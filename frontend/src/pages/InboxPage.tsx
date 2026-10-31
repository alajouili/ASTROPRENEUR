import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, InboxItem } from '../services/api';
import {
  Mail,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Send,
  Edit3,
  Filter,
  Search,
  Check,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const InboxPage: React.FC = () => {
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'AVAILABILITY' | 'STATUS_INQUIRY' | 'SUSPICIOUS'>('ALL');
  const [needsHumanOnly, setNeedsHumanOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEditingDraft, setIsEditingDraft] = useState<boolean>(false);
  const [draftContent, setDraftContent] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    try {
      const data = await api.getInboxDigest();
      setInboxItems(data);
      if (data.length > 0 && !selectedItem) {
        setSelectedItem(data[0]);
        setDraftContent(data[0].ai_response_draft || '');
      }
    } catch (e) {
      console.error('Failed to load inbox items', e);
    }
  };

  const handleSelectItem = (item: InboxItem) => {
    setSelectedItem(item);
    setDraftContent(item.ai_response_draft || '');
    setIsEditingDraft(false);
  };

  const handleApproveDraft = async () => {
    if (!selectedItem) return;
    try {
      const recipient = (selectedItem as any).sender_email || selectedItem.sender;
      const res = await api.proposeInboxReply(selectedItem.id, {
        to_email: recipient,
        subject: `Re: ${selectedItem.subject}`,
        body: draftContent,
      });
      setFeedback(`Email reply proposal #${res.id.substring(0, 8)} created! Queued in Human Approval Queue. Action Gateway dispatches email upon HR authorization.`);
      setIsEditingDraft(false);
      loadInbox();
    } catch (e: any) {
      setFeedback(`Error submitting reply proposal: ${e.message}`);
    }
  };

  const filteredItems = inboxItems.filter((item) => {
    if (urgencyFilter !== 'ALL' && item.urgency !== urgencyFilter) return false;
    if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
    if (needsHumanOnly && !item.needs_human) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.subject.toLowerCase().includes(q) ||
        item.sender.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Live Gateway Notice */}
      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <span className="badge-clean text-[10px]">Active & Guarded</span>
          <span>Inbound mailbox triage with Prompt Guard scanning & Action Gateway email dispatch.</span>
        </div>
        <Link to="/approvals" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1">
          <span>View Approvals</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Header Banner */}
      <div className="surface-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Candidate Inbox Triage & Daily Digest
            </h2>
            <span className="badge-info font-mono">
              Inbound Parser Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated email triage categorized by urgency and intent. Adversarial messages with prompt injections are quarantined before recruiter viewing.
          </p>
        </div>

        {/* Needs human toggle */}
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <input
            type="checkbox"
            checked={needsHumanOnly}
            onChange={(e) => setNeedsHumanOnly(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <span>Needs Human Review Only</span>
        </label>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="surface-card p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-500 font-mono uppercase text-[10px] mr-1">Urgency:</span>
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((urg) => (
            <button
              key={urg}
              onClick={() => setUrgencyFilter(urg)}
              className={`px-2.5 py-1 rounded-md font-mono text-xs transition-colors ${
                urgencyFilter === urg
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {urg}
            </button>
          ))}

          <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>

          <span className="text-slate-500 font-mono uppercase text-[10px] mr-1">Type:</span>
          {(['ALL', 'AVAILABILITY', 'STATUS_INQUIRY', 'SUSPICIOUS'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-md font-mono text-xs transition-colors ${
                typeFilter === t
                  ? t === 'SUSPICIOUS'
                    ? 'bg-rose-600 text-white font-semibold'
                    : 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search sender, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Email List Column */}
        <div className="lg:col-span-5 surface-card overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[640px] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <Mail className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-medium">No emails matching current filters</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const isSuspicious = item.type === 'SUSPICIOUS';

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`p-3.5 cursor-pointer transition-colors relative ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-3 border-l-indigo-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">{item.sender}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate mb-1">{item.subject}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                    {item.summary}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                    <span
                      className={
                        item.urgency === 'HIGH'
                          ? 'badge-danger'
                          : item.urgency === 'MEDIUM'
                          ? 'badge-warning'
                          : 'badge-neutral'
                      }
                    >
                      {item.urgency}
                    </span>

                    <span className={isSuspicious ? 'badge-danger' : 'badge-info'}>
                      {item.type.replace('_', ' ')}
                    </span>

                    {item.needs_human && (
                      <span className="badge-warning">
                        Needs Human
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Email Reading & Action Column */}
        <div className="lg:col-span-7 surface-card p-5 space-y-4">
          {selectedItem ? (
            <div className="space-y-4">
              {/* Message Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedItem.subject}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedItem.sender}</span>
                      <span>&bull;</span>
                      <span>{new Date(selectedItem.received_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <span
                    className={
                      selectedItem.urgency === 'HIGH'
                        ? 'badge-danger font-mono'
                        : selectedItem.urgency === 'MEDIUM'
                        ? 'badge-warning font-mono'
                        : 'badge-neutral font-mono'
                    }
                  >
                    {selectedItem.urgency} Priority
                  </span>
                </div>
              </div>

              {/* Adversarial Alert Banner if Suspicious */}
              {selectedItem.type === 'SUSPICIOUS' && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-rose-800 dark:text-rose-200">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Adversarial Prompt Injection Intercepted</span>
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                    This email contained adversarial system token instructions designed to trick automated recruitment responders into executing unauthorized actions.
                  </p>
                  {selectedItem.quarantined_snippet && (
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                      Quarantined Payload: "{selectedItem.quarantined_snippet}"
                    </div>
                  )}
                </div>
              )}

              {/* Message Body */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                {selectedItem.body}
              </div>

              {/* AI Draft Response & Approval Area */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>AI Proposed Response Draft</span>
                    <span
                      className={
                        selectedItem.draft_status === 'BLOCKED'
                          ? 'badge-danger font-mono text-[10px]'
                          : selectedItem.draft_status === 'DRAFT_READY'
                          ? 'badge-warning font-mono text-[10px]'
                          : 'badge-clean font-mono text-[10px]'
                      }
                    >
                      {selectedItem.draft_status}
                    </span>
                  </div>

                  {!isEditingDraft && selectedItem.draft_status !== 'BLOCKED' && (
                    <button
                      onClick={() => setIsEditingDraft(true)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Draft</span>
                    </button>
                  )}
                </div>

                {isEditingDraft ? (
                  <div className="space-y-2.5">
                    <textarea
                      rows={4}
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      className="input-base font-mono"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setIsEditingDraft(false)} className="btn-secondary text-xs py-1.5 px-3">
                        Cancel
                      </button>
                      <button onClick={handleApproveDraft} className="btn-primary text-xs py-1.5 px-3">
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Authorize Draft</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                      {selectedItem.ai_response_draft || 'No automated response generated.'}
                    </div>

                    {selectedItem.draft_status === 'DRAFT_READY' && (
                      <div className="flex justify-end pt-1">
                        <button onClick={handleApproveDraft} className="btn-primary">
                          <Send className="w-3.5 h-3.5" />
                          <span>Approve & Schedule Dispatch</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400">
              <Mail className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs">Select an email to view full conversation and response draft</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};