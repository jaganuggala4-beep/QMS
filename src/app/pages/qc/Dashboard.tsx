/**
 * QC Officer Dashboard
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router';
import { Layout, StatCard, PageHeader } from '../../components/Layout';
import { useAuth } from '../../store/auth';
import { UserDB, AuditDB, DisputeDB, AllocationDB } from '../../store/db';
import {
  ClipboardList, TrendingUp, AlertCircle, Users,
  Plus, ArrowRight, BarChart3, Activity
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar
} from 'recharts';

export default function QCDashboard() {
  const { currentUser } = useAuth();

  const data = useMemo(() => {
    const allocatedAgentIds = AllocationDB.getAgentsForQC(currentUser!.id);
    const allocatedAgents = allocatedAgentIds.map(id => UserDB.getById(id)).filter(Boolean);
    const myAudits = AuditDB.getByQC(currentUser!.id);
    const myDisputes = DisputeDB.getByQC(currentUser!.id);
    const pendingDisputes = myDisputes.filter(d => d.status === 'PENDING');
    const avgScore = myAudits.length > 0
      ? myAudits.reduce((s, a) => s + a.percentageScore, 0) / myAudits.length : 0;

    return { allocatedAgents, myAudits, myDisputes, pendingDisputes, avgScore };
  }, [currentUser]);

  // Audit trend (last 7 days)
  const trendData = useMemo(() => {
    const days: Record<string, { date: string; count: number; avg: number; total: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[key] = { date: key, count: 0, avg: 0, total: 0 };
    }
    data.myAudits.forEach(a => {
      const d = new Date(a.createdAt);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (key in days) {
        days[key].count++;
        days[key].total += a.percentageScore;
        days[key].avg = days[key].total / days[key].count;
      }
    });
    return Object.values(days).map(d => ({ ...d, avg: parseFloat(d.avg.toFixed(1)) }));
  }, [data.myAudits]);

  // Agent leaderboard
  const agentLeaderboard = useMemo(() => {
    return data.allocatedAgents.map(agent => {
      if (!agent) return null;
      const audits = data.myAudits.filter(a => a.agentId === agent.id);
      const avg = audits.length > 0 ? audits.reduce((s, a) => s + a.percentageScore, 0) / audits.length : 0;
      return { agent, auditCount: audits.length, avg: parseFloat(avg.toFixed(1)) };
    }).filter(Boolean).sort((a, b) => b!.avg - a!.avg);
  }, [data.allocatedAgents, data.myAudits]);

  const recentAudits = useMemo(() =>
    [...data.myAudits].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [data.myAudits]
  );

  return (
    <Layout>
      <PageHeader
        title={`Welcome, ${currentUser?.fullName}`}
        subtitle="QC Officer Dashboard — Monitor and conduct quality audits"
        action={
          <Link to="/qc/new-audit"
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> New Audit
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="My Audits" value={data.myAudits.length} subtitle="Total conducted"
          icon={<ClipboardList size={20} />} color="indigo" />
        <StatCard title="Avg Score" value={`${data.avgScore.toFixed(1)}%`} subtitle="My audits avg"
          icon={<TrendingUp size={20} />} color="green" />
        <StatCard title="Pending Disputes" value={data.pendingDisputes.length} subtitle="Needs attention"
          icon={<AlertCircle size={20} />} color={data.pendingDisputes.length > 0 ? 'red' : 'green'} />
        <StatCard title="Allocated Agents" value={data.allocatedAgents.length} subtitle="Under my review"
          icon={<Users size={20} />} color="blue" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-indigo-600" /> Audit Activity (7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Audits" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-green-600" /> Score Trend (7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Avg Score']} />
              <Line type="monotone" dataKey="avg" stroke="#22c55e" strokeWidth={2}
                dot={{ fill: '#22c55e', r: 3 }} name="Avg Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Leaderboard */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Agent Rankings</h3>
          </div>
          {agentLeaderboard.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No allocated agents</p>
          ) : (
            <div className="space-y-2">
              {agentLeaderboard.map((item, i) => item && (
                <div key={item.agent.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{item.agent.fullName}</p>
                    <p className="text-xs text-gray-400">{item.auditCount} audits</p>
                  </div>
                  <span className={`text-xs font-bold ${item.avg >= 80 ? 'text-green-600' : item.avg >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {item.avg}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Audits */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Audits</h3>
            <Link to="/qc/audits" className="text-indigo-600 text-xs flex items-center gap-1 hover:underline">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {recentAudits.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-3">No audits yet</p>
              <Link to="/qc/new-audit" className="text-indigo-600 text-sm hover:underline">Start your first audit →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAudits.map(audit => {
                const agent = UserDB.getById(audit.agentId);
                return (
                  <div key={audit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{audit.referenceNumber}</p>
                      <p className="text-xs text-gray-400">{agent?.fullName} • {new Date(audit.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                      ${audit.percentageScore >= 80 ? 'bg-green-100 text-green-700' :
                        audit.percentageScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {audit.percentageScore.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pending Disputes Alert */}
      {data.pendingDisputes.length > 0 && (
        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-orange-500" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                {data.pendingDisputes.length} pending dispute{data.pendingDisputes.length > 1 ? 's' : ''} require your attention
              </p>
              <p className="text-xs text-orange-600">Agents are waiting for resolution</p>
            </div>
          </div>
          <Link to="/qc/disputes"
            className="flex items-center gap-1 text-orange-600 text-sm font-medium hover:underline">
            Review <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </Layout>
  );
}
