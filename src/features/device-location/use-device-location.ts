import * as Location from 'expo-location';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Linking, Platform } from 'react-native';

import type { DeviceFix } from '@/domain/booking-rules';

import { useDemoLocationStore } from './demo-location-store';

export type DeviceLocationState =
  | { readonly status: 'checking' }
  /** Permission not asked yet: show our explanation before the OS prompt. */
  | { readonly status: 'needs_permission' }
  | { readonly status: 'denied'; readonly canAskAgain: boolean }
  | { readonly status: 'locating' }
  | {
      readonly status: 'ready';
      readonly fix: DeviceFix;
      readonly source: 'gps' | 'demo';
      readonly label?: string;
    }
  | { readonly status: 'error'; readonly message: string };

const UNAVAILABLE: DeviceLocationState = {
  status: 'error',
  message: 'We could not get your location. Check that location services are on.',
};

async function readPosition(): Promise<DeviceLocationState> {
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      status: 'ready',
      source: 'gps',
      fix: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        mocked: position.mocked === true,
      },
    };
  } catch {
    return UNAVAILABLE;
  }
}

async function checkGps(): Promise<DeviceLocationState> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (permission.granted) return readPosition();
    if (permission.status === 'undetermined') return { status: 'needs_permission' };
    return { status: 'denied', canAskAgain: permission.canAskAgain };
  } catch {
    return UNAVAILABLE;
  }
}

async function askAndLocate(): Promise<DeviceLocationState> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { status: 'denied', canAskAgain: permission.canAskAgain };
    return readPosition();
  } catch {
    return UNAVAILABLE;
  }
}

const GPS_KEY = ['device-location'] as const;

/**
 * The phone's position for the booking rule, treated as async data: TanStack
 * Query handles loading and refresh, and never caches a stale fix. Asks for
 * permission only after the user has read why (never on app start). A demo
 * override, when set, replaces GPS entirely.
 */
export function useDeviceLocation() {
  const override = useDemoLocationStore((s) => s.override);
  const queryClient = useQueryClient();
  const gps = useQuery({
    queryKey: GPS_KEY,
    queryFn: checkGps,
    enabled: override === null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const ask = useMutation({
    mutationFn: askAndLocate,
    onSuccess: (result) => queryClient.setQueryData(GPS_KEY, result),
  });

  const state: DeviceLocationState = override
    ? {
        status: 'ready',
        source: 'demo',
        label: override.label,
        fix: { lat: override.lat, lng: override.lng, mocked: override.mocked },
      }
    : ask.isPending || gps.isFetching
      ? { status: gps.data ? 'locating' : 'checking' }
      : (gps.data ?? { status: 'checking' });

  const refresh = useCallback(async () => {
    if (!override) await gps.refetch();
  }, [override, gps]);

  const openSettings = useCallback(() => {
    if (Platform.OS !== 'web') void Linking.openSettings();
  }, []);

  return { state, refresh, requestPermission: () => ask.mutate(), openSettings };
}
