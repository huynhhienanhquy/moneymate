import type { ReactNode } from 'react';

interface AppTitleProps {
  children: ReactNode;
  level?: 1 | 2 | 3;
  eyebrow?: ReactNode;
  description?: ReactNode;
  className?: string;
}

const AppTitle = ({ children, level = 1, eyebrow, description, className = '' }: AppTitleProps) => {
  const Heading = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
  const size = level === 1 ? 'text-[28px]' : level === 2 ? 'text-xl' : 'text-lg';
  return (
    <div className={className}>
      {eyebrow && <p className="font-semibold text-brand-600 dark:text-brand-400">{eyebrow}</p>}
      <Heading className={`${eyebrow ? 'mt-1' : ''} ${size} font-extrabold tracking-tight text-slate-950 dark:text-slate-100`}>{children}</Heading>
      {description && <p className="mt-1 text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
  );
};

export default AppTitle;
