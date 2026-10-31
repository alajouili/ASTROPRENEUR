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
    <div className="space-y-4">
      {/* Roadmap Notice */}
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <span className="badge-warning text-[10px]">Preview (simulated)</span>
          <span>Calendar synchronization milestone M2/M3. Running on local simulated schedule dataset.</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="surface-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Recruiter Interview Scheduling
            </h2>
            <span className="badge-clean font-mono">
              Week Calendar View
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual calendar grid displaying proposed vs confirmed interview slots. Proposing a slot automatically routes an email draft to the Human Approval Queue.
          </p>
        </div>

        <button onClick={() => setIsProposerOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Propose Interview Slot</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Confirmed Interview</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>Proposed Slot (Pending Recruiter Sign-off)</span>
        </div>
      </div>

      {/* Week Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
        {DAYS_OF_WEEK.map((day) => {
          const daySlots = slots.filter((s) => s.day === day);

          return (
            <div key={day} className="surface-card flex flex-col min-h-[400px] overflow-hidden">
              {/* Day Header */}
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">{day}</span>
                <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                  {day === 'Monday' ? 'Nov 2' : day === 'Tuesday' ? 'Nov 3' : day === 'Wednesday' ? 'Nov 4' : day === 'Thursday' ? 'Nov 5' : 'Nov 6'}
                </span>
              </div>

              {/* Day Slots Body */}
              <div className="p-2.5 space-y-2.5 flex-1 flex flex-col">
                {daySlots.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <Clock className="w-5 h-5 mb-1 opacity-40" />
                    <span className="text-[11px] font-mono">No slots</span>
                  </div>
                ) : (
                  daySlots.map((slot) => {
                    const isConfirmed = slot.status === 'CONFIRMED';

                    return (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
                          isConfirmed
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                            : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 border-dashed'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className={isConfirmed ? 'badge-clean text-[10px]' : 'badge-warning text-[10px]'}
                          >
                            {slot.status}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{slot.time}</span>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{slot.candidate_name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{slot.role}</div>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                          Interviewer: <strong>{slot.interviewer}</strong>
                        </div>

                        {!isConfirmed && (
                          <button
                            onClick={() => handleConfirmSlot(slot.id)}
                            className="w-full mt-1 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Propose Interview Slot</h3>
              </div>
              <button
                onClick={() => setIsProposerOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleProposeSlot} className="p-5 sm:p-6 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Candidate Name:</label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Candidate Email:</label>
                <input
                  type="email"
                  required
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="input-base font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Role:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="input-base"
                  >
                    <option value="Senior Backend Engineer">Senior Backend Engineer</option>
                    <option value="Lead DevOps & Cloud SRE">Lead DevOps & Cloud SRE</option>
                    <option value="AI Ethics & Compliance Officer">AI Ethics & Compliance Officer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Lead Interviewer:</label>
                  <select
                    value={interviewer}
                    onChange={(e) => setInterviewer(e.target.value)}
                    className="input-base"
                  >
                    <option value="Sarah (Lead Architect)">Sarah (Lead Architect)</option>
                    <option value="Dave (Engineering VP)">Dave (Engineering VP)</option>
                    <option value="Claire (Head of Legal)">Claire (Head of Legal)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Day of Week:</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value as any)}
                    className="input-base"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Time Window (UTC):</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="input-base font-mono"
                  >
                    <option value="10:00 - 11:00 UTC">10:00 - 11:00 UTC (Morning)</option>
                    <option value="11:30 - 12:30 UTC">11:30 - 12:30 UTC (Midday)</option>
                    <option value="14:00 - 15:00 UTC">14:00 - 15:00 UTC (Afternoon)</option>
                    <option value="16:00 - 17:00 UTC">16:00 - 17:00 UTC (Late)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                <strong>Golden Rule Enforcement:</strong> Proposing this slot will not send an automated invitation to the candidate. It creates an actionable draft in the <strong>Human Approval Queue</strong> for recruiter review.
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsProposerOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
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