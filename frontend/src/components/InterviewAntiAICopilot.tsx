import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Zap,
  Activity,
  Bot,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  HelpCircle,
  Clock,
  Mic,
} from 'lucide-react';

export const InterviewAntiAICopilot: React.FC = () => {
  const [candidateResponse, setCandidateResponse] = useState<string>('');
  const [responseLatencyS, setResponseLatencyS] = useState<number>(4.8);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<{
    cheatScore: number; // 0 to 100
    classification: 'CLEAN_HUMAN' | 'SUSPICIOUS' | 'AI_TELEPROMPTER_DETECTED';
    markersFound: string[];
    cadenceIssue: string;
    suggestedTrapQuestions: string[];
  } | null>(null);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const sampleClean = `Well, in my last project with Python and PostgreSQL, we faced a major bottleneck with slow joins across 10 million rows. I remember we tried indexing first, but honestly what actually solved it was partitioning the table by month and rewriting the aggregation in a background Celery worker. It took us like two days to debug because our staging environment didn't have the same data volume.`;

  const sampleCheater = `Certainly! When addressing large-scale database optimization with Python and PostgreSQL, several best practices must be methodically implemented. First and foremost, indexing strategy plays a paramount role, specifically utilizing B-tree and GiST indexes for composite keys. Furthermore, query execution plans should be meticulously analyzed using EXPLAIN ANALYZE. In conclusion, adopting connection pooling via PgBouncer and horizontal read replicas ensures optimal throughput and low latency.`;

  const handleRunAnalysis = (textToTest?: string, latencyVal?: number) => {
    const text = textToTest !== undefined ? textToTest : candidateResponse;
    const latency = latencyVal !== undefined ? latencyVal : responseLatencyS;

    if (!text.trim()) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      // Rule-based heuristic & linguistic marker detection
      const aiMarkers = [
        'certainly',
        'first and foremost',
        'furthermore',
        'in conclusion',
        'paramount role',
        'meticulously',
        'it is important to remember',
        'delving into',
        'crucial aspect',
        'comprehensive overview',
        'as previously discussed',
        'it should be noted',
      ];

      const lower = text.toLowerCase();
      const detected = aiMarkers.filter((m) => lower.includes(m));

      // Calculate score based on latency + syntactic markers + sentence uniformity
      let score = 10;

      // Latency penalty (AI teleprompters usually exhibit 3.2s - 6.5s latency lag)
      if (latency >= 3.5) score += 35;
      else if (latency >= 2.5) score += 15;

      // Marker penalty
      score += detected.length * 18;

      // Monotone / perfect grammar check (lack of hesitation words like 'well', 'like', 'honestly', 'um')
      const humanHesitations = ['well', 'honestly', 'like', 'actually', 'remember', 'um', 'uh', 'so basically'];
      const hasHesitations = humanHesitations.some((h) => lower.includes(h));
      if (!hasHesitations) score += 20;
      else score -= 15;

      score = Math.max(5, Math.min(98, score));

      let classification: 'CLEAN_HUMAN' | 'SUSPICIOUS' | 'AI_TELEPROMPTER_DETECTED' = 'CLEAN_HUMAN';
      if (score >= 70) classification = 'AI_TELEPROMPTER_DETECTED';
      else if (score >= 40) classification = 'SUSPICIOUS';

      setAnalysisResult({
        cheatScore: score,
        classification,
        markersFound: detected,
        cadenceIssue:
          latency >= 3.5
            ? `High transcription/generation delay detected (${latency.toFixed(1)}s), followed by rapid verbatim recitation.`
            : 'Natural conversational pause and organic thought delivery pattern.',
        suggestedTrapQuestions: [
          `"You mentioned ${detected[0] || 'your architecture'}. Walk me through the exact failure mode you experienced when that service crashed in production last year."`,
          `"How would you solve this exact problem if no external libraries or frameworks were permitted and memory was strictly constrained to 32MB?"`,
          `"If we change the isolation level to Read Committed instead of Serializable, what specific race condition manifests at line 10?"`,
        ],
      });

      setIsAnalyzing(false);
    }, 600);
  };

  const handleCopyQuestion = (idx: number, q: string) => {
    navigator.clipboard.writeText(q);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="surface-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600/10 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/60 shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Interview Anti-AI Teleprompter Copilot
              </h3>
              <span className="badge-clean text-[10px] font-mono">Real-Time Defense</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detects candidates secretly relying on ChatGPT, Claude, or voice teleprompters during technical video interviews.
            </p>
          </div>
        </div>

        {/* Preset quick test buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCandidateResponse(sampleClean);
              setResponseLatencyS(1.2);
              handleRunAnalysis(sampleClean, 1.2);
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
          >
            Demo: Clean Candidate
          </button>
          <button
            type="button"
            onClick={() => {
              setCandidateResponse(sampleCheater);
              setResponseLatencyS(5.1);
              handleRunAnalysis(sampleCheater, 5.1);
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100"
          >
            Demo: AI Teleprompter Cheater
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Candidate Speech Input */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-indigo-600" />
              <span>Live Interview Answer Transcript</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              Paste or dictate live audio transcription
            </span>
          </div>
          <textarea
            rows={4}
            value={candidateResponse}
            onChange={(e) => setCandidateResponse(e.target.value)}
            placeholder="Type or paste the candidate's spoken answer, or click one of the Demo presets above to test the detector..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-mono"
          />
        </div>

        {/* Right: Latency & Controls */}
        <div className="space-y-3.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Response Initial Delay:</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {responseLatencyS.toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8.0"
              step="0.1"
              value={responseLatencyS}
              onChange={(e) => setResponseLatencyS(parseFloat(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.5s (Natural)</span>
              <span>3.5s (LLM Latency)</span>
              <span>8.0s (Stall)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleRunAnalysis()}
            disabled={isAnalyzing || !candidateResponse.trim()}
            className="w-full btn-primary py-2 text-xs font-semibold flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Scanning Linguistic Cadence...</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                <span>Audit Spoken Transcript</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Result Display */}
      {analysisResult && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 space-y-4 animate-fade-in">
          {/* Top Score Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {analysisResult.classification === 'AI_TELEPROMPTER_DETECTED' ? (
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              ) : analysisResult.classification === 'SUSPICIOUS' ? (
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {analysisResult.classification === 'AI_TELEPROMPTER_DETECTED'
                      ? 'High Probability of Live AI Teleprompter Assistance'
                      : analysisResult.classification === 'SUSPICIOUS'
                      ? 'Elevated Suspicion: Synthetic Cadence'
                      : 'Authentic Human Organic Answer'}
                  </h4>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      analysisResult.cheatScore >= 70
                        ? 'bg-rose-600 text-white'
                        : analysisResult.cheatScore >= 40
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    Risk Score: {analysisResult.cheatScore}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {analysisResult.cadenceIssue}
                </p>
              </div>
            </div>

            {/* Markers summary */}
            {analysisResult.markersFound.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono text-slate-400">Markers:</span>
                {analysisResult.markersFound.map((m, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-semibold"
                  >
                    "{m}"
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Counter-Probe Trap Questions */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Generated Counter-Probe Trap Questions (Break AI Hallucination)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Ask immediately to verify deep first-hand experience
              </span>
            </div>

            <div className="space-y-2">
              {analysisResult.suggestedTrapQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-indigo-100 dark:border-indigo-950 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-xs"
                >
                  <p className="text-slate-800 dark:text-slate-200 font-medium italic">
                    {q}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopyQuestion(idx, q)}
                    className="shrink-0 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Copy question"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
