import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  className?: string;
}

const LoadingState = ({ className = '' }: LoadingStateProps) => (
  <div className={`flex justify-center py-20 ${className}`} role="status">
    <Loader2 aria-label="Đang tải" className="animate-spin text-brand-500" size={28} />
  </div>
);

export default LoadingState;
