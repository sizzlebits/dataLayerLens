import type { Meta, StoryObj } from '@storybook/react';
import { lazy, Suspense } from 'react';

// Lazy import to ensure browser mocks are set up before component loads
const DevToolsPanel = lazy(() => import('@/devtools/DevToolsPanel').then(m => ({ default: m.DevToolsPanel })));

const LoadingFallback = () => (
  <div className="h-screen flex items-center justify-center bg-dl-darker text-slate-400">
    Loading...
  </div>
);

const meta: Meta<typeof DevToolsPanel> = {
  title: 'Views/DevToolsPanel',
  component: DevToolsPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The main DevTools panel view for DataLayer Lens. This is the primary interface users see when opening the extension in Chrome DevTools.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', width: '100%' }}>
        <Suspense fallback={<LoadingFallback />}>
          <Story />
        </Suspense>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DevToolsPanel>;

export const WithEvents: Story = {
  name: 'With Sample Events',
};
