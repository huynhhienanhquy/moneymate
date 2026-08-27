import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';
import PageLayout from '@/layouts/PageLayout/PageLayout';
import LoadingState from '@/components/common/LoadingState/LoadingState';
import { APP_ROUTES } from '@/constants/routes';

const LoginPage = lazy(() => import('@/pages/LoginPage/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage/DashboardPage'));
const WalletsPage = lazy(() => import('@/pages/WalletsPage/WalletsPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage/CategoriesPage'));
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage/TransactionsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage/ReportsPage'));
const MonthlyBalancePage = lazy(() => import('@/pages/MonthlyBalancePage/MonthlyBalancePage'));
const BudgetsPage = lazy(() => import('@/pages/BudgetsPage/BudgetsPage'));
const SavingGoalsPage = lazy(() => import('@/pages/SavingGoalsPage/SavingGoalsPage'));
const RecurringPage = lazy(() => import('@/pages/RecurringPage/RecurringPage'));
const AiAdvisorPage = lazy(() => import('@/pages/AiAdvisorPage/AiAdvisorPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage/ProfilePage'));
const AdminPage = lazy(() => import('@/pages/AdminPage/AdminPage'));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingState className="min-h-screen items-center" />}><Routes>
      {/* Public Routes */}
      <Route path={APP_ROUTES.login} element={<LoginPage />} />
      <Route path={APP_ROUTES.register} element={<RegisterPage />} />

      {/* Regular User Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<PageLayout />}>
          <Route path={APP_ROUTES.dashboard} element={<DashboardPage />} />
          <Route path={APP_ROUTES.wallets} element={<WalletsPage />} />
          <Route path={APP_ROUTES.categories} element={<CategoriesPage />} />
          <Route path={APP_ROUTES.transactions} element={<TransactionsPage />} />
          <Route path={APP_ROUTES.reports} element={<ReportsPage />} />
          <Route path={APP_ROUTES.monthlyBalance} element={<MonthlyBalancePage />} />
          <Route path={APP_ROUTES.budgets} element={<BudgetsPage />} />
          <Route path={APP_ROUTES.savingGoals} element={<SavingGoalsPage />} />
          <Route path={APP_ROUTES.recurring} element={<RecurringPage />} />
          <Route path={APP_ROUTES.aiAdvisor} element={<AiAdvisorPage />} />
          <Route path={APP_ROUTES.profile} element={<ProfilePage />} />
          {/* Fallback path */}
          <Route path="*" element={<Navigate to={APP_ROUTES.dashboard} replace />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminRoute />}>
        <Route path={APP_ROUTES.admin} element={<AdminPage />} />
      </Route>
    </Routes></Suspense>
  );
};

export default AppRoutes;
