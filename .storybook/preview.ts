// IMPORTANT: Mock must be first import to set up globals before any component code runs
import './mocks/browserAPI';

import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f172a' },
        { name: 'darker', value: '#020617' },
        { name: 'light', value: '#f8fafc' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
