import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';
import PageLayout from '@/layouts/PageLayout/PageLayout';
import LoadingState from '@/components/common/LoadingState/LoadingState';

const LoginPage = lazy(() => import('@/pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/Auth/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'));
const WalletsPage = lazy(() => import('@/pages/Wallets/WalletsPage'));
const CategoriesPage = lazy(() => import('@/pages/Categories/CategoriesPage'));
const TransactionsPage = lazy(() => import('@/pages/Transactions/TransactionsPage'));
const ReportsPage = lazy(() => import('@/pages/Reports/ReportsPage'));
const MonthlyBalancePage = lazy(() => import('@/pages/Reports/MonthlyBalancePage'));
const BudgetsPage = lazy(() => import('@/pages/Budgets/BudgetsPage'));
const SavingGoalsPage = lazy(() => import('@/pages/SavingGoals/SavingGoalsPage'));
const RecurringPage = lazy(() => import('@/pages/Recurring/RecurringPage'));
const AiAdvisorPage = lazy(() => import('@/pages/AiAdvisor/AiAdvisorPage'));
const ProfilePage = lazy(() => import('@/pages/Profile/ProfilePage'));
const AdminPage = lazy(() => import('@/pages/Admin/AdminPage'));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingState className="min-h-screen items-center" />}><Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Regular User Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<PageLayout />}>
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
