import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import type { AdminUser } from '@/api/schemas/admin';
import type { Brand } from '@/api/schemas/brand';
import type { Location } from '@/api/schemas/location';
import type { Role } from '@/api/schemas/user';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { applyServerErrors } from '@/lib/form-errors';

import { AccessFields, useAccessDraft } from './access-fields';
import { useInviteStaff } from './use-admin';

const INVITABLE: readonly Role[] = ['staff', 'brand_admin', 'group_admin', 'super_admin'];

const personSchema = z.object({
  name: z.string().trim().min(2, 'Enter their full name.').max(80, 'Name is too long.'),
  email: z.email('Enter a valid email address.'),
});
type PersonForm = z.infer<typeof personSchema>;

type InviteFormProps = {
  readonly brands: readonly Brand[];
  readonly locations: readonly Location[];
  readonly onInvited: (user: AdminUser) => void;
  readonly onCancel: () => void;
};

/** Creates a staff account with a role and starting access. */
export function InviteForm({ brands, locations, onInvited, onCancel }: InviteFormProps) {
  const invite = useInviteStaff();
  const access = useAccessDraft('staff', []);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PersonForm>({
    resolver: zodResolver(personSchema),
    defaultValues: { name: '', email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    // The access problem, if any, is already shown under the access chips.
    if (access.problem) return;
    const role = access.role;
    if (role === 'member') return; // Not offered: members sign up themselves.
    try {
      const user = await invite.mutateAsync({ ...values, role, assignments: access.draft });
      onInvited(user);
    } catch (error) {
      applyServerErrors(error, setError, { name: 'name', email: 'email' });
    }
  });

  return (
    <Card>
      <Text accessibilityRole="header" className="text-lg font-semibold text-text">
        Invite staff
      </Text>
      <Text className="text-sm text-text-muted">
        They get an email to set a password. (The demo creates the account straight away.)
      </Text>
      <View className="gap-5 pt-2">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              label="Full name"
              autoComplete="name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              error={errors.name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              label="Work email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              error={errors.email?.message}
            />
          )}
        />
        <AccessFields access={access} roles={INVITABLE} brands={brands} locations={locations} />
        {errors.root?.server ? (
          <View accessibilityRole="alert" className="rounded-xl bg-danger-soft p-3">
            <Text className="text-sm text-danger">{errors.root.server.message}</Text>
          </View>
        ) : null}
        <Button label="Send invite" onPress={() => void onSubmit()} loading={isSubmitting} />
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
      </View>
    </Card>
  );
}
