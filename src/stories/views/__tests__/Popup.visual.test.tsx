/**
 * Visual regression tests for Popup view
 * Using Vitest v4's built-in screenshot testing capabilities
 */

import { test, expect, beforeEach, beforeAll } from 'vitest';
import { page } from 'vitest/browser';
import { render, cleanup } from 'vitest-browser-react';
import { composeStories } from '@storybook/react';
import * as stories from '../Popup.stories';

// Compose all stories from the file
const { Default } = composeStories(stories);

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
  document.body.style.display = 'flex';
  document.body.style.alignItems = 'center';
  document.body.style.justifyContent = 'center';
  // Clear any theme classes
  document.body.className = '';
  document.documentElement.className = '';
  document.documentElement.style.margin = '0';
  document.documentElement.style.padding = '0';
});

test('Popup default state renders correctly', async () => {
  // Popup is 320x448, so viewport can be slightly larger to center it
  await page.viewport(600, 700);

  await render(<Default />);

  // Wait for animations and font to load
  await new Promise(resolve => setTimeout(resolve, 800));

  // Screenshot the popup container (w-80 h-[28rem] = 320x448)
  const popup = document.querySelector('.w-80');
  await expect(popup!).toMatchScreenshot('popup-default');
});
