import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import AppButton from '@/components/common/AppButton/AppButton';

interface AppModalProps {
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
}

/**
 * Shared modal shell for form dialogs. It provides a consistent overlay,
 * keyboard dismissal, and accessible dialog semantics.
 */
const AppModal = ({ title, children, footer, onClose, className = '' }: AppModalProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="app-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-modal="true"
        aria-label={title ? undefined : 'Hộp thoại'}
        aria-labelledby={title ? 'app-modal-title' : undefined}
        className={`app-modal ${className}`}
        role="dialog"
      >
        {title && (
          <header className="mb-5 flex items-center justify-between gap-4">
            <h2 id="app-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <AppButton
              aria-label="Đóng hộp thoại"
              variant="icon"
              size="sm"
              className="min-h-0 p-2"
              onClick={onClose}
            >
              <X size={20} />
            </AppButton>
          </header>
        )}
        {children}
        {footer && <footer className="mt-6 flex gap-3">{footer}</footer>}
      </section>
    </div>
  );
};

export default AppModal;
