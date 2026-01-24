/**
 * Visual regression tests for DevToolsPanel view
 * Using Vitest v4's built-in screenshot testing capabilities
 */

import { test, expect, beforeEach, beforeAll } from 'vitest';
import { page } from 'vitest/browser';
import { render, cleanup } from 'vitest-browser-react';
import { composeStories } from '@storybook/react';
import * as stories from '../DevToolsPanel.stories';

// Compose all stories from the file
const { WithEvents } = composeStories(stories);

// Load Google Font before all tests
beforeAll(async () => {
  // Add Google Font link to document head
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Caprasimo&display=swap';
  document.head.appendChild(link);

  // Wait for font to load
  await document.fonts.ready;
});

// Clean up between tests to prevent state leakage
beforeEach(() => {
  cleanup();
  // Ensure body fills viewport exactly with no white space
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.width = '100vw';
  document.body.style.height = '100vh';
  document.body.style.overflow = 'hidden';
  document.body.style.background = '#0f172a';
  // Clear any theme classes
  document.body.className = '';
  document.documentElement.className = '';
  document.documentElement.style.margin = '0';
  document.documentElement.style.padding = '0';
});

test('DevToolsPanel with sample events renders correctly', async () => {
  await page.viewport(1200, 800);

  await render(<WithEvents />);

  // Wait for animations and font to load
  await new Promise(resolve => setTimeout(resolve, 800));

  // Screenshot the full viewport (DevToolsPanel is fullscreen)
  const root = document.body;
  await expect(root).toMatchScreenshot('devtools-panel-with-events');
});
