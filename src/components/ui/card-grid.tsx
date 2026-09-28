import { Children, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

/**
 * One column on phones, two from 768 px, three from 1280 px. Uses Tailwind
 * breakpoints, which NativeWind applies on web and native alike.
 */
export function CardGrid({ children }: { readonly children: ReactNode }) {
  return (
    <View className="-m-1.5 flex-row flex-wrap">
      {Children.map(children, (child, index) => (
        <View
          key={isValidElement(child) && child.key !== null ? child.key : index}
          className="w-full p-1.5 md:w-1/2 xl:w-1/3"
        >
          {child}
        </View>
      ))}
    </View>
  );
}
