import { forwardRef, type SelectHTMLAttributes } from 'react';

interface AppSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  unstyled?: boolean;
}

const AppSelect = forwardRef<HTMLSelectElement, AppSelectProps>(({ unstyled = false, className = '', children, ...props }, ref) => (
  <select ref={ref} className={unstyled ? className : `app-select ${className}`} {...props}>{children}</select>
));

AppSelect.displayName = 'AppSelect';
export default AppSelect;
