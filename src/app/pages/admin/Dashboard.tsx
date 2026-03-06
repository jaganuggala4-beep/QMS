/**
 * Admin Dashboard - System Overview
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router';
import {
  Users, ClipboardList, BarChart3, AlertCircle, FileText, GitBranch,
  TrendingUp, Activity, UserCheck, Phone, ArrowRight
} from 'lucide-react';
import { Layout, StatCard, PageHeader } from '../../components/Layout';
import { UserDB, AuditDB, DisputeDB, AllocationDB, TemplateDB } from '../../store/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const stats = useMemo(() => {
    const users = UserDB.getAll();
    const audits = AuditDB.getAll();
    const disputes = DisputeDB.getAll();
    const allocations = AllocationDB.getAll();
    const templates = TemplateDB.getAll();

    const agents = users.filter(u => u.role === 'agent');
    const qcs = users.filter(u => u.role === 'qc');
    const pendingDisputes = disputes.filter(d => d.status === 'PENDING');
    const avgScore = audits.length > 0
      ? audits.reduce((sum, a) => sum + a.percentageScore, 0) / audits.length
      : 0;

    return { users, audits, disputes, allocations, templates, agents, qcs, pendingDisputes, avgScore };
  }, []);

  // Monthly audit trend (last 6 months)
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months[key] = 0;
    }
    stats.audits.forEach(a => {
      const d = new Date(a.createdAt);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (key in months) months[key]++;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count }));
  }, [stats.audits]);

  // Team performance
  const teamData = useMemo(() => {
    const subtypes = ['COLLECTION', 'REVERIFICATION', 'CUSTOMER_CARE', 'MAILS'];
    return subtypes.map(sub => {
      const agents = UserDB.getAgentsBySubtype(sub as any);
      const agentIds = agents.map(a => a.id);
      const audits = stats.audits.filter(a => agentIds.includes(a.agentId));
      const avg = audits.length > 0 ? audits.reduce((s, a) => s + a.percentageScore, 0) / audits.length : 0;
      return { team: sub.replace('_', ' '), avg: parseFloat(avg.toFixed(1)), count: audits.length };
    });
  }, [stats.audits]);

  const recentAudits = useMemo(() => {
    return [...stats.audits]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [stats.audits]);

  return (
    <Layout>
      <PageHeader
        title="Admin Dashboard"
        subtitle="System-wide overview of quality management operations"
        action={
          <Link to="/admin/reports"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <BarChart3 size={16} /> Download Reports
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users" value={stats.users.length} subtitle={`${stats.agents.length} agents, ${stats.qcs.length} QC`}
          icon={<Users size={20} />} color="blue" />
        <StatCard title="Total Audits" value={stats.audits.length} subtitle="All time"
          icon={<ClipboardList size={20} />} color="green" />
        <StatCard title="Avg Score" value={`${stats.avgScore.toFixed(1)}%`} subtitle="Overall quality"
          icon={<TrendingUp size={20} />} color="purple" />
        <StatCard title="Pending Disputes" value={stats.pendingDisputes.length} subtitle="Needs attention"
          icon={<AlertCircle size={20} />} color={stats.pendingDisputes.length > 0 ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Templates" value={stats.templates.length} icon={<FileText size={20} />} color="indigo" />
        <StatCard title="Allocations" value={stats.allocations.length} icon={<GitBranch size={20} />} color="orange" />
        <StatCard title="QC Officers" value={stats.qcs.length} icon={<UserCheck size={20} />} color="blue" />
        <StatCard title="Total Agents" value={stats.agents.length} icon={<Phone size={20} />} color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-blue-600" /> Audit Trend (6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="Audits" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Team Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" /> Team Performance
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={teamData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="team" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val: number) => [`${val}%`, 'Avg Score']} />
              <Bar dataKey="avg" fill="#6366f1" radius={[4, 4, 0, 0]} name="Avg Score %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Audits + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audits */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Audits</h3>
            <Link to="/admin/audits" className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {recentAudits.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No audits yet</p>
          ) : (
            <div className="space-y-2">
              {recentAudits.map(audit => {
                const agent = UserDB.getById(audit.agentId);
                const qc = UserDB.getById(audit.qcId);
                return (
                  <div key={audit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{audit.referenceNumber}</p>
                      <p className="text-xs text-gray-400">{agent?.fullName} • by {qc?.fullName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                        ${audit.percentageScore >= 80 ? 'bg-green-100 text-green-700' :
                          audit.percentageScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'}`}>
                        {audit.percentageScore.toFixed(1)}%
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{new Date(audit.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Add New User', path: '/admin/users', icon: <Users size={16} />, color: 'text-blue-600 bg-blue-50' },
              { label: 'Create Template', path: '/admin/templates', icon: <FileText size={16} />, color: 'text-indigo-600 bg-indigo-50' },
              { label: 'Manage Allocations', path: '/admin/allocations', icon: <GitBranch size={16} />, color: 'text-purple-600 bg-purple-50' },
              { label: 'View Disputes', path: '/admin/disputes', icon: <AlertCircle size={16} />, color: 'text-orange-600 bg-orange-50' },
              { label: 'Download Reports', path: '/admin/reports', icon: <BarChart3 size={16} />, color: 'text-green-600 bg-green-50' },
            ].map(item => (
              <Link key={item.path} to={item.path}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                <span className={`p-2 rounded-lg ${item.color}`}>{item.icon}</span>
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{item.label}</span>
                <ArrowRight size={14} className="ml-auto text-gray-300 group-hover:text-gray-500" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
