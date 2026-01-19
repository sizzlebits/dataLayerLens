/**
 * Toggle - Reusable toggle switch component.
 */

import { motion } from 'framer-motion';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  id,
}: ToggleProps) {
  const toggleId = id || (label ? `toggle-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <motion.button
      id={toggleId}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dl-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dl-darker ${
        checked
          ? 'bg-gradient-to-r from-dl-primary to-dl-secondary'
          : 'bg-dl-border'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      aria-checked={checked}
      aria-label={label || 'Toggle'}
      role="switch"
      disabled={disabled}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
        animate={{ left: checked ? 20 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        aria-hidden="true"
      />
    </motion.button>
  );
}
