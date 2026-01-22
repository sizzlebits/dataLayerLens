import type { Meta, StoryObj } from '@storybook/react';
import { lazy, Suspense, useState } from 'react';
import {
  ScreenshotFrame,
  FloatingCard,
  Glow,
  DevToolsChrome,
  marketingArgTypes,
  defaultMarketingArgs,
  type MarketingArgs,
} from './decorators';
import { EventRow } from '@/components/shared/EventRow';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
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

interface DevToolsHeroProps extends MarketingArgs {}

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
          <Suspense fallback={<LoadingFallback />}>
            <DevToolsPanel />
          </Suspense>
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
          <Suspense fallback={<LoadingFallback />}>
            <DevToolsPanel />
          </Suspense>
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
          <div style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
            <Suspense fallback={<LoadingFallback />}>
              <DevToolsPanel />
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
          <div style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
            <Suspense fallback={<LoadingFallback />}>
              <DevToolsPanel />
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

function GroupingComparisonWrapper({ args }: { args: MarketingArgs }) {
  const panelWidth = 520;
  const panelHeight = 560;

  return (
    <ScreenshotFrame gradient={args.gradient} padding={40}>
      {args.showGlow && <Glow color={args.glowColor} blur={120} opacity={0.4} offsetY={40} />}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {/* Left panel - Ungrouped view */}
        <FloatingCard shadow="xl" rotate={{ y: 6, x: 2 }}>
          <DevToolsChrome activeTab="DataLayer Lens" width={panelWidth} height={panelHeight}>
            <div
              style={{
                height: '100%',
                background: '#020617',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Mini header */}
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#0f172a',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="12" height="12" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Ungrouped</span>
                <span style={{ color: '#64748b', fontSize: 11 }}>{comparisonEvents.length} events</span>
              </div>
              {/* Flat event list using real EventRow */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {comparisonEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isExpanded={false}
                    showTimestamps={true}
                    sourceColor="#22d3ee"
                    onToggle={() => {}}
                  />
                ))}
              </div>
            </div>
          </DevToolsChrome>
        </FloatingCard>

        {/* Right panel - Grouped view */}
        <FloatingCard shadow="xl" rotate={{ y: -6, x: 2 }}>
          <DevToolsChrome activeTab="DataLayer Lens" width={panelWidth} height={panelHeight}>
            <div
              style={{
                height: '100%',
                background: '#020617',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Mini header */}
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#0f172a',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="12" height="12" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Grouped</span>
                <span
                  style={{
                    padding: '2px 6px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#6366f1',
                    borderRadius: 4,
                    fontSize: 10,
                  }}
                >
                  3 groups
                </span>
              </div>
              {/* Grouped event list */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {/* Group 1 */}
                <div style={{ borderBottom: '1px solid #1e293b' }}>
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(15, 23, 42, 0.5)',
                      borderLeft: '2px solid rgba(99, 102, 241, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <svg width="12" height="12" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 500 }}>2 events</span>
                    <span style={{ color: '#6366f1', fontSize: 10 }}>gtm.js</span>
                  </div>
                  <div style={{ paddingLeft: 14, borderLeft: '2px solid rgba(99, 102, 241, 0.2)', marginLeft: 0 }}>
                    {comparisonEvents.slice(0, 2).map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        isExpanded={false}
                        compact={true}
                        showTimestamps={false}
                        sourceColor="#22d3ee"
                        onToggle={() => {}}
                      />
                    ))}
                  </div>
                </div>
                {/* Group 2 */}
                <div style={{ borderBottom: '1px solid #1e293b' }}>
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(15, 23, 42, 0.5)',
                      borderLeft: '2px solid rgba(99, 102, 241, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <svg width="12" height="12" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 500 }}>2 events</span>
                    <span style={{ color: '#6366f1', fontSize: 10 }}>page_view</span>
                  </div>
                  <div style={{ paddingLeft: 14, borderLeft: '2px solid rgba(99, 102, 241, 0.2)', marginLeft: 0 }}>
                    {comparisonEvents.slice(2, 4).map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        isExpanded={false}
                        compact={true}
                        showTimestamps={false}
                        sourceColor="#22d3ee"
                        onToggle={() => {}}
                      />
                    ))}
                  </div>
                </div>
                {/* Group 3 */}
                <div>
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(15, 23, 42, 0.5)',
                      borderLeft: '2px solid rgba(99, 102, 241, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <svg width="12" height="12" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 500 }}>2 events</span>
                    <span style={{ color: '#6366f1', fontSize: 10 }}>add_to_cart</span>
                  </div>
                  <div style={{ paddingLeft: 14, borderLeft: '2px solid rgba(99, 102, 241, 0.2)', marginLeft: 0 }}>
                    {comparisonEvents.slice(4, 6).map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        isExpanded={false}
                        compact={true}
                        showTimestamps={false}
                        sourceColor="#22d3ee"
                        onToggle={() => {}}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
    <ScreenshotFrame gradient={args.gradient} padding={60}>
      {args.showGlow && <Glow color={args.glowColor} blur={150} opacity={0.4} offsetY={-60} />}

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
                <EventRow
                  event={event}
                  isExpanded={false}
                  showTimestamps={true}
                  sourceColor={streamEventColors[index]}
                  onToggle={() => {}}
                />
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
    gradient: 'dustyDusk',
    showGlow: false,
  },
  render: (args) => <EventsStreamWrapper args={args} />,
};
