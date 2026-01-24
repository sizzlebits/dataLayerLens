/**
 * Visual regression tests for DevTools Hero marketing screenshots
 * Using Vitest v4's built-in screenshot testing capabilities
 */

import { test, expect, beforeEach, beforeAll } from 'vitest';
import { page } from 'vitest/browser';
import { render, cleanup } from 'vitest-browser-react';
import { composeStories } from '@storybook/react';
import * as stories from '../DevToolsHero.stories';

// Compose all stories from the file
const {
  Default,
  FullWidth,
  WithEventExpanded,
  WithSettingsOpen,
  GroupingComparison,
  EventsStream,
  LightDarkComparison,
} = composeStories(stories);

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

test('Default hero renders correctly', async () => {
  await page.viewport(1280, 800);

  await render(<Default />);

  // Wait for animations and font to load
  await new Promise(resolve => setTimeout(resolve, 800));

  // Screenshot the ScreenshotFrame (fills viewport exactly)
  const frame = document.querySelector('div[style*="width: 1280"]');
  await expect(frame!).toMatchScreenshot('devtools-hero-default');
});

test('Full width hero renders correctly', async () => {
  await page.viewport(1280, 800);

  await render(<FullWidth />);

  await new Promise(resolve => setTimeout(resolve, 800));
  const frame = document.querySelector('div[style*="width: 1280"]');
  await expect(frame!).toMatchScreenshot('devtools-hero-fullwidth');
});

test('With expanded event renders correctly', async () => {
  await page.viewport(1280, 800);

  await render(<WithEventExpanded />);

  await new Promise(resolve => setTimeout(resolve, 800));
  const frame = document.querySelector('div[style*="width: 1280"]');
  await expect(frame!).toMatchScreenshot('devtools-hero-event-expanded');
});

test('With settings drawer renders correctly', async () => {
  await page.viewport(1280, 800);

  await render(<WithSettingsOpen />);

  await new Promise(resolve => setTimeout(resolve, 800));
  const frame = document.querySelector('div[style*="width: 1280"]');
  await expect(frame!).toMatchScreenshot('devtools-hero-settings');
});

test('Grouping comparison renders correctly', async () => {
  await page.viewport(1280, 800);

  await render(<GroupingComparison />);

  // Wait longer for both panels to load
  await new Promise(resolve => setTimeout(resolve, 1200));
  const frame = document.querySelector('div[style*="width: 1280"]');
  await expect(frame!).toMatchScreenshot('devtools-hero-grouping');
});

test('Events stream renders correctly', async () => {
  await page.viewport(1280, 800);

  await render(<EventsStream />);

  await new Promise(resolve => setTimeout(resolve, 800));
  const frame = document.querySelector('div[style*="width: 1280"]');
  await expect(frame!).toMatchScreenshot('devtools-hero-stream');
});

test('Light vs Dark theme comparison renders correctly', async () => {
  await page.viewport(1280, 800);

  await render(<LightDarkComparison />);

  // Wait for both theme panels to load
  await new Promise(resolve => setTimeout(resolve, 1200));
  const frame = document.querySelector('div[style*="width: 1280"]');
  await expect(frame!).toMatchScreenshot('devtools-hero-themes');
});
