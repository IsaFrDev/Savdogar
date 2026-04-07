import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '../utils/cn';
import styles from './GlassCard.module.css';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

export function GlassCard({ children, className, delay = 0, onClick }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onClick={onClick}
      className={cn(
        styles.card,
        className
      )}
      style={{ borderRadius: 'var(--border-radius)' }}
    >
      {children}
    </motion.div>
  );
}
