import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { DLEventItem } from '../components/DLEventItem';
import { registerComponents } from '../components';
import type { DataLayerEvent } from '@/types';

// Register components before running tests
beforeAll(() => {
  registerComponents();
});

function createMockEvent(overrides: Partial<DataLayerEvent> = {}): DataLayerEvent {
  return {
    id: 'test-event-123',
    timestamp: 1705579200000, // 2024-01-18 12:00:00
    event: 'page_view',
    data: { event: 'page_view', page: '/home' },
    source: 'dataLayer',
    raw: { event: 'page_view', page: '/home' },
    ...overrides,
  };
}

// Helper to wait for scheduled renders (uses queueMicrotask internally)
const waitForRender = () => new Promise<void>(resolve => queueMicrotask(() => resolve()));

describe('DLEventItem', () => {
  let component: DLEventItem;

  beforeEach(() => {
    component = document.createElement('dl-event-item') as unknown as DLEventItem;
    document.body.appendChild(component as unknown as Node);
  });

  afterEach(() => {
    if ((component as unknown as Node).parentNode) {
      (component as unknown as Node).parentNode!.removeChild(component as unknown as Node);
    }
  });

  describe('rendering', () => {
    it('renders empty when no event set', () => {
      const content = component.shadowRoot?.querySelector('.component-content');
      expect(content?.innerHTML).toBe('');
    });

    it('renders event data when set', async () => {
      component.event = createMockEvent();
      await waitForRender();

      const eventName = component.shadowRoot?.querySelector('.event-name');
      expect(eventName?.textContent).toBe('page_view');
    });

    it('displays event icon based on category', async () => {
      component.event = createMockEvent({ event: 'page_view' });
      await waitForRender();

      const icon = component.shadowRoot?.querySelector('.event-icon');
      expect(icon?.textContent?.trim()).toBeTruthy();
    });

    it('displays source', async () => {
      component.event = createMockEvent({ source: 'customDataLayer' });
      await waitForRender();

      const source = component.shadowRoot?.querySelector('.event-source');
      expect(source?.textContent).toContain('customDataLayer');
    });

    it('displays timestamp when show-timestamp is set', async () => {
      component.setAttribute('show-timestamp', '');
      component.event = createMockEvent();
      await waitForRender();

      const timestamp = component.shadowRoot?.querySelector('.event-timestamp');
      expect(timestamp).toBeTruthy();
    });
  });

  describe('expansion', () => {
    it('is collapsed by default', async () => {
      component.event = createMockEvent();
      await waitForRender();

      const item = component.shadowRoot?.querySelector('.event-item');
      expect(item?.classList.contains('expanded')).toBe(false);
    });

    it('expands when expanded attribute is set', async () => {
      component.setAttribute('expanded', '');
      component.event = createMockEvent();
      await waitForRender();

      const item = component.shadowRoot?.querySelector('.event-item');
      expect(item?.classList.contains('expanded')).toBe(true);
    });

    it('shows JSON content when expanded', async () => {
      component.expanded = true;
      component.event = createMockEvent();
      await waitForRender();

      const content = component.shadowRoot?.querySelector('.event-content');
      expect(content).toBeTruthy();

      const json = component.shadowRoot?.querySelector('.json-container');
      expect(json?.innerHTML).toContain('page_view');
    });

    it('toggles expansion on header click', async () => {
      component.event = createMockEvent();
      await waitForRender();

      const header = component.shadowRoot?.querySelector('.event-header') as HTMLElement;
      header?.click();

      expect(component.expanded).toBe(true);
    });
  });

  describe('events', () => {
    it('emits event-toggle on expansion', async () => {
      component.event = createMockEvent();
      await waitForRender();

      const handler = vi.fn();
      component.addEventListener('event-toggle', handler);

      const header = component.shadowRoot?.querySelector('.event-header') as HTMLElement;
      header?.click();

      expect(handler).toHaveBeenCalled();
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.eventId).toBe('test-event-123');
      expect(detail.expanded).toBe(true);
    });

    it('emits event-copy on copy button click', async () => {
      component.event = createMockEvent();
      await waitForRender();

      const handler = vi.fn();
      component.addEventListener('event-copy', handler);

      const copyBtn = component.shadowRoot?.querySelector('[data-action="copy"]') as HTMLElement;
      copyBtn?.click();

      expect(handler).toHaveBeenCalled();
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.event.id).toBe('test-event-123');
    });

    it('emits filter-add on include button click', async () => {
      component.event = createMockEvent();
      await waitForRender();

      const handler = vi.fn();
      component.addEventListener('filter-add', handler);

      const includeBtn = component.shadowRoot?.querySelector('[data-action="filter-include"]') as HTMLElement;
      expect(includeBtn).toBeTruthy();
      includeBtn?.click();

      expect(handler).toHaveBeenCalled();
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.eventName).toBe('page_view');
      expect(detail.mode).toBe('include');
    });

    it('emits filter-add on exclude button click', async () => {
      component.event = createMockEvent();
      await waitForRender();

      const handler = vi.fn();
      component.addEventListener('filter-add', handler);

      const excludeBtn = component.shadowRoot?.querySelector('[data-action="filter-exclude"]') as HTMLElement;
      expect(excludeBtn).toBeTruthy();
      excludeBtn?.click();

      expect(handler).toHaveBeenCalled();
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.eventName).toBe('page_view');
      expect(detail.mode).toBe('exclude');
    });
  });

  describe('compact mode', () => {
    it('applies compact-mode attribute', async () => {
      component.setAttribute('compact-mode', '');
      component.event = createMockEvent();
      await waitForRender();

      expect(component.hasAttribute('compact-mode')).toBe(true);
    });
  });
});
