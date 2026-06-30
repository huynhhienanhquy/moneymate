import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';
import Layout from '../components/Layout';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import WalletsPage from '../pages/WalletsPage';
import CategoriesPage from '../pages/CategoriesPage';
import TransactionsPage from '../pages/TransactionsPage';
import ReportsPage from '../pages/ReportsPage';
import BudgetsPage from '../pages/BudgetsPage';
import SavingGoalsPage from '../pages/SavingGoalsPage';
import RecurringPage from '../pages/RecurringPage';
import AiAdvisorPage from '../pages/AiAdvisorPage';
import ProfilePage from '../pages/ProfilePage';
import AdminPage from '../pages/AdminPage';

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
