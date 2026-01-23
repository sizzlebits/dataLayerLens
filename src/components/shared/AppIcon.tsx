/**
 * AppIcon - Custom DataLayer Lens logo icon
 * Can be used standalone or with an indented container for header usage
 */

interface AppIconProps {
  /** Size of the icon */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Apply an indented container with shadow */
  variant?: 'plain' | 'indented';
  /** Custom className for the icon itself */
  className?: string;
}

const sizeClasses = {
  sm: { icon: 'w-4 h-4', container: 'w-6 h-6 p-0.5 rounded-lg' },
  md: { icon: 'w-6 h-6', container: 'w-8 h-8 p-1 rounded-lg' },
  lg: { icon: 'w-8 h-8', container: 'w-10 h-10 p-1 rounded-xl' },
  xl: { icon: 'w-12 h-12', container: 'w-16 h-16 p-2 rounded-xl' },
};

export function AppIcon({ size = 'md', variant = 'plain', className }: AppIconProps) {
  const iconClasses = className || `${sizeClasses[size].icon} text-dl-primary`;

  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      className={iconClasses}
    >
      <path
        fill="currentColor"
        d="M1.56006 12.1512c.00271.0513.03799.1021.1058.1413L13.164 18.9309c.1413.0816.3703.0816.5116 0l6.638-3.8324c1.3564-.7831 2.0616-1.7999 2.1157-2.8259v2.5795c.0587 1.1114-.6465 2.2337-2.1157 3.082l-6.638 3.8324c-.1413.0816-.3703.0816-.5116 0L1.66586 15.128c-.06781-.0391-.10309-.0899-.1058-.1412z"
      />
      <path
        fill="currentColor"
        d="M1.56008 6.50963c.00271.05129.03797.10212.10578.14127L13.164 13.2894c.1413.0815.3703.0815.5116 0l6.638-3.83248c1.3564-.78311 2.0616-1.79979 2.1157-2.82578v2.57937c.0587 1.11139-.6465 2.23369-2.1157 3.08199l-6.638 3.8324c-.1413.0816-.3703.0816-.5116 0L1.66586 9.48647c-.06781-.03915-.10307-.08998-.10578-.14127z"
      />
      <path
        fill="currentColor"
        d="M10.574 4.86024c1.5717-.9074 4.1199-.9074 5.6916 0 .8172.47184 1.2095 1.09614 1.1768 1.71433v.02508c-.0384.46651-.3192.92755-.8422 1.31498-.1023-.07592-.2138-.14908-.3346-.21885-1.5717-.90739-4.1199-.90739-5.6916 0l-.3759.21705-2.19607-1.26789c-.10663-.06156-.1373-.15037-.09201-.22761.01749-.0224.04219-.04338.07406-.06178zm11.8553 1.5147c.0045.08538.0045.17082 0 .2562z"
      />
    </svg>
  );

  if (variant === 'indented') {
    return (
      <div
        className={`${sizeClasses[size].container} flex items-center justify-center`}
        style={{
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -1px 2px rgba(255, 255, 255, 0.05)',
        }}
      >
        {icon}
      </div>
    );
  }

  return icon;
}
