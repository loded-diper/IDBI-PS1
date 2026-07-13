import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SpendingPage from './pages/SpendingPage';
import PortfolioPage from './pages/PortfolioPage';
import GoalsPage from './pages/GoalsPage';
import SimulatorPage from './pages/SimulatorPage';
import SettingsPage from './pages/SettingsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import TaxRiskPage from './pages/TaxRiskPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/spending" element={<SpendingPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/tax-risk" element={<TaxRiskPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
