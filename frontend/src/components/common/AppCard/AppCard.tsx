import type { HTMLAttributes, ElementType } from 'react';

interface AppCardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };

/**
 * Render the app card interface.
 *
 * Use it to keep the app card workflow's presentation and interactions in one reusable UI boundary.
 * @param props - The properties that configure this React component.
 * @returns The rendered app card interface.
 */
const AppCard = ({ as: Component = 'div', interactive = false, padding = 'md', className = '', ...props }: AppCardProps) => (
  <Component className={`app-card ${interactive ? 'app-card-hover' : ''} ${paddingClasses[padding]} ${className}`} {...props} />
);

export default AppCard;
