import type { Meta, StoryObj } from '@storybook/react';
import { lazy, Suspense, useState } from 'react';
import {
  ScreenshotFrame,
  FloatingCard,
  Glow,
  DevToolsChrome,
  MarketingHeading,
  MarketingBadge,
  marketingArgTypes,
  defaultMarketingArgs,
  type MarketingArgs,
} from './decorators';
import { ThemeWrapper } from './ThemeWrapper';
import { ArrowIcon } from './ArrowIcon';
import { MockedDevToolsPanel } from './MockedDevToolsPanel';
import { EventRow } from '@/components/shared/EventRow';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
import { GroupingSettings } from '@/components/shared/settings/GroupingSettings';
import { AppIcon } from '@/components/shared/AppIcon';
import type { DataLayerEvent, Settings } from '@/types';

const DevToolsPanel = lazy(() =>
  import('@/devtools/DevToolsPanel').then((m) => ({ default: m.DevToolsPanel }))
);

const LoadingFallback = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#1e293b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#64748b',
    }}
  >
    Loading...
  </div>
);

type DevToolsHeroProps = MarketingArgs;

// Default panel width - narrower to simulate typical DevTools view
const DEFAULT_PANEL_WIDTH = 900;
const DEFAULT_PANEL_HEIGHT = 580;

/**
 * Marketing screenshot component with configurable gradient and effects
 * All views are wrapped in the fake DevTools Chrome frame
 */
function DevToolsHeroShot({
  gradient,
  showGlow,
  glowColor,
  rotateX,
  rotateY,
  scale,
}: DevToolsHeroProps) {
  const hasRotation = rotateX !== 0 || rotateY !== 0;

  return (
    <ScreenshotFrame gradient={gradient} padding={40}>
      {showGlow && <Glow color={glowColor} blur={100} opacity={0.5} offsetY={60} />}
      <FloatingCard
        shadow="2xl"
        scale={scale}
        rotate={hasRotation ? { x: rotateX, y: rotateY } : undefined}
      >
        <DevToolsChrome activeTab="DataLayer Lens" width={DEFAULT_PANEL_WIDTH} height={DEFAULT_PANEL_HEIGHT}>
          <ThemeWrapper theme="dark">
            <Suspense fallback={<LoadingFallback />}>
              <DevToolsPanel forceTheme="dark" />
            </Suspense>
          </ThemeWrapper>
        </DevToolsChrome>
      </FloatingCard>
    </ScreenshotFrame>
  );
}

const meta: Meta<typeof DevToolsHeroShot> = {
  title: 'Marketing/DevTools Hero',
  component: DevToolsHeroShot,
  parameters: {
    layout: 'fullscreen',
    chromatic: { disableSnapshot: true },
    docs: { disable: true },
  },
  argTypes: marketingArgTypes,
  args: {
    ...defaultMarketingArgs,
    gradient: 'sunset',
    showGlow: false,
  },
};

export default meta;
type Story = StoryObj<typeof DevToolsHeroShot>;

// ============================================================================
// Main Stories
// ============================================================================

export const Default: Story = {
  name: 'Default (Use Controls)',
  args: {
    gradient: 'sunset',
    showGlow: false,
    scale: 0.9,
  },
};

export const FullWidth: Story = {
  name: 'Full Width',
  args: {
    gradient: 'sunset',
    showGlow: false,
    scale: 0.92,
  },
  render: (args) => (
    <ScreenshotFrame gradient={args.gradient} padding={40}>
      {args.showGlow && <Glow color={args.glowColor} blur={100} opacity={0.5} offsetY={60} />}
      <FloatingCard shadow="2xl" scale={args.scale}>
        <DevToolsChrome activeTab="DataLayer Lens" width={1100} height={620}>
          <ThemeWrapper theme="dark">
            <Suspense fallback={<LoadingFallback />}>
              <DevToolsPanel forceTheme="dark" />
            </Suspense>
          </ThemeWrapper>
        </DevToolsChrome>
      </FloatingCard>
    </ScreenshotFrame>
  ),
};

// ============================================================================
// Context Variations - Different UI states using REAL components
// ============================================================================

// Sample event data for demonstrations
const sampleEvent: DataLayerEvent = {
  id: 'sample-1',
  timestamp: Date.now(),
  event: 'purchase',
  data: {
    event: 'purchase',
    ecommerce: {
      transaction_id: 'T-12345',
      value: 129.99,
      currency: 'USD',
      items: [
        { name: 'Product A', price: 99.99 },
        { name: 'Product B', price: 30.0 },
      ],
    },
  },
  source: 'dataLayer',
  raw: {},
  dataLayerIndex: 5,
};

const defaultSettings: Settings = {
  dataLayerNames: ['dataLayer'],
  showTimestamps: true,
  showEmojis: true,
  maxEvents: 100,
  compactMode: false,
  persistEvents: true,
  persistEventsMaxAge: 0,
  consoleLogging: false,
  debugLogging: false,
  sourceColors: {},
  eventFilters: [],
  filterMode: 'exclude',
  theme: 'dark',
  grouping: {
    enabled: true,
    mode: 'time',
    timeWindowMs: 500,
    triggerEvents: ['gtm.js', 'page_view'],
  },
};

export const WithEventExpanded: Story = {
  name: 'With Event Expanded',
  args: {
    gradient: 'joker',
    showGlow: false,
    scale: 0.88,
  },
  render: (args) => (
    <ScreenshotFrame gradient={args.gradient} padding={40}>
      {args.showGlow && <Glow color={args.glowColor} blur={100} opacity={0.5} offsetY={60} />}
      <FloatingCard shadow="2xl" scale={args.scale}>
        <DevToolsChrome activeTab="DataLayer Lens" width={DEFAULT_PANEL_WIDTH} height={DEFAULT_PANEL_HEIGHT}>
          <ThemeWrapper theme="dark">
            <div style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
              <Suspense fallback={<LoadingFallback />}>
                <DevToolsPanel forceTheme="dark" />
              </Suspense>
              {/* Real EventRow component positioned as overlay, showing expanded state */}
              <div
                style={{
                  position: 'absolute',
                  top: 100,
                  left: 16,
                  right: 16,
                  zIndex: 20,
                  background: '#0f172a',
                  borderRadius: 8,
                  border: '1px solid #6366f1',
                  boxShadow: '0 10px 40px rgba(99, 102, 241, 0.3)',
                  overflow: 'hidden',
                }}
              >
                <EventRow
                  event={sampleEvent}
                  isExpanded={true}
                  showTimestamps={true}
                  sourceColor="#22d3ee"
                  onToggle={() => {}}
                  onCopy={() => {}}
                />
              </div>
            </div>
          </ThemeWrapper>
        </DevToolsChrome>
      </FloatingCard>
    </ScreenshotFrame>
  ),
};

function SettingsDrawerWrapper({ args }: { args: MarketingArgs }) {
  const [settings] = useState<Settings>(defaultSettings);

  return (
    <ScreenshotFrame gradient={args.gradient} padding={40}>
      {args.showGlow && <Glow color={args.glowColor} blur={120} opacity={0.35} offsetY={80} />}
      <FloatingCard shadow="2xl" scale={args.scale}>
        <DevToolsChrome activeTab="DataLayer Lens" width={DEFAULT_PANEL_WIDTH} height={DEFAULT_PANEL_HEIGHT}>
          <ThemeWrapper theme="dark">
            <div style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
              <Suspense fallback={<LoadingFallback />}>
                <DevToolsPanel forceTheme="dark" />
              </Suspense>
              {/* Real SettingsDrawer component - override fixed positioning */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: 320,
                zIndex: 50,
              }}
              className="settings-drawer-override"
            >
              <style>{`
                .settings-drawer-override > div:last-child {
                  position: absolute !important;
                  right: 0 !important;
                }
              `}</style>
              <SettingsDrawer
                isOpen={true}
                onClose={() => {}}
                settings={settings}
                onUpdateSettings={() => {}}
                activeTabId={null}
                eventCount={247}
                onExport={() => {}}
              />
            </div>
          </div>
          </ThemeWrapper>
        </DevToolsChrome>
      </FloatingCard>
    </ScreenshotFrame>
  );
}

export const WithSettingsOpen: Story = {
  name: 'With Settings Drawer',
  args: {
    gradient: 'icePeak',
    showGlow: false,
    scale: 0.88,
  },
  render: (args) => <SettingsDrawerWrapper args={args} />,
};

// ============================================================================
// Grouped vs Ungrouped Comparison (using REAL EventRow components)
// ============================================================================

// Event data for the comparison views
const comparisonEvents: DataLayerEvent[] = [
  { id: 'cmp-1', timestamp: Date.now() - 5000, event: 'gtm.js', data: { event: 'gtm.js' }, source: 'dataLayer', raw: {}, dataLayerIndex: 0 },
  { id: 'cmp-2', timestamp: Date.now() - 4500, event: 'gtm.dom', data: { event: 'gtm.dom' }, source: 'dataLayer', raw: {}, dataLayerIndex: 1 },
  { id: 'cmp-3', timestamp: Date.now() - 3000, event: 'page_view', data: { event: 'page_view', page_title: 'Home' }, source: 'dataLayer', raw: {}, dataLayerIndex: 2 },
  { id: 'cmp-4', timestamp: Date.now() - 2500, event: 'view_item', data: { event: 'view_item', item_name: 'Widget' }, source: 'dataLayer', raw: {}, dataLayerIndex: 3 },
  { id: 'cmp-5', timestamp: Date.now() - 1000, event: 'add_to_cart', data: { event: 'add_to_cart', value: 29.99 }, source: 'dataLayer', raw: {}, dataLayerIndex: 4 },
  { id: 'cmp-6', timestamp: Date.now() - 500, event: 'purchase', data: { event: 'purchase', value: 29.99 }, source: 'dataLayer', raw: {}, dataLayerIndex: 5 },
];

// Settings for ungrouped view
const ungroupedSettings: Settings = {
  ...defaultSettings,
  grouping: {
    enabled: false,
    mode: 'time',
    timeWindowMs: 500,
    triggerEvents: [],
  },
};

// Settings for grouped view
const groupedSettings: Settings = {
  ...defaultSettings,
  grouping: {
    enabled: true,
    mode: 'event',
    timeWindowMs: 500,
    triggerEvents: ['gtm.js', 'page_view', 'add_to_cart'],
  },
};

function GroupingComparisonWrapper({ args }: { args: MarketingArgs }) {
  const panelWidth = 520;
  const panelHeight = 680; // Increased to allow clipping

  return (
    <ScreenshotFrame gradient={args.gradient} padding={40} style={{ overflow: 'hidden' }}>
      {args.showGlow && <Glow color={args.glowColor} blur={120} opacity={0.4} offsetY={40} />}

      {/* Title and Badge */}
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 10 }}>
        <MarketingHeading>Event Grouping</MarketingHeading>
        <MarketingBadge color="secondary">Based on time or event markers</MarketingBadge>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'center', position: 'relative', marginTop: 260 }}>
        {/* Left panel - Ungrouped view using real DevToolsPanel with mocked browser API */}
        <div style={{ position: 'relative' }}>
          <FloatingCard shadow="xl" rotate={{ y: 6, x: 2 }}>
            <DevToolsChrome activeTab="DataLayer Lens" width={panelWidth} height={panelHeight}>
              <ThemeWrapper theme="dark">
                <MockedDevToolsPanel
                  forceTheme="dark"
                  mockEvents={comparisonEvents}
                  mockSettings={ungroupedSettings}
                  mockExpandedEvents={['cmp-3']}
                  clickGroupToggle={true}
                />
              </ThemeWrapper>
            </DevToolsChrome>
          </FloatingCard>

          {/* Stylized Grouping Settings Modal - using real component */}
          <div
            style={{
              position: 'absolute',
              top: 236,
              left: 214,
              width: 240,
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: '2px solid #6366f1',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.2)',
              zIndex: 30,
              pointerEvents: 'none',
            }}
          >
            <ThemeWrapper theme="dark">
              <GroupingSettings
                settings={groupedSettings}
                onUpdateSettings={() => {}}
              />
            </ThemeWrapper>
          </div>
        </div>

        {/* Arrow overlay - positioned at 36% from top */}
        <div style={{ position: 'absolute', left: '50%', top: '36%', transform: 'translate(-50%, -50%)', zIndex: 5, pointerEvents: 'none' }}>
          <ArrowIcon width={120} height={124} color="white" style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))' }} />
        </div>

        {/* Right panel - Grouped view using real DevToolsPanel with mocked browser API */}
        <FloatingCard shadow="xl" rotate={{ y: -6, x: 2 }}>
          <DevToolsChrome activeTab="DataLayer Lens" width={panelWidth} height={panelHeight}>
            <ThemeWrapper theme="dark">
              <MockedDevToolsPanel
                forceTheme="dark"
                mockEvents={comparisonEvents}
                mockSettings={groupedSettings}
                mockExpandedEvents={['cmp-3']}
              />
            </ThemeWrapper>
          </DevToolsChrome>
        </FloatingCard>
      </div>
    </ScreenshotFrame>
  );
}

export const GroupingComparison: Story = {
  name: 'Grouped vs Ungrouped',
  args: {
    gradient: 'sunset',
    showGlow: false,
  },
  render: (args) => <GroupingComparisonWrapper args={args} />,
};

// ============================================================================
// Events Stream - Just events with 3D depth effect (using REAL EventRow)
// Bottom = old/background/small, Top = new/foreground/large
// ============================================================================

const streamEvents: DataLayerEvent[] = [
  { id: 'stream-1', timestamp: Date.now() - 8000, event: 'gtm.js', data: { event: 'gtm.js' }, source: 'dataLayer', raw: {}, dataLayerIndex: 0 },
  { id: 'stream-2', timestamp: Date.now() - 6000, event: 'page_view', data: { event: 'page_view', page_title: 'Home' }, source: 'dataLayer', raw: {}, dataLayerIndex: 1 },
  { id: 'stream-3', timestamp: Date.now() - 4000, event: 'view_item', data: { event: 'view_item', item_name: 'Widget', price: 49.99 }, source: 'dataLayer', raw: {}, dataLayerIndex: 2 },
  { id: 'stream-4', timestamp: Date.now() - 2000, event: 'add_to_cart', data: { event: 'add_to_cart', currency: 'USD', value: 49.99 }, source: 'dataLayer', raw: {}, dataLayerIndex: 3 },
  { id: 'stream-5', timestamp: Date.now(), event: 'purchase', data: { event: 'purchase', transaction_id: 'T-12345', value: 49.99 }, source: 'dataLayer', raw: {}, dataLayerIndex: 4 },
];

const streamEventColors = ['#64748b', '#8b5cf6', '#6366f1', '#3b82f6', '#22d3ee'];

function EventsStreamWrapper({ args }: { args: MarketingArgs }) {
  return (
    <ScreenshotFrame gradient={args.gradient} padding={60} style={{ overflow: 'hidden' }}>
      {args.showGlow && <Glow color={args.glowColor} blur={150} opacity={0.4} offsetY={-60} />}

      {/* Giant decorative AppIcon in background */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(15deg)',
          opacity: 0.08,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <AppIcon size="custom" customSize={900} variant="plain" />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: '1200px',
          perspectiveOrigin: '50% 80%',
          width: 700,
          height: 650,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Events stacked - bottom (index 0) = old/small/back, top (last) = new/large/front */}
        {streamEvents.map((event, index) => {
          const progress = index / (streamEvents.length - 1); // 0 to 1
          const scale = 0.75 + progress * 0.3; // 0.75 to 1.05
          const translateZ = -200 + progress * 250; // -200 to 50
          const translateY = 140 - progress * 280; // Bottom: 140, Top: -140 (closer together)
          const opacity = 0.5 + progress * 0.5; // 0.5 to 1
          const blur = Math.max(0, (1 - progress) * 1); // 1 to 0

          return (
            <div
              key={event.id}
              style={{
                position: 'absolute',
                left: 40,
                right: 40,
                top: '50%',
                transform: `
                  translateY(${translateY}px)
                  translateZ(${translateZ}px)
                  scale(${scale})
                `,
                transformStyle: 'preserve-3d',
                opacity,
                filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
                zIndex: index + 1,
              }}
            >
              <div
                style={{
                  background: '#0f172a',
                  borderRadius: 10,
                  boxShadow: `
                    0 10px 40px rgba(0, 0, 0, 0.5),
                    0 0 60px ${streamEventColors[index]}20
                  `,
                  overflow: 'hidden',
                  border: `1px solid ${streamEventColors[index]}40`,
                }}
              >
                <ThemeWrapper theme="dark">
                  <EventRow
                    event={event}
                    isExpanded={false}
                    showTimestamps={true}
                    sourceColor={streamEventColors[index]}
                    onToggle={() => {}}
                  />
                </ThemeWrapper>
              </div>
            </div>
          );
        })}
      </div>
    </ScreenshotFrame>
  );
}

export const EventsStream: Story = {
  name: 'Events Stream (3D)',
  args: {
    gradient: 'aurora',
    showGlow: false,
  },
  render: (args) => <EventsStreamWrapper args={args} />,
};

// ============================================================================
// Light/Dark Theme Comparison (Side-by-Side)
// ============================================================================

function LightDarkComparisonWrapper({ args }: { args: MarketingArgs }) {
  const panelWidth = 550;
  const panelHeight = 600;

  return (
    <ScreenshotFrame gradient={args.gradient} padding={40}>
      {args.showGlow && <Glow color={args.glowColor} blur={140} opacity={0.4} offsetY={0} />}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {/* Dark Mode */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <MarketingHeading>Dark Mode</MarketingHeading>
            <MarketingBadge color="primary">Perfect for night owl devs</MarketingBadge>
          </div>
          <FloatingCard shadow="xl" rotate={{ y: 6, x: 2 }}>
            <DevToolsChrome activeTab="DataLayer Lens" width={panelWidth} height={panelHeight}>
              <ThemeWrapper theme="dark">
                <Suspense fallback={<LoadingFallback />}>
                  <DevToolsPanel forceTheme="dark" />
                </Suspense>
              </ThemeWrapper>
            </DevToolsChrome>
          </FloatingCard>
        </div>

        {/* Light Mode */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <MarketingHeading>Light Mode</MarketingHeading>
            <MarketingBadge color="accent">...and everyone else 😎</MarketingBadge>
          </div>
          <FloatingCard shadow="xl" rotate={{ y: -6, x: 2 }}>
            <DevToolsChrome activeTab="DataLayer Lens" width={panelWidth} height={panelHeight}>
              <ThemeWrapper theme="light">
                <Suspense fallback={<LoadingFallback />}>
                  <DevToolsPanel forceTheme="light" />
                </Suspense>
              </ThemeWrapper>
            </DevToolsChrome>
          </FloatingCard>
        </div>
      </div>
    </ScreenshotFrame>
  );
}

export const LightDarkComparison: Story = {
  name: 'Light vs Dark Theme',
  args: {
    gradient: 'sunset',
    showGlow: false,
  },
  parameters: {
    // Disable global theme decorator for this story since we're managing themes manually
    themes: {
      disable: true,
    },
  },
  render: (args) => <LightDarkComparisonWrapper args={args} />,
};
