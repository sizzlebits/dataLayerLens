import { Coffee } from 'lucide-react';

interface SupportLinkProps {
  className?: string;
}

export function SupportLink({ className = '' }: SupportLinkProps) {
  return (
    <a
      href="https://paypal.me/milehighsi"
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-dl-accent transition-colors ${className}`}
    >
      <Coffee className="w-3.5 h-3.5" />
      <span>Fuel this extension</span>
    </a>
  );
}
