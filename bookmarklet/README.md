# DataLayer Monitor Bookmarklet

The simplest way to use DataLayer Monitor — just drag a link to your bookmarks bar!

## Installation

1. Show your browser's bookmarks bar (`Cmd+Shift+B` on Mac, `Ctrl+Shift+B` on Windows)
2. Drag the link below to your bookmarks bar:

**[📊 DataLayer Monitor](#)** ← *Drag this to your bookmarks bar*

Or manually create a bookmark with this code as the URL:

```javascript
javascript:(function(){if(window.__dlMonitor){window.__dlMonitor.get()?window.__dlMonitor.get().toggle():window.__dlMonitor.init();return}var s=document.createElement('script');s.src='https://unpkg.com/@simonseddon/datalayer-monitor-dev@latest/dist/inject.js';document.head.appendChild(s)})();
```

## Usage

1. Navigate to any page with GTM/dataLayer
2. Click the bookmarklet in your bookmarks bar
3. The overlay will appear showing dataLayer events
4. Click again to toggle visibility

## Features

- Works on any website
- No installation required (beyond the bookmarklet)
- Toggle on/off with a single click
- Draggable overlay
- Click events to expand details

## Minified Bookmarklet Code

```javascript
javascript:(function(){if(window.__dlMonitor){window.__dlMonitor.get()?window.__dlMonitor.get().toggle():window.__dlMonitor.init();return}var s=document.createElement('script');s.src='https://unpkg.com/@simonseddon/datalayer-monitor-dev@latest/dist/inject.js';document.head.appendChild(s)})();
```

## Self-Hosted Version

If you don't want to load from unpkg, you can host the script yourself:

1. Build the npm package: `cd packages/datalayer-monitor-dev && npm run build`
2. Host `dist/inject.js` on your own server
3. Update the bookmarklet URL to point to your hosted version

```javascript
javascript:(function(){if(window.__dlMonitor){window.__dlMonitor.get()?window.__dlMonitor.get().toggle():window.__dlMonitor.init();return}var s=document.createElement('script');s.src='https://YOUR-DOMAIN.com/datalayer-monitor.js';document.head.appendChild(s)})();
```
