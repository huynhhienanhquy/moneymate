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
    <AppTitle eyebrow={eyebrow} description={description}>{title}</AppTitle>
    {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
  </header>
);

export default PageHeader;
