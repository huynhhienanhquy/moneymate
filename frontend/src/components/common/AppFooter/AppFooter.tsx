import type { ReactNode } from 'react';

interface FooterLink { label: string; href: string; }
interface AppFooterProps {
  brand?: ReactNode;
  links?: FooterLink[];
  copyright?: ReactNode;
  className?: string;
}

/**
 * Render the app footer interface.
 *
 * Use it to keep the app footer workflow's presentation and interactions in one reusable UI boundary.
 * @param props - The properties that configure this React component.
 * @returns The rendered app footer interface.
 */
const AppFooter = ({ brand = 'MoneyMate', links = [], copyright, className = '' }: AppFooterProps) => (
  <footer className={className}>
    {brand && <strong>{brand}</strong>}
    {links.length > 0 && <nav aria-label="Liên kết chân trang">{links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}</nav>}
    {copyright && <p>{copyright}</p>}
  </footer>
);

export default AppFooter;
