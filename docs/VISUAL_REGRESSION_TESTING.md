# Visual Regression Testing with Vitest v4

This project uses Vitest v4's built-in visual regression testing capabilities powered by Playwright.

## Overview

Visual regression tests capture screenshots of components and compare them to baseline images. If visual changes are detected, the test fails, allowing you to review and approve or reject the changes.

## Configuration

Screenshot testing is configured in `vitest.config.ts`:

```typescript
test: {
  name: 'storybook',
  browser: {
    enabled: true,
    headless: true,
    provider: playwright({
      screenshot: 'only-on-failure', // Captures screenshots when tests fail
    }),
    instances: [{ browser: 'chromium' }],
    screenshotDirectory: './test-results/screenshots',
  },
}
```

## Writing Visual Tests

Visual test files should be placed in a `__tests__` directory next to your stories to prevent Storybook from trying to load them.

**File structure:**
```
src/stories/marketing/
  ├── DevToolsHero.stories.tsx
  ├── PopupHero.stories.tsx
  └── __tests__/
      ├── DevToolsHero.visual.test.tsx
      └── PopupHero.visual.test.tsx
```

### Basic Screenshot Test

```typescript
import { test, expect } from 'vitest';

test('component renders correctly', async ({ page }) => {
  // Set viewport for consistent screenshots
  await page.setViewportSize({ width: 1200, height: 800 });

  // Render your component
  const root = document.getElementById('root') || document.body;
  root.innerHTML = '';
  await import('@testing-library/react').then(m =>
    m.render(<YourComponent />)
  );

  // Wait for animations/async loading
  await page.waitForTimeout(500);

  // Take screenshot and compare to baseline
  await expect(page).toMatchScreenshot('your-component.png');
});
```

### Testing Storybook Stories

Create visual tests in a `__tests__` subdirectory:

```typescript
// src/stories/marketing/__tests__/YourComponent.visual.test.tsx
import { composeStories } from '@storybook/react';
import * as stories from '../YourComponent.stories'; // Note: ../ since in __tests__

const { Default, Variant } = composeStories(stories);

test('story renders correctly', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });

  const root = document.getElementById('root') || document.body;
  root.innerHTML = '';
  await import('@testing-library/react').then(m =>
    m.render(<Default />)
  );

  await page.waitForTimeout(500);
  await expect(page).toMatchScreenshot('component-default.png');
});
```

## Frame Locator API (for iframe testing)

Vitest v4 includes Playwright's frame locator API for better iframe testing. Use this when testing components rendered inside iframes.

### Basic Frame Locator Usage

```typescript
test('iframe component renders correctly', async ({ page }) => {
  // Navigate to page with iframe
  await page.goto('http://localhost:6006/iframe.html?id=component--story');

  // Get frame locator
  const frame = page.frameLocator('iframe[id="storybook-preview-iframe"]');

  // Interact with elements inside the iframe
  const button = frame.locator('button.primary');
  await expect(button).toBeVisible();
  await button.click();

  // Take screenshot of the frame
  const frameElement = await page.locator('iframe[id="storybook-preview-iframe"]');
  await expect(frameElement).toMatchScreenshot('iframe-content.png');
});
```

### Nested iframes

```typescript
test('nested iframe interaction', async ({ page }) => {
  // For nested iframes, chain frameLocator calls
  const outerFrame = page.frameLocator('#outer-iframe');
  const innerFrame = outerFrame.frameLocator('#inner-iframe');

  // Interact with deeply nested content
  const element = innerFrame.locator('.nested-element');
  await expect(element).toBeVisible();
});
```

### Testing DevTools Panels (Chrome Extension Context)

```typescript
test('devtools panel in iframe', async ({ page }) => {
  // If DevTools panel is rendered in iframe
  const devToolsFrame = page.frameLocator('iframe[title="DevTools Panel"]');

  // Wait for panel to load
  await devToolsFrame.locator('.panel-loaded').waitFor();

  // Interact with panel elements
  const eventRow = devToolsFrame.locator('[data-event-id="event-1"]');
  await eventRow.click();

  // Verify expanded state
  const eventDetails = devToolsFrame.locator('.event-details');
  await expect(eventDetails).toBeVisible();

  // Screenshot the entire page including iframe
  await expect(page).toMatchScreenshot('devtools-panel.png');
});
```

## Running Visual Tests

```bash
# Run all visual tests
npm run test:storybook

# Run with Playwright traces for debugging
npm run test:storybook -- --browser.trace=on

# Update screenshots (when visual changes are intentional)
npm run test:storybook -- --update-snapshots
```

## Debugging Failed Visual Tests

When a visual test fails:

1. **Review the diff**: Check `test-results/screenshots/` for diff images
2. **Inspect with traces**: If running with `--browser.trace=on`, view traces:
   ```bash
   npx playwright show-trace test-results/traces/trace.zip
   ```
3. **Update baseline**: If changes are intentional:
   ```bash
   npm run test:storybook -- --update-snapshots
   ```

## Version Control

### What to Commit ✅

**Baseline Screenshots** - Stored in `__snapshots__/` directories:
```
src/stories/marketing/
  └── __tests__/
      ├── DevToolsHero.visual.test.tsx
      └── DevToolsHero.visual.test.tsx-snapshots/
          ├── devtools-hero-default.png         ← COMMIT
          └── devtools-hero-fullwidth.png       ← COMMIT
```

These are your source of truth and must be version controlled so:
- All team members use the same baselines
- CI can detect visual regressions
- Baselines are versioned with the code

### What NOT to Commit ❌

**Test Results** - Already in `.gitignore`:
```
test-results/           # Test run outputs (ignored)
*.png-actual.png        # Failed test screenshots (ignored)
*.png-diff.png          # Comparison diffs (ignored)
```

## Best Practices

1. **Consistent viewport**: Always set viewport size for consistent screenshots
2. **Wait for animations**: Use `page.waitForTimeout()` or wait for specific elements
3. **Isolate components**: Test components in isolation when possible
4. **Descriptive names**: Use clear, descriptive screenshot names
5. **Organize by feature**: Group visual tests by component/feature
6. **Commit baselines**: Always commit baseline screenshots in `__snapshots__/` directories
7. **Review diffs carefully**: When updating baselines, review the visual changes before committing

## Example: Marketing Screenshots

See `src/stories/marketing/*.visual.test.tsx` for comprehensive examples of visual regression testing for marketing hero screenshots.

## Tree Reporter

Vitest v4 includes a new tree reporter for better test output visualization:

```bash
# The tree reporter is already configured in vitest.config.ts
npm run test:storybook

# Output shows hierarchical test structure:
# ✓ DevTools Hero Visual Regression
#   ✓ Default hero renders correctly
#   ✓ Full width hero renders correctly
#   ✓ With expanded event renders correctly
```

## Resources

- [Vitest v4 Browser Mode Docs](https://vitest.dev/guide/browser.html)
- [Playwright Frame Locator API](https://playwright.dev/docs/api/class-framelocator)
- [Playwright Screenshot Testing](https://playwright.dev/docs/screenshots)
