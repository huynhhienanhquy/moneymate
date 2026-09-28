import React from 'react';
import AppTitle from '@/components/common/AppTitle/AppTitle';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader = ({ title, description, eyebrow, actions, className = '' }: PageHeaderProps) => (
  <header className={`app-page-header ${className}`}>
    <div className="relative z-10 min-w-0 flex-1">
      <AppTitle eyebrow={eyebrow} description={description}>{title}</AppTitle>
    </div>
    {actions && <div className="relative z-10 flex flex-wrap items-center gap-2 md:justify-end">{actions}</div>}
  </header>
);

export default PageHeader;
