/**
 * DevToolsPanel - Chrome DevTools panel view for DataLayer Lens.
 * Uses the shared EventPanel component with devtools context.
 */

import { EventPanel } from '@/components/shared/EventPanel';

interface DevToolsPanelProps {
  /** Optional: Override theme for marketing/storybook (bypasses storage) */
  forceTheme?: 'light' | 'dark';
}

export function DevToolsPanel({ forceTheme }: DevToolsPanelProps = {}) {
  return <EventPanel context="devtools" forceTheme={forceTheme} />;
}
