/**
 * QC - New Audit Workflow
 * Step 1: Select Agent → Step 2: Select Template → Step 3: Fill Audit Form
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Layout, PageHeader } from '../../components/Layout';
import { useAuth } from '../../store/auth';
import {
  UserDB, TemplateDB, AllocationDB, AuditDB, DisputeDB,
  calculateAuditScore, Template, User, Audit
} from '../../store/db';
import {
  ChevronRight, User as UserIcon, FileText, ClipboardList,
  Check, Upload, Save, RefreshCw, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 1 | 2 | 3;

interface ScoreInput {
  parameterId: string;
  givenScore: number | string;
}

export default function NewAudit() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { reAuditId } = useParams<{ reAuditId?: string }>();

  const [step, setStep] = useState<Step>(1);
  const [selectedAgent, setSelectedAgent] = useState<User | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Form fields
  const [refNum, setRefNum] = useState('');
  const [callRecording, setCallRecording] = useState('');
  const [duration, setDuration] = useState('');
  const [convDate, setConvDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedback, setFeedback] = useState('');
  const [scores, setScores] = useState<ScoreInput[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isReAudit, setIsReAudit] = useState(false);
  const [originalAuditId, setOriginalAuditId] = useState<string | undefined>();

  // Get allocated agents
  const allocatedAgents = useMemo(() => {
    const ids = AllocationDB.getAgentsForQC(currentUser!.id);
    return ids.map(id => UserDB.getById(id)).filter(Boolean) as User[];
  }, [currentUser]);

  // Get available templates for the selected agent's subtype
  const availableTemplates = useMemo(() => {
    if (!selectedAgent) return TemplateDB.getAll();
    const agentSubtype = selectedAgent.subtype;
    // MAILS agents → MAIL templates, others → CALL templates
    return TemplateDB.getAll().filter(t =>
      agentSubtype === 'MAILS' ? t.type === 'MAIL' : t.type === 'CALL'
    );
  }, [selectedAgent]);

  // Load re-audit data
  useEffect(() => {
    if (reAuditId) {
      const originalAudit = AuditDB.getById(reAuditId);
      if (originalAudit) {
        const agent = UserDB.getById(originalAudit.agentId);
        const template = TemplateDB.getById(originalAudit.templateId);
        if (agent && template) {
          setSelectedAgent(agent);
          setSelectedTemplate(template);
          setRefNum(originalAudit.referenceNumber);
          setConvDate(originalAudit.conversationDate);
          setFeedback(originalAudit.feedback);
          setScores(originalAudit.scores.map(s => ({ parameterId: s.parameterId, givenScore: s.givenScore })));
          setDuration(originalAudit.duration || '');
          setIsReAudit(true);
          setOriginalAuditId(reAuditId);
          setStep(3);
        }
      }
    }
  }, [reAuditId]);

  // Initialize scores when template is selected
  const initScores = (template: Template) => {
    setScores(template.parameters.map(p => ({
      parameterId: p.id,
      givenScore: p.scoringType === '1-10' ? 5 : 'NA',
    })));
  };

  const handleSelectAgent = (agent: User) => {
    setSelectedAgent(agent);
    setSelectedTemplate(null);
    setStep(2);
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    initScores(template);
    setStep(3);
  };

  const updateScore = (parameterId: string, value: number | string) => {
    setScores(s => s.map(sc => sc.parameterId === parameterId ? { ...sc, givenScore: value } : sc));
  };

  // Live score preview
  const liveScore = useMemo(() => {
    if (!selectedTemplate || scores.length === 0) return null;
    return calculateAuditScore(selectedTemplate.parameters, scores);
  }, [selectedTemplate, scores]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!refNum.trim()) errs.push('Reference number is required');
    if (!convDate) errs.push('Conversation date is required');
    if (!selectedTemplate) errs.push('Template not selected');
    if (selectedTemplate?.type === 'CALL' && !duration.trim()) errs.push('Call duration is required');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!selectedAgent || !selectedTemplate) return;

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 400));

    const scoreResult = calculateAuditScore(selectedTemplate.parameters, scores);

    AuditDB.create({
      agentId: selectedAgent.id,
      qcId: currentUser!.id,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      templateType: selectedTemplate.type,
      referenceNumber: refNum.trim(),
      callRecording: callRecording || undefined,
      duration: selectedTemplate.type === 'CALL' ? duration : undefined,
      conversationDate: convDate,
      scores: scoreResult.scores,
      totalScore: scoreResult.totalScore,
      maxPossibleScore: scoreResult.maxPossibleScore,
      percentageScore: scoreResult.percentageScore,
      feedback: feedback.trim(),
      isReAudit,
      originalAuditId,
    });

    setSubmitting(false);
    toast.success('Audit submitted successfully!');
    navigate('/qc/audits');
  };

  const steps = [
    { num: 1, label: 'Select Agent', icon: <UserIcon size={16} /> },
    { num: 2, label: 'Select Template', icon: <FileText size={16} /> },
    { num: 3, label: 'Audit Form', icon: <ClipboardList size={16} /> },
  ];

  return (
    <Layout>
      <PageHeader
        title={isReAudit ? 'Re-Audit' : 'New Audit'}
        subtitle={isReAudit ? 'Conducting re-audit on existing reference' : 'Step-by-step quality audit workflow'}
      />

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className={`flex items-center gap-2 cursor-pointer
              ${step >= s.num ? 'opacity-100' : 'opacity-40'}`}
              onClick={() => !isReAudit && s.num < step && setStep(s.num as Step)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${step > s.num ? 'bg-green-500 text-white' :
                  step === s.num ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span className={`text-sm font-medium hidden md:block ${step === s.num ? 'text-indigo-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={16} className={`mx-2 flex-shrink-0 ${step > s.num ? 'text-green-500' : 'text-gray-300'}`} />
            )}
          </React.Fragment>
        ))}
        {selectedAgent && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">
              {selectedAgent.fullName.charAt(0)}
            </div>
            <span className="text-xs text-gray-600">{selectedAgent.fullName}</span>
            {selectedTemplate && (
              <>
                <ChevronRight size={12} className="text-gray-400" />
                <span className="text-xs text-gray-600">{selectedTemplate.name}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Step 1: Select Agent */}
      {step === 1 && (
        <div>
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-1">Select Agent to Audit</h3>
            <p className="text-sm text-gray-500">Only agents allocated to you are shown</p>
          </div>
          {allocatedAgents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No agents allocated</p>
              <p className="text-gray-400 text-sm mt-1">Ask your admin to allocate agents to you</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allocatedAgents.map(agent => {
                const auditCount = AuditDB.getByAgent(agent.id).filter(a => a.qcId === currentUser!.id).length;
                const subColors: Record<string, string> = {
                  COLLECTION: 'bg-blue-50 text-blue-600 border-blue-100',
                  REVERIFICATION: 'bg-purple-50 text-purple-600 border-purple-100',
                  CUSTOMER_CARE: 'bg-orange-50 text-orange-600 border-orange-100',
                  MAILS: 'bg-red-50 text-red-600 border-red-100',
                };
                return (
                  <button key={agent.id} onClick={() => handleSelectAgent(agent)}
                    className="bg-white rounded-xl border-2 border-gray-200 p-5 text-left hover:border-indigo-400 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-lg">
                        {agent.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{agent.fullName}</p>
                        <p className="text-xs text-gray-400">@{agent.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${subColors[agent.subtype || ''] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        {agent.subtype?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">{auditCount} audits</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-medium">Select agent</span>
                      <ChevronRight size={14} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Template */}
      {step === 2 && (
        <div>
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-1">Select Audit Template</h3>
            <p className="text-sm text-gray-500">
              Templates shown for {selectedAgent?.subtype === 'MAILS' ? 'mail' : 'call'} audit type
            </p>
          </div>
          {availableTemplates.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-400 text-sm">No templates available. Ask admin to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableTemplates.map(template => (
                <button key={template.id} onClick={() => handleSelectTemplate(template)}
                  className="bg-white rounded-xl border-2 border-gray-200 p-5 text-left hover:border-indigo-400 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${template.type === 'CALL' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      <FileText size={18} />
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${template.type === 'CALL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {template.type}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">{template.name}</h4>
                  <p className="text-xs text-gray-500">{template.parameters.length} parameters</p>
                  <div className="mt-3 space-y-1">
                    {template.parameters.slice(0, 3).map(p => (
                      <div key={p.id} className="flex justify-between text-xs text-gray-400">
                        <span>{p.name}</span>
                        <span>{p.scoringType === '1-10' ? '1-10' : 'YES/NO'} • {p.weightage}%</span>
                      </div>
                    ))}
                    {template.parameters.length > 3 && (
                      <p className="text-xs text-gray-300">+{template.parameters.length - 3} more...</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-500 hover:text-gray-700">
            ← Back to agent selection
          </button>
        </div>
      )}

      {/* Step 3: Audit Form */}
      {step === 3 && selectedTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Basic Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Audit Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference Number *</label>
                  <input value={refNum} onChange={e => setRefNum(e.target.value)}
                    placeholder="e.g., REF-20240301-001"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Conversation Date *</label>
                  <input type="date" value={convDate} onChange={e => setConvDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
                {selectedTemplate.type === 'CALL' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Call Duration *</label>
                    <input value={duration} onChange={e => setDuration(e.target.value)}
                      placeholder="e.g., 05:32"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                  </div>
                )}
                {selectedTemplate.type === 'CALL' && (
                  <div className={selectedTemplate.type === 'CALL' ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Call Recording</label>
                    <input value={callRecording} onChange={e => setCallRecording(e.target.value)}
                      placeholder="Recording filename or URL (optional)"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Parameter Scoring */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Parameter Scoring</h3>
              <div className="space-y-4">
                {selectedTemplate.parameters.map((param, i) => {
                  const currentScore = scores.find(s => s.parameterId === param.id);
                  return (
                    <div key={param.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{i + 1}. {param.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {param.scoringType === '1-10' ? '0-10 Scale' : 'YES / NO / NA'} •
                            Weightage: <strong>{param.weightage}%</strong>
                          </p>
                        </div>
                        {param.scoringType === '1-10' && currentScore && (
                          <span className={`text-sm font-bold px-2 py-0.5 rounded
                            ${Number(currentScore.givenScore) >= 7 ? 'text-green-600 bg-green-50' :
                              Number(currentScore.givenScore) >= 5 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'}`}>
                            {currentScore.givenScore}/10
                          </span>
                        )}
                      </div>

                      {param.scoringType === '1-10' ? (
                        <div>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            value={Number(currentScore?.givenScore) || 0}
                            onChange={e => updateScore(param.id, Number(e.target.value))}
                            className="w-full accent-indigo-600"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                              <span key={n} className={`cursor-pointer hover:text-indigo-600 ${Number(currentScore?.givenScore) === n ? 'text-indigo-600 font-bold' : ''}`}
                                onClick={() => updateScore(param.id, n)}>
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {(['YES', 'NO', 'NA'] as const).map(val => (
                            <button
                              key={val}
                              onClick={() => updateScore(param.id, val)}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all
                                ${currentScore?.givenScore === val
                                  ? val === 'YES' ? 'border-green-500 bg-green-50 text-green-700'
                                    : val === 'NO' ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-gray-400 bg-gray-100 text-gray-600'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <label className="block text-sm font-semibold text-gray-800 mb-3">Feedback & Comments</label>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4}
                placeholder="Add detailed feedback for the agent..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
                {errors.map((e, i) => (
                  <p key={i} className="text-red-600 text-xs flex items-center gap-1.5">
                    <AlertCircle size={12} /> {e}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Score Summary Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-4">
              <h3 className="font-semibold text-gray-800 mb-4">Score Preview</h3>
              {liveScore && (
                <>
                  <div className={`text-center p-4 rounded-xl mb-4
                    ${liveScore.percentageScore >= 80 ? 'bg-green-50 border border-green-200' :
                      liveScore.percentageScore >= 60 ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-red-50 border border-red-200'}`}>
                    <p className={`text-3xl font-bold
                      ${liveScore.percentageScore >= 80 ? 'text-green-600' :
                        liveScore.percentageScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {liveScore.percentageScore.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {liveScore.totalScore.toFixed(1)} / {liveScore.maxPossibleScore} pts
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    {liveScore.scores.map(s => (
                      <div key={s.parameterId} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate flex-1">{s.parameterName}</span>
                        <span className={`font-medium ml-2 flex-shrink-0
                          ${s.givenScore === 'NA' ? 'text-gray-400' :
                            s.calculatedScore >= s.weightage * 0.8 ? 'text-green-600' : 'text-orange-600'}`}>
                          {s.scoringType === '1-10' ? `${s.givenScore}/10` : s.givenScore as string}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Agent & Template Info */}
              <div className="border-t border-gray-100 pt-4 space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <UserIcon size={12} />
                  <span className="font-medium text-gray-700">{selectedAgent?.fullName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FileText size={12} />
                  <span className="font-medium text-gray-700">{selectedTemplate.name}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors
                  flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isReAudit ? <><RefreshCw size={16} /> Submit Re-Audit</> : <><Save size={16} /> Submit Audit</>}
                  </>
                )}
              </button>

              {!isReAudit && (
                <button onClick={() => setStep(1)} className="w-full mt-2 text-gray-400 text-xs py-2 hover:text-gray-600">
                  ← Start Over
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
