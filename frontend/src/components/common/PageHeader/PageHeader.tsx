import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader = ({ title, description, eyebrow, actions, className = '' }: PageHeaderProps) => (
  <header className={`app-page-header ${className}`}>
    {eyebrow && <p className="font-semibold text-brand-600 dark:text-brand-400">{eyebrow}</p>}
    <h1 className={`${eyebrow ? 'mt-1' : ''} font-extrabold tracking-tight text-slate-950 dark:text-slate-100`}>{title}</h1>
    {description && <p className="mt-1 text-slate-500 dark:text-slate-400">{description}</p>}
    {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
  </header>
);

export default PageHeader;
