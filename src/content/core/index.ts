/**
 * Core module exports for the content script.
 */

export { createContentScriptCore, type IContentScriptCore } from './ContentScriptCore';
export { createEventManager, type IEventManager, type EventManagerOptions } from './EventManager';
export { createMessageRouter, type IMessageRouter, type MessageRouterCallbacks } from './MessageRouter';
export { createOverlayController, type IOverlayController, type OverlayControllerOptions } from './OverlayController';
export { createScriptInjector, type IScriptInjector, type MonitoringConfig } from './ScriptInjector';
