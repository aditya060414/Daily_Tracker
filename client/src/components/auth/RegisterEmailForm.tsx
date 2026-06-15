import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowRight } from 'lucide-react';

const registerEmailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type RegisterEmailValues = z.infer<typeof registerEmailSchema>;

interface RegisterEmailFormProps {
  onSubmit: (values: RegisterEmailValues) => void;
  loading: boolean;
  socialLogin?: React.ReactNode;
}

export const RegisterEmailForm: React.FC<RegisterEmailFormProps> = ({
  onSubmit,
  loading,
  socialLogin
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterEmailValues>({
    resolver: zodResolver(registerEmailSchema)
  });

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-off-white-muted flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-accent" /> Email Address
          </label>
          <input
            type="email"
            placeholder="e.g. aditya@dailyos.host"
            className={`w-full px-3 py-2 text-xs bg-darkbg border rounded text-off-white placeholder-off-white-muted focus:border-accent outline-none transition-all ${
              errors.email ? 'border-red-500/50' : 'border-border'
            }`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-[10px] text-red-400 mt-0.5">{errors.email.message}</p>
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
              <span>SEND_VERIFICATION_OTP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {socialLogin}
    </div>
  );
};
