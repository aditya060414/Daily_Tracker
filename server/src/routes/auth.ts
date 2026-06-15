import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import {
  setSession,
  deleteSession,
  deleteAllSessions,
  setOTP,
  getOTP,
  deleteOTP,
  incrementOTPAttempts,
  getOTPAttempts,
  setPendingUser,
  getPendingUser,
  deletePendingUser
} from '../utils/redis';
import redisClient from '../utils/redis';
import { sendSignupOTP, sendPasswordResetOTP, sendWelcomeEmail } from '../utils/email';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldevelopmentonly';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// POST /api/v1/auth/register (Email Signup Step 1 - Send OTP)
router.post('/register', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Email is required.',
      });
    }

    // Check if email is already active in MongoDB
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'An account with this email already exists.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    await setOTP(email, otp, 'signup');
    
    // Reset OTP attempts tracker in Redis
    const attemptsKey = `otp:attempts:signup:${email.toLowerCase()}`;
    await redisClient.del(attemptsKey);

    // Send OTP
    await sendSignupOTP(email, 'User', otp);

    return res.status(200).json({
      success: true,
      message: 'Verification OTP sent to your email.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/verify-otp (Verify OTP for Sign Up or Forgot Password)
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose || (purpose !== 'signup' && purpose !== 'forgot_password' && purpose !== 'google_login')) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Email, OTP, and valid purpose (signup, forgot_password, or google_login) are required.',
      });
    }

    const lowerEmail = email.toLowerCase();

    // Check attempts limit
    const attempts = await getOTPAttempts(lowerEmail, purpose);
    if (attempts >= 3) {
      await deleteOTP(lowerEmail, purpose);
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Maximum verification attempts exceeded (3). Please request a new OTP.',
      });
    }

    const activeOtp = await getOTP(lowerEmail, purpose);
    if (!activeOtp) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'OTP code is invalid or has expired. Please request a new one.',
      });
    }

    if (activeOtp !== otp) {
      const currentAttempts = await incrementOTPAttempts(lowerEmail, purpose);
      const remaining = Math.max(0, 3 - currentAttempts);
      return res.status(400).json({
        success: false,
        data: null,
        error: `Invalid OTP. Remaining attempts: ${remaining}`,
      });
    }

    // OTP verified successfully. Clean up OTP and attempts keys.
    await deleteOTP(lowerEmail, purpose);
    const attemptsKey = `otp:attempts:${purpose}:${lowerEmail}`;
    await redisClient.del(attemptsKey);

    if (purpose === 'signup') {
      // Generate a temporary signup token in Redis
      const signupToken = crypto.randomBytes(32).toString('hex');
      const signupTokenKey = `signup_token:${lowerEmail}`;
      await redisClient.set(signupTokenKey, signupToken, { EX: 600 }); // valid for 10 mins

      return res.status(200).json({
        success: true,
        data: {
          signupToken,
        },
      });
    } else if (purpose === 'forgot_password') {
      // Generate a temporary password reset token in Redis
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenKey = `reset_token:${lowerEmail}`;
      await redisClient.set(resetTokenKey, resetToken, { EX: 300 }); // valid for 5 mins

      return res.status(200).json({
        success: true,
        data: {
          resetToken,
        },
      });
    } else {
      // purpose === 'google_login'
      const pending = await getPendingUser(lowerEmail);
      if (!pending) {
        return res.status(400).json({
          success: false,
          data: null,
          error: 'Google authentication session expired. Please click Continue with Google again.',
        });
      }

      // Check if user exists by googleId or by email
      let user = await User.findOne({ $or: [{ googleId: pending.googleId }, { email: lowerEmail }] });

      if (user) {
        user.googleId = pending.googleId;
        user.avatar = pending.avatar || user.avatar;
        user.loginMethod = 'google';
        user.lastLogin = new Date();
        // Ensure user has a username
        if (!user.username) {
          let usernameBase = user.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!usernameBase) usernameBase = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          let username = usernameBase;
          let suffix = 1;
          while (await User.findOne({ username })) {
            username = `${usernameBase}${suffix}`;
            suffix++;
          }
          user.username = username;
        }
        await user.save();

        await deletePendingUser(lowerEmail);

        // Generate JWT
        const token = jwt.sign(
          { userId: user._id, email: user.email, name: user.name },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        // Save session in Redis
        await setSession(user._id.toString(), token);

        // Set cookie (7 days)
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
          success: true,
          data: {
            token,
            user: {
              id: user._id,
              name: user.name,
              username: user.username,
              email: user.email,
              avatar: user.avatar,
              loginMethod: user.loginMethod,
            },
          },
        });
      } else {
        // User does not exist in MongoDB. Set up Google registration redirect.
        const signupToken = crypto.randomBytes(32).toString('hex');
        const signupTokenKey = `signup_token:${lowerEmail}`;
        await redisClient.set(signupTokenKey, signupToken, { EX: 600 }); // valid for 10 mins

        // Keep Google details in Redis to link upon completion
        const googlePendingKey = `google_pending:${lowerEmail}`;
        await redisClient.set(googlePendingKey, JSON.stringify({
          googleId: pending.googleId,
          avatar: pending.avatar,
          name: pending.name
        }), { EX: 600 });

        await deletePendingUser(lowerEmail);

        return res.status(200).json({
          success: true,
          data: {
            googleSignup: true,
            signupToken,
            email: lowerEmail,
            name: pending.name,
          },
        });
      }
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/register-complete (Email Signup Step 3 - Create Profile)
router.post('/register-complete', async (req, res, next) => {
  try {
    const { email, signupToken, name, username, password, confirmPassword } = req.body;

    if (!email || !signupToken || !name || !username || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'All fields are required.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Passwords do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Password must be at least 6 characters long.',
      });
    }

    const lowerEmail = email.toLowerCase();
    const lowerUsername = username.toLowerCase();

    // Verify signup token
    const signupTokenKey = `signup_token:${lowerEmail}`;
    const savedToken = await redisClient.get(signupTokenKey);

    if (!savedToken || savedToken !== signupToken) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid or expired signup token. Please verify OTP again.',
      });
    }

    // Check if email already exists in MongoDB
    const existingEmailUser = await User.findOne({ email: lowerEmail });
    if (existingEmailUser && existingEmailUser.isVerified) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'An account with this email already exists.',
      });
    }

    // Check if username is already taken in MongoDB
    const existingUsernameUser = await User.findOne({ username: lowerUsername });
    if (existingUsernameUser) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'This username is already taken.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Check if there are pending Google login details in Redis
    const googlePendingKey = `google_pending:${lowerEmail}`;
    const googlePendingRaw = await redisClient.get(googlePendingKey);
    let googleId: string | undefined;
    let avatar: string | undefined;
    let loginMethod: 'email' | 'google' = 'email';

    if (googlePendingRaw) {
      try {
        const googlePending = JSON.parse(googlePendingRaw);
        googleId = googlePending.googleId;
        avatar = googlePending.avatar;
        loginMethod = 'google';
        await redisClient.del(googlePendingKey);
      } catch (err) {}
    }

    // If an unverified user document already exists, update it, otherwise create new
    let user = await User.findOne({ email: lowerEmail });
    if (user) {
      user.name = name;
      user.username = lowerUsername;
      user.password = passwordHash;
      user.isVerified = true;
      user.loginMethod = loginMethod;
      if (googleId) user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      user.lastLogin = new Date();
      await user.save();
    } else {
      user = await User.create({
        name,
        username: lowerUsername,
        email: lowerEmail,
        password: passwordHash,
        isVerified: true,
        loginMethod,
        googleId,
        avatar,
        lastLogin: new Date(),
      });
    }

    // Clean up signup token in Redis
    await redisClient.del(signupTokenKey);

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Save session in Redis
    await setSession(user._id.toString(), token);

    // Set cookie (7 days)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          loginMethod: user.loginMethod,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Username or email and password are required.',
      });
    }

    const lowerInput = usernameOrEmail.toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: lowerInput },
        { username: lowerInput }
      ]
    });
    if (!user || !user.isVerified) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid credentials.',
      });
    }

    if (user.loginMethod === 'google') {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'This account uses Google Login. Please click Continue with Google.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid credentials.',
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Save session in Redis
    await setSession(user._id.toString(), token);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          loginMethod: user.loginMethod,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/google-login
router.post('/google-login', async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Google credential token is required.',
      });
    }

    let payload: any;
    if (!GOOGLE_CLIENT_ID) {
      console.warn('GOOGLE_CLIENT_ID is not configured in environment. Performing development mock verification.');
      // Extract profile fields from token if possible, or fallback to mock
      try {
        const decoded = jwt.decode(credential) as any;
        payload = decoded || {};
      } catch (err) {
        payload = {};
      }

      // Populate mock data if fields are missing
      payload.sub = payload.sub || 'mock-google-id-12345';
      payload.email = payload.email || 'mock.google.user@gmail.com';
      payload.name = payload.name || 'Mock Google User';
      payload.picture = payload.picture || 'https://avatar.iran.liara.run/public/boy';
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Failed to extract email from Google identity token.',
      });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || email.split('@')[0];
    const avatar = payload.picture;

    // Store pending details in Redis and trigger OTP verification
    await setPendingUser(email, { name, email, googleId, avatar });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    await setOTP(email, otp, 'google_login');

    // Reset OTP attempts tracker in Redis
    const attemptsKey = `otp:attempts:google_login:${email.toLowerCase()}`;
    await redisClient.del(attemptsKey);

    // Send Google login verification OTP
    await sendSignupOTP(email, name, otp);

    return res.status(200).json({
      success: true,
      pendingOtp: true,
      email,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { emailOrUsername } = req.body;

    if (!emailOrUsername) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Email or username is required.',
      });
    }

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() }
      ]
    });
    if (!user || !user.isVerified) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'No account found with this email or username.',
      });
    }

    if (user.loginMethod === 'google') {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'This account uses Google Login. Please sign in directly with Google.',
      });
    }

    const email = user.email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    await setOTP(email, otp, 'forgot_password');

    // Reset OTP attempts tracker in Redis
    const attemptsKey = `otp:attempts:forgot_password:${email.toLowerCase()}`;
    await redisClient.del(attemptsKey);

    await sendPasswordResetOTP(email, user.name, otp);

    return res.status(200).json({
      success: true,
      email: email,
      message: 'Password reset OTP sent to your email.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, password, resetToken } = req.body;

    if (!email || !password || !resetToken) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Email, new password, and resetToken are required.',
      });
    }

    const lowerEmail = email.toLowerCase();
    const resetTokenKey = `reset_token:${lowerEmail}`;
    const savedToken = await redisClient.get(resetTokenKey);

    if (!savedToken || savedToken !== resetToken) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid or expired password reset token.',
      });
    }

    const user = await User.findOne({ email: lowerEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'User not found.',
      });
    }

    // Hash new password and save
    const passwordHash = await bcrypt.hash(password, 10);
    user.password = passwordHash;
    await user.save();

    // Clean up reset token in Redis
    await redisClient.del(resetTokenKey);

    // Invalidate all active sessions for this user in Redis (force re-login on all devices)
    await deleteAllSessions(user._id.toString());

    // Clear current cookie on this browser
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been updated. Please login with your new credentials.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const token = req.token!;

    // Remove current session token from Redis
    await deleteSession(userId, token);

    // Clear HTTP-only cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/auth/me (Get current session info)
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await User.findById(req.user!.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'User account not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          loginMethod: user.loginMethod,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/refresh (Manual session cookie extension)
router.post('/refresh', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const token = req.token!;
    const user = await User.findById(req.user!.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'User not found.',
      });
    }

    // Refresh the cookie for 7 more days
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          loginMethod: user.loginMethod,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
