import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DLBaseComponent, defineComponent } from '../components/DLBaseComponent';

// Test component implementation
class TestComponent extends DLBaseComponent {
  public renderCalled = false;
  public setupCalled = false;
  public cleanupCalled = false;

  protected getStyles(): string {
    return '.test { color: red; }';
  }

  protected render(): void {
    this.renderCalled = true;
    this.setContent('<div class="test">Test Content</div>');
  }

  protected setupEventListeners(): void {
    this.setupCalled = true;
  }

  protected cleanupEventListeners(): void {
    this.cleanupCalled = true;
  }

  // Expose protected methods for testing
  public testEmit<T>(name: string, detail?: T): void {
    this.emit(name, detail);
  }

  public testQuery(selector: string): HTMLElement | null {
    return this.$(selector);
  }

  public testQueryAll(selector: string): NodeListOf<HTMLElement> {
    return this.$$(selector);
  }

  public testToggleClass(selector: string, className: string, condition: boolean): void {
    this.toggleClass(selector, className, condition);
  }

  public testGetBooleanAttribute(name: string, defaultValue?: boolean): boolean {
    return this.getBooleanAttribute(name, defaultValue);
  }

  public testGetNumberAttribute(name: string, defaultValue?: number): number {
    return this.getNumberAttribute(name, defaultValue);
  }
}

// Register test component
if (!customElements.get('test-component')) {
  customElements.define('test-component', TestComponent);
}

describe('DLBaseComponent', () => {
  let component: TestComponent;

  beforeEach(() => {
    component = document.createElement('test-component') as unknown as TestComponent;
  });

  afterEach(() => {
    if (component.parentNode) {
      component.parentNode.removeChild(component);
    }
  });

  describe('lifecycle', () => {
    it('creates shadow DOM on construction', () => {
      expect(component.shadowRoot).toBeTruthy();
    });

    it('calls render when connected to DOM', () => {
      document.body.appendChild(component);
      expect(component.renderCalled).toBe(true);
    });

    it('calls setupEventListeners when connected', () => {
      document.body.appendChild(component);
      expect(component.setupCalled).toBe(true);
    });

    it('injects styles when connected', () => {
      document.body.appendChild(component);
      const style = component.shadowRoot?.querySelector('style');
      expect(style).toBeTruthy();
      expect(style?.textContent).toContain('.test { color: red; }');
    });

    it('does not initialize twice when already connected', () => {
      document.body.appendChild(component);
      component.renderCalled = false;
      component.setupCalled = false;

      // Manually call connectedCallback again (simulating edge case)
      component.connectedCallback();

      // Should not re-initialize when already connected
      expect(component.renderCalled).toBe(false);
    });

    it('re-initializes when reconnected after disconnect', () => {
      document.body.appendChild(component);
      document.body.removeChild(component);

      component.renderCalled = false;
      component.setupCalled = false;

      // Reconnect
      document.body.appendChild(component);

      // Should re-initialize on reconnection
      expect(component.renderCalled).toBe(true);
      expect(component.setupCalled).toBe(true);
    });

    it('calls cleanupEventListeners when disconnected', () => {
      document.body.appendChild(component);
      document.body.removeChild(component);
      expect(component.cleanupCalled).toBe(true);
    });
  });

  describe('setContent', () => {
    it('sets innerHTML in content container', () => {
      document.body.appendChild(component);
      const content = component.shadowRoot?.querySelector('.component-content');
      expect(content?.innerHTML).toContain('Test Content');
    });
  });

  describe('emit', () => {
    it('dispatches custom event with detail', () => {
      document.body.appendChild(component);
      const handler = vi.fn();
      component.addEventListener('test-event', handler);

      component.testEmit('test-event', { foo: 'bar' });

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual({ foo: 'bar' });
    });

    it('events bubble and are composed', () => {
      document.body.appendChild(component);
      const handler = vi.fn();
      document.body.addEventListener('test-event', handler);

      component.testEmit('test-event', { data: 'test' });

      expect(handler).toHaveBeenCalled();
      document.body.removeEventListener('test-event', handler);
    });
  });

  describe('query methods', () => {
    it('$ returns element from shadow DOM', () => {
      document.body.appendChild(component);
      const element = component.testQuery('.test');
      expect(element).toBeTruthy();
      expect(element?.textContent).toBe('Test Content');
    });

    it('$ returns null for non-existent selector', () => {
      document.body.appendChild(component);
      const element = component.testQuery('.nonexistent');
      expect(element).toBeNull();
    });

    it('$$ returns all matching elements', () => {
      document.body.appendChild(component);
      const elements = component.testQueryAll('.test');
      expect(elements.length).toBe(1);
    });
  });

  describe('toggleClass', () => {
    it('adds class when condition is true', () => {
      document.body.appendChild(component);
      component.testToggleClass('.test', 'active', true);
      const element = component.testQuery('.test');
      expect(element?.classList.contains('active')).toBe(true);
    });

    it('removes class when condition is false', () => {
      document.body.appendChild(component);
      const element = component.testQuery('.test');
      element?.classList.add('active');

      component.testToggleClass('.test', 'active', false);
      expect(element?.classList.contains('active')).toBe(false);
    });
  });

  describe('attribute helpers', () => {
    describe('getBooleanAttribute', () => {
      it('returns default when attribute not present', () => {
        expect(component.testGetBooleanAttribute('missing')).toBe(false);
        expect(component.testGetBooleanAttribute('missing', true)).toBe(true);
      });

      it('returns true for present attribute', () => {
        component.setAttribute('present', '');
        expect(component.testGetBooleanAttribute('present')).toBe(true);
      });

      it('returns false for "false" value', () => {
        component.setAttribute('bool', 'false');
        expect(component.testGetBooleanAttribute('bool')).toBe(false);
      });

      it('returns false for "0" value', () => {
        component.setAttribute('bool', '0');
        expect(component.testGetBooleanAttribute('bool')).toBe(false);
      });
    });

    describe('getNumberAttribute', () => {
      it('returns default when attribute not present', () => {
        expect(component.testGetNumberAttribute('missing')).toBe(0);
        expect(component.testGetNumberAttribute('missing', 42)).toBe(42);
      });

      it('parses number value', () => {
        component.setAttribute('count', '123');
        expect(component.testGetNumberAttribute('count')).toBe(123);
      });

      it('parses float value', () => {
        component.setAttribute('value', '3.14');
        expect(component.testGetNumberAttribute('value')).toBe(3.14);
      });

      it('returns default for invalid number', () => {
        component.setAttribute('invalid', 'abc');
        expect(component.testGetNumberAttribute('invalid', 99)).toBe(99);
      });
    });
  });
});

describe('defineComponent', () => {
  it('defines custom element', () => {
    class UniqueComponent extends DLBaseComponent {
      protected getStyles(): string {
        return '';
      }
      protected render(): void {}
    }

    defineComponent('unique-test-component', UniqueComponent as unknown as CustomElementConstructor);
    expect(customElements.get('unique-test-component')).toBe(UniqueComponent);
  });

  it('does not redefine existing element', () => {
    class ExistingComponent extends DLBaseComponent {
      protected getStyles(): string {
        return '';
      }
      protected render(): void {}
    }

    // First definition
    defineComponent('existing-component', ExistingComponent as unknown as CustomElementConstructor);

    // Second definition should not throw
    class AnotherComponent extends DLBaseComponent {
      protected getStyles(): string {
        return '';
      }
      protected render(): void {}
    }

    expect(() => defineComponent('existing-component', AnotherComponent as unknown as CustomElementConstructor)).not.toThrow();
    expect(customElements.get('existing-component')).toBe(ExistingComponent);
  });
});
