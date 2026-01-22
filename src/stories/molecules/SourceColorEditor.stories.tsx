import type { Meta, StoryObj } from '@storybook/react';
import { SourceColorEditor } from '@/components/shared/SourceColorEditor';
import { SOURCE_COLOR_POOL } from '@/types';

const meta: Meta<typeof SourceColorEditor> = {
  title: 'Molecules/SourceColorEditor',
  component: SourceColorEditor,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    sources: { control: 'object' },
    sourceColors: { control: 'object' },
    onColorChange: { action: 'colorChanged' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleSource: Story = {
  args: {
    sources: ['dataLayer'],
    sourceColors: {
      dataLayer: SOURCE_COLOR_POOL[0],
    },
  },
};

export const MultipleSources: Story = {
  args: {
    sources: ['dataLayer', 'customLayer', 'analyticsLayer'],
    sourceColors: {
      dataLayer: SOURCE_COLOR_POOL[0],
      customLayer: SOURCE_COLOR_POOL[1],
      analyticsLayer: SOURCE_COLOR_POOL[2],
    },
  },
};

export const NoSources: Story = {
  args: {
    sources: [],
    sourceColors: {},
  },
};

export const ManySources: Story = {
  args: {
    sources: [
      'dataLayer',
      'customLayer',
      'analyticsLayer',
      'marketingLayer',
      'trackingLayer',
    ],
    sourceColors: {
      dataLayer: SOURCE_COLOR_POOL[0],
      customLayer: SOURCE_COLOR_POOL[1],
      analyticsLayer: SOURCE_COLOR_POOL[2],
      marketingLayer: SOURCE_COLOR_POOL[3],
      trackingLayer: SOURCE_COLOR_POOL[4],
    },
  },
};
