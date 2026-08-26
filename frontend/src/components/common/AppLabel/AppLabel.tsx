import { forwardRef, type LabelHTMLAttributes } from 'react';

export type AppLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

const AppLabel = forwardRef<HTMLLabelElement, AppLabelProps>(({ className = '', children, ...props }, ref) => (
  <label ref={ref} className={className} {...props}>{children}</label>
));

AppLabel.displayName = 'AppLabel';
export default AppLabel;
