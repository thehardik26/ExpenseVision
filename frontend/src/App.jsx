import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import PageMeta from './components/PageMeta';

export default function App() {
  return (
    <BrowserRouter>
      {/* Dynamic Page Metadata & Document Title Synchronizer */}
      <PageMeta />

      <Routes>
        {/* Authentication Route */}
        <Route path="/login" element={<Login />} />

        {/* Main App Routes (Wrapped in Layout with Sidebar & Topbar) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="budgets" element={<Budgets />} />
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
