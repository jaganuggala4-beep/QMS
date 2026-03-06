/**
 * Admin - Template Management
 * Create templates with unlimited parameters, scoring types, and weightage
 */

import React, { useState, useMemo } from 'react';
import { Layout, PageHeader, Badge, EmptyState } from '../../components/Layout';
import { TemplateDB, Template, TemplateParameter, ScoringType, TemplateType } from '../../store/db';
import { useAuth } from '../../store/auth';
import {
  Plus, Trash2, FileText, Edit3, X, AlertCircle,
  ChevronDown, ChevronUp, Settings, Save
} from 'lucide-react';
import { toast } from 'sonner';

interface ParamForm {
  id: string;
  name: string;
  scoringType: ScoringType;
  weightage: number;
}

const generateTempId = () => Math.random().toString(36).substr(2, 9);

export default function AdminTemplates() {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState<Template[]>(() => TemplateDB.getAll());
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<TemplateType>('CALL');
  const [params, setParams] = useState<ParamForm[]>([
    { id: generateTempId(), name: '', scoringType: '1-10', weightage: 0 }
  ]);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const refresh = () => setTemplates(TemplateDB.getAll());

  const totalWeightage = useMemo(() => params.reduce((s, p) => s + (Number(p.weightage) || 0), 0), [params]);

  const openCreate = () => {
    setEditTemplate(null);
    setName('');
    setType('CALL');
    setParams([{ id: generateTempId(), name: '', scoringType: '1-10', weightage: 0 }]);
    setFormErrors([]);
    setShowModal(true);
  };

  const openEdit = (template: Template) => {
    setEditTemplate(template);
    setName(template.name);
    setType(template.type);
    setParams(template.parameters.map(p => ({ ...p })));
    setFormErrors([]);
    setShowModal(true);
  };

  const addParam = () => {
    setParams(p => [...p, { id: generateTempId(), name: '', scoringType: '1-10', weightage: 0 }]);
  };

  const removeParam = (id: string) => {
    if (params.length <= 1) { toast.error('Template must have at least 1 parameter'); return; }
    setParams(p => p.filter(param => param.id !== id));
  };

  const updateParam = (id: string, field: keyof ParamForm, value: string | number) => {
    setParams(p => p.map(param => param.id === id ? { ...param, [field]: value } : param));
  };

  const validate = (): boolean => {
    const errors: string[] = [];
    if (!name.trim()) errors.push('Template name is required');
    if (params.some(p => !p.name.trim())) errors.push('All parameter names are required');
    if (params.some(p => Number(p.weightage) <= 0)) errors.push('All parameters must have weightage > 0');
    // Note: weightage doesn't HAVE to sum to 100, but should be noted
    if (totalWeightage !== 100) errors.push(`Weightage sum is ${totalWeightage}%. It should equal 100%`);
    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const paramData: TemplateParameter[] = params.map(p => ({
      id: p.id,
      name: p.name.trim(),
      scoringType: p.scoringType,
      weightage: Number(p.weightage),
    }));

    if (editTemplate) {
      TemplateDB.update(editTemplate.id, { name: name.trim(), type, parameters: paramData });
      toast.success('Template updated successfully');
    } else {
      TemplateDB.create({
        name: name.trim(),
        type,
        parameters: paramData,
        createdBy: currentUser!.id,
        isActive: true,
      });
      toast.success('Template created successfully');
    }
    refresh();
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    TemplateDB.delete(id);
    refresh();
    toast.success('Template deleted');
  };

  return (
    <Layout>
      <PageHeader
        title="Template Management"
        subtitle="Create and manage audit templates with custom parameters"
        action={
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Plus size={16} /> New Template
          </button>
        }
      />

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <EmptyState icon={<FileText size={24} />} title="No templates yet" description="Create your first audit template" />
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${template.type === 'CALL' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{template.name}</h3>
                      <Badge label={template.type} color={template.type === 'CALL' ? 'blue' : 'purple'} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {template.parameters.length} parameters •
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(template)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(template.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    {expandedId === template.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded Parameters */}
              {expandedId === template.id && (
                <div className="border-t border-gray-100 px-4 pb-4">
                  <table className="w-full mt-3">
                    <thead>
                      <tr className="bg-gray-50 rounded-lg">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">#</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Parameter Name</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Scoring Type</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Weightage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {template.parameters.map((param, i) => (
                        <tr key={param.id} className="border-b border-gray-50">
                          <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{param.name}</td>
                          <td className="px-3 py-2">
                            <Badge
                              label={param.scoringType === '1-10' ? '1-10 Scale' : 'YES/NO/NA'}
                              color={param.scoringType === '1-10' ? 'blue' : 'green'}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              {param.weightage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-gray-600 text-right">Total Weightage:</td>
                        <td className="px-3 py-2">
                          <span className={`text-sm font-bold ${template.parameters.reduce((s, p) => s + p.weightage, 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                            {template.parameters.reduce((s, p) => s + p.weightage, 0)}%
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-800">{editTemplate ? 'Edit Template' : 'Create Template'}</h3>
                <p className="text-xs text-gray-500">Configure audit template with parameters</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Template Name *</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g., Call Quality Template v1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>

              {/* Template Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Template Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['CALL', 'MAIL'] as TemplateType[]).map(t => (
                    <button key={t} onClick={() => setType(t)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all
                        ${type === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {t === 'CALL' ? '📞 Call Audit' : '📧 Mail Audit'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Parameters *</label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${totalWeightage === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      Total: {totalWeightage}%
                    </span>
                    <button onClick={addParam}
                      className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                      <Plus size={13} /> Add Parameter
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {params.map((param, idx) => (
                    <div key={param.id} className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-400 pt-2.5 w-5 flex-shrink-0">{idx + 1}.</span>
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <input
                          value={param.name}
                          onChange={e => updateParam(param.id, 'name', e.target.value)}
                          placeholder="Parameter name"
                          className="col-span-3 md:col-span-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                        />
                        <select
                          value={param.scoringType}
                          onChange={e => updateParam(param.id, 'scoringType', e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                        >
                          <option value="1-10">1-10 Scale</option>
                          <option value="YES_NO_NA">YES/NO/NA</option>
                        </select>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={param.weightage}
                            onChange={e => updateParam(param.id, 'weightage', Number(e.target.value))}
                            placeholder="Weight%"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                        </div>
                      </div>
                      <button onClick={() => removeParam(param.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Errors */}
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                  {formErrors.map((e, i) => (
                    <p key={i} className="text-red-600 text-xs flex items-center gap-1.5">
                      <AlertCircle size={12} /> {e}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t flex-shrink-0">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-2">
                <Save size={16} /> {editTemplate ? 'Update' : 'Create'} Template
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
