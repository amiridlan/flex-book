import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRANDS = ['The Common Ground', 'Hive', 'Clustered'] as const;

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center gap-6 px-6">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-slate-900">FlexiSpace</Text>
          <Text className="text-base text-slate-600">
            Book coworking space across Asia Pacific and Australia.
          </Text>
        </View>

        <View className="gap-3">
          {BRANDS.map((brand) => (
            <View key={brand} className="rounded-xl border border-slate-200 px-4 py-3">
              <Text className="text-base font-semibold text-slate-800">{brand}</Text>
            </View>
          ))}
        </View>

        <Text className="text-xs text-slate-500">
          Concept demo. Not affiliated with Flexi Group.
        </Text>
      </View>
    </SafeAreaView>
  );
}
