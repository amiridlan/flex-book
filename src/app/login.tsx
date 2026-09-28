import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { errorMessage } from '@/api/client/api-error';
import { Screen } from '@/components/ui/screen';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoAccount } from '@/features/auth/demo-accounts';
import { useSignIn } from '@/features/auth/use-auth';
import { useLayout } from '@/lib/use-layout';
import { colors } from '@/theme/tokens';

// Shown before sign-in, when brand data (an authenticated API call) is not yet available.
const BRAND_NAMES = ['The Common Ground', 'Hive', 'Clustered'] as const;
const DISCLAIMER = 'Concept demo with fictional data. Not affiliated with Flexi Group.';

export default function LoginScreen() {
  const signIn = useSignIn();
  const { wide } = useLayout();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  function choose(account: DemoAccount) {
    setPendingEmail(account.email);
    // DEMO ONLY: one-tap sign-in with the shared mock password.
    signIn.mutate(
      { email: account.email, password: DEMO_PASSWORD },
      { onSettled: () => setPendingEmail(null) },
    );
  }

  const accounts = (
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
            className="min-h-touch flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-4 hover:border-primary/50 active:bg-surface-muted"
          >
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-text">{account.title}</Text>
              <Text className="text-sm text-text-muted">{account.description}</Text>
            </View>
            {pending ? <ActivityIndicator color={colors.primary} /> : null}
          </Pressable>
        );
      })}
      {signIn.isError ? (
        <View accessibilityRole="alert" className="rounded-xl bg-danger-soft p-4">
          <Text className="text-sm text-danger">{errorMessage(signIn.error)}</Text>
        </View>
      ) : null}
    </View>
  );

  if (wide) {
    // Desktop: product story on the left, sign-in on the right.
    return (
      <View className="flex-1 flex-row bg-background">
        <View className="flex-1 justify-between bg-sidebar p-16">
          <Text className="text-xl font-bold text-white">FlexiSpace</Text>
          <View className="max-w-lg gap-6">
            <Text
              accessibilityRole="header"
              className="text-5xl font-semibold leading-tight text-white"
            >
              Book any desk, in any city.
            </Text>
            <Text className="text-lg leading-7 text-sidebar-muted">
              One app for three coworking brands across Malaysia, Singapore, Hong Kong, Vietnam,
              Thailand and Australia. Local prices, local time, and bookings you can trust.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {BRAND_NAMES.map((name) => (
                <View key={name} className="rounded-full bg-sidebar-active px-4 py-2">
                  <Text className="text-sm font-medium text-sidebar-text">{name}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text className="text-xs text-sidebar-muted">{DISCLAIMER}</Text>
        </View>
        <ScrollView
          className="flex-1"
          contentContainerClassName="min-h-full items-center justify-center p-16"
        >
          <View className="w-full max-w-md gap-8">
            <View className="gap-2">
              <Text className="text-[28px] font-semibold leading-9 text-text">Sign in</Text>
              <Text className="text-[15px] leading-[22px] text-text-muted">
                Pick a role to explore the member or staff experience.
              </Text>
            </View>
            {accounts}
          </View>
        </ScrollView>
      </View>
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
      {accounts}
      <Text className="text-xs text-text-muted">{DISCLAIMER}</Text>
    </Screen>
  );
}
