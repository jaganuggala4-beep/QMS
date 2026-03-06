/**
 * Main Layout with Left Sidebar - Used by all authenticated pages
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router';
import { useAuth } from '../store/auth';
import {
  LayoutDashboard,
  Users,
  FileText,
  GitBranch,
  BarChart3,
  Search,
  ClipboardList,
  AlertCircle,
  Download,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Shield,
  UserCheck,
  Phone,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'User Management', path: '/admin/users', icon: <Users size={18} /> },
  { label: 'Templates', path: '/admin/templates', icon: <FileText size={18} /> },
  { label: 'Allocations', path: '/admin/allocations', icon: <GitBranch size={18} /> },
  { label: 'All Audits', path: '/admin/audits', icon: <ClipboardList size={18} /> },
  { label: 'Disputes', path: '/admin/disputes', icon: <AlertCircle size={18} /> },
  { label: 'Reports', path: '/admin/reports', icon: <BarChart3 size={18} /> },
  { label: 'Search', path: '/admin/search', icon: <Search size={18} /> },
];

const qcNav: NavItem[] = [
  { label: 'Dashboard', path: '/qc', icon: <LayoutDashboard size={18} /> },
  { label: 'New Audit', path: '/qc/new-audit', icon: <ClipboardList size={18} /> },
  { label: 'My Audits', path: '/qc/audits', icon: <FileText size={18} /> },
  { label: 'Disputes', path: '/qc/disputes', icon: <AlertCircle size={18} /> },
  { label: 'Reports', path: '/qc/reports', icon: <Download size={18} /> },
  { label: 'Search', path: '/qc/search', icon: <Search size={18} /> },
];

const agentNav: NavItem[] = [
  { label: 'Dashboard', path: '/agent', icon: <LayoutDashboard size={18} /> },
  { label: 'My Audits', path: '/agent/audits', icon: <ClipboardList size={18} /> },
  { label: 'My Disputes', path: '/agent/disputes', icon: <AlertCircle size={18} /> },
];

const roleColors: Record<string, string> = {
  admin: 'from-blue-700 to-blue-900',
  qc: 'from-indigo-700 to-indigo-900',
  agent: 'from-slate-700 to-slate-900',
};

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield size={20} />,
  qc: <UserCheck size={20} />,
  agent: <Phone size={20} />,
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const navItems =
    currentUser.role === 'admin' ? adminNav :
    currentUser.role === 'qc' ? qcNav : agentNav;

  const gradClass = roleColors[currentUser.role] || 'from-blue-700 to-blue-900';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-gradient-to-b ${gradClass} text-white flex flex-col transition-all duration-300 z-20`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield size={16} />
              </div>
              <span className="font-semibold text-sm">QMS Portal</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-auto"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* User Info */}
        <div className={`p-4 border-b border-white/10 ${!sidebarOpen && 'flex justify-center'}`}>
          {sidebarOpen ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{currentUser.fullName}</p>
                  <p className="text-xs text-white/60 capitalize">{currentUser.role}</p>
                </div>
              </div>
              {currentUser.subtype && (
                <span className="inline-block bg-white/20 text-xs px-2 py-0.5 rounded-full mt-1">
                  {currentUser.subtype.replace('_', ' ')}
                </span>
              )}
            </div>
          ) : (
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
              {currentUser.fullName.charAt(0)}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all
                  ${isActive
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && (
                  <>
                    <span className="text-sm truncate">{item.label}</span>
                    {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all`}
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-gray-800 font-semibold text-base">
              {navItems.find(n => n.path === location.pathname)?.label || 'QMS Portal'}
            </h1>
            <p className="text-xs text-gray-400">Quality Management System</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
              {roleIcons[currentUser.role]}
              <span className="text-xs font-medium text-gray-600 capitalize">{currentUser.role}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Stat Card Component
export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'indigo';
  trend?: { value: number; label: string };
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Page Header
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Empty State
export function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
        {icon}
      </div>
      <p className="text-gray-600 font-medium">{title}</p>
      {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
    </div>
  );
}

// Badge Component
export function Badge({
  label,
  color = 'gray',
}: {
  label: string;
  color?: 'gray' | 'green' | 'blue' | 'red' | 'orange' | 'purple' | 'yellow';
}) {
  const colorMap = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    purple: 'bg-purple-100 text-purple-700',
    yellow: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[color]}`}>
      {label}
    </span>
  );
}

// Score Badge
export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
  return <Badge label={`${score.toFixed(1)}%`} color={color} />;
}