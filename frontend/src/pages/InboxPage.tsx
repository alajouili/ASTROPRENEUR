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
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Inbox Triage & Daily Digest</h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Inbound Parser Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automated email triage categorized by urgency and intent. Suspicious emails with prompt injections are quarantined before recruiter viewing.
          </p>
        </div>

        {/* Needs human toggle */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <label className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={needsHumanOnly}
              onChange={(e) => setNeedsHumanOnly(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
            />
            <span>Needs Human Review Only</span>
          </label>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">Urgency:</span>
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((urg) => (
            <button
              key={urg}
              onClick={() => setUrgencyFilter(urg)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                urgencyFilter === urg ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {urg}
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          <span className="text-slate-400 font-medium">Type:</span>
          {(['ALL', 'AVAILABILITY', 'STATUS_INQUIRY', 'SUSPICIOUS'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                typeFilter === t
                  ? t === 'SUSPICIOUS'
                    ? 'bg-rose-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Email List Column */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium">No emails matching current filters</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const isSuspicious = item.type === 'SUSPICIOUS';
              const urgencyColor =
                item.urgency === 'HIGH'
                  ? 'bg-rose-100 text-rose-800'
                  : item.urgency === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700';

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`p-4 cursor-pointer transition-colors relative ${
                    isSelected ? 'bg-sky-50/70 border-l-4 border-l-sky-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-slate-900 truncate">{item.sender}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-800 truncate mb-1.5">{item.subject}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
                    {item.summary}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-bold ${urgencyColor}`}>
                      {item.urgency}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded font-semibold ${
                        isSuspicious
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {item.type.replace('_', ' ')}
                    </span>

                    {item.needs_human && (
                      <span className="px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-800 border border-amber-200">
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
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          {selectedItem ? (
            <div className="space-y-6">
              {/* Message Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedItem.subject}</h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">{selectedItem.sender}</span>
                      <span>&bull;</span>
                      <span>{new Date(selectedItem.received_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedItem.urgency === 'HIGH'
                        ? 'bg-rose-100 text-rose-800'
                        : selectedItem.urgency === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {selectedItem.urgency} Priority
                  </span>
                </div>
              </div>

              {/* Adversarial Alert Banner if Suspicious */}
              {selectedItem.type === 'SUSPICIOUS' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Adversarial Prompt Injection Intercepted</span>
                  </div>
                  <p className="text-xs text-rose-700">
                    This email contained adversarial system token instructions designed to trick automated recruitment responders into executing unauthorized actions.
                  </p>
                  {selectedItem.quarantined_snippet && (
                    <div className="p-2.5 rounded bg-white border border-rose-200 font-mono text-[11px] text-slate-800">
                      Quarantined Payload: "{selectedItem.quarantined_snippet}"
                    </div>
                  )}
                </div>
              )}

              {/* Message Body */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                {selectedItem.body}
              </div>

              {/* AI Draft Response & Approval Area */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>AI Proposed Response Draft</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        selectedItem.draft_status === 'BLOCKED'
                          ? 'bg-rose-100 text-rose-800'
                          : selectedItem.draft_status === 'DRAFT_READY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {selectedItem.draft_status}
                    </span>
                  </div>

                  {!isEditingDraft && selectedItem.draft_status !== 'BLOCKED' && (
                    <button
                      onClick={() => setIsEditingDraft(true)}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
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
                      className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingDraft(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleApproveDraft}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Authorize Draft</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                      {selectedItem.ai_response_draft || 'No automated response generated.'}
                    </div>

                    {selectedItem.draft_status === 'DRAFT_READY' && (
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={handleApproveDraft}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors"
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
            <div className="p-12 text-center text-slate-400">
              <Mail className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm">Select an email to view full conversation and response draft</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
