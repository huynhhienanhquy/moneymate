import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  labelAction?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
  variant?: 'default' | 'auth';
  wrapperClassName?: string;
  unstyled?: boolean;
}

const AppInput = forwardRef<HTMLInputElement, AppInputProps>(({
  id, label, labelAction, leading, trailing, error, hint, variant = 'default',
  className = '', wrapperClassName = '', unstyled = false, ...props
}, ref) => {
  const input = <input ref={ref} id={id} aria-invalid={!!error || undefined} aria-describedby={error || hint ? `${id}-help` : undefined} className={variant === 'auth' || unstyled ? className : `app-input ${className}`} {...props} />;

  if (unstyled) return input;

  if (variant === 'auth') return (
    <label className={`auth-field ${wrapperClassName}`} htmlFor={id}>
      {label && <span className="auth-label-row"><span>{label}</span>{labelAction}</span>}
      <span className="auth-input-wrap">{leading}{input}{trailing}</span>
      {(error || hint) && <span id={`${id}-help`} className={error ? 'text-rose-500' : 'text-slate-500'}>{error || hint}</span>}
    </label>
  );

  return (
    <label className={`block ${wrapperClassName}`} htmlFor={id}>
      {label && <span className="mb-1.5 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300"><span>{label}</span>{labelAction}</span>}
      <span className="relative block">{leading && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">{leading}</span>}{input}{trailing && <span className="absolute inset-y-0 right-3 flex items-center">{trailing}</span>}</span>
      {(error || hint) && <span id={`${id}-help`} className={`mt-1 block text-xs ${error ? 'text-rose-500' : 'text-slate-500'}`}>{error || hint}</span>}
    </label>
  );
});

AppInput.displayName = 'AppInput';
export default AppInput;
