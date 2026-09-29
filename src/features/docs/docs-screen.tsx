import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEMO_ACCOUNTS } from '@/features/auth/demo-accounts';
import { isStaffArea } from '@/features/auth/permissions';
import { useSessionStore } from '@/features/auth/session-store';
import { useLayout } from '@/lib/use-layout';
import { colors } from '@/theme/tokens';

import {
  DEMO_TIPS,
  DISCLAIMER,
  DOC_SECTIONS,
  HIGHLIGHTS,
  HOSTING,
  HOSTING_STATUS_LABELS,
  LAYERS,
  NEXT_STEPS,
  OVERVIEW,
  SECURITY,
  SHARED_RULES,
  STACK,
  TRANSPORTS,
  type DocSectionId,
  type HostingStatus,
} from './docs-content';

/** Scroll offset so a section title isn't jammed against the top edge. */
const SCROLL_MARGIN = 24;

const STATUS_STYLE: Readonly<Record<HostingStatus, { box: string; text: string }>> = {
  live: { box: 'bg-success-soft', text: 'text-success' },
  ready: { box: 'bg-warning-soft', text: 'text-warning' },
  planned: { box: 'bg-surface-muted', text: 'text-text-muted' },
};

/** Where the web build is being viewed from, so the page can say where it is hosted. */
function webHost(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return window.location.host;
}

/**
 * Public documentation page about this demo. Reachable signed in or out, so it
 * sits outside the member and staff guards and draws its own top bar.
 */
export function DocsScreen() {
  const { wide } = useLayout();
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const scrollRef = useRef<ScrollView>(null);
  // y of each section inside the scroll content, filled by onLayout.
  const offsets = useRef<Partial<Record<DocSectionId, number>>>({});
  const columnTop = useRef(0);
  // Null while the reader is still in the opening section, which the list leaves out.
  const [active, setActive] = useState<DocSectionId | null>(null);
  const host = webHost();

  function leave() {
    if (router.canGoBack()) router.back();
    else router.replace(user ? (isStaffArea(user) ? '/staff' : '/') : '/login');
  }

  function jumpTo(id: DocSectionId) {
    const y = offsets.current[id];
    if (y === undefined) return;
    setActive(id);
    scrollRef.current?.scrollTo({ y: Math.max(0, columnTop.current + y - SCROLL_MARGIN) });
  }

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = event.nativeEvent.contentOffset.y + SCROLL_MARGIN * 2;
    let current: DocSectionId | null = null;
    for (const { id } of DOC_SECTIONS) {
      const top = offsets.current[id];
      if (top !== undefined && columnTop.current + top <= y) current = id;
    }
    if (current !== active) setActive(current);
  }

  function measure(id: DocSectionId, y: number) {
    offsets.current[id] = y;
  }

  const sections = (
    <View
      className="flex-1 gap-12"
      onLayout={(event) => {
        columnTop.current = event.nativeEvent.layout.y;
      }}
    >
      <Section id="overview" title="About this demo" onMeasure={measure} lead>
        <Text className="text-[15px] leading-6 text-text">{OVERVIEW}</Text>
        <View className="-m-1.5 flex-row flex-wrap">
          {HIGHLIGHTS.map((item) => (
            <View key={item.title} className="w-full p-1.5 md:w-1/2">
              <View className="h-full gap-1 rounded-xl border border-border bg-surface p-4">
                <Text className="text-[15px] font-semibold text-text">{item.title}</Text>
                <Text className="text-sm leading-5 text-text-muted">{item.body}</Text>
              </View>
            </View>
          ))}
        </View>
        <Note>{DISCLAIMER}</Note>
      </Section>

      <Section id="try-it" title="Try the demo" onMeasure={measure}>
        <Rows>
          {DEMO_ACCOUNTS.map((account, index) => (
            <Row key={account.email} first={index === 0}>
              <Text className="text-sm font-semibold text-text lg:w-64">{account.title}</Text>
              <Text className="flex-1 text-sm text-text-muted">{account.description}</Text>
            </Row>
          ))}
        </Rows>
        <Bullets items={DEMO_TIPS} />
      </Section>

      <Section id="stack" title="Tech stack" onMeasure={measure}>
        <Text className="text-[15px] leading-6 text-text-muted">
          What each piece does in this app, not just its name.
        </Text>
        {STACK.map((group) => (
          <View key={group.title} className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              {group.title}
            </Text>
            <Rows>
              {group.items.map((item, index) => (
                <Row key={item.name} first={index === 0}>
                  <View className="gap-0.5 lg:w-64">
                    <Text className="text-sm font-semibold text-text">{item.name}</Text>
                    <Text className="text-xs text-text-muted">{item.version}</Text>
                  </View>
                  <Text className="flex-1 text-sm leading-5 text-text">{item.role}</Text>
                </Row>
              ))}
            </Rows>
          </View>
        ))}
      </Section>

      <Section id="architecture" title="How it fits together" onMeasure={measure}>
        <View
          accessibilityLabel={`Data flow: ${LAYERS.map((l) => l.name).join(', then ')}, then the mock server today or the Laravel API next.`}
          className="gap-2"
        >
          {LAYERS.map((layer) => (
            <View key={layer.name} className="items-center gap-2">
              <View className="w-full flex-row items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3">
                <Text className="w-28 text-sm font-semibold text-text">{layer.name}</Text>
                <Text className="flex-1 text-sm text-text-muted">{layer.detail}</Text>
              </View>
              <Ionicons name="arrow-down" size={16} color={colors['text-muted']} />
            </View>
          ))}
          <View className="gap-2 md:flex-row">
            {TRANSPORTS.map((transport) => (
              <View
                key={transport.name}
                className="flex-1 gap-1 rounded-xl border border-dashed border-border bg-surface px-4 py-3"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-text">{transport.name}</Text>
                  <Text className="text-xs font-semibold uppercase text-primary">
                    {transport.tag}
                  </Text>
                </View>
                <Text className="text-sm text-text-muted">{transport.detail}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text className="text-[15px] leading-6 text-text">{SHARED_RULES}</Text>
      </Section>

      <Section id="hosting" title="Hosting and delivery" onMeasure={measure}>
        {host ? (
          <Note>
            You are reading the web version, served from {host}. Every push to the main branch
            rebuilds it and publishes a new mobile update.
          </Note>
        ) : null}
        <Rows>
          {HOSTING.map((row, index) => (
            <Row key={row.part} first={index === 0}>
              <View className="gap-1 lg:w-64">
                <Text className="text-sm font-semibold text-text">{row.part}</Text>
                <View
                  className={`self-start rounded-full px-2 py-0.5 ${STATUS_STYLE[row.status].box}`}
                >
                  <Text className={`text-xs font-semibold ${STATUS_STYLE[row.status].text}`}>
                    {HOSTING_STATUS_LABELS[row.status]}
                  </Text>
                </View>
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-sm text-text">{row.where}</Text>
                <Text className="text-sm text-text-muted">{row.how}</Text>
              </View>
            </Row>
          ))}
        </Rows>
      </Section>

      <Section id="security" title="Security and privacy" onMeasure={measure}>
        <Bullets items={SECURITY} />
      </Section>

      <Section id="next" title="What comes next" onMeasure={measure}>
        <Bullets items={NEXT_STEPS} />
      </Section>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <View className="h-16 flex-row items-center justify-between gap-4 border-b border-border bg-surface px-4 lg:px-8">
        <View className="flex-row items-center gap-2">
          {wide ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={leave}
              className="min-h-touch min-w-touch items-center justify-center rounded-lg"
            >
              <Ionicons name="arrow-back" size={22} color={colors.primary} />
            </Pressable>
          )}
          <Text className="text-lg font-bold text-text">FlexiSpace</Text>
          <Text className="text-lg text-text-muted">Documentation</Text>
        </View>
        {wide ? (
          <Pressable
            accessibilityRole="button"
            onPress={leave}
            className="min-h-touch justify-center rounded-lg border border-border px-4 hover:bg-surface-muted"
          >
            <Text className="text-sm font-semibold text-text">
              {user ? 'Back to the app' : 'Sign in'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        onScroll={wide ? onScroll : undefined}
        scrollEventThrottle={64}
        contentContainerClassName="w-full max-w-6xl self-center px-4 pb-16 pt-6 lg:px-8 lg:pt-10"
      >
        {wide ? (
          <View className="flex-row items-start gap-12">
            <View
              role="navigation"
              accessibilityLabel="On this page"
              className="w-56 gap-1 web:sticky web:top-10"
            >
              <Text className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                On this page
              </Text>
              {DOC_SECTIONS.map((section) => {
                const current = section.id === active;
                return (
                  <Pressable
                    key={section.id}
                    accessibilityRole="link"
                    accessibilityState={{ selected: current }}
                    onPress={() => jumpTo(section.id)}
                    className={`rounded-lg border-l-2 px-3 py-2 ${
                      current
                        ? 'border-primary bg-primary-soft'
                        : 'border-transparent hover:bg-surface-muted'
                    }`}
                  >
                    <Text
                      className={`text-sm ${current ? 'font-semibold text-primary' : 'text-text-muted'}`}
                    >
                      {section.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View className="max-w-3xl flex-1">{sections}</View>
          </View>
        ) : (
          sections
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  id,
  title,
  lead = false,
  onMeasure,
  children,
}: {
  readonly id: DocSectionId;
  readonly title: string;
  /** The first section's title doubles as the page title. */
  readonly lead?: boolean;
  /** Reports the section's y so the contents list can scroll to it. */
  readonly onMeasure: (id: DocSectionId, y: number) => void;
  readonly children: ReactNode;
}) {
  return (
    <View
      nativeID={id}
      onLayout={(event: LayoutChangeEvent) => onMeasure(id, event.nativeEvent.layout.y)}
      className="gap-4"
    >
      <Text
        accessibilityRole="header"
        className={
          lead
            ? 'text-2xl font-bold text-text lg:text-[28px] lg:leading-9'
            : 'text-xl font-semibold text-text'
        }
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Rows({ children }: { readonly children: ReactNode }) {
  return (
    <View className="overflow-hidden rounded-xl border border-border bg-surface">{children}</View>
  );
}

function Row({ first, children }: { readonly first: boolean; readonly children: ReactNode }) {
  return (
    <View
      className={`gap-1 px-4 py-3 lg:flex-row lg:items-start lg:gap-6 lg:px-5 ${
        first ? '' : 'border-t border-border'
      }`}
    >
      {children}
    </View>
  );
}

function Bullets({ items }: { readonly items: readonly string[] }) {
  return (
    <View className="gap-2">
      {items.map((item) => (
        <View key={item} className="flex-row gap-3">
          <View className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
          <Text className="flex-1 text-[15px] leading-6 text-text">{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Note({ children }: { readonly children: ReactNode }) {
  return (
    <View className="rounded-xl bg-surface-muted px-4 py-3">
      <Text className="text-sm leading-5 text-text-muted">{children}</Text>
    </View>
  );
}
