import React, { useState } from 'react';
import { PendingApproval, api } from '../services/api';
import { CheckCircle2, XCircle, Send, Edit3, ShieldAlert, Mail, Calendar, Clock, AlertTriangle, Lock } from 'lucide-react';

interface ApprovalQueueProps {
  approvals: PendingApproval[];
  onRefresh: () => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ approvals, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState<string>('');
  const [editedSubject, setEditedSubject] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const startEditing = (approval: PendingApproval) => {
    setEditingId(approval.id);
    setEditedSubject(approval.payload.subject || '');
    setEditedBody(approval.payload.body || '');
    setReviewNotes('');
  };

  const handleApprove = async (approval: PendingApproval) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const isCustomized = editingId === approval.id;
      const payloadToSend = isCustomized
        ? {
            ...approval.payload,
            subject: editedSubject,
            body: editedBody,
          }
        : approval.payload;

      // 1. Submit human approval
      await api.reviewApproval(
        approval.id,
        'APPROVED',
        reviewNotes || 'Approved by Lead Recruiter',
        payloadToSend
      );

      // 2. Dispatch approved action deterministically via Action Gateway
      const dispatchResult = await api.dispatchAction(approval.id);

      setFeedback(`Action successfully executed via Action Gateway! (${dispatchResult.result.status})`);
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (approvalId: string) => {
    setIsSubmitting(true);
    try {
      await api.reviewApproval(
        approvalId,
        'REJECTED',
        reviewNotes || 'Action rejected by recruiter review'
      );
      setFeedback('Proposal was rejected. No external action will be taken.');
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Description Card */}
      <div className="surface-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Human Approval & Governance Queue
            </h2>
            <span className="badge-clean">
              Golden Rule Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            <strong className="text-slate-800 dark:text-slate-200">"The agent proposes, the human decides."</strong> No candidate email or calendar slot is ever dispatched without explicit recruiter authorization.
          </p>
        </div>

        <div className="badge-neutral font-mono text-xs">
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Air-Gapped Gateway</span>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 dark:text-emerald-400 hover:underline text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <div className="surface-card p-16 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">All proposals reviewed</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            There are currently no pending agent actions requiring recruiter approval.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {approvals.map((act) => {
            const isEditing = editingId === act.id;
            const isPending = act.status === 'PENDING';
            const isExecuted = act.status === 'EXECUTED';
            const isSuspicious = act.candidate_security_status === 'SUSPICIOUS_FLAGGED';

            return (
              <div
                key={act.id}
                className={`surface-card overflow-hidden transition-all ${
                  isPending
                    ? 'border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-100 dark:ring-amber-950/50'
                    : ''
                }`}
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={
                        isPending
                          ? 'badge-warning font-mono'
                          : isExecuted
                          ? 'badge-clean font-mono'
                          : act.status === 'APPROVED'
                          ? 'badge-info font-mono'
                          : 'badge-danger font-mono'
                      }
                    >
                      {act.status}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                      Target: {act.candidate_name} ({act.candidate_score.toFixed(1)}%)
                    </span>
                    {isSuspicious && (
                      <span className="badge-danger font-mono text-[10px]">
                        <ShieldAlert className="w-3 h-3 text-rose-500" />
                        Quarantined Injection
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Created: {new Date(act.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Content Payload Preview & Editor */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Proposed Action Type:</span>
                      <p className="font-mono text-slate-900 dark:text-white font-semibold mt-0.5">{act.action_type}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Target Recipient:</span>
                      <p className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">{act.payload.to_email}</p>
                    </div>
                  </div>

                  {/* Email Draft Preview / Editor */}
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Candidate Communication Draft
                      </span>
                      {isPending && !isEditing && (
                        <button
                          onClick={() => startEditing(act)}
                          className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-xs"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Draft Before Approval</span>
                        </button>
                      )}
                      {isPending && isEditing && (
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-slate-500 hover:text-slate-700 text-xs font-medium"
                        >
                          <span>Cancel Edit</span>
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Subject:</label>
                          <input
                            type="text"
                            value={editedSubject}
                            onChange={(e) => setEditedSubject(e.target.value)}
                            className="input-base font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Email Body:</label>
                          <textarea
                            rows={5}
                            value={editedBody}
                            onChange={(e) => setEditedBody(e.target.value)}
                            className="input-base font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Reviewer Note (Audit Trail):</label>
                          <input
                            type="text"
                            placeholder="e.g. Adjusted interview schedule and approved language"
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            className="input-base"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Subject: <span className="font-normal font-mono">{act.payload.subject}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap text-[11px] leading-relaxed">
                          {act.payload.body}
                        </div>
                        {act.payload.proposed_slots && act.payload.proposed_slots.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            <span>
                              Proposed Slots: <strong className="text-slate-800 dark:text-slate-200">{act.payload.proposed_slots.join(', ')}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Execution / Review Info */}
                  {act.reviewed_by && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 px-3 py-2 rounded border border-slate-200/60 dark:border-slate-800">
                      <span>Reviewed by: <strong className="text-slate-700 dark:text-slate-300">{act.reviewed_by}</strong></span>
                      {act.review_notes && <span>Note: {act.review_notes}</span>}
                      {act.executed_at && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                          Executed: {new Date(act.executed_at).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Approval Actions */}
                  {isPending && (
                    <div className="flex justify-end gap-2.5 pt-1">
                      <button
                        disabled={isSubmitting}
                        onClick={() => handleReject(act.id)}
                        className="btn-danger"
                      >
                        Reject Proposal
                      </button>
                      <button
                        disabled={isSubmitting}
                        onClick={() => handleApprove(act)}
                        className="btn-primary"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Approve & Dispatch via Action Gateway</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};