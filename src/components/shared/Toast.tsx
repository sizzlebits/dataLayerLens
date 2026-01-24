/**
 * Toast - Notification toast component for transient messages.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string | null;
  type?: ToastType;
  position?: 'top' | 'bottom';
}

const toastConfig: Record<ToastType, { bgClass: string; Icon: typeof AlertCircle }> = {
  success: { bgClass: 'bg-dl-success/90', Icon: CheckCircle },
  error: { bgClass: 'bg-dl-error/90', Icon: XCircle },
  warning: { bgClass: 'bg-dl-warning/90', Icon: AlertCircle },
  info: { bgClass: 'bg-dl-primary/90', Icon: Info },
};

export function Toast({ message, type = 'error', position = 'bottom' }: ToastProps) {
  const config = toastConfig[type];
  const Icon = config.Icon;

  const positionClasses = position === 'top' ? 'top-4' : 'bottom-4';
  const initialY = position === 'top' ? -50 : 50;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: initialY }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: initialY }}
          className={`fixed ${positionClasses} left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 ${config.bgClass} text-theme-text text-sm rounded-lg shadow-lg z-50`}
          role="alert"
          aria-live="polite"
        >
          <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
