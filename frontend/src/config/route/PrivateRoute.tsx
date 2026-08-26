import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export const PrivateRoute: React.FC = () => {
  const { user, isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-brand-500"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Đang đồng bộ phiên làm việc...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
export default PrivateRoute;
