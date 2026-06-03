import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Terminal, ShieldAlert, KeyRound, User as UserIcon } from 'lucide-react';
import { authApi } from '../api';
import { useAuthStore } from '../store';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const res = isRegisterMode
        ? await authApi.register(values.username, values.password)
        : await authApi.login(values.username, values.password);

      if (res.success && res.data) {
        setAuth(res.data.token, res.data.user);
        navigate('/');
      } else {
        setServerError(res.error || 'Authentication failed');
      }
    } catch (err: any) {
      setServerError(
        err.response?.data?.error || 'Unable to connect to the server. Ensure the server is online.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-darkbg px-4 relative select-none">
      {/* Grid background effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35"></div>

      <div className="w-full max-w-md bg-panel border border-border rounded-lg shadow-2xl overflow-hidden glow-accent-strong z-10 animate-fade-in">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-2 text-accent">
            <Terminal className="w-4 h-4" />
            <span className="font-mono text-xs font-bold tracking-wider">
              {isRegisterMode ? 'REGISTER_GATEWAY_V1' : 'SECURE_GATEWAY_V1'}
            </span>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-accent/40"></span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-mono font-bold tracking-wider text-off-white">
              {isRegisterMode ? 'DAILY_OS SIGN_UP' : 'DAILY_OS LOG_IN'}
            </h1>
            <p className="text-xs font-mono text-off-white-muted mt-1">
              {isRegisterMode
                ? 'Create a new self-hosted dashboard account.'
                : 'Self-hosted portal. Provide credentials.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-mono">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
                <UserIcon className="w-3 h-3 text-accent" /> Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. aditya"
                  autoComplete="username"
                  className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-colors ${
                    errors.username ? 'border-red-500/50' : 'border-border'
                  }`}
                  {...register('username')}
                />
              </div>
              {errors.username && (
                <p className="text-[10px] text-red-400 mt-0.5">{errors.username.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-accent" /> Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-colors ${
                    errors.password ? 'border-red-500/50' : 'border-border'
                  }`}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-[10px] text-red-400 mt-0.5">{errors.password.message}</p>
              )}
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className="flex items-start gap-2.5 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Action button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded bg-accent hover:bg-accent-dim text-darkbg hover:text-off-white font-bold text-xs uppercase tracking-wider transition-all duration-150 flex justify-center items-center gap-1"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-darkbg border-t-transparent rounded-full animate-spin"></span>
                  <span>{isRegisterMode ? 'REGISTERING...' : 'VERIFYING...'}</span>
                </>
              ) : (
                <span>{isRegisterMode ? 'INIT_REGISTRATION' : 'INIT_BOOT_SEQUENCE'}</span>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setServerError(null);
              }}
              className="text-[10px] font-mono text-accent hover:underline focus:outline-none uppercase tracking-wider"
            >
              {isRegisterMode ? 'Already have an account? Log in' : 'New user? Create an account'}
            </button>
          </div>

          {/* Default Credentials Notice */}
          {!isRegisterMode && (
            <div className="mt-6 border-t border-border pt-4 text-center">
              <p className="text-[9px] font-mono text-off-white-muted leading-relaxed">
                Default system seed: <span className="text-accent font-semibold">admin</span> /{' '}
                <span className="text-accent font-semibold">password123</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Login;
