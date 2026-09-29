import { useState } from 'react';
import { Text, View } from 'react-native';

import { firstError } from '@/api/client/api-error';
import type { AdminUser } from '@/api/schemas/admin';
import type { Brand } from '@/api/schemas/brand';
import type { Location } from '@/api/schemas/location';
import type { Role } from '@/api/schemas/user';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { normaliseAssignments } from '@/domain/access';

import { AccessFields, useAccessDraft } from './access-fields';
import { useSetStatus, useUpdateAccess } from './use-admin';

const ROLES: readonly Role[] = ['member', 'staff', 'brand_admin', 'group_admin', 'super_admin'];

type AccessEditorProps = {
  readonly user: AdminUser;
  /** The signed-in super admin: nobody may change their own access or suspend themselves. */
  readonly isSelf: boolean;
  readonly brands: readonly Brand[];
  readonly locations: readonly Location[];
};

/**
 * Edits one person's role and brand/location access, and suspends or reactivates
 * the account. The rules mirror the server's (src/domain/access), so mistakes
 * show before saving; the server still checks them.
 */
export function AccessEditor({ user, isSelf, brands, locations }: AccessEditorProps) {
  const update = useUpdateAccess();
  const access = useAccessDraft(user.role, user.assignments);
  const [saved, setSaved] = useState(false);

  const changed =
    access.role !== user.role ||
    JSON.stringify(access.draft) !== JSON.stringify(normaliseAssignments(user.assignments));
  const serverError = firstError(update.error);

  function save() {
    update.mutate(
      { userId: user.id, input: { role: access.role, assignments: access.draft } },
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
            You can’t change your own access or suspend yourself. Another super admin has to do it.
          </Text>
        </View>
      ) : (
        <View className="gap-5 pt-2">
          <AccessFields
            access={access}
            roles={ROLES}
            brands={brands}
            locations={locations}
            onEdit={() => setSaved(false)}
          />
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
            disabled={!changed || access.problem !== null}
          />
          <AccountStatus user={user} />
        </View>
      )}
    </Card>
  );
}

/** Suspend (signs them out, blocks sign-in) or reactivate, with a reason for the log. */
function AccountStatus({ user }: { readonly user: AdminUser }) {
  const setStatus = useSetStatus();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const suspended = user.status === 'suspended';
  const error = firstError(setStatus.error);

  function submit() {
    setStatus.mutate(
      {
        userId: user.id,
        input: { status: suspended ? 'active' : 'suspended', reason },
      },
      {
        onSuccess: () => {
          setConfirming(false);
          setReason('');
        },
      },
    );
  }

  return (
    <View className="gap-3 border-t border-border pt-4">
      <Text className="text-sm font-semibold text-text">Account</Text>
      <Text className="text-sm text-text-muted">
        {suspended
          ? 'Suspended: they are signed out and cannot sign in.'
          : 'Active: they can sign in and use the app.'}
      </Text>
      {confirming ? (
        <View className="gap-3">
          <TextField
            label={suspended ? 'Why reactivate?' : 'Why suspend?'}
            value={reason}
            onChangeText={setReason}
            error={error ?? undefined}
            hint="Saved in the activity log."
          />
          <Button
            label={suspended ? 'Confirm reactivation' : 'Confirm suspension'}
            onPress={submit}
            loading={setStatus.isPending}
          />
          <Button label="Keep as it is" variant="ghost" onPress={() => setConfirming(false)} />
        </View>
      ) : (
        <Button
          label={suspended ? 'Reactivate account' : 'Suspend account'}
          variant="secondary"
          onPress={() => setConfirming(true)}
        />
      )}
    </View>
  );
}
