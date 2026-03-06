/**
 * Agent Dashboard - View audits, performance trend
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router';
import { Layout, StatCard, PageHeader } from '../../components/Layout';
import { useAuth } from '../../store/auth';
import { AuditDB, DisputeDB, UserDB } from '../../store/db';
import {
  ClipboardList, TrendingUp, AlertCircle, Phone,
  ArrowRight, Award, Activity
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function AgentDashboard() {
  const { currentUser } = useAuth();

  const data = useMemo(() => {
    const myAudits = AuditDB.getByAgent(currentUser!.id);
    const myDisputes = DisputeDB.getByAgent(currentUser!.id);
    const pendingDisputes = myDisputes.filter(d => d.status === 'PENDING');
    const avgScore = myAudits.length > 0
      ? myAudits.reduce((s, a) => s + a.percentageScore, 0) / myAudits.length : 0;
    const latestAudit = [...myAudits].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return { myAudits, myDisputes, pendingDisputes, avgScore, latestAudit };
  }, [currentUser]);

  // Performance trend (last 10 audits)
  const trendData = useMemo(() => {
    return [...data.myAudits]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-10)
      .map((a, i) => ({
        audit: `#${i + 1}`,
        score: a.percentageScore,
        ref: a.referenceNumber,
      }));
  }, [data.myAudits]);

  // Recent audits
  const recentAudits = useMemo(() =>
    [...data.myAudits]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [data.myAudits]);

  const scoreCategory = data.avgScore >= 80 ? '🌟 Excellent' : data.avgScore >= 60 ? '👍 Good' : data.avgScore > 0 ? '⚠️ Needs Work' : 'N/A';

  return (
    <Layout>
      <PageHeader
        title={`Hello, ${currentUser?.fullName}!`}
        subtitle={`Agent Portal — ${currentUser?.subtype?.replace('_', ' ')} Team`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Audits" value={data.myAudits.length} subtitle="All time"
          icon={<ClipboardList size={20} />} color="blue" />
        <StatCard title="Avg Score" value={`${data.avgScore.toFixed(1)}%`} subtitle={scoreCategory}
          icon={<TrendingUp size={20} />} color={data.avgScore >= 80 ? 'green' : data.avgScore >= 60 ? 'orange' : 'red'} />
        <StatCard title="Disputes Raised" value={data.myDisputes.length} subtitle={`${data.pendingDisputes.length} pending`}
          icon={<AlertCircle size={20} />} color={data.pendingDisputes.length > 0 ? 'orange' : 'green'} />
        <StatCard title="Team" value={currentUser?.subtype?.replace('_', ' ') || '—'} icon={<Phone size={20} />} color="indigo" />
      </div>

      {/* Performance Level */}
      {data.myAudits.length > 0 && (
        <div className={`rounded-xl border p-5 mb-6 flex items-center justify-between
          ${data.avgScore >= 80 ? 'bg-green-50 border-green-200' :
            data.avgScore >= 60 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl
              ${data.avgScore >= 80 ? 'bg-green-100' : data.avgScore >= 60 ? 'bg-blue-100' : 'bg-red-100'}`}>
              {data.avgScore >= 80 ? '🏆' : data.avgScore >= 60 ? '⭐' : '📊'}
            </div>
            <div>
              <p className={`font-bold text-lg ${data.avgScore >= 80 ? 'text-green-700' : data.avgScore >= 60 ? 'text-blue-700' : 'text-red-700'}`}>
                {scoreCategory}
              </p>
              <p className="text-sm text-gray-500">
                Your overall quality score is <strong>{data.avgScore.toFixed(1)}%</strong> across {data.myAudits.length} audits
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${data.avgScore >= 80 ? 'text-green-600' : data.avgScore >= 60 ? 'text-blue-600' : 'text-red-600'}`}>
              {data.avgScore.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400">Average Score</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-blue-600" /> Performance Trend (Last 10 Audits)
          </h3>
          {trendData.length < 2 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-400 text-sm">
                {trendData.length === 0 ? 'No audits yet' : 'Need more audits to show trend'}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="audit" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number, _, payload) => [`${v}%`, payload.payload?.ref || 'Score']}
                />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'View All Audits', path: '/agent/audits', icon: <ClipboardList size={16} />, color: 'text-blue-600 bg-blue-50' },
              { label: 'Raise Dispute', path: '/agent/disputes', icon: <AlertCircle size={16} />, color: 'text-orange-600 bg-orange-50' },
              { label: 'My Disputes', path: '/agent/disputes', icon: <AlertCircle size={16} />, color: 'text-red-600 bg-red-50' },
            ].map(item => (
              <Link key={item.label} to={item.path}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                <span className={`p-2 rounded-lg ${item.color}`}>{item.icon}</span>
                <span className="text-sm text-gray-700">{item.label}</span>
                <ArrowRight size={14} className="ml-auto text-gray-300 group-hover:text-gray-500" />
              </Link>
            ))}
          </div>

          {data.pendingDisputes.length > 0 && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-700 font-medium">
                {data.pendingDisputes.length} pending dispute{data.pendingDisputes.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-orange-500 mt-0.5">Awaiting QC response</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Audits */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Recent Audits</h3>
          <Link to="/agent/audits" className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
            View All <ArrowRight size={12} />
          </Link>
        </div>
        {recentAudits.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No audits yet</p>
        ) : (
          <div className="space-y-2">
            {recentAudits.map(audit => {
              const qc = UserDB.getById(audit.qcId);
              return (
                <div key={audit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{audit.referenceNumber}</p>
                    <p className="text-xs text-gray-400">QC: {qc?.fullName} • {new Date(audit.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full
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
    </Layout>
  );
}
