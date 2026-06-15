import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User as UserIcon, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(3, 'Username or email must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (values: LoginValues) => void;
  onForgotPassword: () => void;
  loading: boolean;
  socialLogin?: React.ReactNode;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onForgotPassword,
  loading,
  socialLogin
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema)
  });

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
            <UserIcon className="w-3 h-3 text-accent" /> Username or Email Address
          </label>
          <input
            type="text"
            placeholder="e.g. aditya or aditya@dailyos.host"
            className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
              errors.usernameOrEmail ? 'border-red-500/50' : 'border-border'
            }`}
            {...register('usernameOrEmail')}
          />
          {errors.usernameOrEmail && (
            <p className="text-[10px] text-red-400 mt-0.5">{errors.usernameOrEmail.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-accent" /> Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[10px] text-accent hover:underline focus:outline-none uppercase tracking-wider"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`w-full pl-3 pr-10 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
                errors.password ? 'border-red-500/50' : 'border-border'
              }`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-off-white-muted hover:text-accent focus:outline-none transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[10px] text-red-400 mt-0.5">{errors.password.message}</p>
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

      {socialLogin}
    </div>
  );
};
