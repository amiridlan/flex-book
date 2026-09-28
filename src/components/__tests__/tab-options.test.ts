import { tabScreenOptions } from '../tab-options';

describe('tabScreenOptions', () => {
  it('uses a bottom tab bar on phones', () => {
    expect(tabScreenOptions(false)).toMatchObject({
      tabBarPosition: 'bottom',
      tabBarLabelPosition: 'below-icon',
    });
  });

  it('uses a labelled sidebar on wide screens', () => {
    expect(tabScreenOptions(true)).toMatchObject({
      tabBarPosition: 'left',
      tabBarVariant: 'material',
      tabBarLabelPosition: 'beside-icon',
    });
  });
});
