import { z } from 'zod';

const hexColour = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const brandIdSchema = z.enum(['tcg', 'hive', 'clustered']);
export type BrandId = z.infer<typeof brandIdSchema>;

export const brandSchema = z.object({
  id: brandIdSchema,
  name: z.string(),
  tagline: z.string(),
  theme: z.object({
    primary: hexColour,
    onPrimary: hexColour,
    primarySoft: hexColour,
  }),
});
export type Brand = z.infer<typeof brandSchema>;
export type BrandTheme = Brand['theme'];
