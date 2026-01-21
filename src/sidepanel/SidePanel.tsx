/**
 * SidePanel - Chrome side panel view for DataLayer Lens.
 * Uses the shared EventPanel component with sidepanel context.
 */

import { EventPanel } from '@/components/shared/EventPanel';

export function SidePanel() {
  return <EventPanel context="sidepanel" />;
}
