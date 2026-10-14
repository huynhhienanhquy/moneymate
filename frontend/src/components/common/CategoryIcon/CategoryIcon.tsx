import {
  BriefcaseBusiness,
  Car,
  Dumbbell,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  MoreHorizontal,
  Plane,
  ReceiptText,
  ShoppingBag,
  Tag,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react';

interface CategoryIconProps {
  name?: string | null;
  className?: string;
}

const icons: Record<string, LucideIcon> = {
  tag: Tag,
  utensils: Utensils,
  home: Home,
  car: Car,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'shopping-bag': ShoppingBag,
  'gamepad-2': Gamepad2,
  receipt: ReceiptText,
  briefcase: BriefcaseBusiness,
  gift: Gift,
  plane: Plane,
  dumbbell: Dumbbell,
  zap: Zap,
  'more-horizontal': MoreHorizontal,
};

/**
 * Render the category icon interface.
 *
 * Use it to keep the category icon workflow's presentation and interactions in one reusable UI boundary.
 * @param props - The properties that configure this React component.
 * @returns The rendered category icon interface.
 */
const CategoryIcon = ({ name, className = 'size-5' }: CategoryIconProps) => {
  const Icon = icons[(name || 'tag').toLowerCase()] || Tag;
  return <Icon aria-hidden="true" className={className} />;
};

export default CategoryIcon;
