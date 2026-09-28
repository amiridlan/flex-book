import type { ReactNode } from 'react';

import { useBrands } from '@/features/catalog/use-catalog';
import { BrandThemeScope } from '@/theme/brand-theme';

import { useStaffLocation } from '../use-staff-location';

/** Themes a staff screen in the brand of the location the desk is working at. */
export function StaffBrandScope({ children }: { readonly children: ReactNode }) {
  const { current } = useStaffLocation();
  const brands = useBrands();
  return (
    <BrandThemeScope
      theme={brands.data?.find((b) => b.id === current?.brandId)?.theme}
      className="flex-1"
    >
      {children}
    </BrandThemeScope>
  );
}
