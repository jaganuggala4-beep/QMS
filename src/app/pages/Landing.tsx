/**
 * Landing Page - Professional SaaS-style with 3 role cards
 */

import React from 'react';
import { useNavigate } from 'react-router';
import { Shield, UserCheck, Phone, ArrowRight, CheckCircle, Star, BarChart3 } from 'lucide-react';

const roles = [
  {
    key: 'admin',
    title: 'Administrator',
    subtitle: 'System Control Center',
    description: 'Manage users, templates, allocations, and access comprehensive reports with full system oversight.',
    icon: <Shield size={32} />,
    gradient: 'from-blue-600 to-blue-800',
    lightGradient: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    features: ['User Management', 'Template Control', 'Agent Allocation', 'Advanced Reports'],
    badge: 'Full Access',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    key: 'qc',
    title: 'QC Officer',
    subtitle: 'Quality Controller',
    description: 'Conduct audits on allocated agents, manage disputes, and download performance reports.',
    icon: <UserCheck size={32} />,
    gradient: 'from-indigo-600 to-indigo-800',
    lightGradient: 'from-indigo-50 to-indigo-100',
    border: 'border-indigo-200',
    features: ['Conduct Audits', 'Manage Disputes', 'Download Reports', 'Track Performance'],
    badge: 'Quality Control',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    key: 'agent',
    title: 'Agent',
    subtitle: 'Field Representative',
    description: 'View your audit results, listen to call recordings, raise disputes, and track your performance trends.',
    icon: <Phone size={32} />,
    gradient: 'from-slate-600 to-slate-800',
    lightGradient: 'from-slate-50 to-slate-100',
    border: 'border-slate-200',
    features: ['View Audits', 'Raise Disputes', 'Track Performance', 'Access Recordings'],
    badge: 'Agent Portal',
    badgeColor: 'bg-slate-100 text-slate-700',
  },
];

const stats = [
  { label: 'Audits Processed', value: '50K+', icon: <BarChart3 size={18} /> },
  { label: 'Active QC Officers', value: '200+', icon: <UserCheck size={18} /> },
  { label: 'Quality Score Avg', value: '94.2%', icon: <Star size={18} /> },
  { label: 'Compliance Rate', value: '99.8%', icon: <CheckCircle size={18} /> },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg">QMS Portal</span>
            <p className="text-blue-300 text-xs">Quality Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 text-xs px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            System Online
          </span>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-4 py-2 rounded-full mb-6">
          <Star size={12} />
          Enterprise Quality Management Platform v2.0
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
          Centralized Quality
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Audit Management
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-12">
          A unified platform for Administrators, QC Officers, and Agents.
          Select your role below to access your dedicated workspace.
        </p>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 max-w-3xl mx-auto mb-14">
          {stats.map(stat => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <div className="flex justify-center text-blue-400 mb-1">{stat.icon}</div>
              <p className="text-white font-bold text-lg">{stat.value}</p>
              <p className="text-slate-400 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Role Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <p className="text-center text-slate-400 text-sm mb-8 uppercase tracking-wider">
          Select Your Role to Continue
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map(role => (
            <div
              key={role.key}
              onClick={() => navigate(`/login/${role.key}`)}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 cursor-pointer
                hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              {/* Background gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl`}></div>

              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${role.badgeColor}`}>
                  {role.badge}
                </span>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>

              {/* Icon */}
              <div className={`w-16 h-16 bg-gradient-to-br ${role.gradient} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg`}>
                {role.icon}
              </div>

              {/* Content */}
              <h3 className="text-white font-bold text-xl mb-1">{role.title}</h3>
              <p className="text-slate-400 text-xs mb-3">{role.subtitle}</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">{role.description}</p>

              {/* Features */}
              <div className="space-y-2">
                {role.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-slate-400 text-xs">
                    <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className={`mt-5 bg-gradient-to-r ${role.gradient} rounded-xl py-2.5 text-center text-white text-sm font-medium
                opacity-80 group-hover:opacity-100 transition-opacity`}>
                Login as {role.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6">
        <p className="text-center text-slate-600 text-xs">
          © 2026 QMS Portal — Enterprise Quality Management System. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
