import React, { useState, useEffect } from 'react';
import { api, SchedulingSlot } from '../services/api';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  Plus,
  Send,
  User,
  AlertCircle,
  Briefcase,
  Sparkles,
} from 'lucide-react';

const DAYS_OF_WEEK: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

export const SchedulingPage: React.FC = () => {
  const [slots, setSlots] = useState<SchedulingSlot[]>([]);
  const [isProposerOpen, setIsProposerOpen] = useState<boolean>(false);
  const [candidateName, setCandidateName] = useState<string>('Amira Ben Salah');
  const [candidateEmail, setCandidateEmail] = useState<string>('amira.bensalah@topmail.tn');
  const [role, setRole] = useState<string>('Senior Backend Engineer');
  const [interviewer, setInterviewer] = useState<string>('Sarah (Lead Architect)');
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Wednesday');
  const [selectedTime, setSelectedTime] = useState<string>('14:00 - 15:00 UTC');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      const data = await api.getSchedulingSlots();
      setSlots(data);
    } catch (e) {
      console.error('Failed to load slots', e);
    }
  };

  const handleProposeSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.proposeSlot(candidateName, role, interviewer, selectedDay, selectedTime, candidateEmail);
      setFeedback(`New interview slot proposed for ${candidateName} on ${selectedDay} at ${selectedTime}. Queued in Human Approval Queue!`);
      setIsProposerOpen(false);
      loadSlots();
    } catch (err: any) {
      setFeedback(`Error proposing slot: ${err.message}`);
    }
  };

  const handleConfirmSlot = async (slotId: string) => {
    try {
      await api.confirmSlot(slotId);
      setFeedback('Interview slot marked as CONFIRMED on calendar!');
      loadSlots();
    } catch (err: any) {
      setFeedback(`Error confirming slot: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Recruiter Interview Scheduling</h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Week Calendar View
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual calendar grid displaying proposed vs confirmed interview slots. Proposing a slot automatically routes an email draft to the Human Approval Queue.
          </p>
        </div>

        <button
          onClick={() => setIsProposerOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-[0_0_15px_-3px_rgba(14,165,233,0.4)] transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Propose Interview Slot</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-sky-950/80 border border-sky-500/40 text-xs font-semibold text-sky-200 flex justify-between items-center shadow-lg">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-sky-400 hover:text-white font-bold px-2 py-0.5 rounded hover:bg-sky-900/50">
            Dismiss
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-medium text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
          <span>Confirmed Interview</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
          <span>Proposed Slot (Pending Recruiter Sign-off)</span>
        </div>
      </div>

      {/* Week Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {DAYS_OF_WEEK.map((day) => {
          const daySlots = slots.filter((s) => s.day === day);

          return (
            <div key={day} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl flex flex-col min-h-[420px] overflow-hidden">
              {/* Day Header */}
              <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/70 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">{day}</span>
                <span className="block text-[11px] text-slate-500 mt-0.5 font-mono">
                  {day === 'Monday' ? 'Nov 2' : day === 'Tuesday' ? 'Nov 3' : day === 'Wednesday' ? 'Nov 4' : day === 'Thursday' ? 'Nov 5' : 'Nov 6'}
                </span>
              </div>

              {/* Day Slots Body */}
              <div className="p-3 space-y-3 flex-1 flex flex-col">
                {daySlots.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-4 text-center">
                    <Clock className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-[11px] font-mono">No slots scheduled</span>
                  </div>
                ) : (
                  daySlots.map((slot) => {
                    const isConfirmed = slot.status === 'CONFIRMED';

                    return (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                          isConfirmed
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                            : 'bg-amber-950/30 border-amber-500/30 text-amber-200 border-dashed'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              isConfirmed ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {slot.status}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{slot.time}</span>
                        </div>

                        <div>
                          <div className="font-bold text-white">{slot.candidate_name}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{slot.role}</div>
                        </div>

                        <div className="text-[11px] text-slate-300 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                          Interviewer: <strong className="text-white">{slot.interviewer}</strong>
                        </div>

                        {!isConfirmed && (
                          <button
                            onClick={() => handleConfirmSlot(slot.id)}
                            className="w-full mt-1 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Slot</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Propose Slot Modal */}
      {isProposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-slate-100">
          <div className="bg-slate-900/95 rounded-3xl shadow-2xl border border-slate-800/90 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-800/80 bg-slate-950/70 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-white text-base">Propose Interview Slot</h3>
              </div>
              <button
                onClick={() => setIsProposerOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleProposeSlot} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Candidate Name:</label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Candidate Email:</label>
                <input
                  type="email"
                  required
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Role:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white"
                  >
                    <option value="Senior Backend Engineer">Senior Backend Engineer</option>
                    <option value="Lead DevOps & Cloud SRE">Lead DevOps & Cloud SRE</option>
                    <option value="AI Ethics & Compliance Officer">AI Ethics & Compliance Officer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Lead Interviewer:</label>
                  <select
                    value={interviewer}
                    onChange={(e) => setInterviewer(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white"
                  >
                    <option value="Sarah (Lead Architect)">Sarah (Lead Architect)</option>
                    <option value="Dave (Engineering VP)">Dave (Engineering VP)</option>
                    <option value="Claire (Head of Legal)">Claire (Head of Legal)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Day of Week:</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Time Window (UTC):</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white font-mono"
                  >
                    <option value="10:00 - 11:00 UTC">10:00 - 11:00 UTC (Morning)</option>
                    <option value="11:30 - 12:30 UTC">11:30 - 12:30 UTC (Midday)</option>
                    <option value="14:00 - 15:00 UTC">14:00 - 15:00 UTC (Afternoon)</option>
                    <option value="16:00 - 17:00 UTC">16:00 - 17:00 UTC (Late)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-amber-950/40 rounded-xl border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
                <strong className="text-amber-300">Golden Rule Enforcement:</strong> Proposing this slot will not send an automated invitation to the candidate. It creates an actionable draft in the <strong className="text-white">Human Approval Queue</strong> for recruiter review.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProposerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Propose Slot & Queue Approval</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};