// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Create DevTools panel
browserAPI.devtools.panels.create(
  'DataLayer',
  '../icons/icon-32.png',
  'src/devtools/panel.html',
  (panel: chrome.devtools.panels.ExtensionPanel) => {
    console.log('[DataLayer Monitor] DevTools panel created', panel);
  }
);
