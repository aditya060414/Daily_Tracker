import React from 'react';

interface ReflectionTextAreaProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  className?: string;
}

export const ReflectionTextArea: React.FC<ReflectionTextAreaProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  className = "space-y-1.5 flex flex-col"
}) => {
  const getWordCount = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter((w) => w.length > 0).length;
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <label className="text-[9px] uppercase tracking-wider text-off-white-muted">
          {label}
        </label>
        <span className="text-[8px] text-off-white-muted bg-card px-1.5 py-0.5 rounded border border-border font-mono">
          {getWordCount(value)} words
        </span>
      </div>
      <textarea
        placeholder={placeholder}
        className="w-full flex-grow min-h-[120px] px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent resize-none leading-relaxed font-mono text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
};
export default ReflectionTextArea;
