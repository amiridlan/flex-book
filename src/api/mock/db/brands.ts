import type { Brand } from '../../schemas/brand';

/** Brand themes are data, served by the API, so a new brand needs no app release. */
export const BRANDS: readonly Brand[] = [
  {
    id: 'tcg',
    name: 'The Common Ground',
    tagline: 'Workspaces with a neighbourhood feel',
    theme: { primary: '#2F6B4F', onPrimary: '#FFFFFF', primarySoft: '#E3F1E8' },
  },
  {
    id: 'hive',
    name: 'Hive',
    tagline: 'Design-led spaces for creative teams',
    theme: { primary: '#A15C07', onPrimary: '#FFFFFF', primarySoft: '#FDF1D8' },
  },
  {
    id: 'clustered',
    name: 'Clustered',
    tagline: 'Flexible offices for growing companies',
    theme: { primary: '#1E3A8A', onPrimary: '#FFFFFF', primarySoft: '#E0E7FF' },
  },
];
