import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, KeyRound, Chrome } from 'lucide-react';
import { authApi } from '../api';
import { useAuthStore } from '../store';

// Import subcomponents
import { SystemInfoPanel } from '../components/auth/SystemInfoPanel';
import { LoginForm, LoginValues } from '../components/auth/LoginForm';
import { RegisterEmailForm, RegisterEmailValues } from '../components/auth/RegisterEmailForm';
import { RegisterProfileForm, RegisterProfileValues } from '../components/auth/RegisterProfileForm';
import { ForgotPasswordForm, ForgotValues } from '../components/auth/ForgotPasswordForm';
import { ResetPasswordForm, ResetValues } from '../components/auth/ResetPasswordForm';
import { OtpModal } from '../components/auth/OtpModal';
import { GoogleSimChooser } from '../components/auth/GoogleSimChooser';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPurpose] = useState<'signup' | 'forgot_password' | 'google_login'>('signup');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(3);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [tempResetToken, setTempResetToken] = useState('');
  const [tempSignupToken, setTempSignupToken] = useState('');
  const [googleCredential, setGoogleCredential] = useState<string>('');
  const [googlePrefilledName, setGooglePrefilledName] = useState('');

  // Simulated Google account chooser state
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customSimEmail, setCustomSimEmail] = useState('');
  const [customSimName, setCustomSimName] = useState('');
  const [showCustomSimForm, setShowCustomSimForm] = useState(false);

  // 1. Google Identity Services Script loader
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
      if (clientId && (window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-gis-button'),
          { theme: 'outline', size: 'large', width: '100%', text: 'continue_with' }
        );
      }
    };

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {}
    };
  }, [mode]);

  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    setServerError(null);
    try {
      const credential = response.credential;
      setGoogleCredential(credential);
      const res = await authApi.googleLogin(credential);
      if (res.success) {
        const data = (res as any).data;
        if (data && data.googleSignup) {
          setOtpEmail(data.email || '');
          setTempSignupToken(data.signupToken || '');
          setGooglePrefilledName(data.name || '');
          setMode('register');
        } else if (data && data.token && data.user) {
          setAuth(data.token, data.user);
          navigate('/');
        } else {
          setServerError('Google Login failed: Invalid response format');
        }
      } else {
        setServerError(res.error || 'Google Login failed');
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Unable to authenticate with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedGoogleLogin = () => {
    setShowGoogleChooser(true);
    setShowCustomSimForm(false);
    setCustomSimEmail('');
    setCustomSimName('');
  };

  const handleGoogleSimulateSelect = async (email: string, name: string) => {
    setShowGoogleChooser(false);
    setLoading(true);
    setServerError(null);
    try {
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = {
        sub: 'google-mock-id-' + Math.random().toString(36).substring(2, 8),
        email,
        name,
        picture: 'https://avatar.iran.liara.run/public/boy',
      };
      
      const encode = (obj: any) => btoa(JSON.stringify(obj)).replace(/=/g, '');
      const mockCredential = `${encode(header)}.${encode(payload)}.signature`;
      setGoogleCredential(mockCredential);

      const res = await authApi.googleLogin(mockCredential);
      if (res.success) {
        const data = (res as any).data;
        if (data && data.googleSignup) {
          setOtpEmail(data.email || '');
          setTempSignupToken(data.signupToken || '');
          setGooglePrefilledName(data.name || '');
          setMode('register');
        } else if (data && data.token && data.user) {
          setAuth(data.token, data.user);
          navigate('/');
        } else {
          setServerError('Simulated Google Login failed: Invalid response format');
        }
      } else {
        setServerError(res.error || 'Simulated Google Login failed');
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Unable to authenticate with Google');
    } finally {
      setLoading(false);
    }
  };

  // Submission handlers
  const onLoginSubmit = async (values: LoginValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const res = await authApi.login(values.usernameOrEmail, values.password);
      if (res.success && res.data) {
        setAuth(res.data.token, res.data.user);
        navigate('/');
      } else {
        setServerError(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Failed to authenticate. Ensure your credentials are correct.');
    } finally {
      setLoading(false);
    }
  };

  const onRegisterEmailSubmit = async (values: RegisterEmailValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const res = await authApi.register(values.email);
      if (res.success && res.data) {
        setOtpEmail(values.email);
        setTempSignupToken(res.data.signupToken || '');
        setShowOtpModal(false);
      } else {
        setServerError(res.error || 'Failed to register account');
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Signup failed. Email might already be taken.');
    } finally {
      setLoading(false);
    }
  };

  const onRegisterProfileSubmit = async (values: RegisterProfileValues) => {
    if (!tempSignupToken) {
      setServerError('Signup verification token missing. Please verify OTP again.');
      return;
    }
    setLoading(true);
    setServerError(null);
    try {
      const res = await authApi.registerComplete(
        otpEmail,
        tempSignupToken,
        values.name,
        values.username,
        values.password,
        values.confirmPassword
      );
      if (res.success && res.data) {
        setAuth(res.data.token, res.data.user);
        navigate('/');
      } else {
        setServerError(res.error || 'Failed to finalize profile registration');
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Registration completion failed. Username might already be taken.');
    } finally {
      setLoading(false);
    }
  };

  const onForgotSubmit = async (values: ForgotValues) => {
    setLoading(true);
    setServerError(null);
    setServerSuccess(null);
    try {
      const res = await authApi.forgotPassword(values.emailOrUsername);
      if (res.success && res.data) {
        setOtpEmail(res.data.email || values.emailOrUsername);
        setTempResetToken(res.data.resetToken || '');
        setShowOtpModal(false);
        setMode('reset');
      } else {
        setServerError(res.error || 'Password reset request failed');
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (values: ResetValues) => {
    if (!tempResetToken) {
      setServerError('Reset token missing. Please verify OTP again.');
      setMode('forgot');
      return;
    }
    setLoading(true);
    setServerError(null);
    try {
      const res = await authApi.resetPassword(otpEmail, values.password, tempResetToken);
      if (res.success) {
        setServerSuccess('Password reset successful. Please login with your new password.');
        setMode('login');
        setTempResetToken('');
      } else {
        setServerError(res.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      setOtpError('Please enter the full 6-digit OTP.');
      return;
    }

    setLoading(true);
    setOtpError(null);
    try {
      const res = await authApi.verifyOtp(otpEmail, otp, otpPurpose);
      if (res.success && res.data) {
        setShowOtpModal(false);
        if (otpPurpose === 'signup') {
          setTempSignupToken(res.data.signupToken || '');
        } else if (otpPurpose === 'google_login') {
          if (res.data.googleSignup) {
            setOtpEmail(res.data.email || '');
            setTempSignupToken(res.data.signupToken || '');
            setGooglePrefilledName(res.data.name || '');
            setMode('register');
          } else if (res.data.token && res.data.user) {
            setAuth(res.data.token, res.data.user);
            navigate('/');
          }
        } else {
          setTempResetToken(res.data.resetToken || '');
          setMode('reset');
        }
      } else {
        setOtpError(res.error || 'Verification failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Invalid verification code';
      setOtpError(errorMsg);
      if (errorMsg.includes('attempts')) {
        setOtpAttemptsLeft((prev) => Math.max(0, prev - 1));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpResend = async () => {
    setLoading(true);
    setOtpError(null);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpAttemptsLeft(3);
    try {
      let res;
      if (otpPurpose === 'signup') {
        res = await authApi.register(otpEmail);
      } else if (otpPurpose === 'google_login') {
        if (!googleCredential) {
          setOtpError('Google authentication session expired. Please click Continue with Google again.');
          setLoading(false);
          return;
        }
        res = await authApi.googleLogin(googleCredential);
      } else {
        res = await authApi.forgotPassword(otpEmail);
      }
      if (res.success) {
        setOtpError('A fresh OTP has been dispatched to your email.');
      } else {
        setOtpError(res.error || 'Failed to dispatch OTP');
      }
    } catch (err: any) {
      setOtpError(err.response?.data?.error || 'OTP dispatch failed.');
    } finally {
      setLoading(false);
    }
  };

  // Social Login node to inject into form containers
  const socialLoginBlock = (
    <div className="mt-6 space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-[9px] uppercase tracking-widest">
          <span className="bg-panel px-3 text-off-white-muted">OR_SECURE_AUTH</span>
        </div>
      </div>

      <div className="flex justify-center w-full">
        {(import.meta as any).env.VITE_GOOGLE_CLIENT_ID ? (
          <div id="google-gis-button" className="w-full"></div>
        ) : (
          <button
            type="button"
            onClick={handleSimulatedGoogleLogin}
            disabled={loading}
            className="w-full py-2 border border-border hover:border-accent/30 rounded bg-card/50 hover:bg-card text-xs flex items-center justify-center gap-2 hover:text-accent font-bold transition-all"
          >
            <Chrome className="w-4 h-4 text-accent shrink-0" />
            <span>CONTINUE_WITH_GOOGLE [SIM]</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-darkbg text-off-white relative overflow-hidden select-none font-mono">
      {/* Grid background effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 z-0"></div>

      {/* Brand & system info logs panel */}
      <SystemInfoPanel />

      {/* Right side form gateway */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md bg-panel border border-border rounded-lg shadow-2xl overflow-hidden glow-accent-strong animate-fade-in">
          {/* Header bar decor */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-card border-b border-border">
            <div className="flex items-center gap-2 text-accent">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold tracking-wider uppercase">
                {mode === 'login' && 'SECURE_GATEWAY'}
                {mode === 'register' && 'REGISTRATION_GATEWAY'}
                {mode === 'forgot' && 'RECOVERY_GATEWAY'}
                {mode === 'reset' && 'RESET_GATEWAY'}
              </span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-border"></span>
              <span className="w-2 h-2 rounded-full bg-border"></span>
              <span className="w-2 h-2 rounded-full bg-accent/40"></span>
            </div>
          </div>

          <div className="p-8">
            {/* Title / Description */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold tracking-wider text-off-white uppercase">
                {mode === 'login' && 'GATEWAY_BOOT_IN'}
                {mode === 'register' && 'GATEWAY_REGISTER'}
                {mode === 'forgot' && 'GATEWAY_FORGOT_PASS'}
                {mode === 'reset' && 'GATEWAY_RESET_PASS'}
              </h2>
              <p className="text-xs text-off-white-muted mt-1 leading-relaxed">
                {mode === 'login' && 'Provide secure host database credentials.'}
                {mode === 'register' && 'Register a new authenticated system host.'}
                {mode === 'forgot' && 'Provide account email to initiate OTP override.'}
                {mode === 'reset' && 'Confirm new credentials for security overrides.'}
              </p>
            </div>

            {/* General Server Alert Messages */}
            {serverError && (
              <div className="flex items-start gap-2.5 p-3 mb-5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed animate-fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}
            {serverSuccess && (
              <div className="flex items-start gap-2.5 p-3 mb-5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-xs leading-relaxed animate-fade-in">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverSuccess}</span>
              </div>
            )}

            {/* Sub-form Render block */}
            {mode === 'login' && (
              <LoginForm
                onSubmit={onLoginSubmit}
                onForgotPassword={() => {
                  setMode('forgot');
                  setServerError(null);
                  setServerSuccess(null);
                }}
                loading={loading}
                socialLogin={socialLoginBlock}
              />
            )}

            {mode === 'register' && !tempSignupToken && (
              <RegisterEmailForm
                onSubmit={onRegisterEmailSubmit}
                loading={loading}
                socialLogin={socialLoginBlock}
              />
            )}

            {mode === 'register' && tempSignupToken && (
              <RegisterProfileForm
                email={otpEmail}
                initialName={googlePrefilledName}
                onSubmit={onRegisterProfileSubmit}
                onUseDifferentEmail={() => {
                  setTempSignupToken('');
                  setOtpEmail('');
                  setGooglePrefilledName('');
                }}
                loading={loading}
              />
            )}

            {mode === 'forgot' && (
              <ForgotPasswordForm
                onSubmit={onForgotSubmit}
                loading={loading}
              />
            )}

            {mode === 'reset' && (
              <ResetPasswordForm
                onSubmit={onResetSubmit}
                loading={loading}
              />
            )}

            {/* Gateway Mode Toggles */}
            <div className="mt-6 text-center border-t border-border pt-4">
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setServerError(null);
                    setServerSuccess(null);
                  }}
                  className="text-[10px] text-accent hover:underline uppercase tracking-wider"
                >
                  New User? Create account
                </button>
              )}
              {mode === 'register' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setServerError(null);
                    setServerSuccess(null);
                    setTempSignupToken('');
                    setGooglePrefilledName('');
                  }}
                  className="text-[10px] text-accent hover:underline uppercase tracking-wider"
                >
                  Already have an account? Log in
                </button>
              )}
              {(mode === 'forgot' || mode === 'reset') && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setServerError(null);
                    setServerSuccess(null);
                  }}
                  className="text-[10px] text-accent hover:underline uppercase tracking-wider"
                >
                  Cancel and return to Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OTP verification modal overlay */}
      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        otpEmail={otpEmail}
        otpPurpose={otpPurpose}
        otpDigits={otpDigits}
        setOtpDigits={setOtpDigits}
        otpAttemptsLeft={otpAttemptsLeft}
        otpError={otpError}
        loading={loading}
        onResend={handleOtpResend}
        onSubmit={handleOtpSubmit}
      />

      {/* Simulated Google Accounts chooser overlay */}
      <GoogleSimChooser
        isOpen={showGoogleChooser}
        onClose={() => setShowGoogleChooser(false)}
        onSelect={handleGoogleSimulateSelect}
        customSimEmail={customSimEmail}
        setCustomSimEmail={setCustomSimEmail}
        customSimName={customSimName}
        setCustomSimName={setCustomSimName}
        showCustomSimForm={showCustomSimForm}
        setShowCustomSimForm={setShowCustomSimForm}
      />
    </div>
  );
};

export default Login;
