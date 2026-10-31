import React, { useState } from 'react';
import { PendingApproval, api } from '../services/api';
import { CheckCircle2, XCircle, Send, Edit3, ShieldAlert, Mail, Calendar, Clock, AlertTriangle } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Top Description Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Human Approval & Governance Queue</h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Golden Rule Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            "The agent proposes, the human decides." No candidate email or calendar slot is ever dispatched without explicit human sign-off.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sm font-medium text-sky-900 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-sky-600 hover:text-sky-800 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">All proposals reviewed</h3>
          <p className="text-sm text-slate-500 mt-1">
            There are currently no pending agent actions requiring recruiter approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((act) => {
            const isEditing = editingId === act.id;
            const isPending = act.status === 'PENDING';
            const isExecuted = act.status === 'EXECUTED';
            const isSuspicious = act.candidate_security_status === 'SUSPICIOUS_FLAGGED';

            return (
              <div
                key={act.id}
                className={`bg-white rounded-xl border transition-shadow shadow-sm overflow-hidden ${
                  isPending ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isPending
                          ? 'bg-amber-100 text-amber-800'
                          : isExecuted
                          ? 'bg-emerald-100 text-emerald-800'
                          : act.status === 'APPROVED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {act.status}
                    </span>
                    <span className="font-semibold text-slate-900 text-sm">
                      Target: {act.candidate_name} ({act.candidate_score.toFixed(1)}%)
                    </span>
                    {isSuspicious && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                        Flagged Prompt Injection
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Created: {new Date(act.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Content Payload Preview & Editor */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Proposed Action Type:</span>
                      <p className="font-mono text-slate-900 font-semibold mt-0.5">{act.action_type}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Target Recipient:</span>
                      <p className="font-mono text-slate-900 font-semibold mt-0.5">{act.payload.to_email}</p>
                    </div>
                  </div>

                  {/* Email Draft Preview / Editor */}
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        Candidate Communication Draft
                      </span>
                      {isPending && !isEditing && (
                        <button
                          onClick={() => startEditing(act)}
                          className="flex items-center gap-1 text-sky-600 hover:text-sky-800 font-medium"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Draft Before Approval</span>
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Email Subject:</label>
                          <input
                            type="text"
                            value={editedSubject}
                            onChange={(e) => setEditedSubject(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Email Body:</label>
                          <textarea
                            rows={6}
                            value={editedBody}
                            onChange={(e) => setEditedBody(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Reviewer Note (Audit Trail):</label>
                          <input
                            type="text"
                            placeholder="e.g. Adjusted interview schedule and approved language"
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        <div className="font-semibold text-slate-800">
                          Subject: <span className="font-normal font-mono">{act.payload.subject}</span>
                        </div>
                        <div className="bg-white p-3 rounded border border-slate-200 text-slate-700 font-mono whitespace-pre-wrap text-[11px] leading-relaxed">
                          {act.payload.body}
                        </div>
                        {act.payload.proposed_slots && act.payload.proposed_slots.length > 0 && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-2">
                            <Calendar className="w-3.5 h-3.5 text-sky-600" />
                            <span>
                              Proposed Interview Slots:{' '}
                              <strong>{act.payload.proposed_slots.join(', ')}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Execution / Review Info */}
                  {act.reviewed_by && (
                    <div className="text-xs text-slate-500 flex items-center justify-between bg-slate-50 px-3 py-2 rounded border border-slate-100">
                      <span>Reviewed by: <strong className="text-slate-700">{act.reviewed_by}</strong></span>
                      {act.review_notes && <span>Note: {act.review_notes}</span>}
                      {act.executed_at && (
                        <span className="text-emerald-700 font-semibold">
                          Executed: {new Date(act.executed_at).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Approval Actions */}
                  {isPending && (
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        disabled={isSubmitting}
                        onClick={() => handleReject(act.id)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                      >
                        Reject Proposal
                      </button>
                      <button
                        disabled={isSubmitting}
                        onClick={() => handleApprove(act)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-colors"
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
