/**
 * Admin - All Audits View with Re-audit and Search
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Layout, PageHeader, Badge, ScoreBadge, EmptyState } from '../../components/Layout';
import { AuditDB, UserDB, Audit } from '../../store/db';
import { Search, Eye, RefreshCw, Trash2, X, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAudits() {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<Audit[]>(() =>
    [...AuditDB.getAll()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const refresh = () => setAudits([...AuditDB.getAll()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

  const filtered = useMemo(() => {
    if (!search.trim()) return audits;
    return AuditDB.searchByReference(search.trim())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [audits, search]);

  const handleDelete = (id: string) => {
    AuditDB.delete(id);
    refresh();
    setDeleteConfirm(null);
    toast.success('Audit deleted');
  };

  return (
    <Layout>
      <PageHeader
        title="All Audits"
        subtitle={`${audits.length} total audits in the system`}
      />

      {/* Search */}
      <div className="relative max-w-sm mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by reference number..."
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <EmptyState icon={<FileText size={24} />} title="No audits found" description={search ? "Try a different reference number" : "No audits have been conducted yet"} />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(audit => {
            const agent = UserDB.getById(audit.agentId);
            const qc = UserDB.getById(audit.qcId);
            const isExpanded = expandedId === audit.id;
            return (
              <div key={audit.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-blue-600">{audit.referenceNumber}</span>
                      <Badge label={audit.templateType} color={audit.templateType === 'CALL' ? 'blue' : 'purple'} />
                      {audit.isReAudit && <Badge label="Re-Audit" color="orange" />}
                    </div>
                    <p className="text-sm text-gray-600">{audit.templateName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">Agent: <strong className="text-gray-600">{agent?.fullName}</strong></span>
                      <span className="text-xs text-gray-400">QC: <strong className="text-gray-600">{qc?.fullName}</strong></span>
                      <span className="text-xs text-gray-400">{new Date(audit.conversationDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <ScoreBadge score={audit.percentageScore} />
                    <p className="text-xs text-gray-400 mt-1">{audit.totalScore}/{audit.maxPossibleScore} pts</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setExpandedId(isExpanded ? null : audit.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View details">
                      {isExpanded ? <ChevronUp size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => navigate(`/qc/re-audit/${audit.id}`)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Re-audit">
                      <RefreshCw size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirm(audit.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded Score Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Score Details</h4>
                        <div className="space-y-2">
                          {audit.scores.map(score => (
                            <div key={score.parameterId} className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">{score.parameterName}</span>
                              <div className="flex items-center gap-2">
                                {score.scoringType === '1-10' ? (
                                  <span className="text-xs font-medium text-gray-800">{score.givenScore}/10</span>
                                ) : (
                                  <span className={`text-xs font-medium
                                    ${score.givenScore === 'YES' ? 'text-green-600' :
                                      score.givenScore === 'NO' ? 'text-red-600' : 'text-gray-400'}`}>
                                    {score.givenScore as string}
                                  </span>
                                )}
                                <span className="text-xs text-gray-400">({score.weightage}%)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Feedback</h4>
                        <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                          {audit.feedback || 'No feedback provided'}
                        </p>
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-gray-400">Audited: {new Date(audit.createdAt).toLocaleString()}</p>
                          {audit.duration && <p className="text-xs text-gray-400">Duration: {audit.duration}</p>}
                        </div>
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
