import { ReactNode } from 'react';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  icon
}: ButtonProps) {
  const variants = {
    primary: 'premium-button',
    secondary: 'bg-[var(--color-surface-raised)] text-[var(--text-primary)] hover:brightness-110 shadow-sm',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--color-border)]',
    outline: 'bg-transparent border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-glow)]'
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "font-bold transition-all duration-300 flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
      style={{ borderRadius: 'calc(var(--border-radius) / 2)' }}
    >
      {icon}
      {children}
    </motion.button>
  );
}
