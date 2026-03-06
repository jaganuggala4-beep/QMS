/**
 * Admin - Agent Allocation System
 * Allocate agents to QC officers, view allocation matrix
 */

import React, { useState, useMemo } from 'react';
import { Layout, PageHeader, Badge, EmptyState } from '../../components/Layout';
import { UserDB, AllocationDB, User, AgentSubtype } from '../../store/db';
import { useAuth } from '../../store/auth';
import { GitBranch, Plus, Trash2, Users, UserCheck, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAllocations() {
  const { currentUser } = useAuth();
  const [allocations, setAllocations] = useState(() => AllocationDB.getAll());
  const [showModal, setShowModal] = useState(false);
  const [selectedQC, setSelectedQC] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');

  const qcs = useMemo(() => UserDB.getByRole('qc'), []);
  const agents = useMemo(() => UserDB.getByRole('agent'), []);

  const refresh = () => setAllocations(AllocationDB.getAll());

  // Get available agents (not yet allocated to selected QC)
  const availableAgents = useMemo(() => {
    if (!selectedQC) return agents;
    const allocatedIds = AllocationDB.getAgentsForQC(selectedQC);
    return agents.filter(a => !allocatedIds.includes(a.id));
  }, [selectedQC, agents, allocations]);

  const handleAllocate = () => {
    if (!selectedQC || !selectedAgent) {
      toast.error('Please select both QC and Agent');
      return;
    }
    if (AllocationDB.isAllocated(selectedQC, selectedAgent)) {
      toast.error('Agent is already allocated to this QC');
      return;
    }
    AllocationDB.allocate(selectedQC, selectedAgent, currentUser!.id);
    refresh();
    setShowModal(false);
    setSelectedQC('');
    setSelectedAgent('');
    const qc = UserDB.getById(selectedQC);
    const agent = UserDB.getById(selectedAgent);
    toast.success(`${agent?.fullName} allocated to ${qc?.fullName}`);
  };

  const handleDeallocate = (qcId: string, agentId: string) => {
    AllocationDB.deallocate(qcId, agentId);
    refresh();
    toast.success('Allocation removed');
  };

  // Build allocation matrix
  const matrix = useMemo(() => {
    return qcs.map(qc => {
      const agentIds = allocations.filter(a => a.qcId === qc.id).map(a => a.agentId);
      const allocatedAgents = agents.filter(a => agentIds.includes(a.id));
      return { qc, agents: allocatedAgents };
    });
  }, [qcs, agents, allocations]);

  const subtypeColors: Record<string, string> = {
    COLLECTION: 'bg-blue-100 text-blue-700',
    REVERIFICATION: 'bg-purple-100 text-purple-700',
    CUSTOMER_CARE: 'bg-orange-100 text-orange-700',
    MAILS: 'bg-red-100 text-red-700',
  };

  return (
    <Layout>
      <PageHeader
        title="Agent Allocations"
        subtitle="Assign agents to QC officers for audit management"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
              <button onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'matrix' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                Matrix
              </button>
              <button onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                List
              </button>
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Allocate Agent
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><GitBranch size={18} /></div>
          <div><p className="text-xl font-bold text-gray-800">{allocations.length}</p><p className="text-xs text-gray-500">Total Allocations</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><UserCheck size={18} /></div>
          <div><p className="text-xl font-bold text-gray-800">{qcs.length}</p><p className="text-xs text-gray-500">QC Officers</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Users size={18} /></div>
          <div>
            <p className="text-xl font-bold text-gray-800">
              {new Set(allocations.map(a => a.agentId)).size}
            </p>
            <p className="text-xs text-gray-500">Allocated Agents</p>
          </div>
        </div>
      </div>

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          {matrix.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12">
              <EmptyState icon={<GitBranch size={24} />} title="No allocations yet" description="Allocate agents to QC officers to get started" />
            </div>
          ) : (
            matrix.map(row => (
              <div key={row.qc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                    {row.qc.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{row.qc.fullName}</h3>
                    <p className="text-xs text-gray-400">@{row.qc.username} • {row.agents.length} agent(s) allocated</p>
                  </div>
                  <Badge label="QC Officer" color="indigo" />
                </div>

                {row.agents.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm">No agents allocated</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {row.agents.map(agent => (
                      <div key={agent.id}
                        className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100 group">
                        <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {agent.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{agent.fullName}</p>
                          <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full mt-0.5 ${subtypeColors[agent.subtype || ''] || 'bg-gray-100 text-gray-600'}`}>
                            {agent.subtype?.replace('_', ' ')}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeallocate(row.qc.id, agent.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 rounded-md transition-all flex-shrink-0"
                          title="Remove allocation"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Agent</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Team</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Assigned QC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Allocated On</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 ? (
                <tr><td colSpan={5}><EmptyState icon={<GitBranch size={24} />} title="No allocations" /></td></tr>
              ) : (
                allocations.map(alloc => {
                  const agent = UserDB.getById(alloc.agentId);
                  const qc = UserDB.getById(alloc.qcId);
                  return (
                    <tr key={alloc.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                            {agent?.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{agent?.fullName}</p>
                            <p className="text-xs text-gray-400">@{agent?.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {agent?.subtype && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${subtypeColors[agent.subtype] || 'bg-gray-100 text-gray-600'}`}>
                            {agent.subtype.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">
                            {qc?.fullName.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-700">{qc?.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(alloc.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeallocate(alloc.qcId, alloc.agentId)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Allocate Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-gray-800">Allocate Agent to QC</h3>
                <p className="text-xs text-gray-500">Assign an agent to a QC officer</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select QC Officer *</label>
                <select value={selectedQC} onChange={e => { setSelectedQC(e.target.value); setSelectedAgent(''); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">-- Choose QC Officer --</option>
                  {qcs.map(qc => <option key={qc.id} value={qc.id}>{qc.fullName} (@{qc.username})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Agent *</label>
                <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">-- Choose Agent --</option>
                  {availableAgents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} ({a.subtype?.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                {selectedQC && availableAgents.length === 0 && (
                  <p className="text-orange-500 text-xs mt-1">All agents are already allocated to this QC</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleAllocate}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-2">
                <GitBranch size={16} /> Allocate
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
