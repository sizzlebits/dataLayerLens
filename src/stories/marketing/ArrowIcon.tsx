/**
 * ArrowIcon - Decorative arrow for marketing stories
 */

interface ArrowIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ArrowIcon({
  width = 238,
  height = 248,
  color = 'white',
  className,
  style
}: ArrowIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 238.136 248.064"
      className={className}
      style={style}
    >
      <path
        fill={color}
        d="M238.136 80.452 140.024 0l16.6 49.075C59.435 63.831-11.074 147.386 1.44 248.064c0 0 10.5-58.171 65.268-103.175a144.6 144.6 0 0 1 76.628-31.35c4.236-.386 8.645-.605 13.019-.595l-16.331 47.961Z"
      />
    </svg>
  );
}
