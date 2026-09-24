import { render, screen } from '@testing-library/react-native';

import WelcomeScreen from '@/app/index';

describe('WelcomeScreen', () => {
  it('lists all three brands', async () => {
    await render(<WelcomeScreen />);

    expect(screen.getByText('The Common Ground')).toBeTruthy();
    expect(screen.getByText('Hive')).toBeTruthy();
    expect(screen.getByText('Clustered')).toBeTruthy();
  });

  it('shows the concept demo disclaimer', async () => {
    await render(<WelcomeScreen />);

    expect(screen.getByText(/Not affiliated with Flexi Group/)).toBeTruthy();
  });
});
