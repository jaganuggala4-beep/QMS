/**
 * Protected Route Component
 * Enforces role-based access control
 * Prevents URL manipulation to access unauthorized routes
 */

import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../store/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    // Redirect to their own dashboard
    return <Navigate to={`/${currentUser.role}`} replace />;
  }

  return <>{children}</>;
}
