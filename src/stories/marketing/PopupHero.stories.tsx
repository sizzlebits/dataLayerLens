import type { Meta, StoryObj } from '@storybook/react';
import { Suspense } from 'react';
import {
  ScreenshotFrame,
  FloatingCard,
  Glow,
  MarketingText,
  MarketingTextRow,
  MarketingHeader,
  MarketingContent,
  marketingArgTypes,
  defaultMarketingArgs,
  type MarketingArgs,
} from './decorators';
import { ThemeWrapper } from './ThemeWrapper';
import { Popup } from '@/popup/Popup';
import { MonitorTab } from '@/popup/components/MonitorTab';
import { SettingsTab } from '@/popup/components/SettingsTab';
import { DomainsTab } from '@/popup/components/DomainsTab';
import { AppIcon } from '@/components/shared/AppIcon';
import type { Settings, DataLayerEvent, DomainSettings } from '@/types';

const LoadingFallback = () => (
  <div
    style={{
      width: 320,
      height: 448,
      background: '#0f172a',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#64748b',
    }}
  >
    Loading...
  </div>
);

// Mock data for tab showcases
const mockSettings: Settings = {
  dataLayerNames: ['dataLayer', 'adobeDataLayer'],
  showTimestamps: true,
  showEmojis: true,
  maxEvents: 100,
  compactMode: false,
  persistEvents: true,
  persistEventsMaxAge: 0,
  consoleLogging: false,
  debugLogging: false,
  sourceColors: {
    dataLayer: '#22d3ee',
    adobeDataLayer: '#f59e0b',
  },
  eventHighlights: {},
  eventFilters: ['gtm.js', 'gtm.dom'],
  filterMode: 'exclude',
  theme: 'dark',
  grouping: {
    enabled: true,
    mode: 'time',
    timeWindowMs: 500,
    triggerEvents: ['gtm.js', 'page_view'],
  },
};

const mockEvents: DataLayerEvent[] = [
  { id: '1', timestamp: Date.now(), event: 'page_view', data: {}, source: 'dataLayer', raw: {}, dataLayerIndex: 0 },
  { id: '2', timestamp: Date.now(), event: 'view_item', data: {}, source: 'dataLayer', raw: {}, dataLayerIndex: 1 },
  { id: '3', timestamp: Date.now(), event: 'add_to_cart', data: {}, source: 'dataLayer', raw: {}, dataLayerIndex: 2 },
];

const mockDomainSettings: Record<string, DomainSettings> = {
  'example.com': {
    domain: 'example.com',
    settings: { dataLayerNames: ['dataLayer'], maxEvents: 50 },
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
  },
  'shop.example.com': {
    domain: 'shop.example.com',
    settings: { dataLayerNames: ['dataLayer', 'shopLayer'], maxEvents: 200 },
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 3600000,
  },
};

type PopupHeroProps = MarketingArgs;

function PopupHeroShot({
  gradient,
  showGlow,
  glowColor,
  rotateX,
  rotateY,
  scale,
}: PopupHeroProps) {
  const hasRotation = rotateX !== 0 || rotateY !== 0;

  return (
    <ScreenshotFrame gradient={gradient} padding={40}>
      {showGlow && <Glow color={glowColor} blur={100} opacity={0.5} offsetY={40} />}
      <FloatingCard
        shadow="2xl"
        scale={scale}
        rotate={hasRotation ? { x: rotateX, y: rotateY } : undefined}
      >
        <ThemeWrapper theme="dark">
          <Suspense fallback={<LoadingFallback />}>
            <Popup forceTheme="dark" />
          </Suspense>
        </ThemeWrapper>
      </FloatingCard>
    </ScreenshotFrame>
  );
}

const meta: Meta<typeof PopupHeroShot> = {
  title: 'Marketing/Popup Hero',
  component: PopupHeroShot,
  parameters: {
    layout: 'fullscreen',
    chromatic: { disableSnapshot: true },
    docs: { disable: true },
  },
  argTypes: marketingArgTypes,
  args: {
    ...defaultMarketingArgs,
    scale: 1,
  },
};

export default meta;
type Story = StoryObj<typeof PopupHeroShot>;

export const Default: Story = {
  name: 'Default (Use Controls)',
  args: {
    gradient: 'sunset',
    showGlow: false,
  },
};

// ============================================================================
// Three Tabs Side-by-Side
// ============================================================================

interface PopupFrameProps {
  children: React.ReactNode;
  activeTab: 'Monitor' | 'Settings' | 'Domains';
}

function PopupFrame({ children, activeTab }: PopupFrameProps) {
  const tabs = ['Monitor', 'Settings', 'Domains'] as const;

  return (
    <div className="w-80 h-[28rem] flex flex-col bg-gradient-to-br from-dl-dark to-dl-darker rounded-xl overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-dl-primary/20 to-dl-secondary/20 px-4 py-3 border-b border-dl-border">
        <div className="flex items-center gap-3">
          <AppIcon size="lg" variant="indented" />
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight">DataLayer Lens</h1>
            <p className="text-xs text-slate-400">Track your GTM events with clarity</p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 flex border-b border-dl-border">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium relative ${
              activeTab === tab ? 'text-dl-accent' : 'text-slate-400'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-dl-primary to-dl-accent" />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function ThreeTabsShowcase({ args }: { args: MarketingArgs }) {
  return (
    <ScreenshotFrame gradient={args.gradient} padding={40}>
      {args.showGlow && <Glow color={args.glowColor} blur={120} opacity={0.4} offsetY={20} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
        {/* Title */}
        <MarketingHeader position="top">
          <MarketingText heading="Fully Customisable" />
        </MarketingHeader>

        {/* Three Tabs */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {/* Monitor Tab */}
          <FloatingCard shadow="xl" rotate={{ y: 12, x: 5 }}>
            <ThemeWrapper theme="dark">
              <PopupFrame activeTab="Monitor">
                <MonitorTab
                  settings={mockSettings}
                  events={mockEvents}
                  currentDomain="example.com"
                  onClearEvents={() => {}}
                  onExportEvents={() => {}}
                  onAddFilter={() => {}}
                  onRemoveFilter={() => {}}
                  onClearFilters={() => {}}
                  onSetFilterMode={() => {}}
                />
              </PopupFrame>
            </ThemeWrapper>
          </FloatingCard>

          {/* Settings Tab */}
          <FloatingCard shadow="xl">
            <ThemeWrapper theme="dark">
              <PopupFrame activeTab="Settings">
                <SettingsTab
                  settings={mockSettings}
                  onUpdateSettings={() => {}}
                  onExportSettings={() => {}}
                  onImportSettings={() => {}}
                  importStatus={null}
                />
              </PopupFrame>
            </ThemeWrapper>
          </FloatingCard>

          {/* Domains Tab */}
          <FloatingCard shadow="xl" rotate={{ y: -12, x: 5 }}>
            <ThemeWrapper theme="dark">
              <PopupFrame activeTab="Domains">
                <DomainsTab
                  currentDomain="example.com"
                  domainSettings={mockDomainSettings}
                  onSaveCurrentDomain={() => {}}
                  onDeleteDomain={() => {}}
                />
              </PopupFrame>
            </ThemeWrapper>
          </FloatingCard>
        </div>
      </div>
    </ScreenshotFrame>
  );
}

export const ThreeTabs: Story = {
  name: 'All Three Tabs',
  args: {
    gradient: 'sunset',
    showGlow: false,
  },
  render: (args) => <ThreeTabsShowcase args={args} />,
};

// ============================================================================
// Light/Dark Theme Comparison (Side-by-Side)
// ============================================================================

function LightDarkComparisonWrapper({ args }: { args: MarketingArgs }) {
  return (
    <ScreenshotFrame gradient={args.gradient} padding={40}>
      {args.showGlow && <Glow color={args.glowColor} blur={120} opacity={0.4} offsetY={0} />}
      <MarketingHeader position="top">
        <MarketingTextRow
          blocks={[
            { heading: 'Dark Mode', badge: 'Classic DataLayer Lens experience', badgeColor: 'primary' },
            { heading: 'Light Mode', badge: 'Clean for any environment', badgeColor: 'accent' },
          ]}
        />
      </MarketingHeader>
      <MarketingContent>
        <div style={{ display: 'flex', gap: 80, alignItems: 'flex-start' }}>
          {/* Dark Mode */}
          <FloatingCard shadow="2xl" rotate={{ y: 8, x: 4 }} scale={1.15}>
            <ThemeWrapper theme="dark">
              <Popup forceTheme="dark" />
            </ThemeWrapper>
          </FloatingCard>

          {/* Light Mode */}
          <FloatingCard shadow="2xl" rotate={{ y: -8, x: 4 }} scale={1.15}>
            <ThemeWrapper theme="light">
              <Popup forceTheme="light" />
            </ThemeWrapper>
          </FloatingCard>
        </div>
      </MarketingContent>
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
