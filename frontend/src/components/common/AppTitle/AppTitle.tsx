import type { HTMLAttributes, ReactNode } from 'react';

interface AppTitleProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'children'> {
  children: ReactNode;
  level?: 1 | 2 | 3;
  eyebrow?: ReactNode;
  description?: ReactNode;
  unstyled?: boolean;
}

const AppTitle = ({ children, level = 1, eyebrow, description, unstyled = false, className = '', ...headingProps }: AppTitleProps) => {
  const Heading = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
  const size = level === 1 ? 'text-[30px] sm:text-page-title' : level === 2 ? 'text-section-title' : 'text-card-title';
  if (unstyled) return <Heading className={className} {...headingProps}>{children}</Heading>;

  return (
    <div className={className}>
      {eyebrow && <p className="app-title-eyebrow">{eyebrow}</p>}
      <Heading className={`${eyebrow ? 'mt-2.5' : ''} ${size} font-bold leading-tight tracking-tight`} {...headingProps}>{children}</Heading>
      {description && <p className="mt-1.5 max-w-2xl text-sm font-medium leading-5 opacity-80">{description}</p>}
    </div>
  );
};

export default AppTitle;
