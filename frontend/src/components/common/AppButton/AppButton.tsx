import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  unstyled?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'app-primary-button',
  secondary: 'app-secondary-button',
  danger: 'border border-rose-200 bg-white text-rose-500 hover:bg-rose-50 dark:border-rose-500/30 dark:bg-slate-900 dark:hover:bg-rose-500/10',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200',
  icon: 'text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 text-xs',
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(({
  variant = 'primary', size = 'md', loading = false, leadingIcon, trailingIcon,
  fullWidth = false, unstyled = false, className = '', children, disabled, type = 'button', ...props
}, ref) => {
  const buttonClassName = unstyled
    ? className
    : `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

  return (
  <button
    ref={ref}
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={buttonClassName}
    {...props}
  >
    {loading ? <Loader2 aria-label="Đang xử lý" className="animate-spin" size={16} /> : leadingIcon}
    {children}
    {!loading && trailingIcon}
  </button>
  );
});

AppButton.displayName = 'AppButton';
export default AppButton;
