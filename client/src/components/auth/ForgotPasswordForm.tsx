import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User as UserIcon, ArrowRight } from 'lucide-react';

const forgotSchema = z.object({
  emailOrUsername: z.string().min(3, 'Email or username must be at least 3 characters'),
});

export type ForgotValues = z.infer<typeof forgotSchema>;

interface ForgotPasswordFormProps {
  onSubmit: (values: ForgotValues) => void;
  loading: boolean;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  loading
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
          <UserIcon className="w-3 h-3 text-accent" /> Username or Email Address
        </label>
        <input
          type="text"
          placeholder="e.g. aditya or aditya@dailyos.host"
          className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
            errors.emailOrUsername ? 'border-red-500/50' : 'border-border'
          }`}
          {...register('emailOrUsername')}
        />
        {errors.emailOrUsername && (
          <p className="text-[10px] text-red-400 mt-0.5">{errors.emailOrUsername.message}</p>
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
  );
};
