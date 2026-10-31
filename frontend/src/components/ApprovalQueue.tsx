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
    <div className="space-y-6 text-slate-100">
      {/* Top Description Card */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Human Approval & Governance Queue</h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Golden Rule Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            <strong className="text-slate-200">"The agent proposes, the human decides."</strong> No candidate email or calendar slot is ever dispatched without explicit human sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 font-mono">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Air-Gapped Gateway</span>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-sky-950/70 border border-sky-500/40 text-sm font-medium text-sky-200 flex items-center justify-between shadow-lg">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-sky-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded hover:bg-sky-900/50">
            Dismiss
          </button>
        </div>
      )}

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-16 text-center shadow-xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">All proposals reviewed</h3>
          <p className="text-xs text-slate-400 mt-1">
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
                className={`bg-slate-900/60 backdrop-blur-xl rounded-2xl border transition-all shadow-xl overflow-hidden ${
                  isPending
                    ? 'border-amber-500/40 shadow-[0_0_20px_-5px_rgba(251,191,36,0.15)]'
                    : 'border-slate-800/80'
                }`}
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                        isPending
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                          : isExecuted
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : act.status === 'APPROVED'
                          ? 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                          : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {act.status}
                    </span>
                    <span className="font-bold text-white text-sm">
                      Target: {act.candidate_name} ({act.candidate_score.toFixed(1)}%)
                    </span>
                    {isSuspicious && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/70 px-2.5 py-0.5 rounded-full border border-rose-500/40">
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        Quarantined Injection
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Created: {new Date(act.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Content Payload Preview & Editor */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Proposed Action Type:</span>
                      <p className="font-mono text-white font-semibold mt-0.5">{act.action_type}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Target Recipient:</span>
                      <p className="font-mono text-sky-400 font-semibold mt-0.5">{act.payload.to_email}</p>
                    </div>
                  </div>

                  {/* Email Draft Preview / Editor */}
                  <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-sky-400" />
                        Candidate Communication Draft
                      </span>
                      {isPending && !isEditing && (
                        <button
                          onClick={() => startEditing(act)}
                          className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Draft Before Approval</span>
                        </button>
                      )}
                      {isPending && isEditing && (
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 font-medium transition-colors"
                        >
                          <span>Cancel Edit</span>
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-slate-400 font-medium mb-1">Email Subject:</label>
                          <input
                            type="text"
                            value={editedSubject}
                            onChange={(e) => setEditedSubject(e.target.value)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-mono text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-medium mb-1">Email Body:</label>
                          <textarea
                            rows={6}
                            value={editedBody}
                            onChange={(e) => setEditedBody(e.target.value)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-mono text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-medium mb-1">Reviewer Note (Audit Trail):</label>
                          <input
                            type="text"
                            placeholder="e.g. Adjusted interview schedule and approved language"
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        <div className="font-semibold text-slate-300">
                          Subject: <span className="font-normal font-mono text-white">{act.payload.subject}</span>
                        </div>
                        <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-slate-300 font-mono whitespace-pre-wrap text-[11px] leading-relaxed">
                          {act.payload.body}
                        </div>
                        {act.payload.proposed_slots && act.payload.proposed_slots.length > 0 && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-2">
                            <Calendar className="w-3.5 h-3.5 text-sky-400" />
                            <span>
                              Proposed Slots:{' '}
                              <strong className="text-white">{act.payload.proposed_slots.join(', ')}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Execution / Review Info */}
                  {act.reviewed_by && (
                    <div className="text-xs text-slate-400 flex items-center justify-between bg-slate-950/60 px-3.5 py-2.5 rounded-xl border border-slate-800/80">
                      <span>Reviewed by: <strong className="text-slate-200">{act.reviewed_by}</strong></span>
                      {act.review_notes && <span>Note: {act.review_notes}</span>}
                      {act.executed_at && (
                        <span className="text-emerald-400 font-semibold font-mono">
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
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 transition-colors"
                      >
                        Reject Proposal
                      </button>
                      <button
                        disabled={isSubmitting}
                        onClick={() => handleApprove(act)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)] transition-all transform active:scale-95"
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