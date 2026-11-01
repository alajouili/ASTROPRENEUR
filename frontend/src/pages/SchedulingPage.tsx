import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, PersistentInterview } from '../services/api';
import { InterviewAntiAICopilot } from '../components/InterviewAntiAICopilot';
import {
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  CheckCircle2,
  Plus,
  Send,
  User,
  AlertCircle,
  Briefcase,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CalendarDays,
  CalendarRange,
  ListFilter,
  Video,
  Phone,
  MapPin,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

type CalendarViewMode = 'month' | 'week' | 'agenda';

export const SchedulingPage: React.FC = () => {
  const [interviews, setInterviews] = useState<PersistentInterview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [activeTab, setActiveTab] = useState<'calendar' | 'anti_ai_copilot'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [interviewerFilter, setInterviewerFilter] = useState<string>('');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState<boolean>(false);
  const [selectedInterview, setSelectedInterview] = useState<PersistentInterview | null>(null);
  
  // Form fields
  const [candidateName, setCandidateName] = useState<string>('Amira Ben Salah');
  const [candidateEmail, setCandidateEmail] = useState<string>('amira.bensalah@topmail.tn');
  const [role, setRole] = useState<string>('Senior Backend Engineer');
  const [interviewer, setInterviewer] = useState<string>('Sarah (Lead Architect)');
  const [interviewType, setInterviewType] = useState<'online' | 'phone' | 'in_person'>('online');
  const [meetingLocation, setMeetingLocation] = useState<string>('https://meet.google.com/trusthr-room');
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [interviewNotes, setInterviewNotes] = useState<string>('Focus on distributed database locks and concurrency handling.');
  const [routeToApproval, setRouteToApproval] = useState<boolean>(false);

  // Conflicts and feedback
  const [detectedConflicts, setDetectedConflicts] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadInterviews();
  }, [statusFilter, interviewerFilter]);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const data = await api.getInterviews({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        interviewer: interviewerFilter ? interviewerFilter : undefined,
      });
      setInterviews(data);
    } catch (e: any) {
      console.error('Failed to load interviews', e);
      setFeedback({ type: 'error', message: e.message || 'Failed to load interviews from database.' });
    } finally {
      setLoading(false);
    }
  };

  // Real-time conflict detection as form values change
  useEffect(() => {
    if (!isCreateModalOpen && !isRescheduleModalOpen) return;
    const checkTimer = setTimeout(async () => {
      if (!scheduledDateTime || !interviewer) return;
      try {
        const res = await api.checkInterviewConflicts({
          interviewer,
          candidate_email: candidateEmail,
          scheduled_at: new Date(scheduledDateTime).toISOString(),
          duration_minutes: durationMinutes,
        });
        setDetectedConflicts(res.conflicts || []);
      } catch {
        setDetectedConflicts([]);
      }
    }, 400);
    return () => clearTimeout(checkTimer);
  }, [scheduledDateTime, durationMinutes, interviewer, candidateEmail, isCreateModalOpen, isRescheduleModalOpen]);

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createInterview(
        {
          candidate_name: candidateName,
          candidate_email: candidateEmail,
          role,
          interviewer,
          interview_type: interviewType,
          location_or_link: meetingLocation,
          scheduled_at: new Date(scheduledDateTime).toISOString(),
          duration_minutes: durationMinutes,
          notes: interviewNotes,
          route_to_approval: routeToApproval,
        },
        detectedConflicts.length > 0 // force override if user still clicks proceed
      );
      if (res.mode === 'proposal_created') {
        setFeedback({
          type: 'info',
          message: `Interview proposal routed to Action Gateway (EU AI Act Art. 14 HITL Queue)!`,
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Interview confirmed & persisted in database for ${candidateName}!`,
        });
      }
      setIsCreateModalOpen(false);
      loadInterviews();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error scheduling interview.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;
    setSubmitting(true);
    try {
      await api.updateInterview(
        selectedInterview.id,
        {
          scheduled_at: new Date(scheduledDateTime).toISOString(),
          duration_minutes: durationMinutes,
          interviewer,
          interview_type: interviewType,
          location_or_link: meetingLocation,
          notes: interviewNotes,
        },
        detectedConflicts.length > 0
      );
      setFeedback({
        type: 'success',
        message: `Interview successfully rescheduled for ${selectedInterview.candidate_name}!`,
      });
      setIsRescheduleModalOpen(false);
      setSelectedInterview(null);
      loadInterviews();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error rescheduling interview.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInterview = async (id: string, candidateName: string) => {
    const reason = window.prompt(`Please provide a cancellation reason for ${candidateName}:`, 'Candidate schedule conflict');
    if (reason === null) return;
    try {
      await api.cancelInterview(id, reason);
      setFeedback({ type: 'info', message: `Interview cancelled and recorded in append-only audit log.` });
      loadInterviews();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error cancelling interview.' });
    }
  };

  const handleCompleteInterview = async (id: string, candidateName: string) => {
    const feedbackText = window.prompt(`Enter completion feedback or evaluation summary for ${candidateName}:`, 'Candidate demonstrated strong technical mastery.');
    if (feedbackText === null) return;
    try {
      await api.completeInterview(id, feedbackText);
      setFeedback({ type: 'success', message: `Interview marked as COMPLETED!` });
      loadInterviews();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error completing interview.' });
    }
  };

  // Helper date navigation
  const prevDate = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  };

  const nextDate = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  };

  const todayDate = () => setSelectedDate(new Date());

  const getWeekDays = () => {
    const current = new Date(selectedDate);
    const first = current.getDate() - current.getDay() + 1; // Monday start
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(current);
      next.setDate(first + i);
      days.push(next);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Status color pill
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="badge-clean text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800">Confirmed</span>;
      case 'scheduled':
        return <span className="badge-clean text-sky-700 bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800">Scheduled</span>;
      case 'completed':
        return <span className="badge-clean text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800">Completed</span>;
      case 'cancelled':
        return <span className="badge-clean text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 line-through">Cancelled</span>;
      default:
        return <span className="badge-clean">{status}</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'online':
        return <Video className="w-3.5 h-3.5 text-indigo-500" />;
      case 'phone':
        return <Phone className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Feedback Alert Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-sm animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
            {feedback.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            {feedback.type === 'info' && <Sparkles className="w-4 h-4 shrink-0 text-indigo-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner & Navigation Tabs */}
      <div className="surface-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recruitment Interview Calendar
            </h2>
            <span className="badge-clean text-emerald-600 border-emerald-300 dark:border-emerald-800">
              Database Persistent (PostgreSQL / SQLite)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real interview scheduling with double-booking collision prevention and Article 14 Human Action Gateway routing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main workspace tabs */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 inline mr-1.5" />
              Calendar Workspace
            </button>
            <button
              onClick={() => setActiveTab('anti_ai_copilot')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'anti_ai_copilot'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 inline mr-1.5" />
              Anti-AI Teleprompter Monitor
            </button>
          </div>

          {activeTab === 'calendar' && (
            <button
              onClick={() => {
                setCandidateName('Amira Ben Salah');
                setCandidateEmail('amira.bensalah@topmail.tn');
                setRole('Senior Backend Engineer');
                setInterviewer('Sarah (Lead Architect)');
                setScheduledDateTime(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
                setIsCreateModalOpen(true);
              }}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Interview</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'anti_ai_copilot' ? (
        <InterviewAntiAICopilot />
      ) : (
        <div className="space-y-4">
          {/* Calendar Toolbar: Date Navigation & View Filters */}
          <div className="surface-card p-4 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={prevDate}
                className="btn-secondary p-1.5"
                title="Previous period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={todayDate}
                className="btn-secondary text-xs px-2.5 py-1.5 font-medium"
              >
                Today
              </button>
              <button
                onClick={nextDate}
                className="btn-secondary p-1.5"
                title="Next period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 ml-2">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* View Modes & Status Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    viewMode === 'week' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    viewMode === 'month' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode('agenda')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    viewMode === 'agenda' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Agenda List
                </button>
              </div>

              {/* Status filter dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
              >
                <option value="all">All Statuses ({interviews.length})</option>
                <option value="confirmed">Confirmed</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                onClick={loadInterviews}
                className="btn-secondary p-1.5"
                title="Refresh from database"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* VIEW: WEEK GRID */}
          {viewMode === 'week' && (
            <div className="surface-card overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-semibold bg-slate-50/70 dark:bg-slate-900/40">
                {weekDays.map((day, i) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={i}
                      className={`p-3 border-r last:border-r-0 border-slate-200 dark:border-slate-800 ${
                        isToday ? 'bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className={`inline-block mt-1 w-6 h-6 leading-6 rounded-full ${isToday ? 'bg-indigo-600 text-white' : ''}`}>
                        {day.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Day Columns */}
              <div className="grid grid-cols-7 min-h-[420px] divide-x divide-slate-200 dark:divide-slate-800">
                {weekDays.map((day, i) => {
                  const dayStr = day.toISOString().slice(0, 10);
                  const dayInterviews = interviews.filter((item) => {
                    if (!item.scheduled_at) return false;
                    return item.scheduled_at.slice(0, 10) === dayStr;
                  });

                  return (
                    <div key={i} className="p-2 space-y-2 bg-slate-50/20 dark:bg-slate-900/10 min-h-[140px]">
                      {dayInterviews.length === 0 ? (
                        <div className="text-[11px] text-slate-400 text-center py-6 select-none">
                          No slots
                        </div>
                      ) : (
                        dayInterviews.map((item) => {
                          const timeStr = new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div
                              key={item.id}
                              className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition-all hover:shadow-md cursor-pointer ${
                                item.status === 'confirmed'
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                                  : item.status === 'completed'
                                  ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60'
                                  : item.status === 'cancelled'
                                  ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              }`}
                              onClick={() => {
                                setSelectedInterview(item);
                                setCandidateName(item.candidate_name);
                                setCandidateEmail(item.candidate_email);
                                setRole(item.role);
                                setInterviewer(item.interviewer);
                                setInterviewType(item.interview_type as any);
                                setMeetingLocation(item.location_or_link || '');
                                setScheduledDateTime(new Date(item.scheduled_at).toISOString().slice(0, 16));
                                setDurationMinutes(item.duration_minutes);
                                setInterviewNotes(item.notes || '');
                                setIsRescheduleModalOpen(true);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {item.candidate_name}
                                </span>
                                {getTypeIcon(item.interview_type)}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>{timeStr} ({item.duration_minutes}m)</span>
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                                👤 {item.interviewer}
                              </div>
                              <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60">
                                {getStatusBadge(item.status)}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: AGENDA / LIST VIEW */}
          {(viewMode === 'agenda' || viewMode === 'month') && (
            <div className="surface-card divide-y divide-slate-200 dark:divide-slate-800">
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center text-xs font-semibold text-slate-500">
                <span>Total interviews: {interviews.length}</span>
                <span>Click any row to reschedule or edit</span>
              </div>
              {interviews.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No recruitment interviews recorded yet. Click "Schedule Interview" to create one.
                </div>
              ) : (
                interviews.map((item) => {
                  const dateObj = new Date(item.scheduled_at);
                  const formattedDate = dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                          {getTypeIcon(item.interview_type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">
                              {item.candidate_name}
                            </span>
                            <span className="text-xs text-slate-400">({item.candidate_email})</span>
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>💼 {item.role}</span>
                            <span>👤 Interviewer: {item.interviewer}</span>
                            <span>⏱️ {item.duration_minutes} mins</span>
                            {item.location_or_link && (
                              <span className="text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                {item.location_or_link.length > 30 ? item.location_or_link.slice(0, 30) + '...' : item.location_or_link}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                              "{item.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">{formattedDate}</div>
                          <div className="text-xs text-slate-400">{formattedTime} UTC</div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          {item.status !== 'completed' && item.status !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => handleCompleteInterview(item.id, item.candidate_name)}
                                className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800"
                                title="Mark Completed"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleCancelInterview(item.id, item.candidate_name)}
                                className="px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800"
                                title="Cancel Interview"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setSelectedInterview(item);
                              setCandidateName(item.candidate_name);
                              setCandidateEmail(item.candidate_email);
                              setRole(item.role);
                              setInterviewer(item.interviewer);
                              setInterviewType(item.interview_type as any);
                              setMeetingLocation(item.location_or_link || '');
                              setScheduledDateTime(new Date(item.scheduled_at).toISOString().slice(0, 16));
                              setDurationMinutes(item.duration_minutes);
                              setInterviewNotes(item.notes || '');
                              setIsRescheduleModalOpen(true);
                            }}
                            className="btn-secondary text-xs py-1"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: SCHEDULE NEW INTERVIEW */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="surface-card max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Schedule Recruitment Interview
                </h3>
                <p className="text-xs text-slate-500">
                  Select candidate, time slot, and interviewer with automated collision verification.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Overlap / Collision Warning Banner */}
            {detectedConflicts.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Scheduling Conflict Detected:</span>
                </div>
                {detectedConflicts.map((c, idx) => (
                  <div key={idx} className="ml-5 list-disc">• {c}</div>
                ))}
                <div className="text-[11px] text-amber-700 dark:text-amber-300 pt-1">
                  You may choose another time or proceed to force this booking.
                </div>
              </div>
            )}

            <form onSubmit={handleCreateInterview} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Candidate Name</label>
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Candidate Email</label>
                  <input
                    type="email"
                    required
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Target Position / Role</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Interviewer Assigned</label>
                  <input
                    type="text"
                    required
                    value={interviewer}
                    onChange={(e) => setInterviewer(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Type</label>
                  <select
                    value={interviewType}
                    onChange={(e: any) => setInterviewType(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="online">Online Video</option>
                    <option value="phone">Phone Screen</option>
                    <option value="in_person">In-Person (Office)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Date & Start Time (UTC)</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Meeting Link or Location</label>
                  <input
                    type="text"
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Recruiter Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              {/* EU AI Act Article 14 Route option */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={routeToApproval}
                    onChange={(e) => setRouteToApproval(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Route to Action Gateway for Formal Recruiter Sign-Off
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Enforces EU AI Act Article 14 Human-in-the-Loop review before dispatching candidate email hold.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Persisting...' : detectedConflicts.length > 0 ? 'Force Schedule Despite Conflict' : 'Confirm & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESCHEDULE / EDIT INTERVIEW */}
      {isRescheduleModalOpen && selectedInterview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="surface-card max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reschedule / Edit Interview
                </h3>
                <p className="text-xs text-slate-500">
                  Update time, interviewer, or notes for {selectedInterview.candidate_name}.
                </p>
              </div>
              <button
                onClick={() => setIsRescheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {detectedConflicts.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Rescheduling Collision Detected:</span>
                </div>
                {detectedConflicts.map((c, idx) => (
                  <div key={idx} className="ml-5 list-disc">• {c}</div>
                ))}
              </div>
            )}

            <form onSubmit={handleReschedule} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">New Date & Time (UTC)</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Interviewer</label>
                <input
                  type="text"
                  required
                  value={interviewer}
                  onChange={(e) => setInterviewer(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Meeting Link or Location</label>
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Recruiter Notes / Reason</label>
                <textarea
                  rows={3}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Save Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
