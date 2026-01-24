// IMPORTANT: Mock must be first import to set up globals before any component code runs
import './mocks/browserAPI';

import type { Preview } from '@storybook/react';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/styles/globals.css';

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'dark',
      attributeName: 'data-theme',
    }),
  ],
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
    viewport: {
      viewports: {
        screenshot: {
          name: 'Store Screenshot (1280x800)',
          styles: {
            width: '1280px',
            height: '800px',
          },
        },
        screenshotSmall: {
          name: 'Small Screenshot (640x400)',
          styles: {
            width: '640px',
            height: '400px',
          },
        },
      },
    },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Styleguide',
          'Design Tokens',
          'Atoms',
          'Molecules',
          'Organisms',
          'Views',
          'Marketing', // Marketing section appears last
        ],
      },
    },
  },
};

export default preview;
