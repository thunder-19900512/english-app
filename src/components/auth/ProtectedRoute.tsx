import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute: React.FC = () => {
  const studentId = localStorage.getItem('studentId');
  
  if (!studentId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
