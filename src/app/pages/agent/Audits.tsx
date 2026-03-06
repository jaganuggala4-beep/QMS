/**
 * Agent - My Audits View
 * Can view audits, listen to recordings, raise disputes
 * CANNOT modify or delete
 */

import React, { useState, useMemo } from 'react';
import { Layout, PageHeader, Badge, ScoreBadge, EmptyState } from '../../components/Layout';
import { useAuth } from '../../store/auth';
import { AuditDB, DisputeDB, UserDB, Audit } from '../../store/db';
import {
  FileText, Eye, ChevronDown, ChevronUp, Play,
  AlertCircle, CheckCircle, Search, X, Filter
} from 'lucide-react';
import { toast } from 'sonner';

export default function AgentAudits() {
  const { currentUser } = useAuth();
  const [audits] = useState<Audit[]>(() =>
    [...AuditDB.getByAgent(currentUser!.id)].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [disputeModal, setDisputeModal] = useState<Audit | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [search, setSearch] = useState('');
  const [filterScore, setFilterScore] = useState('all');

  const disputes = useMemo(() => DisputeDB.getByAgent(currentUser!.id), [currentUser]);
  const hasDispute = (auditId: string) => disputes.some(d => d.auditId === auditId);
  const getDispute = (auditId: string) => disputes.find(d => d.auditId === auditId);

  const filtered = useMemo(() => {
    let list = audits;
    if (search.trim()) {
      list = list.filter(a => a.referenceNumber.toLowerCase().includes(search.toLowerCase()));
    }
    if (filterScore === 'good') list = list.filter(a => a.percentageScore >= 80);
    if (filterScore === 'average') list = list.filter(a => a.percentageScore >= 60 && a.percentageScore < 80);
    if (filterScore === 'poor') list = list.filter(a => a.percentageScore < 60);
    return list;
  }, [audits, search, filterScore]);

  const handleRaiseDispute = () => {
    if (!disputeReason.trim()) { toast.error('Please describe the dispute reason'); return; }
    if (!disputeModal) return;

    const qcId = disputeModal.qcId;
    DisputeDB.create({
      auditId: disputeModal.id,
      agentId: currentUser!.id,
      qcId,
      reason: disputeReason.trim(),
    });
    setDisputeModal(null);
    setDisputeReason('');
    toast.success('Dispute raised successfully! Your QC will review it.');
  };

  const avgScore = audits.length > 0 ? audits.reduce((s, a) => s + a.percentageScore, 0) / audits.length : 0;

  return (
    <Layout>
      <PageHeader
        title="My Audits"
        subtitle={`${audits.length} audits • Avg: ${avgScore.toFixed(1)}%`}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by reference number..."
            className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select value={filterScore} onChange={e => setFilterScore(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
            <option value="all">All Scores</option>
            <option value="good">Good (≥80%)</option>
            <option value="average">Average (60-80%)</option>
            <option value="poor">Poor (&lt;60%)</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <EmptyState icon={<FileText size={24} />} title="No audits found" description={search ? "Try a different reference number" : "Your audits will appear here"} />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(audit => {
            const qc = UserDB.getById(audit.qcId);
            const isExpanded = expandedId === audit.id;
            const dispute = getDispute(audit.id);
            return (
              <div key={audit.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-sm font-semibold text-blue-600">{audit.referenceNumber}</span>
                      <Badge label={audit.templateType} color={audit.templateType === 'CALL' ? 'blue' : 'purple'} />
                      {audit.isReAudit && <Badge label="Re-Audit" color="orange" />}
                      {dispute && (
                        <Badge
                          label={`Dispute: ${dispute.status}`}
                          color={dispute.status === 'PENDING' ? 'yellow' : dispute.status === 'RESOLVED' ? 'green' : 'red'}
                        />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{audit.templateName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">QC: <strong className="text-gray-600">{qc?.fullName}</strong></span>
                      <span className="text-xs text-gray-400">{new Date(audit.conversationDate).toLocaleDateString()}</span>
                      {audit.duration && <span className="text-xs text-gray-400">⏱ {audit.duration}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                      <ScoreBadge score={audit.percentageScore} />
                      <p className="text-xs text-gray-400 mt-1">{audit.totalScore}/{audit.maxPossibleScore} pts</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => setExpandedId(isExpanded ? null : audit.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        {isExpanded ? <ChevronUp size={16} /> : <Eye size={16} />}
                      </button>
                      {!hasDispute(audit.id) && (
                        <button onClick={() => { setDisputeModal(audit); setDisputeReason(''); }}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Raise dispute">
                          <AlertCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Scores */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Parameter Scores</h4>
                        <div className="space-y-3">
                          {audit.scores.map(score => (
                            <div key={score.parameterId}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-600 flex-1">{score.parameterName}</span>
                                <span className="text-xs text-gray-400 ml-2">{score.weightage}% weight</span>
                              </div>
                              {score.scoringType === '1-10' ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all
                                        ${Number(score.givenScore) >= 7 ? 'bg-green-500' :
                                          Number(score.givenScore) >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                      style={{ width: `${Number(score.givenScore) * 10}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-bold text-gray-700 w-10 text-right">
                                    {score.givenScore}/10
                                  </span>
                                </div>
                              ) : (
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
                                  ${score.givenScore === 'YES' ? 'bg-green-100 text-green-700' :
                                    score.givenScore === 'NO' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {score.givenScore === 'YES' ? <CheckCircle size={11} /> : score.givenScore === 'NO' ? <X size={11} /> : null}
                                  {score.givenScore as string}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Feedback & Recording */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Feedback from QC</h4>
                          <div className="bg-white rounded-lg p-3 border border-gray-200 text-sm text-gray-600 leading-relaxed">
                            {audit.feedback || 'No feedback provided'}
                          </div>
                        </div>

                        {audit.callRecording && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Call Recording</h4>
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
                              <div className="p-1.5 bg-blue-100 rounded-full">
                                <Play size={14} className="text-blue-600" />
                              </div>
                              <span className="text-sm text-blue-700 truncate">{audit.callRecording}</span>
                            </div>
                          </div>
                        )}

                        {/* Dispute Status */}
                        {dispute && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Your Dispute</h4>
                            <div className={`rounded-lg p-3 border text-sm
                              ${dispute.status === 'PENDING' ? 'bg-yellow-50 border-yellow-200' :
                                dispute.status === 'RESOLVED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                {dispute.status === 'PENDING' ? <AlertCircle size={13} className="text-yellow-600" /> :
                                  dispute.status === 'RESOLVED' ? <CheckCircle size={13} className="text-green-600" /> :
                                    <X size={13} className="text-red-600" />}
                                <span className={`text-xs font-semibold
                                  ${dispute.status === 'PENDING' ? 'text-yellow-700' :
                                    dispute.status === 'RESOLVED' ? 'text-green-700' : 'text-red-700'}`}>
                                  {dispute.status}
                                </span>
                              </div>
                              {dispute.resolution && (
                                <p className="text-xs text-gray-600 mt-1">Resolution: {dispute.resolution}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {!hasDispute(audit.id) && (
                          <button
                            onClick={() => { setDisputeModal(audit); setDisputeReason(''); }}
                            className="w-full flex items-center justify-center gap-2 border border-orange-200 bg-orange-50 text-orange-600 py-2.5 rounded-lg text-sm hover:bg-orange-100 transition-colors"
                          >
                            <AlertCircle size={15} /> Raise Dispute
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dispute Modal */}
      {disputeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-gray-800">Raise Dispute</h3>
                <p className="text-xs text-gray-500">For audit: {disputeModal.referenceNumber}</p>
              </div>
              <button onClick={() => setDisputeModal(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5">
              <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Score Received:</span>
                  <span className={`font-bold ${disputeModal.percentageScore >= 80 ? 'text-green-600' : disputeModal.percentageScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {disputeModal.percentageScore}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason for Dispute *
                </label>
                <textarea
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  rows={4}
                  placeholder="Describe why you're disputing this audit score in detail..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{disputeReason.length}/500 characters</p>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setDisputeModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleRaiseDispute}
                className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg text-sm hover:bg-orange-700 flex items-center justify-center gap-2">
                <AlertCircle size={15} /> Raise Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
