import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldevelopmentonly';
const DEFAULT_USER = process.env.DEFAULT_USER || 'admin';
const DEFAULT_PASS = process.env.DEFAULT_PASS || 'password123';

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Username and password are required',
      });
    }

    // Self-healing: if no users in DB, seed the default user
    let user = await User.findOne({ username: username.toLowerCase() });
    const userCount = await User.countDocuments();

    if (!user && userCount === 0 && username.toLowerCase() === DEFAULT_USER.toLowerCase()) {
      const passwordHash = await bcrypt.hash(DEFAULT_PASS, 10);
      user = await User.create({
        username: DEFAULT_USER.toLowerCase(),
        passwordHash,
      });
      console.log(`Default user '${DEFAULT_USER}' automatically created.`);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid credentials',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Username and password are required',
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Password must be at least 4 characters long',
      });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Username is already taken',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.toLowerCase(),
      passwordHash,
    });

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});


// GET /api/v1/auth/me (to verify existing tokens on page load)
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, data: null, error: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }
    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
        },
      },
    });
  } catch (error) {
    return res.status(401).json({ success: false, data: null, error: 'Invalid token' });
  }
});

export default router;
