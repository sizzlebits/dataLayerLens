# DataLayer Lens

A lightweight development tool for monitoring GTM dataLayer events. Add it to your project as a dev dependency to get a floating overlay showing all `dataLayer.push()` calls in real-time.

**No browser extension required!**

## Installation

```bash
npm install --save-dev datalayerlens
```

## Usage

### Quick Start (Auto-inject)

Import the inject script in your app's entry point. The check for development mode varies by framework:

```typescript
// Vite (React, Vue, etc.)
if (import.meta.env.DEV) {
  import('datalayerlens/inject');
}

// Next.js, Node-based tools
if (process.env.NODE_ENV === 'development') {
  import('datalayerlens/inject');
}
```

### With Options

```typescript
if (process.env.NODE_ENV === 'development') {
  import('datalayerlens').then(({ initDataLayerMonitor }) => {
    initDataLayerMonitor({
      dataLayerNames: ['dataLayer', 'dataLayer_v2'],
      position: 'bottom-right',
      maxEvents: 50,
      collapsed: false,
      consoleLog: true,
      onEvent: (event) => {
        // Custom handling
        console.log('Event captured:', event);
      },
    });
  });
}
```

### Framework Examples

#### React (Vite)

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Initialise dataLayer monitor in development
if (import.meta.env.DEV) {
  import('datalayerlens/inject');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### Next.js (App Router)

```typescript
// app/layout.tsx
'use client';

import { useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('datalayerlens').then(({ initDataLayerMonitor }) => {
        initDataLayerMonitor();
      });
    }
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

#### Next.js (Pages Router)

```typescript
// pages/_app.tsx
import { useEffect } from 'react';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('datalayerlens').then(({ initDataLayerMonitor }) => {
        initDataLayerMonitor();
      });
    }
  }, []);

  return <Component {...pageProps} />;
}
```

#### Vue

```typescript
// main.ts
import { createApp } from 'vue';
import App from './App.vue';

if (import.meta.env.DEV) {
  import('datalayerlens/inject');
}

createApp(App).mount('#app');
```

## API

### `initDataLayerMonitor(options?)`

Initialises the monitor and returns a control instance.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dataLayerNames` | `string[]` | `['dataLayer']` | Array names to monitor |
| `position` | `string` | `'bottom-right'` | Overlay position: `'bottom-right'`, `'bottom-left'`, `'top-right'`, `'top-left'` |
| `maxEvents` | `number` | `50` | Maximum events to display |
| `collapsed` | `boolean` | `false` | Start collapsed |
| `consoleLog` | `boolean` | `true` | Log events to console |
| `onEvent` | `function` | `undefined` | Callback when event is captured |

#### Returns: `MonitorInstance`

```typescript
interface MonitorInstance {
  getEvents(): DataLayerEvent[];  // Get all captured events
  clearEvents(): void;            // Clear all events
  show(): void;                   // Show the overlay
  hide(): void;                   // Hide the overlay
  toggle(): void;                 // Toggle visibility
  destroy(): void;                // Destroy and clean up
  setOptions(opts): void;         // Update options
}
```

### `getDataLayerMonitor()`

Returns the existing monitor instance, or `null` if not initialised.

## Console Access

The monitor exposes itself globally for easy console access:

```javascript
// In browser console
__dlMonitor.init()           // Initialise
__dlMonitor.get()            // Get instance
__dlMonitor.get().hide()     // Hide overlay
__dlMonitor.get().getEvents() // Get all events
```

## Features

- **Zero configuration** — Works out of the box
- **Draggable overlay** — Position it anywhere
- **Collapsible** — Minimise when not needed
- **Event expansion** — Click events to see full data
- **Console logging** — Styled logs in DevTools
- **Multiple dataLayers** — Monitor any array name
- **TypeScript support** — Full type definitions included
- **Tree-shakeable** — Only includes what you use

## Styling

The overlay uses Shadow DOM to prevent style conflicts with your application. It has a "DEV" badge to make it clear this is a development tool.

## Comparison with Browser Extension

| Feature | NPM Package | Browser Extension |
|---------|-------------|-------------------|
| Installation | `npm install` | Manual browser install |
| Works in CI/preview | ✅ | ❌ |
| DevTools panel | ❌ | ✅ |
| Persist across pages | ❌ | ✅ |
| Works on any site | ❌ | ✅ |
| Export to JSON | ❌ | ✅ |

**Use the npm package when:**
- You want the simplest setup for your team
- You're working in preview/staging environments
- You need it to work in CI screenshot tests

**Use the browser extension when:**
- You need the full DevTools panel experience
- You want to monitor any website
- You need event export functionality

## Licence

MIT
