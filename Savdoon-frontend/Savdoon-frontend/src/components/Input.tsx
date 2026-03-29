import { ReactNode, useState } from 'react';
import { cn } from '../utils/cn';
import { Eye, EyeOff } from 'lucide-react';

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
  showPasswordToggle?: boolean;
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
  required,
  showPasswordToggle
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

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
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          className={cn(
            "w-full py-3.5 bg-[var(--color-surface-raised)] border-1.5 border-[var(--color-border)] rounded-2xl text-[var(--text-primary)] transition-all focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary-glow)] outline-none",
            icon ? "pl-16" : "pl-5",
            showPasswordToggle && isPassword ? "pr-14" : "pr-5",
            disabled && "opacity-40 cursor-not-allowed"
          )}
        />
        {showPasswordToggle && isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors p-1"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
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
