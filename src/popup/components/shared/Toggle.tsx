/**
 * Toggle - Reusable toggle switch component.
 */

import { motion } from 'framer-motion';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <motion.button
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors ${
        checked
          ? 'bg-gradient-to-r from-dl-primary to-dl-secondary'
          : 'bg-dl-border'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      aria-checked={checked}
      role="switch"
      disabled={disabled}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
        animate={{ left: checked ? 20 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}
