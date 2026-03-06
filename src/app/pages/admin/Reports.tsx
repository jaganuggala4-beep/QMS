/**
 * Admin - Advanced Reports with Excel Download
 * Filters: Date Range, Agent, QC, Team
 * Report Types: Overall, Agent Wise, Parameter Wise, Pareto
 */

import React, { useState, useMemo } from 'react';
import { Layout, PageHeader } from '../../components/Layout';
import { AuditDB, UserDB, generateExcelReport, calculateParameterPareto, AgentSubtype } from '../../store/db';
import {
  BarChart3, Download, Filter, TrendingUp, Users, FileText,
  BarChart2, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

export default function AdminReports() {
  const allUsers = useMemo(() => UserDB.getAll(), []);
  const agents = useMemo(() => UserDB.getByRole('agent'), []);
  const qcs = useMemo(() => UserDB.getByRole('qc'), []);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterQC, setFilterQC] = useState('');
  const [filterTeam, setFilterTeam] = useState<AgentSubtype | ''>('');
  const [activeReport, setActiveReport] = useState<'overall' | 'agent_wise' | 'parameter_wise' | 'pareto'>('overall');

  const filteredAudits = useMemo(() => {
    return AuditDB.getFiltered({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      agentId: filterAgent || undefined,
      qcId: filterQC || undefined,
      subtype: filterTeam || undefined,
    });
  }, [fromDate, toDate, filterAgent, filterQC, filterTeam]);

  const handleDownload = (type: string) => {
    if (filteredAudits.length === 0) {
      toast.error('No data to export with current filters');
      return;
    }
    generateExcelReport(type, filteredAudits, allUsers);
    toast.success('Excel report downloaded successfully');
  };

  // Agent performance data
  const agentPerf = useMemo(() => {
    const map: Record<string, { name: string; avg: number; count: number }> = {};
    filteredAudits.forEach(a => {
      if (!map[a.agentId]) {
        map[a.agentId] = { name: UserDB.getById(a.agentId)?.fullName || a.agentId, avg: 0, count: 0 };
      }
      map[a.agentId].avg += a.percentageScore;
      map[a.agentId].count += 1;
    });
    return Object.values(map).map(v => ({ ...v, avg: parseFloat((v.avg / v.count).toFixed(1)) }))
      .sort((a, b) => b.avg - a.avg);
  }, [filteredAudits]);

  // QC performance
  const qcPerf = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    filteredAudits.forEach(a => {
      if (!map[a.qcId]) {
        map[a.qcId] = { name: UserDB.getById(a.qcId)?.fullName || a.qcId, count: 0 };
      }
      map[a.qcId].count += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filteredAudits]);

  // Team data
  const teamData = useMemo(() => {
    const subtypes = ['COLLECTION', 'REVERIFICATION', 'CUSTOMER_CARE', 'MAILS'] as AgentSubtype[];
    return subtypes.map(sub => {
      const teamAgents = UserDB.getAgentsBySubtype(sub).map(a => a.id);
      const audits = filteredAudits.filter(a => teamAgents.includes(a.agentId));
      const avg = audits.length > 0 ? audits.reduce((s, a) => s + a.percentageScore, 0) / audits.length : 0;
      return { team: sub.replace('_', ' '), avg: parseFloat(avg.toFixed(1)), count: audits.length };
    });
  }, [filteredAudits]);

  // Pareto data
  const paretoData = useMemo(() => calculateParameterPareto(filteredAudits), [filteredAudits]);

  // Score distribution
  const scoreDistribution = useMemo(() => {
    const ranges = [
      { label: '0-20%', min: 0, max: 20, count: 0 },
      { label: '20-40%', min: 20, max: 40, count: 0 },
      { label: '40-60%', min: 40, max: 60, count: 0 },
      { label: '60-80%', min: 60, max: 80, count: 0 },
      { label: '80-100%', min: 80, max: 100, count: 0 },
    ];
    filteredAudits.forEach(a => {
      const range = ranges.find(r => a.percentageScore >= r.min && a.percentageScore <= r.max);
      if (range) range.count++;
    });
    return ranges;
  }, [filteredAudits]);

  const avgScore = useMemo(() =>
    filteredAudits.length > 0 ? filteredAudits.reduce((s, a) => s + a.percentageScore, 0) / filteredAudits.length : 0,
    [filteredAudits]);

  return (
    <Layout>
      <PageHeader
        title="Advanced Reports"
        subtitle="Generate filtered reports with Excel export"
      />

      {/* Filter Panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-blue-600" />
          <h3 className="font-semibold text-gray-800 text-sm">Report Filters</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Agent</label>
            <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              <option value="">All Agents</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">QC Officer</label>
            <select value={filterQC} onChange={e => setFilterQC(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              <option value="">All QC</option>
              {qcs.map(q => <option key={q.id} value={q.id}>{q.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Team</label>
            <select value={filterTeam} onChange={e => setFilterTeam(e.target.value as AgentSubtype | '')}
              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              <option value="">All Teams</option>
              {['COLLECTION', 'REVERIFICATION', 'CUSTOMER_CARE', 'MAILS'].map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing <strong className="text-gray-800">{filteredAudits.length}</strong> audits
            {filteredAudits.length > 0 && ` • Avg Score: ${avgScore.toFixed(1)}%`}
          </p>
          <button onClick={() => { setFromDate(''); setToDate(''); setFilterAgent(''); setFilterQC(''); setFilterTeam(''); }}
            className="text-xs text-blue-600 hover:underline">Clear Filters</button>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { key: 'overall', label: 'Overall Report', icon: <FileText size={16} />, color: 'bg-blue-600 hover:bg-blue-700' },
          { key: 'agent_wise', label: 'Agent Wise', icon: <Users size={16} />, color: 'bg-indigo-600 hover:bg-indigo-700' },
          { key: 'parameter_wise', label: 'Parameter Wise', icon: <BarChart2 size={16} />, color: 'bg-purple-600 hover:bg-purple-700' },
          { key: 'pareto', label: 'Pareto Report', icon: <AlertTriangle size={16} />, color: 'bg-orange-600 hover:bg-orange-700' },
        ].map(btn => (
          <button key={btn.key} onClick={() => handleDownload(btn.key)}
            className={`${btn.color} text-white px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 justify-center transition-colors`}>
            <Download size={14} /> {btn.label}
          </button>
        ))}
        <button onClick={() => handleDownload('overall')}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 justify-center transition-colors col-span-2 md:col-span-1">
          <Download size={14} /> Download All
        </button>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 mb-5 border-b border-gray-200">
        {[
          { key: 'overall', label: 'Overview' },
          { key: 'agent_wise', label: 'Agent Performance' },
          { key: 'parameter_wise', label: 'Parameter Analysis' },
          { key: 'pareto', label: 'Pareto Analysis' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveReport(tab.key as typeof activeReport)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all
              ${activeReport === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeReport === 'overall' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Audits', value: filteredAudits.length, icon: <FileText size={18} />, color: 'text-blue-600 bg-blue-50' },
              { label: 'Avg Score', value: `${avgScore.toFixed(1)}%`, icon: <TrendingUp size={18} />, color: 'text-green-600 bg-green-50' },
              { label: 'Agents Audited', value: new Set(filteredAudits.map(a => a.agentId)).size, icon: <Users size={18} />, color: 'text-indigo-600 bg-indigo-50' },
              { label: 'QC Officers', value: new Set(filteredAudits.map(a => a.qcId)).size, icon: <BarChart3 size={18} />, color: 'text-purple-600 bg-purple-50' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.color}`}>{s.icon}</div>
                <div><p className="text-xl font-bold text-gray-800">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Score Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Audits" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Team Performance */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Team Performance</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={teamData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="team" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Avg Score']} />
                  <Bar dataKey="avg" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Agent Performance */}
      {activeReport === 'agent_wise' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Agent Performance Rankings</h3>
            {agentPerf.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data with current filters</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agentPerf.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Avg Score']} />
                    <Bar dataKey="avg" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Avg Score %" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {agentPerf.map((a, i) => (
                    <div key={a.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                        ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{a.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${a.avg >= 80 ? 'bg-green-500' : a.avg >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${a.avg}%` }}></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-12 text-right">{a.avg}%</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{a.count} audits</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Parameter Analysis */}
      {activeReport === 'parameter_wise' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Parameter-wise Analysis</h3>
          {filteredAudits.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data with current filters</p>
          ) : (() => {
            const paramMap: Record<string, { scores: number[]; yes: number; no: number; na: number }> = {};
            filteredAudits.forEach(a => {
              a.scores.forEach(s => {
                if (!paramMap[s.parameterName]) paramMap[s.parameterName] = { scores: [], yes: 0, no: 0, na: 0 };
                if (s.scoringType === '1-10') paramMap[s.parameterName].scores.push(Number(s.givenScore));
                else if (s.givenScore === 'YES') paramMap[s.parameterName].yes++;
                else if (s.givenScore === 'NO') paramMap[s.parameterName].no++;
                else paramMap[s.parameterName].na++;
              });
            });
            return (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Parameter</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Avg Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">YES</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">NO</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">NA</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(paramMap).map(([name, val]) => {
                    const avg = val.scores.length > 0 ? val.scores.reduce((a, b) => a + b, 0) / val.scores.length : null;
                    const passRate = (val.yes + val.no) > 0 ? (val.yes / (val.yes + val.no)) * 100 : null;
                    return (
                      <tr key={name} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{avg !== null ? `${avg.toFixed(1)}/10` : '—'}</td>
                        <td className="px-4 py-3"><span className="text-green-600 font-medium text-sm">{val.yes || '—'}</span></td>
                        <td className="px-4 py-3"><span className="text-red-600 font-medium text-sm">{val.no || '—'}</span></td>
                        <td className="px-4 py-3"><span className="text-gray-400 text-sm">{val.na || '—'}</span></td>
                        <td className="px-4 py-3">
                          {passRate !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-16">
                                <div className={`h-1.5 rounded-full ${passRate >= 80 ? 'bg-green-500' : passRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${passRate}%` }}></div>
                              </div>
                              <span className="text-xs text-gray-600">{passRate.toFixed(0)}%</span>
                            </div>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}

      {/* Pareto */}
      {activeReport === 'pareto' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Pareto Analysis - Most Failed Parameters</h3>
          <p className="text-xs text-gray-500 mb-4">Parameters contributing most to quality failures (1-10 score &lt; 5 or YES/NO = NO)</p>
          {paretoData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No failure data with current filters</p>
          ) : (
            <>
              <div className="overflow-x-auto mb-5">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">PARAMETER</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">FAIL COUNT</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">CONTRIBUTION</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">CUMULATIVE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paretoData.map((item, i) => (
                      <tr key={item.name} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            {item.failCount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-1.5">
                              <div className="h-1.5 bg-orange-500 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-600">{item.percentage}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${item.cumulativePercentage <= 80 ? 'text-orange-600' : 'text-gray-500'}`}>
                            {item.cumulativePercentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={paretoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="failCount" fill="#f97316" radius={[4, 4, 0, 0]} name="Fail Count" />
                  <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#3b82f6" strokeWidth={2} name="Cumulative %" dot={false} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      )}
    </Layout>
  );
}
