import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventGrouping, createEventGrouping } from './EventGrouping';
import type { DataLayerEvent, GroupingConfig } from '@/types';

function createMockEvent(overrides: Partial<DataLayerEvent> = {}): DataLayerEvent {
  return {
    id: `event-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    event: 'test_event',
    data: { event: 'test_event' },
    source: 'dataLayer',
    raw: { event: 'test_event' },
    dataLayerIndex: 0,
    ...overrides,
  };
}

const defaultSettings: GroupingConfig = {
  enabled: true,
  mode: 'time',
  timeWindowMs: 500,
  triggerEvents: ['gtm.js', 'page_view'],
};

describe('EventGrouping', () => {
  let grouping: EventGrouping;
  let onGroupsChangeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onGroupsChangeMock = vi.fn();
    grouping = new EventGrouping({
      settings: defaultSettings,
      onGroupsChange: onGroupsChangeMock,
    });
  });

  describe('addEventToGroup - time mode', () => {
    it('creates new group for first event', () => {
      const event = createMockEvent({ timestamp: 1000 });
      grouping.addEventToGroup(event);

      const groups = grouping.getGroups();
      expect(groups).toHaveLength(1);
      expect(groups[0].events).toHaveLength(1);
      expect(event.groupId).toBe(groups[0].id);
    });

    it('adds events to same group within time window', () => {
      const event1 = createMockEvent({ timestamp: 1000 });
      const event2 = createMockEvent({ timestamp: 1200 }); // Within 500ms window

      grouping.addEventToGroup(event1);
      grouping.addEventToGroup(event2);

      const groups = grouping.getGroups();
      expect(groups).toHaveLength(1);
      expect(groups[0].events).toHaveLength(2);
      expect(event1.groupId).toBe(event2.groupId);
    });

    it('creates new group when time window exceeded', () => {
      const event1 = createMockEvent({ timestamp: 1000 });
      const event2 = createMockEvent({ timestamp: 2000 }); // Exceeds 500ms window

      grouping.addEventToGroup(event1);
      grouping.addEventToGroup(event2);

      const groups = grouping.getGroups();
      expect(groups).toHaveLength(2);
      expect(event1.groupId).not.toBe(event2.groupId);
    });

    it('updates group start and end times', () => {
      const event1 = createMockEvent({ timestamp: 1000 });
      const event2 = createMockEvent({ timestamp: 1200 });

      grouping.addEventToGroup(event1);
      grouping.addEventToGroup(event2);

      const group = grouping.getGroups()[0];
      expect(group.startTime).toBe(1000);
      expect(group.endTime).toBe(1200);
    });
  });

  describe('addEventToGroup - event mode', () => {
    beforeEach(() => {
      grouping = new EventGrouping({
        settings: { ...defaultSettings, mode: 'event' },
        onGroupsChange: onGroupsChangeMock,
      });
    });

    it('creates new group on trigger event', () => {
      const event1 = createMockEvent({ event: 'gtm.js', timestamp: 1000 });
      const event2 = createMockEvent({ event: 'gtm.dom', timestamp: 1100 });

      grouping.addEventToGroup(event1);
      grouping.addEventToGroup(event2);

      const groups = grouping.getGroups();
      expect(groups).toHaveLength(1); // gtm.dom is not a trigger
    });

    it('starts new group on page_view', () => {
      const event1 = createMockEvent({ event: 'gtm.js', timestamp: 1000 });
      const event2 = createMockEvent({ event: 'custom_event', timestamp: 1100 });
      const event3 = createMockEvent({ event: 'page_view', timestamp: 1200 }); // Trigger event

      grouping.addEventToGroup(event1);
      grouping.addEventToGroup(event2);
      grouping.addEventToGroup(event3);

      const groups = grouping.getGroups();
      expect(groups).toHaveLength(2);
    });

    it('sets triggerEvent on group', () => {
      const event = createMockEvent({ event: 'page_view', timestamp: 1000 });
      grouping.addEventToGroup(event);

      const group = grouping.getGroups()[0];
      expect(group.triggerEvent).toBe('page_view');
    });
  });

  describe('addEventToGroup - disabled', () => {
    beforeEach(() => {
      grouping = new EventGrouping({
        settings: { ...defaultSettings, enabled: false },
      });
    });

    it('does not assign groupId when disabled', () => {
      const event = createMockEvent();
      grouping.addEventToGroup(event);

      expect(event.groupId).toBeUndefined();
    });

    it('creates no groups when disabled', () => {
      const event = createMockEvent();
      grouping.addEventToGroup(event);

      expect(grouping.getGroups()).toHaveLength(0);
    });
  });

  describe('getGroupById', () => {
    it('returns group by ID', () => {
      const event = createMockEvent({ timestamp: 1000 });
      grouping.addEventToGroup(event);

      const groups = grouping.getGroups();
      const found = grouping.getGroupById(groups[0].id);

      expect(found).toEqual(groups[0]);
    });

    it('returns undefined for non-existent ID', () => {
      expect(grouping.getGroupById('missing')).toBeUndefined();
    });
  });

  describe('clearGroups', () => {
    it('removes all groups', () => {
      grouping.addEventToGroup(createMockEvent({ timestamp: 1000 }));
      grouping.addEventToGroup(createMockEvent({ timestamp: 2000 }));

      grouping.clearGroups();

      expect(grouping.getGroups()).toHaveLength(0);
    });

    it('notifies listeners on clear', () => {
      grouping.addEventToGroup(createMockEvent());
      onGroupsChangeMock.mockClear();

      grouping.clearGroups();

      expect(onGroupsChangeMock).toHaveBeenCalledWith([]);
    });
  });

  describe('rebuildGroups', () => {
    it('rebuilds groups from events', () => {
      const events = [
        createMockEvent({ timestamp: 1000 }),
        createMockEvent({ timestamp: 1100 }),
        createMockEvent({ timestamp: 2000 }), // New group
        createMockEvent({ timestamp: 2100 }),
      ];

      grouping.rebuildGroups(events);

      const groups = grouping.getGroups();
      expect(groups).toHaveLength(2);
    });

    it('orders groups with newest first', () => {
      const events = [
        createMockEvent({ timestamp: 1000 }),
        createMockEvent({ timestamp: 2000 }),
      ];

      grouping.rebuildGroups(events);

      const groups = grouping.getGroups();
      expect(groups[0].startTime).toBe(2000);
      expect(groups[1].startTime).toBe(1000);
    });
  });

  describe('updateSettings', () => {
    it('updates grouping settings', () => {
      grouping.updateSettings({ ...defaultSettings, timeWindowMs: 1000 });

      expect(grouping.getSettings().timeWindowMs).toBe(1000);
    });
  });

  describe('toggleGroupCollapsed', () => {
    it('toggles collapsed state', () => {
      const event = createMockEvent({ timestamp: 1000 });
      grouping.addEventToGroup(event);

      const groupId = grouping.getGroups()[0].id;

      expect(grouping.isGroupCollapsed(groupId)).toBe(false);

      grouping.toggleGroupCollapsed(groupId);
      expect(grouping.isGroupCollapsed(groupId)).toBe(true);

      grouping.toggleGroupCollapsed(groupId);
      expect(grouping.isGroupCollapsed(groupId)).toBe(false);
    });

    it('notifies listeners on toggle', () => {
      const event = createMockEvent({ timestamp: 1000 });
      grouping.addEventToGroup(event);
      onGroupsChangeMock.mockClear();

      const groupId = grouping.getGroups()[0].id;
      grouping.toggleGroupCollapsed(groupId);

      expect(onGroupsChangeMock).toHaveBeenCalled();
    });
  });
});

describe('createEventGrouping', () => {
  it('creates an EventGrouping instance', () => {
    const grouping = createEventGrouping({ settings: defaultSettings });

    expect(grouping).toBeInstanceOf(EventGrouping);
  });
});
