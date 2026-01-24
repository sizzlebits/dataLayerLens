# Vitest v4 Features in DataLayer Lens

This document outlines the new Vitest v4 features implemented in this project.

## 🎯 Features Implemented

### 1. Visual Regression Testing (Configuration Ready)

Infrastructure configured for visual regression testing of marketing screenshots and critical UI.

**Status**: ⚠️ Configuration complete, but Vitest v4 browser mode screenshot API still evolving.
**Recommendation**: Use [Storybook test-runner](https://storybook.js.org/docs/react/writing-tests/test-runner) with Playwright for production visual testing.

**What's Configured**:
- Dedicated `visual` test project in vitest.config.ts
- Screenshot directory: `./test-results/screenshots`
- Visual test files location: `src/**/__tests__/*.visual.test.tsx`
- Excluded from unit tests to prevent conflicts

**Commands**:
```bash
npm run test:visual           # Run visual regression tests
npm run test:visual:update    # Update screenshot baselines
```

**Alternative: Storybook Visual Testing**

For production-ready visual regression testing, consider:

1. **[Chromatic](https://www.chromatic.com/)** - Automated visual testing for Storybook
2. **[Storybook test-runner](https://storybook.js.org/docs/react/writing-tests/test-runner)** - Playwright-based testing
3. **[Percy](https://percy.io/)** - Visual review platform

**What's Ready to Use**:
- Screenshot configuration
- Browser test project setup
- Frame locator helpers for iframe testing
- Comprehensive documentation

### 2. Tree Reporter

Enhanced test output with hierarchical visualization.

**Configuration**: Already enabled in `vitest.config.ts`

**What it does**:
- Shows nested test structure
- Displays test timing
- Color-coded pass/fail status
- Improved readability for large test suites

**Example output**:
```
✓ JsonHighlight (20)
  ✓ primitive values (7)
    ✓ renders null 17ms
    ✓ renders boolean true 2ms
  ✓ arrays (4)
    ✓ renders empty array 1ms
    ✓ renders array with values 4ms
```

### 3. Frame Locator API

Utilities for testing components inside iframes (browser extensions, Storybook).

**Location**: `src/test/helpers/frameLocators.ts`

**What it does**:
- Simplifies iframe testing
- Supports nested iframes
- Provides helper functions for common patterns

**Example Usage**:
```typescript
import { getStorybookFrame, waitForFrame } from '@/test/helpers/frameLocators';

test('component in iframe', async ({ page }) => {
  const frame = getStorybookFrame(page);
  await waitForFrame(frame);

  const button = frame.locator('button.primary');
  await expect(button).toBeVisible();
  await button.click();
});
```

**Helpers available**:
- `getStorybookFrame(page)` - Get Storybook preview iframe
- `getDevToolsFrame(page, title)` - Get Chrome DevTools panel iframe
- `waitForFrame(frame, selector)` - Wait for frame to be ready
- `getNestedFrame(page, selectors)` - Get deeply nested iframe

## 📖 Documentation

### Comprehensive Guides

**Visual Regression Testing**:
- Location: `docs/VISUAL_REGRESSION_TESTING.md`
- Covers: Configuration, writing tests, debugging, best practices
- Includes: Frame locator examples, Storybook integration

**This Document**:
- Location: `docs/VITEST_V4_FEATURES.md`
- Quick reference for implemented features

## 🧪 Test Utilities

- `src/test/helpers/frameLocators.ts` - Frame locator helper functions for iframe testing
  - `getStorybookFrame(page)` - Access Storybook preview iframe
  - `getDevToolsFrame(page, title)` - Access DevTools panel iframe
  - `waitForFrame(frame, selector)` - Wait for iframe to load
  - `getNestedFrame(page, selectors)` - Handle deeply nested iframes

## ⚙️ Configuration

### vitest.config.ts Updates

```typescript
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    reporters: ['default', 'junit', 'tree'], // ✨ Added tree reporter
    projects: [
      {
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              screenshot: 'only-on-failure', // ✨ Screenshot on failure
            }),
            instances: [{ browser: 'chromium' }],
            screenshotDirectory: './test-results/screenshots', // ✨ Screenshot dir
          },
        },
      },
    ],
  },
});
```

### Package Updates

All Vitest packages upgraded to v4.0.18:
- `vitest@^4.0.18`
- `@vitest/browser@^4.0.18`
- `@vitest/browser-playwright@^4.0.18` (new)
- `@vitest/coverage-v8@^4.0.18`
- `@vitest/ui@^4.0.18`

## 🚀 Benefits

1. **Visual Regression Testing**
   - Catch unintended UI changes
   - Automated visual QA
   - Prevent CSS regressions
   - Document visual states

2. **Tree Reporter**
   - Better test organization visibility
   - Easier to identify failing tests
   - Improved CI output readability

3. **Frame Locator API**
   - Simplified iframe testing
   - More reliable browser extension tests
   - Better Storybook integration

## 📝 Next Steps

Consider adding visual regression tests for:
- [ ] Critical user flows in DevTools panel
- [ ] Popup component states
- [ ] Theme variations
- [ ] Responsive breakpoints
- [ ] Animation states

## 🔗 Resources

- [Vitest v4 Migration Guide](https://vitest.dev/guide/migration.html#vitest-4)
- [Vitest v4 Blog Post](https://vitest.dev/blog/vitest-4)
- [Playwright Frame Locators](https://playwright.dev/docs/api/class-framelocator)
- [Visual Regression Testing Best Practices](https://playwright.dev/docs/test-snapshots)
