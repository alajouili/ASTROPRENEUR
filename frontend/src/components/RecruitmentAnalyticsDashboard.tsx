import React, { useState, useEffect } from 'react';
import { api, RecruitmentFunnel, ScoreDistribution, JobOffer } from '../services/api';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Users,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const RecruitmentAnalyticsDashboard: React.FC = () => {
  const [funnel, setFunnel] = useState<RecruitmentFunnel | null>(null);
  const [distribution, setDistribution] = useState<ScoreDistribution | null>(null);
  const [interviewsData, setInterviewsData] = useState<any | null>(null);
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [selectedJobId]);

  const loadJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch {
      // handled
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [fData, dData, iData] = await Promise.all([
        api.getAnalyticsFunnel(selectedJobId || undefined),
        api.getAnalyticsScoreDistribution(selectedJobId || undefined),
        api.getAnalyticsInterviews(),
      ]);
      setFunnel(fData);
      setDistribution(dData);
      setInterviewsData(iData);
    } catch (e) {
      console.error('Analytics load error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Analytics Toolbar */}
      <div className="surface-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recruitment Funnel & Evaluation Telemetry
            </h3>
            <p className="text-[11px] text-slate-500">
              Grounded metrics computed dynamically from candidate stage progressions and verified screenings.
            </p>
          </div>
        </div>

        {/* Job Filter Dropdown */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 flex-1 sm:w-56"
          >
            <option value="">All Job Offers (Aggregate)</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. RECRUITMENT FUNNEL */}
        <section className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pipeline Conversion Funnel
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Stage-by-stage progression with drop-off rates
              </p>
            </div>
            {funnel && (
              <span className="badge-clean text-emerald-600 font-mono text-xs">
                {funnel.overall_conversion}% Overall Conversion
              </span>
            )}
          </div>

          {loading || !funnel ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-8 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {funnel.stages.map((st, idx) => {
                const maxCount = funnel.stages[0]?.count || 1;
                const widthPercent = Math.max(12, Math.round((st.count / maxCount) * 100));

                return (
                  <div key={st.stage} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {idx + 1}. {st.stage}
                      </span>
                      <div className="flex items-center gap-2 tabular-nums">
                        <span className="font-bold text-slate-900 dark:text-white">{st.count}</span>
                        <span className="text-[11px] text-slate-400">({st.rate}%)</span>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: st.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. SCORE DISTRIBUTION & MUST-HAVES */}
        <section className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Candidate Score Distribution
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluation score tiers from verified factual quotes
              </p>
            </div>
            {distribution && (
              <span className="badge-clean text-indigo-600 font-mono text-xs">
                {distribution.total_evaluations} Evaluated
              </span>
            )}
          </div>

          {loading || !distribution ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-8 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2.5">
                {distribution.distribution.map((d) => {
                  const maxBin = Math.max(...distribution.distribution.map((item) => item.count), 1);
                  const barWidth = Math.max(8, Math.round((d.count / maxBin) * 100));

                  return (
                    <div key={d.range} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{d.range}</span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {d.count} candidates
                        </span>
                      </div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mandatory Criteria Pass Rate KPI */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Mandatory Criteria Compliance
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {distribution.must_have_compliance.passed_all_mandatory} passed all must-haves ·{' '}
                    {distribution.must_have_compliance.missing_mandatory} missing mandatory requirements
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {distribution.must_have_compliance.pass_rate}%
                  </div>
                  <div className="text-[10px] text-slate-400">Pass Rate</div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 3. INTERVIEWS & OPERATIONAL WORKLOAD */}
      {interviewsData && (
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Interview Workload & Operational Velocity
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Active interviews, interviewer bandwidth and channel distribution
              </p>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              Total {interviewsData.total_interviews} interviews on file
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
            {/* Status Breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">By Lifecycle Status</span>
              <div className="space-y-1.5">
                {interviewsData.status_breakdown.map((s: any) => (
                  <div key={s.status} className="flex justify-between items-center capitalize">
                    <span className="text-slate-500">{s.status}</span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Workload by Interviewer */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Interviewer Allocation</span>
              <div className="space-y-1.5">
                {interviewsData.interviewer_workload.length === 0 ? (
                  <div className="text-slate-400 text-[11px]">No interviewers assigned</div>
                ) : (
                  interviewsData.interviewer_workload.map((w: any) => (
                    <div key={w.interviewer} className="flex justify-between items-center truncate">
                      <span className="text-slate-500 truncate">{w.interviewer}</span>
                      <span className="font-semibold text-slate-900 dark:text-white tabular-nums ml-2">{w.interviews} slots</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Channels */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Interview Channels</span>
              <div className="space-y-1.5">
                {interviewsData.channel_breakdown.map((c: any) => (
                  <div key={c.type} className="flex justify-between items-center capitalize">
                    <span className="text-slate-500">
                      {c.type === 'online' ? '🎥 Google Meet / Video' : c.type === 'phone' ? '📞 Phone Screen' : '🏢 In-Person Office'}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
