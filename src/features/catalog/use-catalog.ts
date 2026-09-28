import { useQuery } from '@tanstack/react-query';

import { catalogRepository } from '@/api';
import type { BrandId } from '@/api/schemas/brand';
import { queryKeys } from '@/lib/query-keys';

/** Brands and countries change rarely: fetch once per session. */
export function useBrands() {
  return useQuery({
    queryKey: queryKeys.brands,
    queryFn: () => catalogRepository.brands(),
    staleTime: Infinity,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: queryKeys.countries,
    queryFn: () => catalogRepository.countries(),
    staleTime: Infinity,
  });
}

export function useBrand(id: BrandId | undefined) {
  const brands = useBrands();
  return brands.data?.find((b) => b.id === id);
}
