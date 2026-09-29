import { useState } from 'react';
import { Text, View } from 'react-native';

import { firstError } from '@/api/client/api-error';
import type { AdminUser } from '@/api/schemas/admin';
import type { Brand } from '@/api/schemas/brand';
import type { Location } from '@/api/schemas/location';
import type { Assignment, Role } from '@/api/schemas/user';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ROLE_LABELS } from '@/features/auth/permissions';
import {
  accessProblem,
  describeAccess,
  needsAssignments,
  normaliseAssignments,
} from '@/domain/access';

import { useUpdateAccess } from './use-admin';

const ROLES: readonly Role[] = ['member', 'staff', 'brand_admin', 'group_admin', 'super_admin'];

const ROLE_HINTS: Readonly<Record<Role, string>> = {
  member: 'Books spaces at every brand.',
  staff: 'Runs the front desk at the brands or locations chosen below.',
  brand_admin: 'Manages whole brands chosen below.',
  group_admin: 'Sees every brand and location.',
  super_admin: 'Manages people, access and settings.',
};

type AccessEditorProps = {
  readonly user: AdminUser;
  /** The signed-in super admin: nobody may change their own access. */
  readonly isSelf: boolean;
  readonly brands: readonly Brand[];
  readonly locations: readonly Location[];
};

/**
 * Edits one person's role and brand/location access. The rules here mirror the
 * server's (shared from src/domain/access), so mistakes show before saving; the
 * server still checks them.
 */
export function AccessEditor({ user, isSelf, brands, locations }: AccessEditorProps) {
  const update = useUpdateAccess();
  const [role, setRole] = useState<Role>(user.role);
  const [picked, setPicked] = useState<readonly Assignment[]>(user.assignments);
  const [saved, setSaved] = useState(false);

  const names = {
    brand: (id: string) => brands.find((b) => b.id === id)?.name ?? id,
    location: (id: string) => locations.find((l) => l.id === id)?.name ?? id,
  };
  const draft = needsAssignments(role) ? normaliseAssignments(picked) : [];
  const current = normaliseAssignments(user.assignments);
  const changed = role !== user.role || JSON.stringify(draft) !== JSON.stringify(current);
  const problem = accessProblem(role, draft);
  const serverError = firstError(update.error);

  function edit(next: readonly Assignment[]) {
    setPicked(next);
    setSaved(false);
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

  function save() {
    update.mutate(
      { userId: user.id, input: { role, assignments: draft } },
      { onSuccess: () => setSaved(true) },
    );
  }

  return (
    <Card>
      <Text accessibilityRole="header" className="text-lg font-semibold text-text">
        {user.name}
      </Text>
      <Text className="text-sm text-text-muted">{user.email}</Text>

      {isSelf ? (
        <View className="rounded-xl bg-surface-muted p-3">
          <Text className="text-sm text-text-muted">
            You can’t change your own access. Another super admin has to do it.
          </Text>
        </View>
      ) : (
        <View className="gap-5 pt-2">
          <View className="gap-2">
            <Text className="text-sm font-semibold text-text">Role</Text>
            <View className="flex-row flex-wrap gap-2">
              {ROLES.map((r) => (
                <Chip
                  key={r}
                  label={ROLE_LABELS[r]}
                  selected={role === r}
                  onPress={() => {
                    setRole(r);
                    setSaved(false);
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
                const brandLocations = locations.filter((l) => l.brandId === brand.id);
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
                        ? brandLocations.map((location) => (
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
              After saving
            </Text>
            <Text className="text-sm text-text">{describeAccess(role, draft, names)}</Text>
          </View>

          {problem ? (
            <Text accessibilityRole="alert" className="text-sm text-danger">
              {problem}
            </Text>
          ) : null}
          {serverError ? (
            <View accessibilityRole="alert" className="rounded-xl bg-danger-soft p-3">
              <Text className="text-sm text-danger">{serverError}</Text>
            </View>
          ) : null}
          {saved && !changed ? (
            <Text accessibilityRole="alert" className="text-sm font-semibold text-success">
              Saved. It applies on {user.name.split(' ')[0]}’s next action, and is in the activity
              log.
            </Text>
          ) : null}

          <Button
            label="Save access"
            onPress={save}
            loading={update.isPending}
            disabled={!changed || problem !== null}
          />
        </View>
      )}
    </Card>
  );
}
