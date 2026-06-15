import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, User as UserIcon, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const registerProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterProfileValues = z.infer<typeof registerProfileSchema>;

interface RegisterProfileFormProps {
  email: string;
  onSubmit: (values: RegisterProfileValues) => void;
  onUseDifferentEmail: () => void;
  loading: boolean;
  initialName?: string;
}

export const RegisterProfileForm: React.FC<RegisterProfileFormProps> = ({
  email,
  onSubmit,
  onUseDifferentEmail,
  loading,
  initialName = ''
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<RegisterProfileValues>({
    resolver: zodResolver(registerProfileSchema),
    defaultValues: {
      name: initialName,
      username: '',
      password: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    if (initialName) {
      setValue('name', initialName);
    }
  }, [initialName, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2 p-2.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] mb-2 animate-fade-in">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>Email verified: <strong>{email}</strong></span>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
          <UserIcon className="w-3 h-3 text-accent" /> Full Name
        </label>
        <input
          type="text"
          placeholder="e.g. Aditya Kumar"
          className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
            errors.name ? 'border-red-500/50' : 'border-border'
          }`}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-[10px] text-red-400 mt-0.5">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
          <UserIcon className="w-3 h-3 text-accent" /> Choose Username
        </label>
        <input
          type="text"
          placeholder="e.g. adityakumar"
          className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
            errors.username ? 'border-red-500/50' : 'border-border'
          }`}
          {...register('username')}
        />
        {errors.username && (
          <p className="text-[10px] text-red-400 mt-0.5">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-accent" /> Password
        </label>
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

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-accent" /> Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className={`w-full pl-3 pr-10 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
              errors.confirmPassword ? 'border-red-500/50' : 'border-border'
            }`}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-off-white-muted hover:text-accent focus:outline-none transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-[10px] text-red-400 mt-0.5">{errors.confirmPassword.message}</p>
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

      <button
        type="button"
        onClick={onUseDifferentEmail}
        className="w-full text-center text-[9px] uppercase tracking-wider text-off-white-muted hover:underline mt-2"
      >
        Use different email
      </button>
    </form>
  );
};
