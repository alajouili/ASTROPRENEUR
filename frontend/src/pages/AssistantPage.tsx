import React, { useState } from 'react';
import { api, PolicyAnswer } from '../services/api';
import {
  Bot,
  Send,
  User,
  BookOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ThumbsUp,
  Copy,
  Check,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citation?: {
    source: string;
    confidence: number;
    section: string;
  };
}

const PRESET_QUESTIONS = [
  "What is our remote work and equipment allowance policy?",
  "How many days of paid maternity or paternity leave are provided?",
  "What is the annual education and conference budget per employee?",
  "How does TrustHR protect employee and applicant personal data under GDPR?",
  "What health insurance and mental wellness benefits are included?",
];

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-0',
      sender: 'assistant',
      text: "Hello! I am the TrustHR Employee Policy Assistant. I provide verifiable answers grounded exclusively in our verified corporate HR handbook and compliance documents. Every response includes exact source citations and confidence metrics.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputText('');
    setIsTyping(true);

    try {
      const res: PolicyAnswer = await api.askPolicyAssistant(textToSend);
      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citation: {
          source: res.source,
          confidence: res.confidence,
          section: res.section,
        },
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="surface-card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Employee Policy Assistant
            </h2>
            <span className="badge-info font-mono">
              Verifiable RAG
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Grounded Q&A over internal company policies, benefits, leave, and GDPR rights with verifiable source citations.
          </p>
        </div>

        <div className="badge-clean">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Hallucination-Protected</span>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-2">
          Frequently Consulted Policies
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs font-medium bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1.5 text-left cursor-pointer"
            >
              <span>{q}</span>
              <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread Area */}
      <div className="surface-card flex flex-col h-[500px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';

            return (
              <div
                key={m.id}
                className={`flex gap-2.5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs ${
                    isUser ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble & Metadata */}
                <div className="space-y-1.5">
                  <div
                    className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none space-y-2.5'
                    }`}
                  >
                    <p>{m.text}</p>

                    {/* Verifiable Citation Card if Assistant */}
                    {m.citation && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Verifiable Source:</span>
                          </span>
                          <span className="badge-info text-[10px]">
                            {(m.citation.confidence * 100).toFixed(0)}% Match
                          </span>
                        </div>

                        <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {m.citation.source}
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span>Section: {m.citation.section}</span>
                          <button
                            onClick={() => handleCopy(m.id, m.text)}
                            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <span className={`block text-[10px] text-slate-400 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-2.5 max-w-[85%] mr-auto items-center text-xs text-slate-400">
              <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-white">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></div>
                <span className="text-[11px] text-slate-500 ml-1 font-mono">Searching employee handbook...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask any policy, benefits, or compliance question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="input-base"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="btn-primary"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};