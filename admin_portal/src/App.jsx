import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout & Pages
import MainLayout from './layouts/MainLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Batches from './pages/Batches';
import BatchDetails from './pages/BatchDetails';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Homework from './pages/Homework';
import Exams from './pages/Exams';
import Grades from './pages/Grades';
import DeveloperPortal from './pages/DeveloperPortal';
import RecycleBin from './pages/RecycleBin';
import AuditLogs from './pages/AuditLogs';
import Teachers from './pages/Teachers';


// Secure Route Helper Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0B132B]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Establishing secure session context...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Auth Endpoint */}
      <Route path="/login" element={<Auth />} />

      {/* Developer Portal (Private & Hidden) */}
      <Route path="/developer/portal" element={<DeveloperPortal />} />

      {/* Protected Admin Portal Scope */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/batches" element={<Batches />} />
                <Route path="/batches/:id" element={<BatchDetails />} />
                <Route path="/students" element={<Students />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/fees" element={<Fees />} />
                <Route path="/homework" element={<Homework />} />
                <Route path="/exams" element={<Exams />} />
                <Route path="/grades" element={<Grades />} />
                <Route path="/recycle-bin" element={<RecycleBin />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/teachers" element={<Teachers />} />
              

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
