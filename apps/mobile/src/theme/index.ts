import { colors, lightColors, radius, spacing } from '@moneymate/design-tokens';

export const theme = { colors: { ...lightColors, ...colors }, spacing, radius } as const;
