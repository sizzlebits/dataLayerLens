import type { Meta, StoryObj } from '@storybook/react';
import { JsonHighlight } from '@/components/shared/JsonHighlight';

const meta: Meta<typeof JsonHighlight> = {
  title: 'Molecules/JsonHighlight',
  component: JsonHighlight,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object' },
  },
  decorators: [
    (Story) => (
      <pre
        style={{
          backgroundColor: '#020617',
          padding: '16px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}
      >
        <Story />
      </pre>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleObject: Story = {
  args: {
    data: {
      event: 'page_view',
      page_title: 'Home Page',
    },
  },
};

export const NestedObject: Story = {
  args: {
    data: {
      event: 'purchase',
      ecommerce: {
        transaction_id: 'T12345',
        value: 99.99,
        currency: 'USD',
        items: [
          {
            item_id: 'SKU001',
            item_name: 'Product 1',
            price: 49.99,
            quantity: 2,
          },
        ],
      },
    },
  },
};

export const WithArray: Story = {
  args: {
    data: {
      items: ['item1', 'item2', 'item3'],
      count: 3,
    },
  },
};

export const WithPrimitives: Story = {
  args: {
    data: {
      string: 'Hello World',
      number: 42,
      float: 3.14159,
      boolean: true,
      null: null,
    },
  },
};

export const EmptyObject: Story = {
  args: {
    data: {},
  },
};

export const EmptyArray: Story = {
  args: {
    data: [],
  },
};

export const ComplexData: Story = {
  args: {
    data: {
      event: 'view_item_list',
      ecommerce: {
        item_list_id: 'related_products',
        item_list_name: 'Related products',
        items: [
          {
            item_id: 'SKU_12345',
            item_name: 'Stan and Friends Tee',
            affiliation: 'Google Merchandise Store',
            coupon: 'SUMMER_FUN',
            discount: 2.22,
            index: 0,
            item_brand: 'Google',
            item_category: 'Apparel',
            item_category2: 'Adult',
            item_list_id: 'related_products',
            item_variant: 'green',
            price: 9.99,
            quantity: 1,
          },
          {
            item_id: 'SKU_12346',
            item_name: 'Google Power Tee',
            item_brand: 'Google',
            item_category: 'Apparel',
            price: 19.99,
            quantity: 1,
          },
        ],
      },
    },
  },
};
