import type { ReactNode } from 'react';

interface FooterLink { label: string; href: string; }
interface AppFooterProps {
  brand?: ReactNode;
  links?: FooterLink[];
  copyright?: ReactNode;
  className?: string;
}

const AppFooter = ({ brand = 'MoneyMate', links = [], copyright, className = '' }: AppFooterProps) => (
  <footer className={className}>
    {brand && <strong>{brand}</strong>}
    {links.length > 0 && <nav aria-label="Liên kết chân trang">{links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}</nav>}
    {copyright && <p>{copyright}</p>}
  </footer>
);

export default AppFooter;
