import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';
import Layout from '@/shared/components/Layout';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import WalletsPage from '@/features/wallets/pages/WalletsPage';
import CategoriesPage from '@/features/categories/pages/CategoriesPage';
import TransactionsPage from '@/features/transactions/pages/TransactionsPage';
import ReportsPage from '@/features/reports/pages/ReportsPage';
import MonthlyBalancePage from '@/features/reports/pages/MonthlyBalancePage';
import BudgetsPage from '@/features/budgets/pages/BudgetsPage';
import SavingGoalsPage from '@/features/saving-goals/pages/SavingGoalsPage';
import RecurringPage from '@/features/recurring/pages/RecurringPage';
import AiAdvisorPage from '@/features/ai/pages/AiAdvisorPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import AdminPage from '@/features/admin/pages/AdminPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
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
    </Routes>
  );
};

export default AppRoutes;
