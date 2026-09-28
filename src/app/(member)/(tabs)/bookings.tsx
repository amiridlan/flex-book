import { Screen, ScreenHeader } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';

export default function BookingsScreen() {
  return (
    <Screen>
      <ScreenHeader title="My bookings" />
      <EmptyState
        title="No bookings yet"
        message="Spaces you book will show here with a QR code for check-in."
      />
    </Screen>
  );
}
