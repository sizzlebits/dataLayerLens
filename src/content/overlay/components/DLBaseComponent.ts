/**
 * Base class for all DataLayer Lens Web Components.
 * Provides common functionality for Shadow DOM, styling, and event emission.
 */

export abstract class DLBaseComponent extends HTMLElement {
  protected shadow: ShadowRoot;
  private _initialized = false;
  private _rendering = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  /**
   * Schedule a render if not already rendering.
   * Prevents infinite loops from property setters triggering re-renders.
   */
  protected scheduleRender(): void {
    if (this._rendering || !this.isConnected) return;
    this._rendering = true;
    // Use microtask to batch multiple property changes
    queueMicrotask(() => {
      this._rendering = false;
      if (this.isConnected) {
        this.render();
      }
    });
  }

  /**
   * Called when the element is connected to the DOM.
   * Initializes styles and renders the component.
   */
  connectedCallback(): void {
    if (this._initialized) return;
    this._initialized = true;

    this.injectStyles();
    this.render();
    this.setupEventListeners();
  }

  /**
   * Called when the element is disconnected from the DOM.
   * Override to clean up event listeners and resources.
   */
  disconnectedCallback(): void {
    this._initialized = false;
    this.cleanupEventListeners();
  }

  /**
   * Inject component styles into the shadow DOM.
   */
  private injectStyles(): void {
    const styles = this.getStyles();
    if (styles) {
      const styleElement = document.createElement('style');
      styleElement.textContent = styles;
      this.shadow.appendChild(styleElement);
    }
  }

  /**
   * Override to provide component-specific styles.
   * Return CSS as a string.
   */
  protected abstract getStyles(): string;

  /**
   * Override to render the component's HTML content.
   * Called after styles are injected.
   */
  protected abstract render(): void;

  /**
   * Override to set up event listeners after rendering.
   */
  protected setupEventListeners(): void {
    // Override in subclasses
  }

  /**
   * Override to clean up event listeners when disconnected.
   */
  protected cleanupEventListeners(): void {
    // Override in subclasses
  }

  /**
   * Emit a custom event that bubbles through the Shadow DOM.
   * @param eventName - Name of the event
   * @param detail - Event detail data
   */
  protected emit<T>(eventName: string, detail?: T): void {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        composed: true, // Allows event to cross shadow DOM boundary
        detail,
      })
    );
  }

  /**
   * Query an element within the shadow DOM.
   */
  protected $(selector: string): HTMLElement | null {
    return this.shadow.querySelector(selector);
  }

  /**
   * Query all elements within the shadow DOM.
   */
  protected $$(selector: string): NodeListOf<HTMLElement> {
    return this.shadow.querySelectorAll(selector);
  }

  /**
   * Set inner HTML of the shadow root (after styles).
   */
  protected setContent(html: string): void {
    // Find existing content container or create one
    let container = this.shadow.querySelector('.component-content');
    if (!container) {
      container = document.createElement('div');
      container.className = 'component-content';
      this.shadow.appendChild(container);
    }
    container.innerHTML = html;
  }

  /**
   * Update a specific element's content within the component.
   */
  protected updateElement(selector: string, html: string): void {
    const element = this.$(selector);
    if (element) {
      element.innerHTML = html;
    }
  }

  /**
   * Add or remove a class based on condition.
   */
  protected toggleClass(selector: string, className: string, condition: boolean): void {
    const element = this.$(selector);
    if (element) {
      element.classList.toggle(className, condition);
    }
  }

  /**
   * Safely parse a boolean attribute value.
   */
  protected getBooleanAttribute(name: string, defaultValue = false): boolean {
    if (!this.hasAttribute(name)) {
      return defaultValue;
    }
    const value = this.getAttribute(name);
    return value !== 'false' && value !== '0';
  }

  /**
   * Safely parse a number attribute value.
   */
  protected getNumberAttribute(name: string, defaultValue = 0): number {
    const value = this.getAttribute(name);
    if (value === null) {
      return defaultValue;
    }
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }
}

/**
 * Helper to define a custom element only if not already defined.
 */
export function defineComponent(tagName: string, componentClass: CustomElementConstructor): void {
  // Guard against environments where customElements is not available
  if (typeof customElements === 'undefined' || customElements === null) {
    console.warn(`[DataLayer Lens] customElements not available, cannot register ${tagName}`);
    return;
  }
  if (!customElements.get(tagName)) {
    customElements.define(tagName, componentClass);
  }
}
