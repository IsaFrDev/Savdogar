import { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  helper,
  icon,
  className,
  disabled,
  required
}: InputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] ml-1">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--brand-primary)] transition-colors">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          className={cn(
            "w-full py-3.5 pr-5 bg-[var(--color-surface-raised)] border-1.5 border-[var(--color-border)] rounded-2xl text-[var(--text-primary)] transition-all focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary-glow)] outline-none",
            icon ? "pl-16" : "pl-5",
            disabled && "opacity-40 cursor-not-allowed"
          )}
        />
      </div>
      {helper && (
        <p className="text-[10px] text-[var(--text-muted)] ml-1 font-medium">{helper}</p>
      )}
    </div>
  );
}

interface TextAreaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
  rows?: number;
  className?: string;
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  helper,
  rows = 4,
  className
}: TextAreaProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] ml-1">{label}</label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "w-full px-4 py-3 resize-none"
        )}
      />
      {helper && (
        <p className="text-[10px] text-[var(--text-muted)] ml-1 font-medium">{helper}</p>
      )}
    </div>
  );
}
