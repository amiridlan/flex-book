import { CameraView, useCameraPermissions } from 'expo-camera';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';

type QrScannerProps = {
  /** Called with the raw QR text. Scanning pauses while `paused` is true. */
  readonly onScan: (text: string) => void;
  readonly paused: boolean;
};

/** Camera viewfinder for check-in QR codes, with its own permission explainer. */
export function QrScanner({ onScan, paused }: QrScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <Frame message="Starting camera…" />;
  }
  if (!permission.granted) {
    return (
      <View className="gap-3 rounded-2xl border border-border bg-surface p-4">
        <Text className="text-base font-semibold text-text">Camera access needed to scan</Text>
        <Text className="text-sm text-text-muted">
          The camera is only used on this screen, to read members’ check-in QR codes. You can also
          type the booking code below.
        </Text>
        {permission.canAskAgain ? (
          <Button label="Allow camera" onPress={() => void requestPermission()} />
        ) : Platform.OS !== 'web' ? (
          <Button
            label="Open settings"
            variant="secondary"
            onPress={() => void Linking.openSettings()}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View
      accessibilityLabel="Camera viewfinder. Point it at the member’s QR code."
      className="h-72 overflow-hidden rounded-2xl bg-black"
    >
      <CameraView
        // The camera needs an explicit style; absoluteFill makes it fill the rounded frame.
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={paused ? undefined : (result) => onScan(result.data)}
      />
      <View pointerEvents="none" className="flex-1 items-center justify-center">
        <View className="h-44 w-44 rounded-2xl border-2 border-white" />
      </View>
    </View>
  );
}

function Frame({ message }: { readonly message: string }) {
  return (
    <View className="h-72 items-center justify-center rounded-2xl bg-surface-muted">
      <Text className="text-sm text-text-muted">{message}</Text>
    </View>
  );
}
