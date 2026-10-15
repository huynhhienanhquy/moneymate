import React from 'react';
import { ArrowUpRight, TrendingUp, Target, WalletCards } from 'lucide-react';
import AppFooter from '@/components/common/AppFooter/AppFooter';

interface AuthShellProps {
  titleId: string;
  children: React.ReactNode;
  register?: boolean;
}

const AuthShell = ({ titleId, children, register = false }: AuthShellProps) => (
  <main className={`auth-page ${register ? 'auth-page-register' : ''}`}>
    <div className="auth-layout">
      <aside className="auth-story" aria-label="Cùng MoneyMate quản lý tài chính">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-100/70"><span className="size-1.5 rounded-full bg-emerald-300" /> Từng bước vững vàng hơn</div>
        <div className="auth-story-copy">
          <h2>Tài chính rõ ràng.<br /><span className="text-blue-300">Cuộc sống<br className="hidden xl:block" /> nhẹ nhàng.</span></h2>
          <p>Một nơi để theo dõi chi tiêu, nuôi dưỡng thói quen tốt và đến gần hơn với những điều bạn mong muốn.</p>
          <div className="auth-illustration" aria-hidden="true">
            <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-blue-100/70">Kế hoạch nhỏ. Tương lai lớn.</span><ArrowUpRight className="size-5 text-blue-300" /></div>
            <svg viewBox="0 0 360 130" fill="none" className="my-4 w-full" aria-hidden="true">
              <path d="M0 110H360M0 65H360M0 20H360" stroke="white" strokeOpacity=".06" strokeDasharray="4 5" />
              <path className="auth-chart-line" pathLength="1" d="M4 113C38 113 41 86 73 92S115 55 147 67S189 42 220 48S262 12 294 24S330 10 356 4" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
              <path d="M4 113C38 113 41 86 73 92S115 55 147 67S189 42 220 48S262 12 294 24S330 10 356 4V130H4Z" fill="url(#auth-chart-fill)" />
              <defs><linearGradient id="auth-chart-fill" x1="180" y1="0" x2="180" y2="130" gradientUnits="userSpaceOnUse"><stop stopColor="#60a5fa" stopOpacity=".22" /><stop offset="1" stopColor="#60a5fa" stopOpacity="0" /></linearGradient></defs>
            </svg>
            <div className="flex items-center gap-2 text-[11px] text-blue-100/70"><span className="size-1.5 rounded-full bg-blue-300" /> Chủ động hôm nay, an tâm ngày mai</div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-4">
            <div className="auth-feature"><span><WalletCards className="size-4" /></span>Theo dõi dòng tiền</div>
            <div className="auth-feature"><span><Target className="size-4" /></span>Chạm tới mục tiêu</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-blue-100/50"><TrendingUp className="size-4" /> Người bạn đồng hành tài chính của bạn</div>
      </aside>
      <section className="auth-wrap animate-fade-in" aria-labelledby={titleId}>
        <div className="auth-card">
          <div className="auth-brand"><WalletCards aria-hidden="true" /><span>MoneyMate<span className="text-blue-600">.</span></span></div>
          {children}
        </div>
        <AppFooter className="auth-footer" links={[{ label: 'Điều khoản', href: '#terms' }, { label: 'Bảo mật', href: '#privacy' }, { label: 'Liên hệ', href: '#contact' }]} copyright={`© ${new Date().getFullYear()} MoneyMate. Tài chính trong tầm tay.`} />
      </section>
    </div>
  </main>
);

export default AuthShell;
