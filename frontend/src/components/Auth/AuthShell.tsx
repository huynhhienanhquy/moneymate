import React from 'react';
import { WalletCards } from 'lucide-react';
import AppFooter from '@/components/common/AppFooter/AppFooter';

interface AuthShellProps {
  titleId: string;
  children: React.ReactNode;
  register?: boolean;
}

const AuthShell = ({ titleId, children, register = false }: AuthShellProps) => (
  <main className={`auth-page ${register ? 'auth-page-register' : ''}`}>
    <div className="auth-scene" aria-hidden="true"><span>₫</span><span>↗</span><span>✦</span><span>●</span><span>▥</span><span>₫</span><span>+</span></div>
    <section className="auth-wrap animate-scale-in" aria-labelledby={titleId}>
      <div className="auth-card">
        <div className="auth-brand"><WalletCards aria-hidden="true" /><span>MoneyMate</span></div>
        {children}
      </div>
      <AppFooter className="auth-footer" links={[{ label: 'Điều khoản', href: '#terms' }, { label: 'Bảo mật', href: '#privacy' }, { label: 'Liên hệ', href: '#contact' }]} copyright="© 2024 MoneyMate - Hành trình tài chính thông minh" />
    </section>
  </main>
);

export default AuthShell;
