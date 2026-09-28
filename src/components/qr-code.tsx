import { create } from 'qrcode';
import { useMemo } from 'react';
import { View } from 'react-native';

type QrCodeProps = {
  readonly value: string;
  /** Rendered width in points. */
  readonly size?: number;
  readonly accessibilityLabel: string;
};

/**
 * QR code drawn with plain Views from the `qrcode` encoder's module matrix, so
 * it needs no SVG or canvas and renders identically on iOS, Android and web.
 */
export function QrCode({ value, size = 200, accessibilityLabel }: QrCodeProps) {
  const matrix = useMemo(() => create(value, { errorCorrectionLevel: 'M' }).modules, [value]);
  const quiet = 2; // quiet-zone modules each side, needed by scanners
  const count = matrix.size + quiet * 2;
  const cell = Math.floor(size / count);
  const rows = Array.from({ length: matrix.size }, (_, r) => r);

  // Inline sizes: module size is computed at runtime, which utility classes cannot express.
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      className="self-center bg-white"
      style={{ padding: cell * quiet }}
    >
      {rows.map((r) => (
        <View key={r} className="flex-row">
          {rows.map((c) => (
            <View
              key={c}
              className={matrix.data[r * matrix.size + c] ? 'bg-black' : 'bg-white'}
              style={{ width: cell, height: cell }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
