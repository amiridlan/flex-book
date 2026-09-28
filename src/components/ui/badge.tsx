import { Text, View } from 'react-native';

/** Small label on the current `primary-soft` token, so it takes a brand's colour inside BrandThemeScope. */
export function Badge({ label }: { readonly label: string }) {
  return (
    <View className="self-start rounded-full bg-primary-soft px-3 py-1">
      <Text className="text-xs font-semibold text-primary">{label}</Text>
    </View>
  );
}
