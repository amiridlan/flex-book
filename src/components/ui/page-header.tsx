import { Link, type Href } from 'expo-router';
import { Fragment, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useLayout } from '@/lib/use-layout';

import { ScreenHeader } from './screen';

export type Crumb = { readonly label: string; readonly href?: Href };

type PageHeaderProps = {
  readonly title: string;
  readonly subtitle?: string;
  /** Desktop only: the path back up the app (Explore / Malaysia / Bangsar Loft). */
  readonly breadcrumbs?: readonly Crumb[];
  /** Desktop only: controls on the right of the title (filters, dropdowns). */
  readonly actions?: ReactNode;
};

/**
 * Desktop page header: breadcrumb 12/16, title 28/36 semibold, subtitle 15/22,
 * actions right-aligned. On phones it falls back to the compact ScreenHeader.
 */
export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  const { wide } = useLayout();
  if (!wide) return <ScreenHeader title={title} subtitle={subtitle} />;

  return (
    <View className="z-20 gap-2 border-b border-border pb-5">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <View accessibilityLabel="Breadcrumb" className="flex-row flex-wrap items-center gap-1.5">
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? <Text className="text-xs text-text-muted">/</Text> : null}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-xs font-medium text-text-muted hover:text-primary"
                >
                  {crumb.label}
                </Link>
              ) : (
                <Text
                  className={`text-xs font-medium ${index === breadcrumbs.length - 1 ? 'text-text' : 'text-text-muted'}`}
                >
                  {crumb.label}
                </Text>
              )}
            </Fragment>
          ))}
        </View>
      ) : null}
      <View className="flex-row items-end justify-between gap-6">
        <View className="flex-1 gap-1">
          <Text
            accessibilityRole="header"
            className="text-[28px] font-semibold leading-9 text-text"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-[15px] leading-[22px] text-text-muted">{subtitle}</Text>
          ) : null}
        </View>
        {actions ? <View className="flex-row items-center gap-3">{actions}</View> : null}
      </View>
    </View>
  );
}
