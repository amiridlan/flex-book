import type { Country } from '../../schemas/country';

/**
 * Illustrative tax settings for the demo. In production these come from the
 * backend and are maintained by finance, never hard-coded in the app.
 */
export const COUNTRIES: readonly Country[] = [
  {
    code: 'MY',
    name: 'Malaysia',
    currency: 'MYR',
    currencyExponent: 2,
    tax: { label: 'SST', rateBp: 800 },
  },
  {
    code: 'SG',
    name: 'Singapore',
    currency: 'SGD',
    currencyExponent: 2,
    tax: { label: 'GST', rateBp: 900 },
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    currency: 'HKD',
    currencyExponent: 2,
    tax: { label: null, rateBp: 0 },
  },
  {
    code: 'VN',
    name: 'Vietnam',
    currency: 'VND',
    currencyExponent: 0,
    tax: { label: 'VAT', rateBp: 1000 },
  },
  {
    code: 'TH',
    name: 'Thailand',
    currency: 'THB',
    currencyExponent: 2,
    tax: { label: 'VAT', rateBp: 700 },
  },
  {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    currencyExponent: 2,
    tax: { label: 'GST', rateBp: 1000 },
  },
];
