/**
 * Frame Locator Helpers for Vitest v4
 *
 * Utilities for working with iframes in browser tests using Playwright's frame locator API.
 * These are particularly useful for testing browser extension DevTools panels and Storybook iframes.
 */

import type { Page, FrameLocator } from 'playwright';

/**
 * Get the Storybook preview iframe
 * Useful when testing stories directly in Storybook's iframe context
 */
export function getStorybookFrame(page: Page): FrameLocator {
  return page.frameLocator('iframe[id="storybook-preview-iframe"]');
}

/**
 * Get a Chrome DevTools panel iframe
 * Useful if testing DevTools panels in an iframe context
 */
export function getDevToolsFrame(page: Page, title = 'DevTools Panel'): FrameLocator {
  return page.frameLocator(`iframe[title="${title}"]`);
}

/**
 * Wait for a frame to be loaded and ready
 * @param frame - The frame locator to wait for
 * @param selector - Optional selector to wait for within the frame
 */
export async function waitForFrame(
  frame: FrameLocator,
  selector = 'body',
  timeout = 5000
): Promise<void> {
  await frame.locator(selector).waitFor({ timeout });
}

/**
 * Get a nested frame locator
 * Useful for deeply nested iframe structures
 *
 * @example
 * const innerFrame = getNestedFrame(page, [
 *   'iframe#outer',
 *   'iframe#middle',
 *   'iframe#inner'
 * ]);
 */
export function getNestedFrame(page: Page, selectors: string[]): FrameLocator {
  let frame = page.frameLocator(selectors[0]);

  for (let i = 1; i < selectors.length; i++) {
    frame = frame.frameLocator(selectors[i]);
  }

  return frame;
}

/**
 * Example: Testing a component inside Storybook iframe
 *
 * ```typescript
 * import { test, expect } from 'vitest';
 * import { getStorybookFrame, waitForFrame } from '@/test/helpers/frameLocators';
 *
 * test('component in storybook iframe', async ({ page }) => {
 *   await page.goto('http://localhost:6006/iframe.html?id=component--story');
 *
 *   const frame = getStorybookFrame(page);
 *   await waitForFrame(frame);
 *
 *   // Now interact with elements inside the iframe
 *   const button = frame.locator('button.primary');
 *   await expect(button).toBeVisible();
 *   await button.click();
 *
 *   // Take screenshot
 *   await expect(page).toMatchScreenshot('component-in-iframe.png');
 * });
 * ```
 */

/**
 * Example: Testing Chrome extension DevTools panel
 *
 * ```typescript
 * import { test, expect } from 'vitest';
 * import { getDevToolsFrame, waitForFrame } from '@/test/helpers/frameLocators';
 *
 * test('devtools panel interaction', async ({ page }) => {
 *   await page.goto('chrome-extension://abc123/devtools.html');
 *
 *   const frame = getDevToolsFrame(page, 'DataLayer Lens');
 *   await waitForFrame(frame, '.panel-loaded');
 *
 *   // Click on event row
 *   const eventRow = frame.locator('[data-event-id="event-1"]');
 *   await eventRow.click();
 *
 *   // Verify expanded state
 *   const details = frame.locator('.event-details');
 *   await expect(details).toBeVisible();
 *
 *   // Screenshot
 *   await expect(page).toMatchScreenshot('devtools-event-expanded.png');
 * });
 * ```
 */

/**
 * Example: Testing nested iframes
 *
 * ```typescript
 * import { test, expect } from 'vitest';
 * import { getNestedFrame } from '@/test/helpers/frameLocators';
 *
 * test('deeply nested iframe content', async ({ page }) => {
 *   await page.goto('http://localhost:3000/nested');
 *
 *   const innerFrame = getNestedFrame(page, [
 *     'iframe#level1',
 *     'iframe#level2',
 *     'iframe#level3',
 *   ]);
 *
 *   const content = innerFrame.locator('.nested-content');
 *   await expect(content).toHaveText('Deep content');
 * });
 * ```
 */
