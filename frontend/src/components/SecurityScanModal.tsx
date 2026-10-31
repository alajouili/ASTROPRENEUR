import React, { useState } from 'react';
import { api, ScanPdfResponse } from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  FileText,
  X,
  AlertTriangle,
  Search,
  CheckCircle2,
  Lock,
  Layers,
  Cpu,
} from 'lucide-react';

interface SecurityScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFile?: File | null;
}

export const SecurityScanModal: React.FC<SecurityScanModalProps> = ({
  isOpen,
  onClose,
  initialFile,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile || null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanPdfResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setScanResult(null);
      setError(null);
    }
  };

  const runScan = async (fileToScan?: File) => {
    const file = fileToScan || selectedFile;
    if (!file) return;
    setIsScanning(true);
    setError(null);
    try {
      const res = await api.scanPdf(file);
      setScanResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to inspect document.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/70 dark:bg-slate-850">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Live Document Forensic & Injection Scanner
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Member 2 Security Deliverable: PyMuPDF binary extraction (white-text, micro-fonts) + Prompt Guard ML classifier.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* File Picker / Dropzone */}
          <div className="surface-card p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-center gap-3">
            <UploadCloud className="w-8 h-8 text-indigo-500" />
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {selectedFile ? selectedFile.name : 'Choose any PDF or candidate CV to scan'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Inspects invisible text, homoglyphs, and prompt injection patterns in real time
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <label className="btn-secondary text-xs cursor-pointer">
                <span>Select Document</span>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <button
                  onClick={() => runScan()}
                  disabled={isScanning}
                  className="btn-primary text-xs"
                >
                  {isScanning ? 'Inspecting...' : 'Run Forensic Scan'}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Display */}
          {scanResult && (
            <div className="space-y-4 animate-fade-in">
              {/* Verdict Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  scanResult.is_malicious
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {scanResult.is_malicious ? (
                    <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold">
                      {scanResult.is_malicious
                        ? 'SECURITY ALERT: Document Quarantined'
                        : 'CLEAN: No Adversarial Threat Detected'}
                    </h3>
                    <p className="text-xs opacity-90 mt-0.5">
                      File: {scanResult.filename} &bull; Total Chars: {scanResult.total_chars_analyzed}
                    </p>
                  </div>
                </div>
                <span
                  className={`badge font-mono text-xs uppercase ${
                    scanResult.is_malicious ? 'badge-danger' : 'badge-clean'
                  }`}
                >
                  Risk: {scanResult.risk_level}
                </span>
              </div>

              {/* Hidden Text Findings */}
              <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>Binary Hidden Text Inspection (PyMuPDF)</span>
                  </div>
                  <span className="badge-neutral font-mono text-[10px]">
                    {scanResult.hidden_text_flags.length} Segments Detected
                  </span>
                </div>
                {scanResult.hidden_text_flags.length > 0 ? (
                  <ul className="space-y-2 pt-1">
                    {scanResult.hidden_text_flags.map((flag, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs font-mono text-rose-800 dark:text-rose-300"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold pb-1 text-rose-700 dark:text-rose-400">
                          <span>Reason: {flag.reason}</span>
                          <span className="text-[10px] uppercase">[Quarantined]</span>
                        </div>
                        <p className="text-xs">&ldquo;{flag.text}&rdquo;</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1">
                    Zero white-on-white text, microscopic fonts, or off-page text found.
                  </p>
                )}
              </div>

              {/* Regex & Prompt Guard Flags */}
              <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-500" />
                    <span>Prompt Injection Pattern Detection</span>
                  </div>
                  <span className="badge-neutral font-mono text-[10px]">
                    {scanResult.regex_flags.length} Triggers
                  </span>
                </div>
                {scanResult.regex_flags.length > 0 ? (
                  <ul className="space-y-1.5 pt-1">
                    {scanResult.regex_flags.map((rf, idx) => (
                      <li
                        key={idx}
                        className="p-2 rounded bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs font-mono text-amber-800 dark:text-amber-300"
                      >
                        <span className="font-bold">{rf.code}</span>: {rf.description || rf.match}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1">
                    No prompt injection or override phrases detected.
                  </p>
                )}
              </div>

              {/* Clean Preview */}
              <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Guarded Visible Text Preview (Sent to LLM / Agent)
                </h4>
                <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {scanResult.clean_text_preview || 'No visible text extracted.'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
