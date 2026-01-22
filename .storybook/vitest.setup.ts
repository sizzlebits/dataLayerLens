import { setProjectAnnotations } from '@storybook/react';
import * as previewAnnotations from './preview';

// Apply Storybook's preview configuration to Vitest
setProjectAnnotations([previewAnnotations]);

// Suppress common React warnings in browser tests that don't affect functionality
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = String(args[0]);

  // Suppress act() warnings from animations (framer-motion)
  if (message.includes('An update to') && message.includes('inside a test was not wrapped in act')) {
    return;
  }

  // Suppress invalid hook call warnings (known issue with browser testing)
  if (message.includes('Invalid hook call')) {
    return;
  }

  // Suppress error boundary suggestions (just informational)
  if (message.includes('Consider adding an error boundary')) {
    return;
  }

  // Suppress Storybook status follower error (known bug in Storybook 10.2.0)
  // https://github.com/storybookjs/storybook/issues/33575
  if (message.includes('storybook/status') || message.includes('follower with id')) {
    return;
  }

  // Log all other errors normally
  originalConsoleError.apply(console, args);
};
