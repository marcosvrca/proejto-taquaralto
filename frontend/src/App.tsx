import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import ThemeToggleButton from './components/ThemeToggleButton';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Sleep from './pages/Sleep';
import Workouts from './pages/Workouts';
import Nutrition from './pages/Nutrition';
import Pains from './pages/Pains';
import Goals from './pages/Goals';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import './App.css';

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      {user && <Header />}
      {user && <ThemeToggleButton />}
      <main>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
          <Route path="/sleep" element={<ProtectedRoute requiredPermission="sleep"><Sleep /></ProtectedRoute>} />
          <Route path="/workouts" element={<ProtectedRoute requiredPermission="workouts"><Workouts /></ProtectedRoute>} />
          <Route path="/nutrition" element={<ProtectedRoute requiredPermission="nutrition"><Nutrition /></ProtectedRoute>} />
          <Route path="/pains" element={<ProtectedRoute requiredPermission="health"><Pains /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute requiredPermission="goals"><Goals /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
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