import type { Decorator } from '@storybook/react';
import type { CSSProperties, ReactNode } from 'react';
import type { ArgTypes } from '@storybook/react';

// Screenshot dimensions for extension stores
export const SCREENSHOT_WIDTH = 1280;
export const SCREENSHOT_HEIGHT = 800;

// Gradient presets
export const gradients = {
  // None - transparent for custom backgrounds
  none: 'transparent',
  // Brand gradient - purple to blue
  brand: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4338ca 50%, #3b82f6 75%, #0ea5e9 100%)',
  // Dark slate - subtle and professional
  slate: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
  // Vibrant - eye-catching for hero shots
  vibrant: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 30%, #2563eb 60%, #0891b2 100%)',
  // Warm accent
  warm: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 30%, #9333ea 60%, #c026d3 100%)',
  // Cool and clean
  cool: 'linear-gradient(145deg, #0c4a6e 0%, #0369a1 30%, #0284c7 60%, #06b6d4 100%)',
  // Sunset stripes
  sunset: 'linear-gradient(135deg, #d0415e 0%, #d0415e 20%, #d65767 calc(20% + 1px), #d65767 40%, #db7971 calc(40% + 1px), #db7971 60%, #e0a57c calc(60% + 1px), #e0a57c 80%, #e6d886 calc(80% + 1px), #e6d886 100%)',
  // Ocean depth
  ocean: 'linear-gradient(135deg, #0f172a 0%, #164e63 30%, #0e7490 60%, #06b6d4 100%)',
  // Aurora
  aurora: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 25%, #7c3aed 50%, #2dd4bf 75%, #a5f3fc 100%)',
  // Ember
  ember: 'linear-gradient(135deg, #1c1917 0%, #78350f 30%, #ea580c 60%, #fbbf24 100%)',
  // Dusty Dusk - warm pastel stripes
  dustyDusk: 'linear-gradient(45deg, #ddcb8b 0%, #ddcb8b 14.286%, #d0d38e calc(14.286% + 1px), #d0d38e 28.571%, #c0d39b calc(28.571% + 1px), #c0d39b 42.857%, #b5ccad calc(42.857% + 1px), #b5ccad 57.143%, #b4c0bd calc(57.143% + 1px), #b4c0bd 71.429%, #bcb3c4 calc(71.429% + 1px), #bcb3c4 85.714%, #cbacc0 calc(85.714% + 1px), #cbacc0 100%)',
  // Ice Peak - cool conic gradient
  icePeak: 'conic-gradient(from 150deg, #0080d2 0deg, #02abdb 60deg, #12d5de 120deg, #2be3d5 180deg, #45ccd0 240deg, #5a9ed8 300deg, #6379df 360deg)',
  // Joker - bold conic stripes
  joker: 'conic-gradient(from 90deg, #000004 0deg, #000004 72deg, #460c6f calc(72deg + 0.1deg), #460c6f 144deg, #cde87e calc(144deg + 0.1deg), #cde87e 216deg, #82df1d calc(216deg + 0.1deg), #82df1d 288deg, #000000 calc(288deg + 0.1deg), #000000 360deg)',
} as const;

export type GradientName = keyof typeof gradients;

interface ScreenshotFrameProps {
  children: ReactNode;
  gradient?: GradientName | string;
  padding?: number;
  style?: CSSProperties;
}

/**
 * Frame component for consistent screenshot dimensions
 */
export function ScreenshotFrame({
  children,
  gradient = 'brand',
  padding = 64,
  style,
}: ScreenshotFrameProps) {
  const backgroundImage = gradient in gradients
    ? gradients[gradient as GradientName]
    : gradient;

  return (
    <div
      style={{
        width: SCREENSHOT_WIDTH,
        height: SCREENSHOT_HEIGHT,
        backgroundImage,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Decorator for marketing screenshots with gradient background
 */
export const screenshotDecorator = (
  gradient: GradientName = 'brand',
  padding = 64
): Decorator => {
  return (Story) => (
    <ScreenshotFrame gradient={gradient} padding={padding}>
      <Story />
    </ScreenshotFrame>
  );
};

/**
 * Card wrapper with shadow and rounded corners for floating effect
 */
interface FloatingCardProps {
  children: ReactNode;
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  scale?: number;
  rotate?: { x?: number; y?: number; z?: number };
  style?: CSSProperties;
}

const shadows = {
  sm: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 12px 24px -8px rgba(0, 0, 0, 0.3)',
  '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.6), 0 20px 40px -10px rgba(0, 0, 0, 0.4)',
};

export function FloatingCard({
  children,
  shadow = 'xl',
  scale = 1,
  rotate = {},
  style,
}: FloatingCardProps) {
  const { x = 0, y = 0, z = 0 } = rotate;
  const transform = [
    scale !== 1 && `scale(${scale})`,
    (x || y || z) && `perspective(1500px)`,
    x && `rotateX(${x}deg)`,
    y && `rotateY(${y}deg)`,
    z && `rotateZ(${z}deg)`,
  ].filter(Boolean).join(' ');

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: shadows[shadow],
        transform: transform || undefined,
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Glow effect behind components
 */
interface GlowProps {
  color?: string;
  blur?: number;
  opacity?: number;
  offsetY?: number;
}

export function Glow({
  color = '#6366f1',
  blur = 80,
  opacity = 0.4,
  offsetY = 40,
}: GlowProps) {
  return (
    <div
      style={{
        position: 'absolute',
        width: '60%',
        height: '40%',
        background: color,
        filter: `blur(${blur}px)`,
        opacity,
        transform: `translateY(${offsetY}px)`,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

/**
 * Reflection effect under components
 */
export function Reflection({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      <div
        style={{
          transform: 'scaleY(-1) translateY(-8px)',
          opacity: 0.15,
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 50%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 50%)',
          filter: 'blur(1px)',
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Storybook Args & ArgTypes for reusable controls
// ============================================================================

export const gradientNames = Object.keys(gradients) as GradientName[];

/**
 * Common argTypes for marketing stories - use with spread operator
 * @example argTypes: { ...marketingArgTypes }
 */
export const marketingArgTypes: ArgTypes = {
  gradient: {
    control: 'select',
    options: gradientNames,
    description: 'Background gradient preset',
    table: {
      category: 'Background',
      defaultValue: { summary: 'brand' },
    },
  },
  showGlow: {
    control: 'boolean',
    description: 'Show glow effect behind content',
    table: {
      category: 'Effects',
      defaultValue: { summary: 'true' },
    },
  },
  glowColor: {
    control: 'color',
    description: 'Glow color',
    table: {
      category: 'Effects',
      defaultValue: { summary: '#6366f1' },
    },
  },
  perspective: {
    control: 'boolean',
    description: 'Apply 3D perspective effect',
    table: {
      category: 'Effects',
      defaultValue: { summary: 'false' },
    },
  },
  rotateY: {
    control: { type: 'range', min: -15, max: 15, step: 1 },
    description: 'Y-axis rotation (degrees)',
    table: {
      category: 'Effects',
      defaultValue: { summary: '0' },
    },
  },
  rotateX: {
    control: { type: 'range', min: -15, max: 15, step: 1 },
    description: 'X-axis rotation (degrees)',
    table: {
      category: 'Effects',
      defaultValue: { summary: '0' },
    },
  },
  scale: {
    control: { type: 'range', min: 0.7, max: 1, step: 0.01 },
    description: 'Scale factor',
    table: {
      category: 'Effects',
      defaultValue: { summary: '0.95' },
    },
  },
};

/**
 * Default args for marketing stories
 */
export const defaultMarketingArgs = {
  gradient: 'brand' as GradientName,
  showGlow: true,
  glowColor: '#6366f1',
  perspective: false,
  rotateY: 0,
  rotateX: 0,
  scale: 0.95,
};

export type MarketingArgs = typeof defaultMarketingArgs;

// ============================================================================
// DevTools Chrome Frame
// ============================================================================

interface DevToolsChromeProps {
  children: React.ReactNode;
  activeTab?: string;
  width?: number;
  height?: number;
}

const devToolsTabs = ['Elements', 'Console', 'Sources', 'Network', 'DataLayer Lens'];

/**
 * Simulates the Chrome DevTools frame with tabs
 */
export function DevToolsChrome({
  children,
  activeTab = 'DataLayer Lens',
  width = 1100,
  height = 650,
}: DevToolsChromeProps) {
  return (
    <div
      style={{
        width,
        height: height + 32, // Add space for tab bar
        background: '#1e1e1e',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          height: 32,
          background: '#252526',
          borderBottom: '1px solid #3c3c3c',
          display: 'flex',
          alignItems: 'stretch',
          paddingLeft: 8,
          gap: 0,
        }}
      >
        {devToolsTabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <div
              key={tab}
              style={{
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                fontSize: 11,
                color: isActive ? '#e8e8e8' : '#969696',
                background: isActive ? '#1e1e1e' : 'transparent',
                borderTop: isActive ? '2px solid #6366f1' : '2px solid transparent',
                borderRight: '1px solid #3c3c3c',
                cursor: 'default',
                whiteSpace: 'nowrap',
              }}
            >
              {tab}
            </div>
          );
        })}
        {/* Spacer */}
        <div style={{ flex: 1 }} />
        {/* Close/settings icons placeholder */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingRight: 12,
            color: '#969696',
            fontSize: 11,
          }}
        >
          <span style={{ opacity: 0.6 }}>⋮</span>
          <span style={{ opacity: 0.6 }}>×</span>
        </div>
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

// ============================================================================
// Marketing Labels - Styled text for collateral
// ============================================================================

interface MarketingHeadingProps {
  children: ReactNode;
  style?: CSSProperties;
}

/**
 * Marketing heading with Caprasimo font
 */
export function MarketingHeading({ children, style }: MarketingHeadingProps) {
  return (
    <h3
      style={{
        fontFamily: '"Caprasimo", serif',
        fontWeight: 400,
        fontSize: 40,
        color: 'white',
        margin: 0,
        ...style,
      }}
    >
      {children}
    </h3>
  );
}

interface MarketingBadgeProps {
  children: ReactNode;
  color?: 'primary' | 'accent' | 'secondary' | 'success';
  style?: CSSProperties;
}

const badgeColors = {
  primary: { bg: '#6366f1', text: '#ffffff', shadow: '#6366f1' },
  accent: { bg: '#22d3ee', text: '#0f172a', shadow: '#22d3ee' },
  secondary: { bg: '#a855f7', text: '#ffffff', shadow: '#a855f7' },
  success: { bg: '#10b981', text: '#ffffff', shadow: '#10b981' },
};

/**
 * Marketing badge with solid neon background, crisp shadows and skew
 */
export function MarketingBadge({ children, color = 'primary', style }: MarketingBadgeProps) {
  const colors = badgeColors[color];

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '8px 16px',
        fontSize: 15,
        fontWeight: 600,
        color: colors.text,
        background: colors.bg,
        borderRadius: 6,
        transform: 'rotate(-2deg) skewX(-4deg)',
        boxShadow: `0 3px 0 rgba(0, 0, 0, 0.4), 0 0 0 2px ${colors.shadow}80`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
