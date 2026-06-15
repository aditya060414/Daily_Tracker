import React from 'react';
import { OtpInput } from '../OtpInput';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  otpEmail: string;
  otpPurpose: 'signup' | 'forgot_password' | 'google_login';
  otpDigits: string[];
  setOtpDigits: (value: string[]) => void;
  otpAttemptsLeft: number;
  otpError: string | null;
  loading: boolean;
  onResend: () => void;
  onSubmit: () => void;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  onClose,
  otpEmail,
  otpPurpose,
  otpDigits,
  setOtpDigits,
  otpAttemptsLeft,
  otpError,
  loading,
  onResend,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-darkbg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-panel border border-border rounded-lg shadow-2xl p-6 glow-accent animate-fade-in font-mono text-off-white">
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
        <OtpInput
          value={otpDigits}
          onChange={setOtpDigits}
          length={6}
        />

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
            onClick={onResend}
            disabled={loading}
            className="w-1/2 py-2 border border-border hover:border-accent/20 rounded text-xs font-bold uppercase tracking-wider text-off-white-muted hover:text-off-white transition-all"
          >
            RESEND_OTP
          </button>
          <button
            type="button"
            onClick={onSubmit}
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
            onClick={onClose}
            className="text-[9px] uppercase tracking-wider text-off-white-muted hover:underline"
          >
            Go back to forms
          </button>
        </div>
      </div>
    </div>
  );
};
