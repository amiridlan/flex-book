import { render, screen } from '@testing-library/react-native';
import { create } from 'qrcode';

import { QrCode } from '../qr-code';

describe('QrCode', () => {
  it('renders one row per QR module row inside a labelled image', async () => {
    const value = 'flexbook://check-in/bk_1?token=qr_TEST';
    const size = create(value, { errorCorrectionLevel: 'M' }).modules.size;

    await render(<QrCode value={value} accessibilityLabel="Check-in QR code" />);

    const image = screen.getByLabelText('Check-in QR code');
    expect(image.children).toHaveLength(size);
  });
});
