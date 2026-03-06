/**
 * QC - Manage Disputes from Agents
 */

import React, { useState } from 'react';
import { Layout, PageHeader, Badge, EmptyState } from '../../components/Layout';
import { useAuth } from '../../store/auth';
import { DisputeDB, AuditDB, UserDB, Dispute } from '../../store/db';
import { AlertCircle, CheckCircle, XCircle, Clock, MessageSquare, X, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function QCDisputes() {
  const { currentUser } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>(() =>
    [...DisputeDB.getByQC(currentUser!.id)].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [resolveModal, setResolveModal] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolveAction, setResolveAction] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = () => setDisputes([...DisputeDB.getByQC(currentUser!.id)]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

  const filtered = filterStatus === 'all' ? disputes : disputes.filter(d => d.status === filterStatus);

  const handleResolve = () => {
    if (!resolution.trim()) { toast.error('Please add a resolution comment'); return; }
    DisputeDB.resolve(resolveModal!.id, resolution, currentUser!.id, resolveAction);
    refresh();
    setResolveModal(null);
    setResolution('');
    toast.success(`Dispute ${resolveAction.toLowerCase()}`);
  };

  const pending = disputes.filter(d => d.status === 'PENDING').length;

  return (
    <Layout>
      <PageHeader
        title="Agent Disputes"
        subtitle="Review and resolve disputes raised by agents"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending', value: pending, color: 'bg-yellow-50 border-yellow-200 text-yellow-600', icon: <Clock size={18} /> },
          { label: 'Resolved', value: disputes.filter(d => d.status === 'RESOLVED').length, color: 'bg-green-50 border-green-200 text-green-600', icon: <CheckCircle size={18} /> },
          { label: 'Rejected', value: disputes.filter(d => d.status === 'REJECTED').length, color: 'bg-red-50 border-red-200 text-red-600', icon: <XCircle size={18} /> },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 flex items-center gap-3 ${s.color}`}>
            {s.icon}
            <div><p className="text-xl font-bold">{s.value}</p><p className="text-xs opacity-70">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'PENDING', 'RESOLVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            {s === 'PENDING' && pending > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">{pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Disputes */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <EmptyState icon={<AlertCircle size={24} />} title="No disputes" description="No disputes in this category" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(dispute => {
            const agent = UserDB.getById(dispute.agentId);
            const audit = AuditDB.getById(dispute.auditId);
            const isExpanded = expandedId === dispute.id;

            return (
              <div key={dispute.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5
                    ${dispute.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                      dispute.status === 'RESOLVED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {dispute.status === 'PENDING' ? <Clock size={16} /> : dispute.status === 'RESOLVED' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800 text-sm">
                        {agent?.fullName}
                      </span>
                      <Badge
                        label={dispute.status}
                        color={dispute.status === 'PENDING' ? 'yellow' : dispute.status === 'RESOLVED' ? 'green' : 'red'}
                      />
                      <span className="text-xs text-gray-400">{new Date(dispute.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{dispute.reason}</p>
                    {audit && (
                      <p className="text-xs text-gray-400">
                        Ref: <span className="text-indigo-500 font-medium">{audit.referenceNumber}</span>
                        {' '}• Score: <strong>{audit.percentageScore}%</strong>
                      </p>
                    )}
                    {dispute.resolution && (
                      <div className="mt-2 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                        <p className="text-xs text-gray-500">Resolution:</p>
                        <p className="text-xs text-gray-700 mt-0.5">{dispute.resolution}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {audit && (
                      <button onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Eye size={15} />
                      </button>
                    )}
                    {dispute.status === 'PENDING' && (
                      <button onClick={() => { setResolveModal(dispute); setResolution(''); setResolveAction('RESOLVED'); }}
                        className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
                        <MessageSquare size={13} /> Resolve
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && audit && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                      <div><span className="text-gray-400">Template:</span> <strong>{audit.templateName}</strong></div>
                      <div><span className="text-gray-400">Score:</span> <strong className={audit.percentageScore >= 80 ? 'text-green-600' : audit.percentageScore >= 60 ? 'text-yellow-600' : 'text-red-600'}>{audit.percentageScore}%</strong></div>
                      <div><span className="text-gray-400">Date:</span> <strong>{new Date(audit.conversationDate).toLocaleDateString()}</strong></div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Feedback given:</p>
                      <p className="text-xs text-gray-600 bg-white rounded p-2 border border-gray-200">
                        {audit.feedback || 'No feedback'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-800">Resolve Dispute</h3>
              <button onClick={() => setResolveModal(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">From: {UserDB.getById(resolveModal.agentId)?.fullName}</p>
                <p className="text-sm text-gray-700">{resolveModal.reason}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setResolveAction('RESOLVED')}
                    className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all
                      ${resolveAction === 'RESOLVED' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                    ✓ Accept Dispute
                  </button>
                  <button onClick={() => setResolveAction('REJECTED')}
                    className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all
                      ${resolveAction === 'REJECTED' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'}`}>
                    ✗ Reject Dispute
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Resolution Comment *</label>
                <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={3}
                  placeholder="Explain your decision..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setResolveModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm">Cancel</button>
              <button onClick={handleResolve}
                className={`flex-1 text-white py-2.5 rounded-lg text-sm font-medium ${resolveAction === 'RESOLVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
