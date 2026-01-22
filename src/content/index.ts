/**
 * Content script entry point for DataLayer Lens.
 *
 * This thin entry point delegates all functionality to the core modules.
 */

import { createContentScriptCore } from './core';

/**
 * Initialize the content script.
 */
async function initialize(): Promise<void> {
  const core = createContentScriptCore();
  await core.initialize();
}

// Start initialization
initialize();
