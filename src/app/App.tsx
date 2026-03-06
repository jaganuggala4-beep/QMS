/**
 * QMS - Enterprise Quality Management System
 * Main Application Entry Point
 *
 * Architecture:
 * - React Router for navigation
 * - Supabase/PostgreSQL for permanent data persistence
 * - Role-based access (Admin / QC / Agent)
 * - Permanent data that never resets
 */

import React from 'react';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './store/auth';
import { Toaster } from 'sonner';
import { router } from './routes';

// We wrap the whole app in RouterProvider + AuthProvider + Toaster
// AuthProvider provides login state to all routes
// The router contains all page components

export default function App() {
  return (
    <AuthProvider>
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        richColors
        expand={false}
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'inherit',
          },
        }}
      />
      {/* React Router */}
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
