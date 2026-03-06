/**
 * QC Reports - Agent wise, Parameter wise, Date range filtered
 */

import React, { useState, useMemo } from 'react';
import { Layout, PageHeader } from '../../components/Layout';
import { useAuth } from '../../store/auth';
import { AuditDB, UserDB, AllocationDB, generateExcelReport, AgentSubtype } from '../../store/db';
import { Download, Filter, BarChart3, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line
} from 'recharts';
import { toast } from 'sonner';

export default function QCReports() {
  const { currentUser } = useAuth();

  const allocatedAgentIds = useMemo(() =>
    AllocationDB.getAgentsForQC(currentUser!.id), [currentUser]);

  const agents = useMemo(() =>
    allocatedAgentIds.map(id => UserDB.getById(id)).filter(Boolean),
    [allocatedAgentIds]);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterTeam, setFilterTeam] = useState<AgentSubtype | ''>('');

  const allUsers = useMemo(() => UserDB.getAll(), []);

  const filteredAudits = useMemo(() => {
    return AuditDB.getFiltered({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      agentId: filterAgent || undefined,
      qcId: currentUser!.id, // QC can only see their own audits
      subtype: filterTeam || undefined,
    });
  }, [fromDate, toDate, filterAgent, filterTeam, currentUser]);

  const handleDownload = (type: string) => {
    if (filteredAudits.length === 0) {
      toast.error('No data to export with current filters');
      return;
    }
    generateExcelReport(type, filteredAudits, allUsers);
    toast.success('Report downloaded successfully');
  };

  // Agent performance within filtered range
  const agentData = useMemo(() => {
    const map: Record<string, { name: string; avg: number; count: number; total: number }> = {};
    filteredAudits.forEach(a => {
      if (!map[a.agentId]) {
        map[a.agentId] = { name: UserDB.getById(a.agentId)?.fullName || a.agentId, avg: 0, count: 0, total: 0 };
      }
      map[a.agentId].total += a.percentageScore;
      map[a.agentId].count++;
      map[a.agentId].avg = map[a.agentId].total / map[a.agentId].count;
    });
    return Object.values(map).map(v => ({ ...v, avg: parseFloat(v.avg.toFixed(1)) }))
      .sort((a, b) => b.avg - a.avg);
  }, [filteredAudits]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const map: Record<string, { date: string; count: number; total: number; avg: number }> = {};
    filteredAudits.forEach(a => {
      const date = new Date(a.conversationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!map[date]) map[date] = { date, count: 0, total: 0, avg: 0 };
      map[date].count++;
      map[date].total += a.percentageScore;
      map[date].avg = map[date].total / map[date].count;
    });
    return Object.values(map).map(d => ({ ...d, avg: parseFloat(d.avg.toFixed(1)) }));
  }, [filteredAudits]);

  const avgScore = filteredAudits.length > 0
    ? filteredAudits.reduce((s, a) => s + a.percentageScore, 0) / filteredAudits.length : 0;

  return (
    <Layout>
      <PageHeader title="My Reports" subtitle="Download and analyze your audit reports" />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-indigo-600" />
          <h3 className="font-semibold text-gray-800 text-sm">Filter Reports</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Agent</label>
            <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
              <option value="">All Agents</option>
              {agents.map(a => a && <option key={a.id} value={a.id}>{a.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Team</label>
            <select value={filterTeam} onChange={e => setFilterTeam(e.target.value as AgentSubtype | '')}
              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
              <option value="">All Teams</option>
              {['COLLECTION', 'REVERIFICATION', 'CUSTOMER_CARE', 'MAILS'].map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            <strong className="text-gray-800">{filteredAudits.length}</strong> audits •
            Avg: <strong className="text-gray-800">{avgScore.toFixed(1)}%</strong>
          </p>
          <button onClick={() => { setFromDate(''); setToDate(''); setFilterAgent(''); setFilterTeam(''); }}
            className="text-xs text-indigo-600 hover:underline">Clear Filters</button>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { key: 'agent_wise', label: 'Agent Wise Report', color: 'bg-indigo-600 hover:bg-indigo-700' },
          { key: 'parameter_wise', label: 'Parameter Wise Report', color: 'bg-purple-600 hover:bg-purple-700' },
          { key: 'overall', label: 'Full Audit Summary', color: 'bg-blue-600 hover:bg-blue-700' },
        ].map(btn => (
          <button key={btn.key} onClick={() => handleDownload(btn.key)}
            className={`${btn.color} text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 justify-center transition-colors`}>
            <Download size={16} /> {btn.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" /> Agent Performance
          </h3>
          {agentData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data with current filters</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={agentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Avg Score']} />
                <Bar dataKey="avg" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-600" /> Score Trend
          </h3>
          {dailyTrend.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data with current filters</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Avg Score']} />
                <Line type="monotone" dataKey="avg" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Audit Table */}
      {filteredAudits.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Audit Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reference</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Agent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Template</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudits.slice(0, 20).map(audit => {
                  const agent = UserDB.getById(audit.agentId);
                  return (
                    <tr key={audit.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm text-indigo-600">{audit.referenceNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{agent?.fullName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{audit.templateName}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(audit.conversationDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold
                          ${audit.percentageScore >= 80 ? 'text-green-600' :
                            audit.percentageScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {audit.percentageScore.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredAudits.length > 20 && (
              <p className="text-center text-xs text-gray-400 py-3">Showing 20 of {filteredAudits.length} records. Download Excel for full data.</p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
