import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { env } from '@/config/env';
import { useBrands } from '@/features/catalog/use-catalog';
import { DemoLocationPicker } from '@/features/device-location/demo-location-picker';
import { useLocations } from '@/features/locations/use-locations';

import { ROLE_LABELS } from './permissions';
import { useSessionStore } from './session-store';
import { useSignOut } from './use-auth';

/** Shared by the member and staff areas. */
export function ProfileScreen() {
  const user = useSessionStore((s) => s.user);
  const signOut = useSignOut();
  const router = useRouter();
  const brands = useBrands();
  const locations = useLocations();

  if (!user) return null;

  const scopeLines = user.assignments.map((assignment) => {
    const brandName =
      brands.data?.find((b) => b.id === assignment.brandId)?.name ?? assignment.brandId;
    if (assignment.locationId === null) return `${brandName} · all locations`;
    const location = locations.data?.data.find((l) => l.id === assignment.locationId);
    return `${brandName} · ${location ? `${location.name}, ${location.city}` : assignment.locationId}`;
  });

  return (
    <Screen scroll>
      <PageHeader title={user.name} subtitle={user.email} />
      {/* Desktop keeps the page full width (header lines up with other pages) but caps the reading column. */}
      <View className="w-full max-w-2xl gap-5">
        <Card>
          <Row label="Role" value={ROLE_LABELS[user.role]} />
          <View className="gap-1">
            <Text className="text-sm text-text-muted">Access</Text>
            {scopeLines.length === 0 ? (
              <Text className="text-base text-text">All brands and locations</Text>
            ) : (
              scopeLines.map((line) => (
                <Text key={line} className="text-base text-text">
                  {line}
                </Text>
              ))
            )}
          </View>
        </Card>

        <Card>
          <Row
            label="Data source"
            value={env.apiMode === 'mock' ? 'Mock API (demo data)' : 'Live API'}
          />
        </Card>

        {env.apiMode === 'mock' ? <DemoLocationPicker /> : null}

        <Button label="About this demo" variant="ghost" onPress={() => router.push('/docs')} />
        <Button
          label="Sign out"
          variant="secondary"
          loading={signOut.isPending}
          onPress={() => signOut.mutate()}
        />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View className="flex-row justify-between gap-4">
      <Text className="text-sm text-text-muted">{label}</Text>
      <Text className="flex-1 text-right text-base font-medium text-text">{value}</Text>
    </View>
  );
}
