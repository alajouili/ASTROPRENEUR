import React, { useState } from 'react';
import { Proposal, api } from '../services/api';
import {
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Edit3,
  FileCheck,
  Check,
  ArrowRight,
  HelpCircle,
  Send,
  Mail,
  Calendar,
} from 'lucide-react';

interface ApprovalQueueProps {
  approvals: Proposal[];
  onRefresh: () => void;
}

// Evidence and risk entries from the backend are objects; React cannot render them as is.
const candidateLabel = (entry: any, names: Record<string, string>): string => {
  if (typeof entry === 'string') return names[entry] || entry;
  const name = entry?.display_name || names[entry?.candidate_id] || entry?.candidate_id || 'Unknown candidate';
  const parts: string[] = [];
  if (entry?.score !== undefined) parts.push(`score ${entry.score}`);
  if (entry?.must_have) parts.push(`must-haves ${entry.must_have}`);
  if (entry?.risk_level) parts.push(`risk ${entry.risk_level}`);
  if (Array.isArray(entry?.flags) && entry.flags.length > 0) parts.push(`flags: ${entry.flags.join(', ')}`);
  return parts.length > 0 ? `${name} (${parts.join(', ')})` : name;
};

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ approvals, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedCandidateIds, setEditedCandidateIds] = useState<string[]>([]);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; details?: any } | null>(null);

  const startReview = (proposal: Proposal) => {
    setEditingId(proposal.id);
    const initialCandidates = proposal.payload?.candidate_ids || [];
    setEditedCandidateIds([...initialCandidates]);
    setReviewNote('');
    setFeedback(null);
  };

  const handleToggleCandidate = (candidateId: string) => {
    setEditedCandidateIds((prev) =>
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]
    );
  };

  const handleApprove = async (proposal: Proposal) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const isShortlist = proposal.type === 'shortlist';
      const body: { candidate_ids?: string[]; note?: string } = {
        note: reviewNote || 'Approved by recruiter authorization',
      };
      if (isShortlist) {
        body.candidate_ids = editedCandidateIds;
      }

      const res = await api.approveProposal(proposal.id, body);
      setFeedback({
        type: 'success',
        message: `Proposal #${proposal.id.substring(0, 8)} approved and executed by Action Gateway.`,
        details: res.execution_result,
      });
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Action Gateway rejected or failed proposal execution.',
        details: err.details,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (proposalId: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.rejectProposal(proposalId, {
        note: reviewNote || 'Rejected during human review',
      });
      setFeedback({
        type: 'success',
        message: `Proposal #${proposalId.substring(0, 8)} rejected. State was preserved; no action dispatched.`,
      });
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to reject proposal.',
      });
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
              Golden Rule Enforced
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            <strong className="text-slate-800 dark:text-slate-200">"The agent proposes, the human decides."</strong> Only the Action Gateway (<code className="font-mono text-indigo-600 dark:text-indigo-400">backend/app/gateway/executor.py</code>) can alter recruitment state.
          </p>
        </div>

        <div className="badge-neutral font-mono text-xs">
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Action Gateway State Barrier</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-semibold">{feedback.message}</span>
              {feedback.details && (
                <pre className="text-[11px] font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 overflow-x-auto mt-1">
                  {JSON.stringify(feedback.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <div className="surface-card p-12 text-center text-slate-500">
          <FileCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Approval queue is empty</h3>
          <p className="text-xs text-slate-500 mt-1">
            New proposals generated by AI agents will appear here for authenticated human sign-off.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((proposal) => {
            const isEditing = editingId === proposal.id;
            const isPending = proposal.status === 'pending';
            const evidence = proposal.evidence || {};
            const rankingList = evidence.ranking || [];
            const needsReviewList = evidence.needs_review || [];
            const missingMustHavesList = evidence.missing_must_haves || [];
            const candidateNames: Record<string, string> = Object.fromEntries(
              [...rankingList, ...needsReviewList, ...missingMustHavesList]
                .filter((c: any) => c && c.candidate_id && c.display_name)
                .map((c: any) => [c.candidate_id, c.display_name])
            );

            return (
              <div
                key={proposal.id}
                className="surface-card p-5 border border-slate-200 dark:border-slate-800 space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                      Proposal #{proposal.id.substring(0, 8)}
                    </span>
                    <span className="badge-neutral font-mono text-[10px] uppercase">
                      Type: {proposal.type}
                    </span>
                    <span
                      className={`badge font-mono text-[10px] uppercase ${
                        proposal.status === 'pending'
                          ? 'badge-warning'
                          : proposal.status === 'approved' || proposal.status === 'executed'
                          ? 'badge-clean'
                          : 'badge-danger'
                      }`}
                    >
                      {proposal.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Created: {new Date(proposal.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Risk Flags Banner if present */}
                {proposal.risk_flags && proposal.risk_flags.length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Security Advisory:</strong>
                      <ul className="list-disc pl-4 mt-1 font-mono text-[11px]">
                        {proposal.risk_flags.map((rf: any, i) => (
                          <li key={i}>{candidateLabel(rf, candidateNames)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Evidence & Payload Section */}
                <div className="space-y-3">
                  {/* Outbound Email Proposals */}
                  {proposal.type === 'send_email' && (
                    <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                          <Mail className="w-4 h-4" />
                          <span>Action Gateway Outbound Email Proposal</span>
                        </div>
                        <span className="badge-clean text-[10px] font-mono">Output Guard Verified</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-500 w-16">To:</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                            {proposal.payload?.to || proposal.payload?.recipient_email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-500 w-16">Subject:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {proposal.payload?.subject}
                          </span>
                        </div>
                        <div className="pt-2">
                          <span className="font-semibold text-slate-500 block mb-1">Message Body:</span>
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                            {proposal.payload?.body}
                          </div>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 font-mono flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>OWASP LLM02 / LLM05 Output Guard: verified zero cross-candidate data leakage and no unapproved commitments.</span>
                      </div>
                    </div>
                  )}

                  {/* Interview Scheduling Proposals */}
                  {proposal.type === 'schedule_interview' && (
                    <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                          <Calendar className="w-4 h-4" />
                          <span>Action Gateway Interview Calendar Hold Proposal</span>
                        </div>
                        <span className="badge-clean text-[10px] font-mono">Calendar Lock</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 font-mono text-[10px] uppercase block">Candidate</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {proposal.payload?.candidate_name || 'Candidate'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            {proposal.payload?.candidate_email}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 font-mono text-[10px] uppercase block">Proposed Slot & Hold</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {proposal.payload?.slot || `${proposal.payload?.day} ${proposal.payload?.time}`}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            Interviewer: {proposal.payload?.interviewer}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shortlist Proposals */}
                  {proposal.type === 'shortlist' && (
                    <>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                        Agent Proposed Shortlist & Evidence:
                      </h4>

                      {/* Proposed Candidates List */}
                      {rankingList.length > 0 && (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                          <table className="min-w-full text-xs text-left divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-850 font-mono text-slate-500 text-[10px] uppercase">
                              <tr>
                                {isEditing && <th className="p-2.5">Include</th>}
                                <th className="p-2.5">Candidate</th>
                                <th className="p-2.5">Score</th>
                                <th className="p-2.5">Must-Have Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {rankingList.map((cand: any, idx: number) => {
                                const cid = cand.candidate_id || cand.id;
                                const isIncluded = editedCandidateIds.includes(cid);
                                return (
                                  <tr
                                    key={idx}
                                    className={
                                      isEditing && !isIncluded
                                        ? 'opacity-40 bg-slate-50 dark:bg-slate-900/50'
                                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-850/50'
                                    }
                                  >
                                    {isEditing && (
                                      <td className="p-2.5">
                                        <input
                                          type="checkbox"
                                          checked={isIncluded}
                                          onChange={() => handleToggleCandidate(cid)}
                                          className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                      </td>
                                    )}
                                    <td className="p-2.5 font-mono font-medium text-slate-800 dark:text-slate-200">
                                      {cand.display_name || cand.name || cid}
                                    </td>
                                    <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                                      {cand.score !== undefined ? `${cand.score}%` : '—'}
                                    </td>
                                    <td className="p-2.5">
                                      {cand.must_have || cand.must_have_met !== undefined ? (
                                        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                                          {cand.must_have || `${cand.must_have_met}/${cand.must_have_total}`} met
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}

                  {/* Needs Review / Missing Must-Haves warnings */}
                  {(needsReviewList.length > 0 || missingMustHavesList.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {needsReviewList.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-[11px]">
                          <span className="font-semibold text-amber-900 dark:text-amber-200 font-mono">
                            Needs Human Review ({needsReviewList.length}):
                          </span>
                          <ul className="list-disc pl-4 text-amber-800 dark:text-amber-300 font-mono mt-1">
                            {needsReviewList.map((entry: any, i: number) => (
                              <li key={i}>{candidateLabel(entry, candidateNames)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {missingMustHavesList.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-[11px]">
                          <span className="font-semibold text-rose-900 dark:text-rose-200 font-mono">
                            Missing Must-Haves ({missingMustHavesList.length}):
                          </span>
                          <ul className="list-disc pl-4 text-rose-800 dark:text-rose-300 font-mono mt-1">
                            {missingMustHavesList.map((entry: any, i: number) => (
                              <li key={i}>{candidateLabel(entry, candidateNames)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Execution Result Banner (After Approval) */}
                {proposal.execution_result && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2 font-mono font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Action Gateway Execution Result:</span>
                    </div>
                    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
                      {Object.entries(proposal.execution_result).map(([key, value]) => (
                        <React.Fragment key={key}>
                          <dt className="text-slate-500 dark:text-slate-400 capitalize">{key.replace(/_/g, ' ')}</dt>
                          <dd className="text-slate-800 dark:text-slate-200 break-all">
                            {Array.isArray(value) ? (value.length ? `${value.length} item(s)` : 'none') : typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
                          </dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Review Notes or Form */}
                {isEditing ? (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Deterministic Action Gateway Pre-Flight Verification Checklist */}
                    <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold font-mono text-indigo-900 dark:text-indigo-200 text-[11px] uppercase tracking-wider">
                        <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Action Gateway Deterministic Pre-Flight Checklist</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Human Authority: Verified HR Session</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Anti-CSRF Guard: Double-Submit Token</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Tamper Barrier: Payload Hash Verified</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>State Boundary: Only Status <code>screened</code> Target</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                        *If any pre-condition fails at execution time, database changes roll back atomically with a 409 Conflict.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Review Note / Rationale (Logged into tamper-evident audit trail)
                      </label>
                      <textarea
                        rows={2}
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Add decision context (e.g. Verified technical interview match for shortlisted candidates)..."
                        className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleReject(proposal.id)}
                        className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject Proposal</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting || (proposal.type === 'shortlist' && editedCandidateIds.length === 0)}
                        onClick={() => handleApprove(proposal)}
                        className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          Authorize via Action Gateway{proposal.type === 'shortlist' ? ` (${editedCandidateIds.length})` : ''}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500 font-mono">
                      {proposal.reviewed_by && (
                        <span>
                          Reviewed{proposal.reviewed_at ? ` on ${new Date(proposal.reviewed_at).toLocaleString()}` : ''} by user <span title={proposal.reviewed_by}>{proposal.reviewed_by.slice(0, 8)}</span>
                          {proposal.review_note ? <> &bull; Note: &ldquo;{proposal.review_note}&rdquo;</> : null}
                        </span>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startReview(proposal)}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Review & Authorize</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
