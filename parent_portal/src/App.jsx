import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout & Pages
import MainLayout from './layouts/MainLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Homework from './pages/Homework';
import Exams from './pages/Exams';
import ReportCard from './pages/ReportCard';
import Fees from './pages/Fees';

import Register from './pages/Register';

// Secure Route Helper Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0B132B]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Establishing parent session context...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Auth Endpoints */}
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Parent Portal Scope */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/homework" element={<Homework />} />
                <Route path="/exams" element={<Exams />} />
                <Route path="/reports" element={<ReportCard />} />
                <Route path="/fees" element={<Fees />} />

                {/* Catch All redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
