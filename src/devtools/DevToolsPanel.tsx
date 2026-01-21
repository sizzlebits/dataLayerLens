/**
 * DevToolsPanel - Chrome DevTools panel view for DataLayer Lens.
 * Uses the shared EventPanel component with devtools context.
 */

import { EventPanel } from '@/components/shared/EventPanel';

export function DevToolsPanel() {
  return <EventPanel context="devtools" />;
}
