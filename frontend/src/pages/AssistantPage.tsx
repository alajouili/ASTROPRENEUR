import React, { useEffect, useRef, useState } from 'react';
import { api, AssistantAnswer, AssistantStatus, AssistantTurn } from '../services/api';
import {
  ArrowUp,
  BookOpen,
  Bot,
  Check,
  Copy,
  FileText,
  Info,
  RefreshCw,
  RotateCcw,
  SearchX,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';

const MAX_LENGTH = 1000;

const SUGGESTIONS = [
  'How many days of annual leave do I get?',
  'How many days a week can I work remotely?',
  'What is the yearly training budget?',
  'How long is paternity leave?',
  'How do I ask for my personal data to be deleted?',
];

type Message =
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'answer'; reply: AssistantAnswer }
  | { id: string; kind: 'error'; text: string; question: string };

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const describeMode = (mode: string) => {
  if (mode.startsWith('sample data')) return { label: 'Sample data', tone: 'badge-warning', detail: 'Pre-written examples only, nothing comes from the backend.' };
  if (mode.includes('offline') || mode.includes('SIMULATED'))
    return { label: 'Offline mode', tone: 'badge-warning', detail: 'No AI model is configured: answers quote the most relevant policy text directly.' };
  return { label: 'AI model', tone: 'badge-clean', detail: `Answers are written by ${mode} from the policy documents only, with their sources.` };
};

export const AssistantPage: React.FC = () => {
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.getAssistantStatus().then(setStatus).catch((e) => setStatusError(e.message || 'The assistant is unavailable.'));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  // The conversation sent as context: questions and the assistant's answers (errors excluded).
  const history = (): AssistantTurn[] =>
    messages.flatMap<AssistantTurn>((m) =>
      m.kind === 'user' ? [{ role: 'user', content: m.text }] : m.kind === 'answer' ? [{ role: 'assistant', content: m.reply.answer }] : []
    );

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || isSending) return;
    const context = history();
    setMessages((prev) => [...prev, { id: newId(), kind: 'user', text: question }]);
    setInput('');
    setIsSending(true);
    try {
      const reply = await api.askAssistant(question, context);
      setMessages((prev) => [...prev, { id: newId(), kind: 'answer', reply }]);
    } catch (e: any) {
      const message =
        e?.status === 429
          ? 'Too many questions in a short time. Wait a minute, then try again.'
          : e?.message || 'The assistant could not be reached.';
      setMessages((prev) => [...prev, { id: newId(), kind: 'error', text: message, question }]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const retry = (msg: Extract<Message, { kind: 'error' }>) => {
    // Remove the failed exchange, then ask again.
    setMessages((prev) => {
      const i = prev.findIndex((m) => m.id === msg.id);
      return prev.filter((_, j) => j !== i && j !== i - 1);
    });
    send(msg.question);
  };

  const copy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const mode = status ? describeMode(status.mode) : null;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4 h-[calc(100vh-9.5rem)] min-h-[520px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">Policy assistant</h2>
          <p className="page-subtitle">Ask about leave, remote work, benefits, training or your personal data.</p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="btn-secondary self-start sm:self-auto" disabled={isSending}>
            <RotateCcw className="w-4 h-4" />
            New conversation
          </button>
        )}
      </div>

      {/* Status */}
      {statusError ? (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <TriangleAlert className="w-4 h-4 shrink-0" /> {statusError}
        </div>
      ) : mode ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
          <span className={mode.tone}>{mode.label}</span>
          <span>{mode.detail}</span>
          {status && status.documents.length > 0 && (
            <span className="inline-flex items-center gap-1" title={status.documents.join('\n')}>
              <BookOpen className="w-3.5 h-3.5" /> {status.documents.length} documents available to you
            </span>
          )}
        </div>
      ) : (
        <div className="skeleton h-5 w-80" />
      )}

      {/* Conversation */}
      <div className="surface-card flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5" aria-live="polite">
          {messages.length === 0 && (
            <div className="empty-state h-full">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1">
                <Bot className="w-5 h-5" />
              </div>
              <div className="text-base font-medium text-slate-900 dark:text-white">How can I help?</div>
              <p className="max-w-md">
                I answer from the company's HR policy documents only and show where each answer comes from. I can't see
                information about candidates or other employees.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-2xl">
                {SUGGESTIONS.map((q) => (
                  <button key={q} onClick={() => send(q)} className="btn-secondary text-xs py-1.5 font-normal">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            if (m.kind === 'user') {
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-md bg-indigo-600 text-white text-sm whitespace-pre-wrap break-words">
                    {m.text}
                  </div>
                </div>
              );
            }
            if (m.kind === 'error') {
              return (
                <div key={m.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                    <TriangleAlert className="w-4 h-4" />
                  </div>
                  <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-md border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 text-sm text-rose-800 dark:text-rose-200">
                    <p>{m.text}</p>
                    <button onClick={() => retry(m)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium hover:underline" disabled={isSending}>
                      <RefreshCw className="w-3.5 h-3.5" /> Try again
                    </button>
                  </div>
                </div>
              );
            }
            const { reply } = m;
            return (
              <div key={m.id} className="flex gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    reply.flagged
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'
                      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                  }`}
                >
                  {reply.flagged ? <ShieldAlert className="w-4 h-4" /> : reply.found ? <Bot className="w-4 h-4" /> : <SearchX className="w-4 h-4" />}
                </div>
                <div className="min-w-0 max-w-[85%] space-y-2">
                  <div className="group relative px-4 py-3 rounded-2xl rounded-tl-md bg-slate-100 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">
                    {reply.answer}
                    <button
                      onClick={() => copy(m.id, reply.answer)}
                      className="absolute -right-9 top-1 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      aria-label="Copy answer"
                    >
                      {copiedId === m.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {reply.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {reply.sources.map((src) => (
                        <span
                          key={src.id}
                          title={src.excerpt || undefined}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          {src.document}
                          {src.section && <span className="text-slate-400">› {src.section}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  {reply.notice && (
                    <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{reply.notice}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3" role="status" aria-label="The assistant is answering">
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
                <span className="sr-only">Searching the policies</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4"
        >
          <div className="flex items-end gap-2">
            <label htmlFor="assistant-input" className="sr-only">Your question</label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={MAX_LENGTH}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask a question about a company policy…"
              className="input-base resize-none max-h-40 py-2.5"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="btn-primary h-[42px] w-[42px] p-0 shrink-0"
              aria-label="Send question"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-between mt-1.5 px-1 text-xs text-slate-400">
            <span>Enter to send · Shift+Enter for a new line</span>
            {input.length > MAX_LENGTH * 0.8 && <span>{input.length}/{MAX_LENGTH}</span>}
          </div>
        </form>
      </div>
    </div>
  );
};
