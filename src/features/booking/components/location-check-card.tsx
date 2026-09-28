import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import type { RuleResult } from '@/domain/booking-rules';
import { formatDistance } from '@/domain/geo';
import type { DeviceLocationState } from '@/features/device-location/use-device-location';

type LocationCheckCardProps = {
  readonly state: DeviceLocationState;
  readonly result: RuleResult | null;
  /** Explanation of a failed rule, from the shared rule module. */
  readonly failureMessage: string | null;
  readonly onAllow: () => void;
  readonly onRetry: () => void;
  readonly onOpenSettings: () => void;
};

/**
 * Explains the location requirement before the OS permission prompt, then shows
 * the rule outcome. The same rule runs again on the server when booking.
 */
export function LocationCheckCard({
  state,
  result,
  failureMessage,
  onAllow,
  onRetry,
  onOpenSettings,
}: LocationCheckCardProps) {
  if (state.status === 'checking' || state.status === 'locating') {
    return <Panel tone="neutral" title="Checking your location…" />;
  }
  if (state.status === 'needs_permission') {
    return (
      <Panel
        tone="neutral"
        title="We need your location to book"
        body="Same-day bookings are only open to people nearby, and bookings for later days to people in the same country. This stops fake bookings holding rooms others need. We only check your location when you book or check in."
      >
        <Button label="Share my location" onPress={onAllow} />
      </Panel>
    );
  }
  if (state.status === 'denied') {
    return (
      <Panel
        tone="danger"
        title="Location is off for FlexiSpace"
        body="You can browse every space, but booking needs your location."
      >
        {state.canAskAgain ? (
          <Button label="Share my location" onPress={onAllow} />
        ) : (
          <Button label="Open settings" variant="secondary" onPress={onOpenSettings} />
        )}
      </Panel>
    );
  }
  if (state.status === 'error') {
    return (
      <Panel tone="danger" title="Location unavailable" body={state.message}>
        <Button label="Try again" variant="secondary" onPress={onRetry} />
      </Panel>
    );
  }

  const where =
    state.source === 'demo' ? `Demo location: ${state.label ?? ''}` : 'Your current location';
  if (result?.ok) {
    return (
      <Panel
        tone="success"
        title="You can book this space"
        body={`${where} · ${formatDistance(result.distanceKm)} away${
          result.sameDay ? ' (same-day limit applies)' : ''
        }`}
      />
    );
  }
  return (
    <Panel tone="danger" title="You can’t book this from here" body={failureMessage ?? ''}>
      <Text className="text-xs text-text-muted">{where}</Text>
      <Button label="Check again" variant="secondary" onPress={onRetry} />
    </Panel>
  );
}

const TONES = {
  neutral: 'bg-surface border-border',
  success: 'bg-success-soft border-success-soft',
  danger: 'bg-danger-soft border-danger-soft',
} as const;

function Panel({
  tone,
  title,
  body,
  children,
}: {
  tone: keyof typeof TONES;
  title: string;
  body?: string;
  children?: ReactNode;
}) {
  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      className={`gap-3 rounded-2xl border p-4 ${TONES[tone]}`}
    >
      <Text
        className={`text-base font-semibold ${
          tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-text'
        }`}
      >
        {title}
      </Text>
      {body ? <Text className="text-sm text-text">{body}</Text> : null}
      {children}
    </View>
  );
}
