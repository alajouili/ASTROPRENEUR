import React, { useState, useEffect } from 'react';
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
      await api.updateInboxDraft(selectedItem.id, draftContent, true);
      setFeedback(`Draft response for "${selectedItem.sender}" approved and queued!`);
      setIsEditingDraft(false);
      loadInbox();
    } catch (e: any) {
      setFeedback(`Error approving draft: ${e.message}`);
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
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Inbox Triage & Daily Digest</h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Inbound Parser Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated email triage categorized by urgency and intent. Adversarial emails with prompt injections are quarantined before recruiter viewing.
          </p>
        </div>

        {/* Needs human toggle */}
        <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <label className="text-xs font-semibold text-slate-300 cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={needsHumanOnly}
              onChange={(e) => setNeedsHumanOnly(e.target.checked)}
              className="rounded text-sky-500 focus:ring-sky-500 w-4 h-4 cursor-pointer bg-slate-900 border-slate-700"
            />
            <span>Needs Human Review Only</span>
          </label>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex justify-between items-center shadow-lg">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-400 hover:text-white font-bold px-2 py-0.5 rounded hover:bg-emerald-900/50">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-slate-800/80 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-mono uppercase tracking-wider">Urgency:</span>
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((urg) => (
            <button
              key={urg}
              onClick={() => setUrgencyFilter(urg)}
              className={`px-3 py-1 rounded-xl font-mono text-xs font-semibold transition-all border ${
                urgencyFilter === urg
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                  : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-slate-800/80'
              }`}
            >
              {urg}
            </button>
          ))}

          <span className="text-slate-700 mx-1">|</span>

          <span className="text-slate-400 font-mono uppercase tracking-wider">Type:</span>
          {(['ALL', 'AVAILABILITY', 'STATUS_INQUIRY', 'SUSPICIOUS'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-xl font-mono text-xs font-semibold transition-all border ${
                typeFilter === t
                  ? t === 'SUSPICIOUS'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                  : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-slate-800/80'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search sender, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-700/80 rounded-xl text-xs bg-slate-950/80 text-white placeholder:text-slate-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Email List Column */}
        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden divide-y divide-slate-800/70 max-h-[700px] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Mail className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-medium">No emails matching current filters</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const isSuspicious = item.type === 'SUSPICIOUS';
              const urgencyColor =
                item.urgency === 'HIGH'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                  : item.urgency === 'MEDIUM'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700';

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`p-4 cursor-pointer transition-all relative ${
                    isSelected
                      ? 'bg-sky-950/40 border-l-4 border-l-sky-500 shadow-[inset_0_0_15px_rgba(14,165,233,0.15)]'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-white truncate">{item.sender}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-200 truncate mb-1">{item.subject}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                    {item.summary}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                    <span className={`px-2 py-0.5 rounded ${urgencyColor}`}>
                      {item.urgency}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded font-semibold ${
                        isSuspicious
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                          : 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {item.type.replace('_', ' ')}
                    </span>

                    {item.needs_human && (
                      <span className="px-2 py-0.5 rounded font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
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
        <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl p-6 space-y-6">
          {selectedItem ? (
            <div className="space-y-6">
              {/* Message Header */}
              <div className="border-b border-slate-800/80 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-extrabold text-white">{selectedItem.subject}</h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-slate-300">{selectedItem.sender}</span>
                      <span>&bull;</span>
                      <span>{new Date(selectedItem.received_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                      selectedItem.urgency === 'HIGH'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                        : selectedItem.urgency === 'MEDIUM'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {selectedItem.urgency} Priority
                  </span>
                </div>
              </div>

              {/* Adversarial Alert Banner if Suspicious */}
              {selectedItem.type === 'SUSPICIOUS' && (
                <div className="p-4 bg-rose-950/50 border border-rose-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-rose-300">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Adversarial Prompt Injection Intercepted</span>
                  </div>
                  <p className="text-xs text-rose-200/80">
                    This email contained adversarial instructions designed to trick automated recruitment responders into executing unauthorized actions.
                  </p>
                  {selectedItem.quarantined_snippet && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-rose-500/30 font-mono text-[11px] text-slate-300">
                      Quarantined Payload: "{selectedItem.quarantined_snippet}"
                    </div>
                  )}
                </div>
              )}

              {/* Message Body */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {selectedItem.body}
              </div>

              {/* AI Draft Response & Approval Area */}
              <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>AI Proposed Response Draft</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                        selectedItem.draft_status === 'BLOCKED'
                          ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                          : selectedItem.draft_status === 'DRAFT_READY'
                          ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {selectedItem.draft_status}
                    </span>
                  </div>

                  {!isEditingDraft && selectedItem.draft_status !== 'BLOCKED' && (
                    <button
                      onClick={() => setIsEditingDraft(true)}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Draft</span>
                    </button>
                  )}
                </div>

                {isEditingDraft ? (
                  <div className="space-y-3">
                    <textarea
                      rows={5}
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingDraft(false)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleApproveDraft}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Authorize Draft</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                      {selectedItem.ai_response_draft || 'No automated response generated.'}
                    </div>

                    {selectedItem.draft_status === 'DRAFT_READY' && (
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={handleApproveDraft}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)] transition-all transform active:scale-95"
                        >
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
            <div className="p-16 text-center text-slate-500">
              <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm">Select an email to view full conversation and response draft</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};