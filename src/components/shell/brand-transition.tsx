import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';

import { useReduceMotion } from '@/lib/use-reduce-motion';
import { rgb } from '@/theme/tokens';

/** How long the new brand colour takes to sweep down the sidebar. */
const WIPE_MS = 450;
/** How long the brand name takes to swap. */
const LABEL_MS = 300;
/** How far the brand name travels while it swaps, in px (one line of text-xs). */
const LABEL_TRAVEL = 16;

// Transforms and opacity run on the native UI thread; the web has no native driver.
const useNativeDriver = Platform.OS !== 'web';

/**
 * The sidebar background, with each brand change sweeping the new colour down
 * from the top over the old one. `background` is the target colour as RGB
 * channels. Returns the colour to paint underneath and an overlay element to
 * render as the sidebar's first child (behind its content).
 */
export function useBackgroundWipe(background: string) {
  const reduceMotion = useReduceMotion();
  // The colour fully painted so far; it catches up with `background` when a wipe ends.
  const [painted, setPainted] = useState(background);
  const [progress] = useState(() => new Animated.Value(1));
  const wiping = !reduceMotion && painted !== background;

  useEffect(() => {
    if (!wiping) return;
    progress.setValue(0);
    const wipe = Animated.timing(progress, {
      toValue: 1,
      duration: WIPE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver,
    });
    wipe.start(({ finished }) => {
      if (finished) setPainted(background);
    });
    // A newer brand change stops this wipe and starts its own from the top.
    return () => wipe.stop();
  }, [wiping, background, progress]);

  const overlay = wiping ? (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: rgb(background),
          transformOrigin: 'top',
          transform: [{ scaleY: progress }],
        },
      ]}
    />
  ) : null;

  return { paintedBackground: rgb(reduceMotion ? background : painted), overlay };
}

type BrandLabelProps = {
  readonly name: string;
  readonly className: string;
};

/**
 * One line of text that swaps with a top-to-bottom motion: the old name slides
 * down and fades out while the new one drops in from above.
 */
export function BrandLabel({ name, className }: BrandLabelProps) {
  const reduceMotion = useReduceMotion();
  const [shown, setShown] = useState(name);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [progress] = useState(() => new Animated.Value(1));

  // A new name arrived: keep the old one on screen so it can slide away.
  if (name !== shown) {
    setLeaving(shown);
    setShown(name);
  }

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const swap = Animated.timing(progress, {
      toValue: 1,
      duration: LABEL_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver,
    });
    swap.start(({ finished }) => {
      if (finished) setLeaving(null);
    });
    return () => swap.stop();
  }, [shown, reduceMotion, progress]);

  const travel = (from: number, to: number) =>
    progress.interpolate({ inputRange: [0, 1], outputRange: [from, to] });

  return (
    // Clipped to one line, so the names appear from and disappear behind its edges.
    <View className="h-4 overflow-hidden">
      {leaving !== null && !reduceMotion ? (
        <Animated.View
          aria-hidden
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: travel(1, 0),
              transform: [{ translateY: travel(0, LABEL_TRAVEL) }],
            },
          ]}
        >
          <Text className={className}>{leaving}</Text>
        </Animated.View>
      ) : null}
      <Animated.View
        style={{
          opacity: progress,
          transform: [{ translateY: travel(-LABEL_TRAVEL, 0) }],
        }}
      >
        <Text className={className}>{shown}</Text>
      </Animated.View>
    </View>
  );
}
