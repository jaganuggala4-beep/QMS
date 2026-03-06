/**
 * Admin - User Management
 * Add QC, Add Agent (with subtype), Delete users
 */

import React, { useState, useMemo } from 'react';
import { Layout, PageHeader, Badge, EmptyState } from '../../components/Layout';
import { UserDB, User, UserRole, AgentSubtype } from '../../store/db';
import { useAuth } from '../../store/auth';
import {
  Plus, Trash2, Users, Shield, UserCheck, Phone,
  Eye, EyeOff, Search, X, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const roleColors: Record<string, 'blue' | 'indigo' | 'green'> = {
  admin: 'blue',
  qc: 'indigo',
  agent: 'green',
};

const subtypeColors: Record<string, 'blue' | 'purple' | 'orange' | 'red'> = {
  COLLECTION: 'blue',
  REVERIFICATION: 'purple',
  CUSTOMER_CARE: 'orange',
  MAILS: 'red',
};

interface AddUserForm {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: UserRole;
  subtype: AgentSubtype | '';
}

const defaultForm: AddUserForm = {
  username: '',
  password: '',
  fullName: '',
  email: '',
  role: 'agent',
  subtype: 'COLLECTION',
};

export default function AdminUsers() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(() => UserDB.getAll());
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<AddUserForm>(defaultForm);
  const [showPassword, setShowPassword] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<AddUserForm>>({});

  const refresh = () => setUsers(UserDB.getAll());

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = search === '' ||
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === 'all' || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  const validate = (): boolean => {
    const errs: Partial<AddUserForm> = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    else if (UserDB.getByUsername(form.username.trim())) errs.username = 'Username already exists';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.includes('@')) errs.email = 'Valid email is required';
    if (form.role === 'agent' && !form.subtype) errs.subtype = 'Agent subtype is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    UserDB.create({
      username: form.username.trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      role: form.role,
      subtype: form.role === 'agent' ? (form.subtype as AgentSubtype) : undefined,
      isActive: true,
    });
    refresh();
    setShowAddModal(false);
    setForm(defaultForm);
    setErrors({});
    toast.success(`${form.role === 'qc' ? 'QC Officer' : form.role === 'agent' ? 'Agent' : 'User'} "${form.username}" created successfully`);
  };

  const handleDelete = (id: string) => {
    const user = UserDB.getById(id);
    if (user?.role === 'admin') { toast.error("Cannot delete admin"); return; }
    UserDB.delete(id);
    refresh();
    setDeleteConfirm(null);
    toast.success('User deleted successfully');
  };

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      qcs: users.filter(u => u.role === 'qc').length,
      agents: users.filter(u => u.role === 'agent').length,
    };
  }, [users]);

  return (
    <Layout>
      <PageHeader
        title="User Management"
        subtitle="Manage administrators, QC officers, and agents"
        action={
          <button onClick={() => { setShowAddModal(true); setForm(defaultForm); setErrors({}); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Plus size={16} /> Add User
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: stats.total, icon: <Users size={18} />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Admins', value: stats.admins, icon: <Shield size={18} />, color: 'bg-red-50 text-red-600' },
          { label: 'QC Officers', value: stats.qcs, icon: <UserCheck size={18} />, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Agents', value: stats.agents, icon: <Phone size={18} />, color: 'bg-green-50 text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
            <div className={`p-2 rounded-lg ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="qc">QC Officer</option>
          <option value="agent">Agent</option>
        </select>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Username</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Team</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6}><EmptyState icon={<Users size={24} />} title="No users found" /></td></tr>
            ) : (
              filtered.map(user => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{user.fullName}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{user.username}</td>
                  <td className="px-4 py-3">
                    <Badge label={user.role.toUpperCase()} color={roleColors[user.role] || 'gray'} />
                  </td>
                  <td className="px-4 py-3">
                    {user.subtype ? (
                      <Badge label={user.subtype.replace('_', ' ')} color={subtypeColors[user.subtype] || 'gray'} />
                    ) : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    {user.id === currentUser?.id && (
                      <span className="text-xs text-gray-400 ml-2">(You)</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-gray-800">Add New User</h3>
                <p className="text-xs text-gray-500">Create a QC officer or agent account</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['qc', 'agent'] as UserRole[]).map(r => (
                    <button key={r} onClick={() => setForm(f => ({ ...f, role: r, subtype: r === 'agent' ? 'COLLECTION' : '' }))}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all
                        ${form.role === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {r === 'qc' ? 'QC Officer' : 'Agent'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtype for agents */}
              {form.role === 'agent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Agent Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['COLLECTION', 'REVERIFICATION', 'CUSTOMER_CARE', 'MAILS'] as AgentSubtype[]).map(sub => (
                      <button key={sub} onClick={() => setForm(f => ({ ...f, subtype: sub }))}
                        className={`p-2.5 rounded-lg border-2 text-xs font-medium transition-all
                          ${form.subtype === sub ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {sub.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  {errors.subtype && <p className="text-red-500 text-xs mt-1">{errors.subtype}</p>}
                </div>
              )}

              {[
                { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
                { key: 'username', label: 'Username', type: 'text', placeholder: 'johndoe' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'john@company.com' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label} *</label>
                  <input
                    type={field.type}
                    value={form[field.key as keyof AddUserForm] as string}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30
                      ${errors[field.key as keyof AddUserForm] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  />
                  {errors[field.key as keyof AddUserForm] && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors[field.key as keyof AddUserForm]}
                    </p>
                  )}
                </div>
              ))}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 6 characters"
                    className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30
                      ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} /> {errors.password}</p>}
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleAdd}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Plus size={16} /> Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="font-bold text-gray-800 text-center mb-2">Delete User?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              This will permanently delete "{UserDB.getById(deleteConfirm)?.fullName}".
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
