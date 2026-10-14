import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  className?: string;
}

/**
 * Render the loading state interface.
 *
 * Use it to keep the loading state workflow's presentation and interactions in one reusable UI boundary.
 * @param props - The properties that configure this React component.
 * @returns The rendered loading state interface.
 */
const LoadingState = ({ className = '' }: LoadingStateProps) => (
  <div className={`flex justify-center py-20 ${className}`} role="status">
    <Loader2 aria-label="Đang tải" className="size-7 animate-spin text-brand-500"  />
  </div>
);

export default LoadingState;
