import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { ToastProvider } from './store/ToastContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import DashboardPage      from './pages/DashboardPage';
import PortfoliosPage     from './pages/PortfoliosPage';
import PortfolioDetailPage from './pages/PortfolioDetailPage';
import WatchlistPage      from './pages/WatchlistPage';
import AssetsPage         from './pages/AssetsPage';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route path="/dashboard"  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/portfolios" element={<ProtectedRoute><PortfoliosPage /></ProtectedRoute>} />
          <Route path="/portfolios/:portfolioId" element={<ProtectedRoute><PortfolioDetailPage /></ProtectedRoute>} />
          <Route path="/watchlist"  element={<ProtectedRoute><WatchlistPage /></ProtectedRoute>} />
          <Route path="/assets"     element={<ProtectedRoute><AssetsPage /></ProtectedRoute>} />

          {/* Redirects */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
