import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  className = 'flex justify-between gap-2.5 mb-5',
  inputClassName = 'w-10 h-12 text-center text-lg font-bold bg-darkbg border border-border rounded text-accent focus:border-accent outline-none transition-all'
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus synchronization helper
  useEffect(() => {
    if (inputRefs.current.length !== length) {
      inputRefs.current = inputRefs.current.slice(0, length);
    }
  }, [length]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const val = e.target.value;
    
    if (val === '') {
      const newDigits = [...value];
      newDigits[index] = '';
      onChange(newDigits);
      return;
    }

    // Find the newly entered character (digit)
    const prevDigit = value[index] || '';
    let newDigit = '';
    
    if (val.length === 1) {
      newDigit = val;
    } else if (val.length > 1) {
      if (val[0] === prevDigit) {
        newDigit = val[1];
      } else if (val[1] === prevDigit) {
        newDigit = val[0];
      } else {
        newDigit = val.slice(-1);
      }
    }

    // Only allow numeric input
    if (!/^\d$/.test(newDigit)) {
      return;
    }

    const newDigits = [...value];
    newDigits[index] = newDigit;
    onChange(newDigits);

    // Auto-focus next box
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // If fully filled, fire onComplete callback
    const combined = newDigits.join('');
    if (onComplete && combined.length === length) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...value];

      if (value[index]) {
        // Current box has value, clear it without moving focus
        newDigits[index] = '';
        onChange(newDigits);
      } else if (index > 0) {
        // Current box is empty, focus previous box and clear its value
        newDigits[index - 1] = '';
        onChange(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData.getData('text');
    // Strip non-numeric
    const digitsOnly = pastedData.replace(/\D/g, '');
    if (!digitsOnly) return;

    // Distribute characters starting from the currently focused index
    const focusedIndex = inputRefs.current.findIndex((el) => el === document.activeElement);
    const startIdx = focusedIndex !== -1 ? focusedIndex : 0;

    const newDigits = [...value];
    let lastFilledIdx = startIdx;

    for (let j = 0; j < digitsOnly.length; j++) {
      const targetIdx = startIdx + j;
      if (targetIdx < length) {
        newDigits[targetIdx] = digitsOnly[j];
        lastFilledIdx = targetIdx;
      } else {
        break;
      }
    }

    onChange(newDigits);

    // Determine new focus: last filled or the box after it if more remain
    const nextFocusIdx = lastFilledIdx + 1;
    const finalFocusIdx = nextFocusIdx < length ? nextFocusIdx : lastFilledIdx;
    inputRefs.current[finalFocusIdx]?.focus();

    // Trigger onComplete if fully filled
    const combined = newDigits.join('');
    if (onComplete && combined.length === length) {
      onComplete(combined);
    }
  };

  return (
    <div className={className}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value[idx] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className={inputClassName}
        />
      ))}
    </div>
  );
};
