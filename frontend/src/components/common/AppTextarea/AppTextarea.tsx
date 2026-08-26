import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface AppTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  unstyled?: boolean;
}

const AppTextarea = forwardRef<HTMLTextAreaElement, AppTextareaProps>(({ unstyled = false, className = '', ...props }, ref) => (
  <textarea ref={ref} className={unstyled ? className : `app-input min-h-24 resize-y ${className}`} {...props} />
));

AppTextarea.displayName = 'AppTextarea';
export default AppTextarea;
