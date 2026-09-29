import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

/** Column width as a Tailwind class: fixed (`w-32`) or flexible (`flex-1`). */
export type Column = { readonly label: string; readonly width: string };

type TableProps = {
  readonly columns: readonly Column[];
  readonly label: string;
  readonly children: ReactNode;
};

/**
 * Desktop data table: 14/20 text, 12 px uppercase headers, 1 px row rules.
 * Web roles let screen readers announce rows and columns.
 */
export function Table({ columns, label, children }: TableProps) {
  return (
    <View
      role="table"
      accessibilityLabel={label}
      className="overflow-hidden rounded-xl border border-border bg-surface"
    >
      <View role="row" className="flex-row items-center gap-4 bg-surface-muted px-5 py-3">
        {columns.map((column) => (
          <Text
            key={column.label}
            role="columnheader"
            className={`${column.width} text-xs font-semibold uppercase tracking-wide text-text-muted`}
          >
            {column.label}
          </Text>
        ))}
      </View>
      {children}
    </View>
  );
}

type TableRowProps = {
  readonly children: ReactNode;
  readonly accessibilityLabel: string;
  /** Makes the whole row a link. */
  readonly href?: Href;
  /** Tints the row, e.g. guests arriving now or the row being edited. */
  readonly highlight?: boolean;
  /** Makes the whole row a button, e.g. to pick the row to edit beside the table. */
  readonly onPress?: () => void;
};

export function TableRow({
  children,
  accessibilityLabel,
  href,
  highlight = false,
  onPress,
}: TableRowProps) {
  const className = `min-h-touch flex-row items-center gap-4 border-t border-border px-5 py-3 ${
    highlight ? 'bg-primary-soft/50' : ''
  }`;
  if (onPress) {
    return (
      <Pressable
        role="row"
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: highlight }}
        onPress={onPress}
        className={`${className} hover:bg-surface-muted`}
      >
        {children}
      </Pressable>
    );
  }
  if (!href) {
    return (
      <View role="row" accessibilityLabel={accessibilityLabel} className={className}>
        {children}
      </View>
    );
  }
  return (
    <Link href={href} asChild>
      <Pressable
        role="row"
        accessibilityRole="link"
        accessibilityLabel={accessibilityLabel}
        className={`${className} hover:bg-surface-muted`}
      >
        {children}
      </Pressable>
    </Link>
  );
}

export function Cell({
  width,
  children,
}: {
  readonly width: string;
  readonly children: ReactNode;
}) {
  return (
    <View role="cell" className={width}>
      {children}
    </View>
  );
}
