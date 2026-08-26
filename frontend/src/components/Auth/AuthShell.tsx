import React from 'react';
import { WalletCards } from 'lucide-react';

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
      <footer className="auth-footer"><strong>MoneyMate</strong><nav aria-label="Liên kết chân trang"><a href="#terms">Điều khoản</a><a href="#privacy">Bảo mật</a><a href="#contact">Liên hệ</a></nav><p>© 2024 MoneyMate - Hành trình tài chính thông minh</p></footer>
    </section>
  </main>
);

export default AuthShell;
