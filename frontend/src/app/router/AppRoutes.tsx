import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';
import Layout from '@/shared/components/Layout';
import LoadingState from '@/shared/components/LoadingState';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const WalletsPage = lazy(() => import('@/features/wallets/pages/WalletsPage'));
const CategoriesPage = lazy(() => import('@/features/categories/pages/CategoriesPage'));
const TransactionsPage = lazy(() => import('@/features/transactions/pages/TransactionsPage'));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'));
const MonthlyBalancePage = lazy(() => import('@/features/reports/pages/MonthlyBalancePage'));
const BudgetsPage = lazy(() => import('@/features/budgets/pages/BudgetsPage'));
const SavingGoalsPage = lazy(() => import('@/features/saving-goals/pages/SavingGoalsPage'));
const RecurringPage = lazy(() => import('@/features/recurring/pages/RecurringPage'));
const AiAdvisorPage = lazy(() => import('@/features/ai/pages/AiAdvisorPage'));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'));
const AdminPage = lazy(() => import('@/features/admin/pages/AdminPage'));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingState className="min-h-screen items-center" />}><Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Regular User Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/wallets" element={<WalletsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/monthly-balance" element={<MonthlyBalancePage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/saving-goals" element={<SavingGoalsPage />} />
          <Route path="/recurring" element={<RecurringPage />} />
          <Route path="/ai" element={<AiAdvisorPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Fallback path */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes></Suspense>
  );
};

export default AppRoutes;
