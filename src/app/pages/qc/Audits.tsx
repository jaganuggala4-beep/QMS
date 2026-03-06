/**
 * QC - My Audits View with Re-audit, Delete, and Search
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Layout, PageHeader, Badge, ScoreBadge, EmptyState } from '../../components/Layout';
import { useAuth } from '../../store/auth';
import { AuditDB, UserDB, Audit } from '../../store/db';
import {
  Search, RefreshCw, Trash2, ChevronDown, ChevronUp,
  Eye, FileText, Filter, X
} from 'lucide-react';
import { toast } from 'sonner';

export default function QCAudits() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [audits, setAudits] = useState<Audit[]>(() =>
    [...AuditDB.getByQC(currentUser!.id)].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const refresh = () => setAudits([...AuditDB.getByQC(currentUser!.id)]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

  // Get unique agents from audits
  const auditedAgents = useMemo(() => {
    const agentIds = [...new Set(audits.map(a => a.agentId))];
    return agentIds.map(id => UserDB.getById(id)).filter(Boolean);
  }, [audits]);

  const filtered = useMemo(() => {
    let list = audits;
    if (search.trim()) {
      list = list.filter(a => a.referenceNumber.toLowerCase().includes(search.toLowerCase()));
    }
    if (filterAgent) {
      list = list.filter(a => a.agentId === filterAgent);
    }
    return list;
  }, [audits, search, filterAgent]);

  const handleDelete = (id: string) => {
    AuditDB.delete(id);
    refresh();
    setDeleteConfirm(null);
    toast.success('Audit deleted');
  };

  const avgScore = useMemo(() =>
    audits.length > 0 ? audits.reduce((s, a) => s + a.percentageScore, 0) / audits.length : 0,
    [audits]);

  return (
    <Layout>
      <PageHeader
        title="My Audits"
        subtitle={`${audits.length} audits conducted • Avg: ${avgScore.toFixed(1)}%`}
        action={
          <button onClick={() => navigate('/qc/new-audit')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
            + New Audit
          </button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by reference number..."
            className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
            <option value="">All Agents</option>
            {auditedAgents.map(a => a && <option key={a.id} value={a.id}>{a.fullName}</option>)}
          </select>
        </div>
        {(search || filterAgent) && (
          <button onClick={() => { setSearch(''); setFilterAgent(''); }}
            className="text-xs text-indigo-600 hover:underline">Clear</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <EmptyState icon={<FileText size={24} />} title="No audits found"
            description={search || filterAgent ? "Try different filters" : "Conduct your first audit"} />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(audit => {
            const agent = UserDB.getById(audit.agentId);
            const isExpanded = expandedId === audit.id;
            return (
              <div key={audit.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-sm font-semibold text-indigo-600">{audit.referenceNumber}</span>
                      <Badge label={audit.templateType} color={audit.templateType === 'CALL' ? 'blue' : 'purple'} />
                      {audit.isReAudit && <Badge label="Re-Audit" color="orange" />}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{audit.templateName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        Agent: <strong className="text-gray-600">{agent?.fullName}</strong>
                      </span>
                      <span className="text-xs text-gray-400">{new Date(audit.conversationDate).toLocaleDateString()}</span>
                      {audit.duration && <span className="text-xs text-gray-400">⏱ {audit.duration}</span>}
                    </div>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <ScoreBadge score={audit.percentageScore} />
                    <p className="text-xs text-gray-400 mt-1">{audit.totalScore}/{audit.maxPossibleScore} pts</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setExpandedId(isExpanded ? null : audit.id)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      {isExpanded ? <ChevronUp size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => navigate(`/qc/re-audit/${audit.id}`)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Re-audit">
                      <RefreshCw size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirm(audit.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Parameter Scores</h4>
                        <div className="space-y-2">
                          {audit.scores.map(score => (
                            <div key={score.parameterId} className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 flex-1">{score.parameterName}</span>
                              <div className="flex items-center gap-2">
                                {score.scoringType === '1-10' ? (
                                  <>
                                    <div className="w-16 bg-gray-200 rounded-full h-1">
                                      <div className={`h-1 rounded-full ${Number(score.givenScore) >= 7 ? 'bg-green-500' : Number(score.givenScore) >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${Number(score.givenScore) * 10}%` }}></div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-700 w-8 text-right">{score.givenScore}/10</span>
                                  </>
                                ) : (
                                  <span className={`text-xs font-semibold
                                    ${score.givenScore === 'YES' ? 'text-green-600' :
                                      score.givenScore === 'NO' ? 'text-red-600' : 'text-gray-400'}`}>
                                    {score.givenScore as string}
                                  </span>
                                )}
                                <span className="text-xs text-gray-400 w-8">({score.weightage}%)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Feedback</h4>
                        <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-200 leading-relaxed">
                          {audit.feedback || 'No feedback provided'}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Audited: {new Date(audit.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 text-center mb-2">Delete Audit?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
