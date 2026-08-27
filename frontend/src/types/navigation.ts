import type { LucideIcon } from 'lucide-react';

export type NavigationItem = {
  name: string;
  path: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};
