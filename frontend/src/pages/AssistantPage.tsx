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
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Employee Policy Assistant</h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.25)]">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Verifiable RAG
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Grounded Q&A over internal company policies, benefits, leave, and GDPR rights with verifiable source citations.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-500/30 font-semibold font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Hallucination-Protected</span>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div>
        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
          Frequently Consulted Policies
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs font-medium bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-slate-800 shadow-sm transition-all flex items-center gap-2 text-left"
            >
              <span>{q}</span>
              <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread Area */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl flex flex-col h-[520px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {messages.map((m) => {
            const isUser = m.sender === 'user';

            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                    isUser ? 'bg-sky-600 shadow-[0_0_10px_rgba(14,165,233,0.4)]' : 'bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble & Metadata */}
                <div className="space-y-2">
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none space-y-3'
                    }`}
                  >
                    <p>{m.text}</p>

                    {/* Verifiable Citation Card if Assistant */}
                    {m.citation && (
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-purple-300 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                            <span>Verifiable Source:</span>
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 font-bold">
                            {(m.citation.confidence * 100).toFixed(0)}% Confidence Match
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                          {m.citation.source}
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span>Section: {m.citation.section}</span>
                          <button
                            onClick={() => handleCopy(m.id, m.text)}
                            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copied</span>
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

                  <span className={`block text-[10px] text-slate-500 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-center text-xs text-slate-400">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]"></div>
                <span className="text-[11px] text-slate-400 ml-1 font-mono">Searching employee handbook...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/70">
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
              className="flex-1 p-3 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="flex items-center gap-1.5 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Ask Policy Bot</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};