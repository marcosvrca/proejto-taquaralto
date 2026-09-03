import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppShell from './layouts/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Sleep from './pages/Sleep';
import Workouts from './pages/Workouts';
import Nutrition from './pages/Nutrition';
import Pains from './pages/Pains';
import Goals from './pages/Goals';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import AdminGames from './pages/AdminGames';
import AdminAthletePerformance from './pages/AdminAthletePerformance';
import AthleteCalendar from './pages/AthleteCalendar';

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center" style={{ background: 'var(--bg)' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/games" element={<ProtectedRoute adminOnly><AdminGames /></ProtectedRoute>} />
        <Route path="/admin/athlete-performance" element={<ProtectedRoute adminOnly><AdminAthletePerformance /></ProtectedRoute>} />
        <Route path="/sleep" element={<ProtectedRoute requiredPermission="sleep"><Sleep /></ProtectedRoute>} />
        <Route path="/workouts" element={<ProtectedRoute requiredPermission="workouts"><Workouts /></ProtectedRoute>} />
        <Route path="/nutrition" element={<ProtectedRoute requiredPermission="nutrition"><Nutrition /></ProtectedRoute>} />
        <Route path="/pains" element={<ProtectedRoute requiredPermission="health"><Pains /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute requiredPermission="goals"><Goals /></ProtectedRoute>} />
        <Route path="/calendar" element={<AthleteCalendar />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
