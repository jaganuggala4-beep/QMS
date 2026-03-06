/**
 * Agent - My Disputes View
 */

import React, { useState } from 'react';
import { Layout, PageHeader, Badge, EmptyState } from '../../components/Layout';
import { useAuth } from '../../store/auth';
import { DisputeDB, AuditDB, UserDB, Dispute } from '../../store/db';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AgentDisputes() {
  const { currentUser } = useAuth();
  const [disputes] = useState<Dispute[]>(() =>
    [...DisputeDB.getByAgent(currentUser!.id)].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = filterStatus === 'all' ? disputes : disputes.filter(d => d.status === filterStatus);

  const pending = disputes.filter(d => d.status === 'PENDING').length;
  const resolved = disputes.filter(d => d.status === 'RESOLVED').length;
  const rejected = disputes.filter(d => d.status === 'REJECTED').length;

  return (
    <Layout>
      <PageHeader title="My Disputes" subtitle="Track the status of your raised disputes" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending', value: pending, color: 'bg-yellow-50 border-yellow-200 text-yellow-600', icon: <Clock size={18} /> },
          { label: 'Resolved', value: resolved, color: 'bg-green-50 border-green-200 text-green-600', icon: <CheckCircle size={18} /> },
          { label: 'Rejected', value: rejected, color: 'bg-red-50 border-red-200 text-red-600', icon: <XCircle size={18} /> },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 flex items-center gap-3 ${s.color}`}>
            {s.icon}
            <div><p className="text-xl font-bold">{s.value}</p><p className="text-xs opacity-70">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'PENDING', 'RESOLVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Disputes */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <EmptyState icon={<AlertCircle size={24} />}
            title={disputes.length === 0 ? "No disputes raised" : "No disputes in this category"}
            description={disputes.length === 0 ? "If you disagree with an audit score, you can raise a dispute from the Audits page" : ""}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(dispute => {
            const audit = AuditDB.getById(dispute.auditId);
            const qc = UserDB.getById(dispute.qcId);

            return (
              <div key={dispute.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl flex-shrink-0
                    ${dispute.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                      dispute.status === 'RESOLVED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {dispute.status === 'PENDING' ? <Clock size={18} /> :
                      dispute.status === 'RESOLVED' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge
                        label={dispute.status}
                        color={dispute.status === 'PENDING' ? 'yellow' : dispute.status === 'RESOLVED' ? 'green' : 'red'}
                      />
                      <span className="text-xs text-gray-400">{new Date(dispute.createdAt).toLocaleDateString()}</span>
                      {dispute.resolvedAt && (
                        <span className="text-xs text-gray-400">
                          Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {audit && (
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-blue-600 font-semibold">{audit.referenceNumber}</span>
                        <span className={`text-sm font-bold
                          ${audit.percentageScore >= 80 ? 'text-green-600' :
                            audit.percentageScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {audit.percentageScore}%
                        </span>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-2">
                      <p className="text-xs text-gray-500 mb-0.5">Your reason:</p>
                      <p className="text-sm text-gray-700">{dispute.reason}</p>
                    </div>

                    {dispute.resolution ? (
                      <div className={`rounded-lg p-3 border
                        ${dispute.status === 'RESOLVED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className="text-xs font-semibold mb-0.5
                          ${dispute.status === 'RESOLVED' ? 'text-green-600' : 'text-red-600'}">
                          QC Response ({qc?.fullName}):
                        </p>
                        <p className="text-sm text-gray-700">{dispute.resolution}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        ⏳ Awaiting response from {qc?.fullName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
