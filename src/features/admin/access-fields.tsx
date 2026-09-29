import { useState } from 'react';
import { Text, View } from 'react-native';

import type { Brand } from '@/api/schemas/brand';
import type { Location } from '@/api/schemas/location';
import type { Assignment, Role } from '@/api/schemas/user';
import { Chip } from '@/components/ui/chip';
import {
  accessProblem,
  describeAccess,
  needsAssignments,
  normaliseAssignments,
} from '@/domain/access';
import { ROLE_LABELS } from '@/features/auth/permissions';

const ROLE_HINTS: Readonly<Record<Role, string>> = {
  member: 'Books spaces at every brand.',
  staff: 'Runs the front desk at the brands or locations chosen below.',
  brand_admin: 'Manages whole brands chosen below.',
  group_admin: 'Sees every brand and location.',
  super_admin: 'Manages people, access and settings.',
};

/** A role plus access being edited, with the shared rules applied as you go. */
export function useAccessDraft(initialRole: Role, initialAssignments: readonly Assignment[]) {
  const [role, setRole] = useState<Role>(initialRole);
  const [picked, setPicked] = useState<readonly Assignment[]>(initialAssignments);
  const draft = needsAssignments(role) ? normaliseAssignments(picked) : [];
  return {
    role,
    setRole,
    picked,
    setPicked,
    /** The role and access that would be saved. */
    draft,
    problem: accessProblem(role, draft),
  };
}

export type AccessDraft = ReturnType<typeof useAccessDraft>;

type AccessFieldsProps = {
  readonly access: AccessDraft;
  readonly roles: readonly Role[];
  readonly brands: readonly Brand[];
  readonly locations: readonly Location[];
  /** Called on any change, e.g. to clear a "Saved" note. */
  readonly onEdit?: () => void;
};

/** Role chips, brand and location chips, and a plain-words preview of the result. */
export function AccessFields({ access, roles, brands, locations, onEdit }: AccessFieldsProps) {
  const { role, setRole, picked, setPicked, draft, problem } = access;
  const names = {
    brand: (id: string) => brands.find((b) => b.id === id)?.name ?? id,
    location: (id: string) => locations.find((l) => l.id === id)?.name ?? id,
  };

  function edit(next: readonly Assignment[]) {
    setPicked(next);
    onEdit?.();
  }

  function toggleBrand(brandId: Brand['id']) {
    const whole = picked.some((a) => a.brandId === brandId && a.locationId === null);
    edit(
      whole
        ? picked.filter((a) => a.brandId !== brandId)
        : [...picked.filter((a) => a.brandId !== brandId), { brandId, locationId: null }],
    );
  }

  function toggleLocation(location: Location) {
    const has = picked.some((a) => a.locationId === location.id);
    edit(
      has
        ? picked.filter((a) => a.locationId !== location.id)
        : [...picked, { brandId: location.brandId, locationId: location.id }],
    );
  }

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Text className="text-sm font-semibold text-text">Role</Text>
        <View className="flex-row flex-wrap gap-2">
          {roles.map((r) => (
            <Chip
              key={r}
              label={ROLE_LABELS[r]}
              selected={role === r}
              onPress={() => {
                setRole(r);
                onEdit?.();
              }}
            />
          ))}
        </View>
        <Text className="text-sm text-text-muted">{ROLE_HINTS[role]}</Text>
      </View>

      {needsAssignments(role) ? (
        <View className="gap-4">
          <Text className="text-sm font-semibold text-text">Access</Text>
          {brands.map((brand) => {
            const whole = picked.some((a) => a.brandId === brand.id && a.locationId === null);
            return (
              <View key={brand.id} className="gap-2">
                <Text className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {brand.name}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <Chip
                    label={`All ${brand.name} locations`}
                    selected={whole}
                    onPress={() => toggleBrand(brand.id)}
                  />
                  {role === 'staff' && !whole
                    ? locations
                        .filter((l) => l.brandId === brand.id)
                        .map((location) => (
                          <Chip
                            key={location.id}
                            label={`${location.name} · ${location.city}`}
                            selected={picked.some((a) => a.locationId === location.id)}
                            onPress={() => toggleLocation(location)}
                          />
                        ))
                    : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      <View className="gap-1 rounded-xl bg-surface-muted p-3">
        <Text className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Access after saving
        </Text>
        <Text className="text-sm text-text">{describeAccess(role, draft, names)}</Text>
      </View>

      {problem ? (
        <Text accessibilityRole="alert" className="text-sm text-danger">
          {problem}
        </Text>
      ) : null}
    </View>
  );
}
