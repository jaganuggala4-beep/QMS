/**
 * QC - Search by Reference Number
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout, PageHeader, Badge, ScoreBadge } from '../../components/Layout';
import { useAuth } from '../../store/auth';
import { AuditDB, UserDB, AllocationDB } from '../../store/db';
import { Search, RefreshCw, Eye, X } from 'lucide-react';

export default function QCSearch() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReturnType<typeof AuditDB.searchByReference>>([]);
  const [searched, setSearched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allocatedAgentIds = AllocationDB.getAgentsForQC(currentUser!.id);

  const handleSearch = () => {
    if (!query.trim()) return;
    // QC can only search their own audits OR audits of allocated agents
    const all = AuditDB.searchByReference(query.trim());
    const filtered = all.filter(a => a.qcId === currentUser!.id || allocatedAgentIds.includes(a.agentId));
    setResults(filtered);
    setSearched(true);
  };

  return (
    <Layout>
      <PageHeader title="Search Audits" subtitle="Search audits by reference number" />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Enter reference number..."
              className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); setSearched(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
          <button onClick={handleSearch}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Search size={16} /> Search
          </button>
        </div>
      </div>

      {searched && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {results.length === 0 ? 'No audits found' : `Found ${results.length} audit(s)`} for "{query}"
          </p>
          <div className="space-y-3">
            {results.map(audit => {
              const agent = UserDB.getById(audit.agentId);
              const isExpanded = expandedId === audit.id;
              const canReAudit = allocatedAgentIds.includes(audit.agentId);
              return (
                <div key={audit.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-indigo-600">{audit.referenceNumber}</span>
                        <Badge label={audit.templateType} color={audit.templateType === 'CALL' ? 'blue' : 'purple'} />
                        {audit.isReAudit && <Badge label="Re-Audit" color="orange" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{audit.templateName}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>Agent: <strong className="text-gray-600">{agent?.fullName}</strong></span>
                        <span>Date: {new Date(audit.conversationDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ScoreBadge score={audit.percentageScore} />
                      <button onClick={() => setExpandedId(isExpanded ? null : audit.id)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                      {canReAudit && (
                        <button onClick={() => navigate(`/qc/re-audit/${audit.id}`)}
                          className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
                          <RefreshCw size={13} /> Re-Audit
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Scores</h4>
                          {audit.scores.map(s => (
                            <div key={s.parameterId} className="flex justify-between py-1">
                              <span className="text-xs text-gray-600">{s.parameterName}</span>
                              <span className={`text-xs font-semibold ${s.givenScore === 'YES' ? 'text-green-600' : s.givenScore === 'NO' ? 'text-red-600' : ''}`}>
                                {s.scoringType === '1-10' ? `${s.givenScore}/10` : s.givenScore as string}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Feedback</h4>
                          <p className="text-xs text-gray-600 bg-gray-50 rounded p-2">{audit.feedback || 'No feedback'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Layout>
  );
}
