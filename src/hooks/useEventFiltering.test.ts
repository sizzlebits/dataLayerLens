import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEventFiltering } from './useEventFiltering';
import { DataLayerEvent, DEFAULT_SETTINGS, Settings } from '@/types';

const createMockEvent = (
  id: string,
  eventName: string,
  data: Record<string, unknown> = {}
): DataLayerEvent => ({
  id,
  event: eventName,
  data,
  timestamp: Date.now(),
  source: 'test',
  raw: data,
  dataLayerIndex: 0,
});

describe('useEventFiltering', () => {
  const mockEvents: DataLayerEvent[] = [
    createMockEvent('1', 'gtm.click', { target: 'button' }),
    createMockEvent('2', 'purchase', { value: 100 }),
    createMockEvent('3', 'page_view', { page: '/home' }),
    createMockEvent('4', 'gtm.dom', {}),
    createMockEvent('5', 'add_to_cart', { product: 'widget' }),
  ];

  describe('search filtering', () => {
    it('returns all events when search is empty', () => {
      const { result } = renderHook(() =>
        useEventFiltering(mockEvents, '', DEFAULT_SETTINGS)
      );

      expect(result.current.filteredEvents).toHaveLength(5);
    });

    it('filters events by event name', () => {
      const { result } = renderHook(() =>
        useEventFiltering(mockEvents, 'gtm', DEFAULT_SETTINGS)
      );

      expect(result.current.filteredEvents).toHaveLength(2);
      expect(result.current.filteredEvents.map(e => e.event)).toEqual(['gtm.click', 'gtm.dom']);
    });

    it('filters events by data content', () => {
      const { result } = renderHook(() =>
        useEventFiltering(mockEvents, 'widget', DEFAULT_SETTINGS)
      );

      expect(result.current.filteredEvents).toHaveLength(1);
      expect(result.current.filteredEvents[0].event).toBe('add_to_cart');
    });

    it('search is case-insensitive', () => {
      const { result } = renderHook(() =>
        useEventFiltering(mockEvents, 'GTM', DEFAULT_SETTINGS)
      );

      expect(result.current.filteredEvents).toHaveLength(2);
    });

    it('ignores whitespace-only search', () => {
      const { result } = renderHook(() =>
        useEventFiltering(mockEvents, '   ', DEFAULT_SETTINGS)
      );

      expect(result.current.filteredEvents).toHaveLength(5);
    });
  });

  describe('event type filters - include mode', () => {
    it('includes only matching events when in include mode', () => {
      const settings: Settings = {
        ...DEFAULT_SETTINGS,
        eventFilters: ['purchase', 'page_view'],
        filterMode: 'include',
      };

      const { result } = renderHook(() =>
        useEventFiltering(mockEvents, '', settings)
      );

      expect(result.current.filteredEvents).toHaveLength(2);
      expect(result.current.filteredEvents.map(e => e.event)).toEqual(['purchase', 'page_view']);
    });

    it('filter matching is case-insensitive', () => {
      const settings: Settings = {
        ...DEFAULT_SETTINGS,
        eventFilters: ['PURCHASE'],
        filterMode: 'include',
      };

      const { result } = renderHook(() =>
        useEventFiltering(mockEvents, '', settings)
      );

      expect(result.current.filteredEvents).toHaveLength(1);
      expect(result.current.filteredEvents[0].event).toBe('purchase');
    });

    it('includes events with partial matches', () => {
      const settings: Settings = {
        ...DEFAULT_SETTINGS,
        eventFilters: ['gtm'],
        filterMode: 'include',
      };

      const { result } = renderHook(() =>
        useEventFiltering(mockEvents, '', settings)
      );

      expect(result.current.filteredEvents).toHaveLength(2);
    });
  });

  describe('event type filters - exclude mode', () => {
    it('excludes matching events when in exclude mode', () => {
      const settings: Settings = {
        ...DEFAULT_SETTINGS,
        eventFilters: ['gtm'],
        filterMode: 'exclude',
      };

      const { result } = renderHook(() =>
        useEventFiltering(mockEvents, '', settings)
      );

      expect(result.current.filteredEvents).toHaveLength(3);
      expect(result.current.filteredEvents.map(e => e.event)).toEqual([
        'purchase',
        'page_view',
        'add_to_cart',
      ]);
    });
  });

  describe('combined filtering', () => {
    it('applies both search and event filters', () => {
      const settings: Settings = {
        ...DEFAULT_SETTINGS,
        eventFilters: ['gtm'],
        filterMode: 'include',
      };

      const { result } = renderHook(() =>
        useEventFiltering(mockEvents, 'click', settings)
      );

      expect(result.current.filteredEvents).toHaveLength(1);
      expect(result.current.filteredEvents[0].event).toBe('gtm.click');
    });
  });

  describe('availableEventTypes', () => {
    it('returns unique sorted event types from all events', () => {
      const { result } = renderHook(() =>
        useEventFiltering(mockEvents, '', DEFAULT_SETTINGS)
      );

      expect(result.current.availableEventTypes).toEqual([
        'add_to_cart',
        'gtm.click',
        'gtm.dom',
        'page_view',
        'purchase',
      ]);
    });

    it('returns available types based on original events, not filtered', () => {
      const settings: Settings = {
        ...DEFAULT_SETTINGS,
        eventFilters: ['gtm'],
        filterMode: 'include',
      };

      const { result } = renderHook(() =>
        useEventFiltering(mockEvents, '', settings)
      );

      // Available types should include all event types, not just filtered ones
      expect(result.current.availableEventTypes).toHaveLength(5);
    });
  });
});
