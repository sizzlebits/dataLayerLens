/**
 * ScriptInjector module - handles injecting the page script into the document.
 * The injected script runs in the page context (MAIN world) to intercept dataLayer pushes.
 */

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export interface IScriptInjector {
  /** Inject the monitoring script into the page */
  inject(): void;
  /** Initialize monitoring with the given settings */
  initializeMonitoring(config: MonitoringConfig): void;
  /** Update monitoring configuration */
  updateConfig(config: MonitoringConfig): void;
}

export interface MonitoringConfig {
  dataLayerNames: string[];
  consoleLogging: boolean;
}

/**
 * Handles injection of the page script that intercepts dataLayer pushes.
 */
export class ScriptInjector implements IScriptInjector {
  private injected = false;

  /**
   * Inject the monitoring script into the page.
   * The script will run in the page's execution context (MAIN world).
   */
  inject(): void {
    if (this.injected) return;

    const script = document.createElement('script');
    script.src = browserAPI.runtime.getURL('injected.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);

    this.injected = true;
  }

  /**
   * Initialize monitoring with the given configuration.
   * Sends a message to the injected script via window.postMessage.
   */
  initializeMonitoring(config: MonitoringConfig): void {
    window.postMessage(
      {
        type: 'DATALAYER_MONITOR_INIT',
        payload: {
          dataLayerNames: config.dataLayerNames,
          consoleLogging: config.consoleLogging,
        },
      },
      '*'
    );
  }

  /**
   * Update monitoring configuration.
   * Sends an update message to the injected script.
   */
  updateConfig(config: MonitoringConfig): void {
    window.postMessage(
      {
        type: 'DATALAYER_MONITOR_UPDATE_CONFIG',
        payload: {
          dataLayerNames: config.dataLayerNames,
          consoleLogging: config.consoleLogging,
        },
      },
      '*'
    );
  }
}

/**
 * Factory function to create a ScriptInjector instance.
 */
export function createScriptInjector(): IScriptInjector {
  return new ScriptInjector();
}
