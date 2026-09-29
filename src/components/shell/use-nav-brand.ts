import { usePathname } from 'expo-router';

import type { Brand } from '@/api/schemas/brand';
import { useBooking } from '@/features/booking/use-bookings';
import { useBrands } from '@/features/catalog/use-catalog';
import { useLocation } from '@/features/locations/use-locations';
import { useStaffLocation } from '@/features/staff/use-staff-location';

/** `/locations/loc_hive_kul/...` -> `loc_hive_kul`. */
const LOCATION_PATH = /^\/locations\/([^/]+)/;
/** `/bookings/bk_123`, not the `/bookings` list. */
const BOOKING_PATH = /^\/bookings\/([^/]+)$/;

/**
 * The brand whose colours the member navigation takes: the brand of the page
 * being viewed (a location, one of its spaces, or a booking). Pages that span
 * every brand return undefined and keep the neutral shell. Reads the same query
 * cache as the screen, so it adds no requests.
 */
export function useMemberNavBrand(): Brand | undefined {
  const pathname = usePathname();
  const brands = useBrands();
  const locationId = LOCATION_PATH.exec(pathname)?.[1];
  const bookingId = BOOKING_PATH.exec(pathname)?.[1];
  const location = useLocation(locationId ?? '', { enabled: locationId !== undefined });
  const booking = useBooking(bookingId ?? '', { enabled: bookingId !== undefined });

  const brandId = locationId
    ? location.data?.brandId
    : bookingId
      ? booking.data?.location.brandId
      : undefined;
  return brandId ? brands.data?.find((b) => b.id === brandId) : undefined;
}

/** Staff navigation follows the brand of the location the desk is working at. */
export function useStaffNavBrand(): Brand | undefined {
  const { current } = useStaffLocation();
  const brands = useBrands();
  return current ? brands.data?.find((b) => b.id === current.brandId) : undefined;
}
