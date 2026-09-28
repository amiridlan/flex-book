import { useWindowDimensions } from 'react-native';

/** Widths match Tailwind's md (768) and lg (1024) breakpoints used in class names. */
export const WIDE_MIN_WIDTH = 1024;

/**
 * Layout mode from the window width, so the same screens adapt: phones get
 * bottom tabs and one column; laptops get a sidebar and a card grid.
 */
export function useLayout() {
  const { width } = useWindowDimensions();
  return { wide: width >= WIDE_MIN_WIDTH };
}
