import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Terminal, ShieldAlert, KeyRound, User as UserIcon, Mail, Lock, ShieldCheck, ArrowRight, Chrome } from 'lucide-react';
import { authApi } from '../api';
import { useAuthStore } from '../store';

// Schemas for form validation
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;
type ResetValues = z.infer<typeof resetSchema>;

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
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'forgot_password' | 'google_login'>('signup');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(3);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [tempResetToken, setTempResetToken] = useState('');
  const [googleCredential, setGoogleCredential] = useState<string>('');

  // Simulated Google account chooser state
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customSimEmail, setCustomSimEmail] = useState('');
  const [customSimName, setCustomSimName] = useState('');
  const [showCustomSimForm, setShowCustomSimForm] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      // Avoid removing if other components need it, but safe here
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
        if (res.pendingOtp && res.email) {
          setOtpEmail(res.email);
          setOtpPurpose('google_login');
          setOtpDigits(['', '', '', '', '', '']);
          setOtpAttemptsLeft(3);
          setOtpError(null);
          setShowOtpModal(true);
        } else {
          const data = (res as any).data;
          if (data && data.token && data.user) {
            setAuth(data.token, data.user);
            navigate('/');
          } else {
            setServerError('Google Login failed: Invalid response format');
          }
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
        if (res.pendingOtp && res.email) {
          setOtpEmail(res.email);
          setOtpPurpose('google_login');
          setOtpDigits(['', '', '', '', '', '']);
          setOtpAttemptsLeft(3);
          setOtpError(null);
          setShowOtpModal(true);
        } else {
          const data = (res as any).data;
          if (data && data.token && data.user) {
            setAuth(data.token, data.user);
            navigate('/');
          } else {
            setServerError('Simulated Google Login failed: Invalid response format');
          }
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

  // 2. React Hook Forms setup
  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const forgotForm = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });
  const resetForm = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  // 3. Form submission handlers
  const onLoginSubmit = async (values: LoginValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const res = await authApi.login(values.email, values.password);
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

  const onRegisterSubmit = async (values: RegisterValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const res = await authApi.register(values.name, values.email, values.password, values.confirmPassword);
      if (res.success) {
        setOtpEmail(values.email);
        setOtpPurpose('signup');
        setOtpDigits(['', '', '', '', '', '']);
        setOtpAttemptsLeft(3);
        setOtpError(null);
        setShowOtpModal(true);
      } else {
        setServerError(res.error || 'Failed to register account');
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Signup failed. Email might already be taken.');
    } finally {
      setLoading(false);
    }
  };

  const onForgotSubmit = async (values: ForgotValues) => {
    setLoading(true);
    setServerError(null);
    setServerSuccess(null);
    try {
      const res = await authApi.forgotPassword(values.email);
      if (res.success) {
        setOtpEmail(values.email);
        setOtpPurpose('forgot_password');
        setOtpDigits(['', '', '', '', '', '']);
        setOtpAttemptsLeft(3);
        setOtpError(null);
        setShowOtpModal(true);
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
        resetForm.reset();
      } else {
        setServerError(res.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  };

  // 4. OTP verification modal handlers
  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.substring(value.length - 1);
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
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
        if (otpPurpose === 'signup' || otpPurpose === 'google_login') {
          // Logged in immediately on signup/google OTP verification
          if (res.data.token && res.data.user) {
            setAuth(res.data.token, res.data.user);
            navigate('/');
          }
        } else {
          // Pass temporary reset token to resetting view
          setTempResetToken(res.data.resetToken || '');
          setMode('reset');
        }
      } else {
        setOtpError(res.error || 'Verification failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Invalid verification code';
      setOtpError(errorMsg);
      // Reduce attempts locally if attempts counter returned
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
        const pending = await authApi.register(
          registerForm.getValues('name'),
          otpEmail,
          registerForm.getValues('password'),
          registerForm.getValues('confirmPassword')
        );
        res = pending;
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

  return (
    <div className="min-h-screen flex bg-darkbg text-off-white relative overflow-hidden select-none font-mono">
      {/* Grid background effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 z-0"></div>

      {/* LEFT SIDE: Branding, Status Logs, and Mock Dashboard (Visible on md+) */}
      <div className="hidden lg:flex flex-col w-1/2 justify-between p-12 border-r border-border bg-panel/20 relative z-10">
        <div>
          {/* Header Branding */}
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-accent/25 border border-accent/40 text-accent glow-accent">
              <Terminal className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-md font-bold tracking-widest text-off-white">DAILY_OS</span>
            <span className="text-[9px] bg-border text-off-white-muted border border-border px-1 rounded">SYS_SEC_V1.2</span>
          </div>

          {/* Motivational System Logs */}
          <div className="mt-16 max-w-md">
            <h1 className="text-xl font-bold tracking-wide text-off-white leading-tight">
              HOST_SEQ: ORGANIZE_YOUR_DAY.
            </h1>
            <p className="text-xs text-off-white-muted mt-2 leading-relaxed italic">
              "We are what we repeatedly do. Excellence, then, is not an act, but a habit." — system_override
            </p>
          </div>
        </div>

        {/* Mock Terminal Dashboard Preview */}
        <div className="border border-border bg-darkbg/90 rounded-lg p-5 shadow-2xl glow-accent-strong w-full max-w-lg mb-10 overflow-hidden relative">
          <div className="flex justify-between items-center border-b border-border pb-2.5 mb-4 text-[10px] text-accent">
            <span>PREVIEW: SYSTEM_OVERVIEW.LOG</span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-dim"></span>
            </div>
          </div>
          <div className="space-y-2 text-[10px] text-off-white-muted">
            <div className="flex justify-between">
              <span>[SYSTEM_LOAD_STATUS]</span>
              <span className="text-green-400">ONLINE</span>
            </div>
            <div className="flex justify-between">
              <span>[ACTIVE_TIMELINE_NODES]</span>
              <span>8 BLOCKS CONFIG</span>
            </div>
            <div className="flex justify-between">
              <span>[GYM_ROUTINE_STATE]</span>
              <span>WORKOUT_COMPLETE [120 min]</span>
            </div>
            <div className="flex justify-between">
              <span>[TOTAL_POINTS_DAILY]</span>
              <span className="text-accent">+45 PTS (GOAL_REACHED)</span>
            </div>
            <div className="pt-3 border-t border-border mt-3">
              <div className="flex justify-between text-off-white">
                <span>ACTIVE_USER_SESSION:</span>
                <span>NONE (SECURE_GATEWAY_REQUIRED)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[10px] text-off-white-muted">
          DAILY_OS CORE ENGINE // ALL RIGHTS SECURED.
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form Gateways */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md bg-panel border border-border rounded-lg shadow-2xl overflow-hidden glow-accent-strong animate-fade-in">
          {/* Form Header bar */}
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
            {/* Title */}
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

            {/* General Server Error / Success Alert */}
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

            {/* ========================================================
                LOGIN FORM
                ======================================================== */}
            {mode === 'login' && (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-accent" /> Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. aditya@dailyos.host"
                    className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
                      loginForm.formState.errors.email ? 'border-red-500/50' : 'border-border'
                    }`}
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-[10px] text-red-400 mt-0.5">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-accent" /> Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[10px] text-accent hover:underline focus:outline-none uppercase tracking-wider"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
                      loginForm.formState.errors.password ? 'border-red-500/50' : 'border-border'
                    }`}
                    {...loginForm.register('password')}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-[10px] text-red-400 mt-0.5">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded bg-accent hover:bg-accent-dim text-darkbg hover:text-off-white font-bold text-xs uppercase tracking-wider transition-all duration-150 flex justify-center items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-darkbg border-t-transparent rounded-full animate-spin"></span>
                      <span>BOOTING_SYSTEM...</span>
                    </>
                  ) : (
                    <>
                      <span>INIT_BOOT_SEQUENCE</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ========================================================
                REGISTER FORM
                ======================================================== */}
            {mode === 'register' && (
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
                    <UserIcon className="w-3 h-3 text-accent" /> Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aditya Kumar"
                    className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
                      registerForm.formState.errors.name ? 'border-red-500/50' : 'border-border'
                    }`}
                    {...registerForm.register('name')}
                  />
                  {registerForm.formState.errors.name && (
                    <p className="text-[10px] text-red-400 mt-0.5">{registerForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-accent" /> Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. aditya@dailyos.host"
                    className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
                      registerForm.formState.errors.email ? 'border-red-500/50' : 'border-border'
                    }`}
                    {...registerForm.register('email')}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-[10px] text-red-400 mt-0.5">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-accent" /> Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
                      registerForm.formState.errors.password ? 'border-red-500/50' : 'border-border'
                    }`}
                    {...registerForm.register('password')}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-[10px] text-red-400 mt-0.5">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-accent" /> Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
                      registerForm.formState.errors.confirmPassword ? 'border-red-500/50' : 'border-border'
                    }`}
                    {...registerForm.register('confirmPassword')}
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-[10px] text-red-400 mt-0.5">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded bg-accent hover:bg-accent-dim text-darkbg hover:text-off-white font-bold text-xs uppercase tracking-wider transition-all duration-150 flex justify-center items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-darkbg border-t-transparent rounded-full animate-spin"></span>
                      <span>CREATING_ACCOUNT...</span>
                    </>
                  ) : (
                    <>
                      <span>CREATE_ACCOUNT</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ========================================================
                FORGOT PASSWORD FORM
                ======================================================== */}
            {mode === 'forgot' && (
              <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-accent" /> Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. aditya@dailyos.host"
                    className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
                      forgotForm.formState.errors.email ? 'border-red-500/50' : 'border-border'
                    }`}
                    {...forgotForm.register('email')}
                  />
                  {forgotForm.formState.errors.email && (
                    <p className="text-[10px] text-red-400 mt-0.5">{forgotForm.formState.errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded bg-accent hover:bg-accent-dim text-darkbg hover:text-off-white font-bold text-xs uppercase tracking-wider transition-all duration-150 flex justify-center items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-darkbg border-t-transparent rounded-full animate-spin"></span>
                      <span>SENDING_OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>DISPATCH_OTP_OVERRIDE</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ========================================================
                RESET PASSWORD FORM
                ======================================================== */}
            {mode === 'reset' && (
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-accent" /> New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
                      resetForm.formState.errors.password ? 'border-red-500/50' : 'border-border'
                    }`}
                    {...resetForm.register('password')}
                  />
                  {resetForm.formState.errors.password && (
                    <p className="text-[10px] text-red-400 mt-0.5">{resetForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-accent" /> Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
                      resetForm.formState.errors.confirmPassword ? 'border-red-500/50' : 'border-border'
                    }`}
                    {...resetForm.register('confirmPassword')}
                  />
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-[10px] text-red-400 mt-0.5">{resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded bg-accent hover:bg-accent-dim text-darkbg hover:text-off-white font-bold text-xs uppercase tracking-wider transition-all duration-150 flex justify-center items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-darkbg border-t-transparent rounded-full animate-spin"></span>
                      <span>OVERRIDING_CREDENTIALS...</span>
                    </>
                  ) : (
                    <>
                      <span>CONFIRM_RESET_OVERRIDE</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ========================================================
                SOCIAL LOGIN BLOCK
                ======================================================== */}
            {(mode === 'login' || mode === 'register') && (
              <div className="mt-6 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-[9px] uppercase tracking-widest">
                    <span className="bg-panel px-3 text-off-white-muted">OR_SECURE_AUTH</span>
                  </div>
                </div>

                {/* Google Sign-in buttons */}
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
            )}

            {/* ========================================================
                MODE SWITCHERS
                ======================================================== */}
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

      {/* ========================================================
          OTP VERIFICATION MODAL OVERLAY
          ======================================================== */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-darkbg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-panel border border-border rounded-lg shadow-2xl p-6 glow-accent animate-fade-in font-mono">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <span className="text-xs font-bold text-accent tracking-widest uppercase">
                {otpPurpose === 'signup' ? 'SIGNUP_OTP_GATE' : otpPurpose === 'google_login' ? 'GOOGLE_OTP_GATE' : 'FORGOT_OTP_GATE'}
              </span>
              <span className="text-[10px] bg-border px-1.5 py-0.5 rounded text-off-white-muted">
                PENDING_VERIFY
              </span>
            </div>

            {/* Modal Description */}
            <p className="text-[11px] text-off-white-muted leading-relaxed mb-4">
              A 6-digit OTP code has been sent to <span className="text-accent font-bold">{otpEmail}</span>. Input it below to verify:
            </p>

            {/* OTP Digit Inputs */}
            <div className="flex justify-between gap-2.5 mb-5">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-10 h-12 text-center text-lg font-bold bg-darkbg border border-border rounded text-accent focus:border-accent outline-none transition-all"
                />
              ))}
            </div>

            {/* OTP Error message */}
            {otpError && (
              <p className="text-[10px] text-red-400 mb-4 bg-red-500/10 border border-red-500/20 p-2.5 rounded">
                {otpError}
              </p>
            )}

            {/* Attempts Alert */}
            <p className="text-[9px] text-off-white-muted mb-5">
              Attempts remaining: <span className="text-accent font-bold">{otpAttemptsLeft}</span> / 3 before self-destruction.
            </p>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleOtpResend}
                disabled={loading}
                className="w-1/2 py-2 border border-border hover:border-accent/20 rounded text-xs font-bold uppercase tracking-wider text-off-white-muted hover:text-off-white transition-all"
              >
                RESEND_OTP
              </button>
              <button
                type="button"
                onClick={handleOtpSubmit}
                disabled={loading || otpAttemptsLeft === 0}
                className="w-1/2 py-2 rounded bg-accent hover:bg-accent-dim text-darkbg hover:text-off-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                {loading ? 'VERIFYING...' : 'VERIFY_OTP'}
              </button>
            </div>
            
            {/* Cancel fallback */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-[9px] uppercase tracking-wider text-off-white-muted hover:underline"
              >
                Go back to forms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          GOOGLE ACCOUNTS SIMULATED CHOOSER OVERLAY
          ======================================================== */}
      {showGoogleChooser && (
        <div className="fixed inset-0 bg-darkbg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-panel border border-border rounded-lg shadow-2xl p-6 glow-accent animate-fade-in font-mono text-off-white">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2 text-accent">
                <Chrome className="w-4 h-4 shrink-0 animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase">Choose Google Account</span>
              </div>
              <span className="text-[10px] bg-border px-1.5 py-0.5 rounded text-off-white-muted">
                SIM_GATEWAY
              </span>
            </div>

            <p className="text-[11px] text-off-white-muted leading-relaxed mb-4">
              Select a Google account to log in to <span className="text-accent font-bold">DailyOS</span>:
            </p>

            {/* List of Simulated Accounts */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto mb-4 pr-1">
              {[
                { name: 'Aditya Singh', email: 'adityakumar62719@gmail.com', avatar: 'AS' },
                { name: 'Developer Sandbox', email: 'dev.tester@gmail.com', avatar: 'DS' },
                { name: 'Test User B', email: 'test.user.b@gmail.com', avatar: 'TB' }
              ].map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleGoogleSimulateSelect(acc.email, acc.name)}
                  className="w-full p-3 bg-card hover:bg-card/75 border border-border hover:border-accent/40 rounded flex items-center gap-3.5 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent font-bold text-xs uppercase group-hover:bg-accent group-hover:text-darkbg transition-colors">
                    {acc.avatar}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-off-white truncate">{acc.name}</span>
                    <span className="text-[10px] text-off-white-muted truncate mt-0.5">{acc.email}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Collapsible custom account form */}
            <div className="border-t border-border pt-3 mt-3">
              {!showCustomSimForm ? (
                <button
                  type="button"
                  onClick={() => setShowCustomSimForm(true)}
                  className="w-full py-2 border border-border hover:border-accent/20 border-dashed rounded text-[10px] uppercase text-off-white-muted hover:text-accent font-bold text-center transition-all"
                >
                  + Use another account
                </button>
              ) : (
                <div className="space-y-3 p-3 bg-card/40 border border-border rounded animate-fade-in">
                  <span className="text-[10px] uppercase text-accent font-bold">Add Simulated Account</span>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. customized@gmail.com"
                      value={customSimEmail}
                      onChange={(e) => setCustomSimEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-[11px] bg-darkbg border border-border rounded text-off-white focus:border-accent outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Display Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Custom User"
                      value={customSimName}
                      onChange={(e) => setCustomSimName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-[11px] bg-darkbg border border-border rounded text-off-white focus:border-accent outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomSimForm(false)}
                      className="w-1/2 py-1.5 border border-border hover:bg-red-500/10 rounded text-[9px] uppercase font-bold text-off-white-muted hover:text-red-400 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const email = customSimEmail.trim();
                        const name = customSimName.trim() || email.split('@')[0] || 'Custom User';
                        if (!email.includes('@')) {
                          alert('Please enter a valid email address.');
                          return;
                        }
                        handleGoogleSimulateSelect(email, name);
                      }}
                      className="w-full py-1.5 rounded bg-accent hover:bg-accent-dim text-darkbg hover:text-off-white font-bold text-[9px] uppercase transition-all"
                    >
                      Add & Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cancel Button */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowGoogleChooser(false)}
                className="text-[9px] uppercase tracking-wider text-off-white-muted hover:underline"
              >
                Go back to login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
