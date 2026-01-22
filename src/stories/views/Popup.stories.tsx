import type { Meta, StoryObj } from '@storybook/react';
import { lazy, Suspense } from 'react';

// Lazy import to ensure browser mocks are set up before component loads
const Popup = lazy(() => import('@/popup/Popup').then(m => ({ default: m.Popup })));

const LoadingFallback = () => (
  <div className="w-80 h-[28rem] flex items-center justify-center bg-dl-dark text-slate-400 rounded-xl">
    Loading...
  </div>
);

const meta: Meta<typeof Popup> = {
  title: 'Views/Popup',
  component: Popup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The browser extension popup interface. Provides quick access to event monitoring, settings, and domain-specific configurations.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Story />
        </Suspense>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Popup>;

export const Default: Story = {};
