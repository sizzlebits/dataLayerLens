import type { Meta, StoryObj } from '@storybook/react';
import { lazy, Suspense } from 'react';

// Lazy import to ensure browser mocks are set up before component loads
const EventPanel = lazy(() => import('@/components/shared/EventPanel').then(m => ({ default: m.EventPanel })));

const LoadingFallback = () => (
  <div className="h-full flex items-center justify-center bg-dl-darker text-slate-400">
    Loading...
  </div>
);

const meta: Meta<typeof EventPanel> = {
  title: 'Organisms/EventPanel',
  component: EventPanel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    context: {
      control: 'select',
      options: ['devtools'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px' }}>
        <Suspense fallback={<LoadingFallback />}>
          <Story />
        </Suspense>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EventPanel>;

export const WithEvents: Story = {
  name: 'With Sample Events',
  args: {
    context: 'devtools',
  },
};
