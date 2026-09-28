import { useState } from 'react';
import { Text, View } from 'react-native';

import { firstError } from '@/api/client/api-error';
import type { StaffBooking } from '@/api/schemas/booking';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { TwoColumn } from '@/components/ui/two-column';
import { normaliseBookingCode, parseCheckInPayload } from '@/domain/check-in-payload';
import { QrScanner } from '@/features/staff/components/qr-scanner';
import { StaffBrandScope } from '@/features/staff/components/staff-brand-scope';
import { useStaffCheckIn } from '@/features/staff/use-staff';
import { formatInZone, TIME_FORMAT } from '@/lib/time';
import { useLayout } from '@/lib/use-layout';

type Outcome =
  | { readonly kind: 'success'; readonly booking: StaffBooking }
  | { readonly kind: 'error'; readonly message: string };

export default function StaffScanScreen() {
  const checkIn = useStaffCheckIn();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();
  const { wide } = useLayout();

  const busy = checkIn.isPending || outcome !== null;

  function run(input: Parameters<typeof checkIn.mutate>[0]) {
    checkIn.mutate(input, {
      onSuccess: (booking) => setOutcome({ kind: 'success', booking }),
      onError: (error) =>
        setOutcome({ kind: 'error', message: firstError(error) ?? 'Check-in failed.' }),
    });
  }

  function onScan(text: string) {
    const payload = parseCheckInPayload(text);
    if (!payload) {
      setOutcome({ kind: 'error', message: 'That is not a FlexiSpace check-in QR code.' });
      return;
    }
    run(payload);
  }

  function submitCode() {
    const normalised = normaliseBookingCode(code);
    if (!normalised) {
      setCodeError('Enter a code like FXB-7QLM.');
      return;
    }
    setCodeError(undefined);
    run({ code: normalised });
  }

  function reset() {
    setOutcome(null);
    setCode('');
    checkIn.reset();
  }

  const result = outcome ? (
    <View
      accessibilityRole="alert"
      className={`gap-2 rounded-2xl p-4 ${outcome.kind === 'success' ? 'bg-success-soft' : 'bg-danger-soft'}`}
    >
      {outcome.kind === 'success' ? (
        <>
          <Text className="text-lg font-bold text-success">
            {outcome.booking.customer.name} is checked in
          </Text>
          <Text className="text-sm text-text">
            {outcome.booking.space.name} ·{' '}
            {formatInZone(outcome.booking.startsAt, outcome.booking.location.timezone, TIME_FORMAT)}{' '}
            – {formatInZone(outcome.booking.endsAt, outcome.booking.location.timezone, TIME_FORMAT)}
          </Text>
          <Text className="text-xs text-text-muted">
            {outcome.booking.location.name} · {outcome.booking.code}
          </Text>
        </>
      ) : (
        <Text className="text-base font-semibold text-danger">{outcome.message}</Text>
      )}
      <Button label="Scan next" variant="secondary" onPress={reset} />
    </View>
  ) : null;

  const codeEntry = (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-base font-semibold text-text">
        Or type the booking code
      </Text>
      <TextField
        label="Booking code"
        placeholder="FXB-7QLM"
        autoCapitalize="characters"
        autoCorrect={false}
        value={code}
        onChangeText={setCode}
        onSubmitEditing={submitCode}
        error={codeError}
        editable={!busy}
        returnKeyType="done"
      />
      <Button
        label="Check in with code"
        onPress={submitCode}
        loading={checkIn.isPending}
        disabled={busy && !checkIn.isPending}
      />
    </View>
  );

  const scanner = <QrScanner onScan={onScan} paused={busy} />;

  return (
    <StaffBrandScope>
      <Screen scroll>
        <PageHeader
          title="Check in a member"
          subtitle={
            wide
              ? 'Scan their booking QR code, or type the code from their booking.'
              : 'Scan their booking QR code.'
          }
        />
        {wide ? (
          <TwoColumn
            main={scanner}
            aside={
              <>
                {result}
                <Card>{codeEntry}</Card>
              </>
            }
          />
        ) : (
          <>
            {scanner}
            {result}
            {codeEntry}
          </>
        )}
      </Screen>
    </StaffBrandScope>
  );
}
