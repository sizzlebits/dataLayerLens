# DataLayer Lens - Technical Overview

A guide for frontend developers new to browser extension development.

---

## Core Tech Stack

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| **TypeScript** | Type-safe JavaScript | [typescriptlang.org](https://www.typescriptlang.org/docs/) |
| **React 18** | UI components | [react.dev](https://react.dev/) |
| **Zustand** | Lightweight state management | [zustand docs](https://docs.pmnd.rs/zustand/getting-started/introduction) |
| **Vite** | Build tool with HMR | [vitejs.dev](https://vitejs.dev/) |
| **Tailwind CSS** | Utility-first styling | [tailwindcss.com](https://tailwindcss.com/docs) |
| **Framer Motion** | Animations | [framer.com/motion](https://www.framer.com/motion/) |
| **Manifest V3** | Chrome extension architecture | [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/mv3/) |

---

## Extension Architecture

Browser extensions run code in **multiple isolated contexts** that cannot directly share memory or variables. They communicate via message passing.

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    WEB PAGE                               │   │
│  │  ┌─────────────────┐    window.postMessage               │   │
│  │  │ Injected Script │◄──────────────────────┐             │   │
│  │  │ (page context)  │                       │             │   │
│  │  │ Reads dataLayer │                       ▼             │   │
│  │  └────────┬────────┘              ┌────────────────┐     │   │
│  │           │                       │ Content Script │     │   │
│  │           └──────────────────────►│ (isolated)     │     │   │
│  │              window.postMessage   └───────┬────────┘     │   │
│  └───────────────────────────────────────────│──────────────┘   │
│                                              │                   │
│                          chrome.runtime.sendMessage             │
│                                              │                   │
│  ┌───────────────────────────────────────────▼──────────────┐   │
│  │                 BACKGROUND SERVICE WORKER                 │   │
│  │           (persistent, manages extension state)           │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│            chrome.runtime.sendMessage / onMessage               │
│                             │                                    │
│  ┌──────────────────────────┼──────────────────────────────┐    │
│  │                          ▼                               │    │
│  │  ┌─────────┐                          ┌──────────────┐  │    │
│  │  │  Popup  │                          │   DevTools   │  │    │
│  │  │ (React) │                          │   (React)    │  │    │
│  │  └─────────┘                          └──────────────┘  │    │
│  │                    EXTENSION VIEWS                       │    │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Four Contexts

### 1. Background Service Worker
**File:** `src/background/index.ts`

The "brain" of the extension. Runs persistently (though Chrome may suspend it). Handles:
- Cross-tab coordination
- Storage management
- Message routing between contexts

```typescript
// Listening for messages from any context
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_EVENTS') {
    // Handle request
  }
});
```

**Key resource:** [Service Workers in Extensions](https://developer.chrome.com/docs/extensions/mv3/service_workers/)

---

### 2. Content Script
**File:** `src/content/index.ts`

Injected into web pages. Can access the DOM but **not** page JavaScript variables (like `window.dataLayer`). Acts as a bridge.

```typescript
// Receives messages from injected script
window.addEventListener('message', (event) => {
  if (event.data.type === 'DATALAYER_PUSH') {
    // Forward to background
    chrome.runtime.sendMessage(event.data);
  }
});
```

**Key resource:** [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)

---

### 3. Injected Script (Page Context)
**File:** `src/injected/index.ts`

Injected into the **page's world** via `<script>` tag. Can access `window.dataLayer` directly. Communicates with content script via `window.postMessage`.

```typescript
// Intercept dataLayer.push
const originalPush = window.dataLayer.push;
window.dataLayer.push = function(...args) {
  window.postMessage({ type: 'DATALAYER_PUSH', data: args }, '*');
  return originalPush.apply(this, args);
};
```

**Key resource:** [Injecting Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/#inject-programmatically)

---

### 4. Popup & DevTools
**Files:** `src/popup/Popup.tsx`, `src/devtools/DevToolsPanel.tsx`

- **Popup**: Small UI that appears when clicking the extension icon. Short-lived - destroyed when closed.
- **DevTools Panel**: The main event viewing interface. Persists while DevTools is open.

```typescript
// Sending message to content script
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_EVENTS' });
```

**Key resource:** [DevTools Extensions](https://developer.chrome.com/docs/extensions/how-to/devtools/extend-devtools)

---

## Communication Patterns

### Pattern 1: Page → Content Script → Background → DevTools

Used when capturing dataLayer events:

```
dataLayer.push() → Injected Script → Content Script → Background → DevTools Panel
                   (postMessage)    (runtime.sendMessage)  (runtime.sendMessage)
```

### Pattern 2: UI → Content Script → Page

Used for actions like clearing events:

```
Popup "Clear" → chrome.tabs.sendMessage → Content Script → Clears local state
```

### Pattern 3: Storage-Based Sync

Settings changes use `chrome.storage.local` for persistence and sync:

```typescript
// Writing (in popup)
await chrome.storage.local.set({ settings: newSettings });

// Listening (in any context)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) {
    updateLocalState(changes.settings.newValue);
  }
});
```

**Key resource:** [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

---

## Key Files Summary

| File | Purpose |
|------|---------|
| `src/background/index.ts` | Service worker entry point |
| `src/content/index.ts` | Content script - DOM access, message bridge |
| `src/injected/index.ts` | Injected into page - reads dataLayer |
| `src/popup/Popup.tsx` | Extension popup UI |
| `src/devtools/DevToolsPanel.tsx` | DevTools panel UI |
| `src/components/shared/EventPanel/useEventPanelState.ts` | Shared state for DevTools |
| `src/store/createStore.ts` | Zustand store factory with DI |
| `src/services/browser.ts` | Browser API abstraction layer |
| `src/utils/debug.ts` | Centralised debug logging utility |

---

## Debug Logging

All debug logging uses a centralised utility (`src/utils/debug.ts`) that respects the user's `debugLogging` setting.

```typescript
// For class-based modules, create a logger instance
import { createDebugLogger } from '@/utils/debug';

class MyModule {
  private logger = createDebugLogger(false);

  doSomething() {
    this.logger.debug('Processing...', { data });
    this.logger.error('Failed:', error);
  }

  updateDebug(enabled: boolean) {
    this.logger.setEnabled(enabled);
  }
}

// For simple one-off logging
import { debugLog, debugError } from '@/utils/debug';

debugLog(settings.debugLogging, 'Message', data);
debugError(settings.debugLogging, 'Error:', error);
```

All logging is prefixed with `[DataLayer Lens]` and only outputs when debug mode is enabled.

---

## Common Gotchas

### 1. Context Isolation
Variables defined in one context don't exist in another. You **must** use message passing.

### 2. Service Worker Lifecycle
Background scripts can be suspended. Don't rely on in-memory state - persist to `chrome.storage`.

### 3. Content Script Timing
Content scripts run after DOM load but before all resources. Use `document_idle` in manifest for safer timing.

### 4. Message Response Timing
`sendMessage` callbacks are async. For complex flows, use `sendResponse` with `return true` to keep the channel open.

---

## Further Reading

- [Chrome Extension Architecture Overview](https://developer.chrome.com/docs/extensions/mv3/architecture-overview/)
- [Message Passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/mv3-migration/)
- [Extension Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
- [MDN WebExtensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions) (for Firefox compatibility)
