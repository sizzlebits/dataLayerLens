/**
 * Content script entry point for DataLayer Lens.
 *
 * This thin entry point delegates all functionality to the core modules.
 * The overlay can be toggled via the OVERLAY_ENABLED flag for testing.
 */

import { createContentScriptCore } from './core';

// Feature flag for overlay (can be disabled for sidepanel-only mode)
const OVERLAY_ENABLED = true;

/**
 * Initialize the content script.
 */
async function initialize(): Promise<void> {
  const core = createContentScriptCore({
    overlayEnabled: OVERLAY_ENABLED,
  });

  await core.initialize();
}

// Start initialization
initialize();
