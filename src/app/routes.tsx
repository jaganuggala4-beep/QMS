/**
 * Application Routes Configuration
 * React Router v7 Data Mode
 */

import { createBrowserRouter } from 'react-router';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminTemplates from './pages/admin/Templates';
import AdminAllocations from './pages/admin/Allocations';
import AdminReports from './pages/admin/Reports';
import AdminAudits from './pages/admin/Audits';
import AdminDisputes from './pages/admin/Disputes';
import AdminSearch from './pages/admin/Search';

// QC Pages
import QCDashboard from './pages/qc/Dashboard';
import QCNewAudit from './pages/qc/NewAudit';
import QCAudits from './pages/qc/Audits';
import QCDisputes from './pages/qc/Disputes';
import QCReports from './pages/qc/Reports';
import QCSearch from './pages/qc/Search';

// Agent Pages
import AgentDashboard from './pages/agent/Dashboard';
import AgentAudits from './pages/agent/Audits';
import AgentDisputes from './pages/agent/Disputes';

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    Component: Landing,
  },
  {
    path: '/login/:role',
    Component: Login,
  },

  // ---- ADMIN Routes ----
  {
    path: '/admin',
    Component: AdminDashboard,
  },
  {
    path: '/admin/users',
    Component: AdminUsers,
  },
  {
    path: '/admin/templates',
    Component: AdminTemplates,
  },
  {
    path: '/admin/allocations',
    Component: AdminAllocations,
  },
  {
    path: '/admin/audits',
    Component: AdminAudits,
  },
  {
    path: '/admin/disputes',
    Component: AdminDisputes,
  },
  {
    path: '/admin/reports',
    Component: AdminReports,
  },
  {
    path: '/admin/search',
    Component: AdminSearch,
  },

  // ---- QC Routes ----
  {
    path: '/qc',
    Component: QCDashboard,
  },
  {
    path: '/qc/new-audit',
    Component: QCNewAudit,
  },
  {
    path: '/qc/re-audit/:reAuditId',
    Component: QCNewAudit,
  },
  {
    path: '/qc/audits',
    Component: QCAudits,
  },
  {
    path: '/qc/disputes',
    Component: QCDisputes,
  },
  {
    path: '/qc/reports',
    Component: QCReports,
  },
  {
    path: '/qc/search',
    Component: QCSearch,
  },

  // ---- AGENT Routes ----
  {
    path: '/agent',
    Component: AgentDashboard,
  },
  {
    path: '/agent/audits',
    Component: AgentAudits,
  },
  {
    path: '/agent/disputes',
    Component: AgentDisputes,
  },

  // Catch-all → Landing
  {
    path: '*',
    Component: Landing,
  },
]);
