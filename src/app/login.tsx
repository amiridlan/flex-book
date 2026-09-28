import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { errorMessage } from '@/api/client/api-error';
import { Screen } from '@/components/ui/screen';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoAccount } from '@/features/auth/demo-accounts';
import { useSignIn } from '@/features/auth/use-auth';
import { colors } from '@/theme/tokens';

export default function LoginScreen() {
  const signIn = useSignIn();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  function choose(account: DemoAccount) {
    setPendingEmail(account.email);
    // DEMO ONLY: one-tap sign-in with the shared mock password.
    signIn.mutate(
      { email: account.email, password: DEMO_PASSWORD },
      { onSettled: () => setPendingEmail(null) },
    );
  }

  return (
    <Screen scroll width="compact">
      <View className="gap-2 pt-6">
        <Text accessibilityRole="header" className="text-3xl font-bold text-text">
          FlexiSpace
        </Text>
        <Text className="text-base text-text-muted">
          Book coworking space across Asia Pacific and Australia.
        </Text>
      </View>

      <View className="gap-3">
        <Text className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Choose a demo account
        </Text>
        {DEMO_ACCOUNTS.map((account) => {
          const pending = pendingEmail === account.email;
          return (
            <Pressable
              key={account.email}
              accessibilityRole="button"
              accessibilityLabel={`Sign in as ${account.title}`}
              accessibilityHint={account.description}
              accessibilityState={{ disabled: signIn.isPending, busy: pending }}
              disabled={signIn.isPending}
              onPress={() => choose(account)}
              className="min-h-touch flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-4 active:bg-surface-muted"
            >
              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold text-text">{account.title}</Text>
                <Text className="text-sm text-text-muted">{account.description}</Text>
              </View>
              {pending ? <ActivityIndicator color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>

      {signIn.isError ? (
        <View accessibilityRole="alert" className="rounded-xl bg-danger-soft p-4">
          <Text className="text-sm text-danger">{errorMessage(signIn.error)}</Text>
        </View>
      ) : null}

      <Text className="text-xs text-text-muted">
        Concept demo with fictional data. Not affiliated with Flexi Group.
      </Text>
    </Screen>
  );
}
