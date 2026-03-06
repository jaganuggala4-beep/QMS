import { createClient } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'qc' | 'agent';
export type AgentSubtype = 'COLLECTION' | 'REVERIFICATION' | 'CUSTOMER_CARE' | 'MAILS';
export type ScoringType = '1-10' | 'YES_NO_NA';
export type DisputeStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';
export type TemplateType = 'CALL' | 'MAIL';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  subtype?: AgentSubtype;
  fullName: string;
  email: string;
  createdAt: string;
  isActive: boolean;
}
export interface TemplateParameter { id: string; name: string; scoringType: ScoringType; weightage: number; }
export interface Template { id: string; name: string; type: TemplateType; parameters: TemplateParameter[]; createdAt: string; createdBy: string; isActive: boolean; }
export interface Allocation { id: string; qcId: string; agentId: string; createdAt: string; assignedBy: string; }
export interface AuditScore { parameterId: string; parameterName: string; scoringType: ScoringType; weightage: number; givenScore: number | string; calculatedScore: number; }
export interface Audit { id: string; agentId: string; qcId: string; templateId: string; templateName: string; templateType: TemplateType; referenceNumber: string; callRecording?: string; duration?: string; conversationDate: string; scores: AuditScore[]; totalScore: number; maxPossibleScore: number; percentageScore: number; feedback: string; createdAt: string; updatedAt: string; isReAudit: boolean; originalAuditId?: string; }
export interface Dispute { id: string; auditId: string; agentId: string; qcId: string; reason: string; status: DisputeStatus; resolution?: string; createdAt: string; resolvedAt?: string; resolvedBy?: string; }

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

const cache = {
  users: [] as User[],
  templates: [] as Template[],
  allocations: [] as Allocation[],
  audits: [] as Audit[],
  disputes: [] as Dispute[],
};

const TABLES = {
  users: 'users',
  templates: 'audit_templates',
  allocations: 'agent_allocations',
  audits: 'audits',
  disputes: 'disputes',
};

function generateId(): string { return crypto.randomUUID(); }
function hashPassword(password: string): string { return btoa(password + '_qms_salt'); }
function verifyPassword(password: string, hash: string): boolean { return btoa(password + '_qms_salt') === hash; }

function toSnake<T extends Record<string, any>>(obj: T) {
  const out: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    const key = k.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
    out[key] = v;
  });
  return out;
}

function toCamel<T extends Record<string, any>>(obj: T) {
  const out: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    const key = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = v;
  });
  return out;
}

let initialized = false;
export async function initializeDatabase(): Promise<void> {
  if (initialized) return;
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Supabase env vars are missing.');
    initialized = true;
    return;
  }

  const [u, t, al, au, d] = await Promise.all([
    supabase.from(TABLES.users).select('*'),
    supabase.from(TABLES.templates).select('*'),
    supabase.from(TABLES.allocations).select('*'),
    supabase.from(TABLES.audits).select('*'),
    supabase.from(TABLES.disputes).select('*'),
  ]);

  cache.users = (u.data || []).map(r => toCamel(r) as User);
  cache.templates = (t.data || []).map(r => ({ ...toCamel(r), parameters: r.parameters || [] }) as Template);
  cache.allocations = (al.data || []).map(r => toCamel(r) as Allocation);
  cache.audits = (au.data || []).map(r => ({ ...toCamel(r), scores: r.scores || [] }) as Audit);
  cache.disputes = (d.data || []).map(r => toCamel(r) as Dispute);

  const adminEmail = 'ADMIN@QMS.COM';
  if (!cache.users.some(x => x.email.toUpperCase() === adminEmail)) {
    const adminUser: User = {
      id: 'admin_001', username: adminEmail, password: hashPassword('ADMIN@123'), role: 'admin',
      fullName: 'System Administrator', email: adminEmail, createdAt: new Date().toISOString(), isActive: true,
    };
    cache.users.push(adminUser);
    await supabase.from(TABLES.users).insert(toSnake(adminUser));
  }

  initialized = true;
}

function persist(table: string, row: any, op: 'insert' | 'update' | 'delete' = 'insert') {
  if (!import.meta.env.VITE_SUPABASE_URL) return;
  const query = supabase.from(table);
  if (op === 'insert') query.insert(toSnake(row));
  if (op === 'update') query.update(toSnake(row)).eq('id', row.id);
  if (op === 'delete') query.delete().eq('id', row.id);
}

export const UserDB = {
  getAll: (): User[] => cache.users,
  getById: (id: string) => cache.users.find(u => u.id === id),
  getByUsername: (username: string) => cache.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()),
  authenticate: (username: string, password: string): User | null => {
    const user = UserDB.getByUsername(username);
    if (!user || !user.isActive) return null;
    return verifyPassword(password, user.password) ? user : null;
  },
  create: (data: Omit<User, 'id' | 'createdAt' | 'password'> & { password: string }): User => {
    const newUser: User = { ...data, id: generateId(), password: hashPassword(data.password), createdAt: new Date().toISOString() };
    cache.users.push(newUser); persist(TABLES.users, newUser); return newUser;
  },
  delete: (id: string): void => { cache.users = cache.users.filter(u => u.id !== id && u.role !== 'admin'); persist(TABLES.users, { id }, 'delete'); },
  update: (id: string, data: Partial<User>): void => { cache.users = cache.users.map(u => u.id === id ? { ...u, ...data } : u); const user = cache.users.find(x => x.id === id); if (user) persist(TABLES.users, user, 'update'); },
  getByRole: (role: UserRole): User[] => cache.users.filter(u => u.role === role),
  getAgentsBySubtype: (subtype: AgentSubtype): User[] => cache.users.filter(u => u.role === 'agent' && u.subtype === subtype),
};

export const TemplateDB = {
  getAll: (): Template[] => cache.templates,
  getById: (id: string) => cache.templates.find(t => t.id === id),
  create: (data: Omit<Template, 'id' | 'createdAt'>): Template => { const n = { ...data, id: generateId(), createdAt: new Date().toISOString() }; cache.templates.push(n); persist(TABLES.templates, n); return n; },
  update: (id: string, data: Partial<Template>): void => { cache.templates = cache.templates.map(t => t.id === id ? { ...t, ...data } : t); const t = cache.templates.find(x => x.id === id); if (t) persist(TABLES.templates, t, 'update'); },
  delete: (id: string): void => { cache.templates = cache.templates.filter(t => t.id !== id); persist(TABLES.templates, { id }, 'delete'); },
};

export const AllocationDB = {
  getAll: (): Allocation[] => cache.allocations,
  allocate: (qcId: string, agentId: string, assignedBy: string): Allocation => {
    const existing = cache.allocations.find(a => a.qcId === qcId && a.agentId === agentId); if (existing) return existing;
    const n: Allocation = { id: generateId(), qcId, agentId, createdAt: new Date().toISOString(), assignedBy }; cache.allocations.push(n); persist(TABLES.allocations, n); return n;
  },
  deallocate: (qcId: string, agentId: string): void => { const x = cache.allocations.find(a => a.qcId === qcId && a.agentId === agentId); cache.allocations = cache.allocations.filter(a => !(a.qcId === qcId && a.agentId === agentId)); if (x) persist(TABLES.allocations, x, 'delete'); },
  getAgentsForQC: (qcId: string): string[] => cache.allocations.filter(a => a.qcId === qcId).map(a => a.agentId),
  getQCForAgent: (agentId: string): string[] => cache.allocations.filter(a => a.agentId === agentId).map(a => a.qcId),
  isAllocated: (qcId: string, agentId: string): boolean => cache.allocations.some(a => a.qcId === qcId && a.agentId === agentId),
};

export function calculateAuditScore(parameters: TemplateParameter[], scores: { parameterId: string; givenScore: number | string }[]) {
  let totalWeightageUsed = 0; let totalScore = 0;
  const auditScores: AuditScore[] = parameters.map(param => {
    const given = scores.find(s => s.parameterId === param.id)?.givenScore; let calculated = 0; let includeInTotal = true;
    if (param.scoringType === '1-10') { const n = Number(given) || 0; calculated = (n / 10) * param.weightage; totalWeightageUsed += param.weightage; }
    else if (given === 'YES') { calculated = param.weightage; totalWeightageUsed += param.weightage; }
    else if (given === 'NO') { totalWeightageUsed += param.weightage; }
    else { includeInTotal = false; }
    if (includeInTotal) totalScore += calculated;
    return { parameterId: param.id, parameterName: param.name, scoringType: param.scoringType, weightage: param.weightage, givenScore: given ?? (param.scoringType === '1-10' ? 0 : 'NA'), calculatedScore: Number(calculated.toFixed(2)) };
  });
  const percentageScore = totalWeightageUsed > 0 ? (totalScore / totalWeightageUsed) * 100 : 0;
  return { scores: auditScores, totalScore: Number(totalScore.toFixed(2)), maxPossibleScore: totalWeightageUsed, percentageScore: Number(percentageScore.toFixed(2)) };
}

export const AuditDB = {
  getAll: (): Audit[] => cache.audits,
  getById: (id: string) => cache.audits.find(a => a.id === id),
  getByAgent: (agentId: string): Audit[] => cache.audits.filter(a => a.agentId === agentId),
  getByQC: (qcId: string): Audit[] => cache.audits.filter(a => a.qcId === qcId),
  searchByReference: (refNum: string): Audit[] => cache.audits.filter(a => a.referenceNumber.toLowerCase().includes(refNum.toLowerCase())),
  create: (data: Omit<Audit, 'id' | 'createdAt' | 'updatedAt'>): Audit => { const n: Audit = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; cache.audits.push(n); persist(TABLES.audits, n); return n; },
  update: (id: string, data: Partial<Audit>): void => { cache.audits = cache.audits.map(a => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a); const a = cache.audits.find(x => x.id === id); if (a) persist(TABLES.audits, a, 'update'); },
  delete: (id: string): void => { cache.audits = cache.audits.filter(a => a.id !== id); persist(TABLES.audits, { id }, 'delete'); },
  getFiltered: (filters: { fromDate?: string; toDate?: string; agentId?: string; qcId?: string; subtype?: AgentSubtype; }): Audit[] => {
    let audits = cache.audits;
    if (filters.fromDate) audits = audits.filter(a => new Date(a.conversationDate) >= new Date(filters.fromDate!));
    if (filters.toDate) audits = audits.filter(a => new Date(a.conversationDate) <= new Date(filters.toDate!));
    if (filters.agentId) audits = audits.filter(a => a.agentId === filters.agentId);
    if (filters.qcId) audits = audits.filter(a => a.qcId === filters.qcId);
    if (filters.subtype) { const agents = UserDB.getAgentsBySubtype(filters.subtype).map(u => u.id); audits = audits.filter(a => agents.includes(a.agentId)); }
    return audits;
  },
};

export const DisputeDB = {
  getAll: (): Dispute[] => cache.disputes,
  getById: (id: string) => cache.disputes.find(d => d.id === id),
  getByAudit: (auditId: string): Dispute[] => cache.disputes.filter(d => d.auditId === auditId),
  getByAgent: (agentId: string): Dispute[] => cache.disputes.filter(d => d.agentId === agentId),
  getByQC: (qcId: string): Dispute[] => cache.disputes.filter(d => d.qcId === qcId),
  getPending: (): Dispute[] => cache.disputes.filter(d => d.status === 'PENDING'),
  create: (data: Omit<Dispute, 'id' | 'createdAt' | 'status'>): Dispute => { const n = { ...data, id: generateId(), status: 'PENDING' as const, createdAt: new Date().toISOString() }; cache.disputes.push(n); persist(TABLES.disputes, n); return n; },
  resolve: (id: string, resolution: string, resolvedBy: string, status: 'RESOLVED' | 'REJECTED'): void => { cache.disputes = cache.disputes.map(d => d.id === id ? { ...d, status, resolution, resolvedAt: new Date().toISOString(), resolvedBy } : d); const d = cache.disputes.find(x => x.id === id); if (d) persist(TABLES.disputes, d, 'update'); },
};

export interface ParetoItem { name: string; failCount: number; percentage: number; cumulativePercentage: number; }
export function calculateParameterPareto(audits: Audit[]): ParetoItem[] { const failMap: Record<string, number> = {}; audits.forEach(a => a.scores.forEach(s => { if ((s.scoringType === 'YES_NO_NA' && s.givenScore === 'NO') || (s.scoringType === '1-10' && Number(s.givenScore) < 5)) failMap[s.parameterName] = (failMap[s.parameterName] || 0) + 1; })); const total = Object.values(failMap).reduce((a, b) => a + b, 0); const sorted = Object.entries(failMap).sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, failCount: count, percentage: total > 0 ? (count / total) * 100 : 0 })); let cumulative = 0; return sorted.map(item => { cumulative += item.percentage; return { ...item, cumulativePercentage: parseFloat(cumulative.toFixed(2)), percentage: parseFloat(item.percentage.toFixed(2)) }; }); }

export function generateExcelReport(reportType: string, audits: Audit[], users: User[]): void {
  import('xlsx').then(XLSX => {
    const wb = XLSX.utils.book_new();
    const getUserName = (id: string) => users.find(u => u.id === id)?.fullName || id;
    const data = audits.map(a => ({ 'Audit ID': a.id, 'Reference Number': a.referenceNumber, Agent: getUserName(a.agentId), 'QC Officer': getUserName(a.qcId), Template: a.templateName, Type: a.templateType, 'Conversation Date': a.conversationDate, 'Total Score': a.totalScore, 'Max Score': a.maxPossibleScore, 'Percentage Score': `${a.percentageScore}%`, Feedback: a.feedback, 'Audit Date': new Date(a.createdAt).toLocaleDateString() }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Report');
    XLSX.writeFile(wb, `QMS_Report_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
  });
}
