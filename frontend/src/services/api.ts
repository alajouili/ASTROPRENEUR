import {
  MOCK_HOME_STATS,
  MOCK_JOBS,
  MOCK_CANDIDATES,
  MOCK_APPROVALS,
  MOCK_AUDIT_LOGS,
  MOCK_INBOX_DIGEST,
  MOCK_SCHEDULING_SLOTS,
  MOCK_POLICY_KB,
  MockInboxItem,
  MockSchedulingSlot,
  MockPolicyAnswer,
} from './mockData';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'recruiter' | 'hr_admin' | 'employee';
}

export interface Criterion {
  id: string;
  label: string;
  kind: 'must' | 'nice';
  weight: number;
  type: string;
  keywords?: string[];
  min_years?: number;
}

export interface JobOffer {
  id: string;
  title: string;
  description: string;
  criteria: Criterion[];
  created_at: string;
  department?: string;
  criteria_count?: number;
}

export interface UploadRejection {
  filename: string;
  reason: string;
  message: string;
}

export interface UploadResumesResponse {
  accepted: Array<{ candidate_id: string; filename: string }>;
  rejected: UploadRejection[];
}

export interface TaskStatus {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  progress_done: number;
  progress_total: number;
  error: string | null;
  result: any;
}

export interface CriterionResult {
  criterion_id: string;
  met: boolean;
  score: number;
  weight: number;
  evidence_quote?: string;
  reason?: string;
}

export interface CriterionEvaluation {
  id: string;
  criterion_name: string;
  criterion_weight: number;
  score: number;
  evidence_quote: string;
  evidence_verified: boolean;
  reasoning: string;
}

export interface CandidateDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  file_name: string;
  file_hash: string;
  overall_score: number;
  security_status: 'CLEAN' | 'SUSPICIOUS_FLAGGED' | 'QUARANTINED';
  security_findings: Array<{
    rule: string;
    severity: string;
    description: string;
    snippet: string;
  }>;
  status: string;
  evaluations_count: number;
  evaluation_summary: string;
  evaluations: CriterionEvaluation[];
  pending_actions?: any[];
  created_at?: string;
}

export interface RankedCandidate {
  rank: number;
  candidate_id: string;
  display_name: string;
  source_filename: string;
  status: string;
  score: number;
  must_have_met: number;
  must_have_total: number;
  justification: string;
  criteria_results: Record<string, any>;
  risk_level: 'clean' | 'low' | 'medium' | 'high';
  risk_flags: string[];
  rejected_evidence: string[];
  engine: string;
}

export interface NotRankedCandidate {
  candidate_id: string;
  display_name: string;
  source_filename: string;
  status: string;
  risk_level: string;
  risk_flags: string[];
}

export interface RankingResponse {
  job: JobOffer;
  ranked: RankedCandidate[];
  not_ranked: NotRankedCandidate[];
}

export interface Proposal {
  id: string;
  type: string;
  job_id: string | null;
  payload: any;
  evidence: any;
  risk_flags: string[];
  status: 'pending' | 'approved' | 'rejected' | 'failed' | 'executed';
  created_by: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  execution_result: any;
}

export interface AuditEntry {
  id: number;
  at: string;
  actor_type: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  hash: string;
}

export interface AuditVerifyResponse {
  ok: boolean;
  checked: number;
  first_bad_id: number | null;
}

export interface HomeStats {
  candidatesScreened: number;
  pendingApprovals: number;
  inboxUnread: number;
  interviewsScheduled: number;
  securityThreatsIntercepted: number;
  hashChainIntegrity: boolean;
  averageMatchScore: number;
}

export type { MockInboxItem as InboxItem, MockSchedulingSlot as SchedulingSlot, MockPolicyAnswer as PolicyAnswer };

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// In-memory mock toggle and local mock data store
let _mockMode = false;
let _mockCandidates: any[] = [...MOCK_CANDIDATES];
let _mockApprovals: any[] = [...MOCK_APPROVALS];
let _mockAuditLogs: any[] = [...MOCK_AUDIT_LOGS];
let _mockInbox = [...MOCK_INBOX_DIGEST];
let _mockSlots = [...MOCK_SCHEDULING_SLOTS];

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)trusthr_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : sessionStorage.getItem('trusthr_csrf');
}

function setCsrfToken(token: string | null) {
  if (token) {
    sessionStorage.setItem('trusthr_csrf', token);
  } else {
    sessionStorage.removeItem('trusthr_csrf');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const method = (options.method || 'GET').toUpperCase();

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers.set('X-CSRF-Token', csrf);
    }
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  if (response.status === 401) {
    setCsrfToken(null);
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Session unauthenticated or expired. Please log in.');
  }

  if (!response.ok) {
    let message = response.statusText;
    let details: any = null;
    try {
      const errJson = await response.json();
      message = errJson.detail || errJson.message || JSON.stringify(errJson);
      details = errJson;
    } catch {
      // response wasn't JSON
    }
    throw new ApiError(response.status, message, details);
  }

  return response.json();
}

export const api = {
  isMockMode(): boolean {
    return _mockMode;
  },

  setMockMode(enabled: boolean) {
    _mockMode = enabled;
  },

  // ---- Authentication ----
  async login(body: { email: string; password: string }): Promise<{ user: User; csrf_token: string }> {
    if (_mockMode) {
      const role = body.email.includes('admin')
        ? 'hr_admin'
        : body.email.includes('employee')
        ? 'employee'
        : 'recruiter';
      const mockUser: User = {
        id: `usr-mock-${Date.now()}`,
        email: body.email,
        full_name: role === 'hr_admin' ? 'Hedi HR Admin' : role === 'employee' ? 'Eya Employee' : 'Rania Recruiter',
        role,
      };
      setCsrfToken('mock-csrf-token');
      return { user: mockUser, csrf_token: 'mock-csrf-token' };
    }
    const res = await request<{ user: User; csrf_token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setCsrfToken(res.csrf_token);
    return res;
  },

  async logout(): Promise<void> {
    if (_mockMode) {
      setCsrfToken(null);
      return;
    }
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setCsrfToken(null);
    }
  },

  async getMe(): Promise<User> {
    if (_mockMode) {
      return {
        id: 'usr-mock',
        email: 'recruiter@trusthr.demo',
        full_name: 'Rania Recruiter (Demo)',
        role: 'recruiter',
      };
    }
    const res = await request<{ user: User }>('/api/auth/me');
    return res.user;
  },

  // ---- Jobs & Screening ----
  async getJobs(): Promise<JobOffer[]> {
    if (_mockMode) {
      return MOCK_JOBS.map((j) => ({
        id: j.id,
        title: j.title,
        description: j.description || '',
        criteria: (j.criteria || []).map((c: any, i: number) => ({
          id: c.name?.toLowerCase().replace(/\s+/g, '_') || `crit_${i}`,
          label: c.name || `Criterion ${i + 1}`,
          kind: (c.required ? 'must' : 'nice') as 'must' | 'nice',
          weight: c.weight || 2,
          type: 'keywords',
        })),
        created_at: j.created_at,
        department: j.department,
        criteria_count: j.criteria_count,
      }));
    }
    return request<JobOffer[]>('/api/jobs');
  },

  async getJob(jobId: string): Promise<JobOffer> {
    if (_mockMode) {
      const found = MOCK_JOBS.find((j) => j.id === jobId) || MOCK_JOBS[0];
      return {
        id: found.id,
        title: found.title,
        description: found.description || '',
        criteria: (found.criteria || []).map((c: any, i: number) => ({
          id: c.name?.toLowerCase().replace(/\s+/g, '_') || `crit_${i}`,
          label: c.name || `Criterion ${i + 1}`,
          kind: (c.required ? 'must' : 'nice') as 'must' | 'nice',
          weight: c.weight || 2,
          type: 'keywords',
        })),
        created_at: found.created_at,
        department: found.department,
        criteria_count: found.criteria_count,
      };
    }
    return request<JobOffer>(`/api/jobs/${jobId}`);
  },

  async createJob(body: { title: string; description: string; criteria: Criterion[] }): Promise<JobOffer> {
    if (_mockMode) {
      const newJob: JobOffer = {
        id: `job-${Date.now()}`,
        title: body.title,
        description: body.description,
        criteria: body.criteria,
        created_at: new Date().toISOString(),
        department: 'Operations',
        criteria_count: body.criteria.length,
      };
      MOCK_JOBS.unshift(newJob as any);
      return newJob;
    }
    return request<JobOffer>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async uploadResumes(jobId: string, files: File[]): Promise<UploadResumesResponse> {
    if (_mockMode) {
      const accepted: Array<{ candidate_id: string; filename: string }> = [];
      const rejected: UploadRejection[] = [];

      for (const f of files) {
        if (f.size > 5 * 1024 * 1024) {
          rejected.push({ filename: f.name, reason: 'file_too_large', message: 'File exceeds 5MB limit.' });
        } else {
          const cid = `cand-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
          accepted.push({ candidate_id: cid, filename: f.name });
        }
      }
      return { accepted, rejected };
    }

    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }

    return request<UploadResumesResponse>(`/api/jobs/${jobId}/resumes`, {
      method: 'POST',
      body: formData,
    });
  },

  async startScreening(jobId: string): Promise<{ task_id: string; status: string }> {
    if (_mockMode) {
      return { task_id: `task-mock-${Date.now()}`, status: 'done' };
    }
    return request<{ task_id: string; status: string }>(`/api/jobs/${jobId}/screen`, {
      method: 'POST',
    });
  },

  async getTask(taskId: string): Promise<TaskStatus> {
    if (_mockMode) {
      return {
        id: taskId,
        type: 'screen_job',
        status: 'done',
        progress_done: 5,
        progress_total: 5,
        error: null,
        result: { ranked: 5 },
      };
    }
    return request<TaskStatus>(`/api/tasks/${taskId}`);
  },

  async getRanking(jobId: string): Promise<RankingResponse> {
    if (_mockMode) {
      const filtered = _mockCandidates.filter((c) => c.job_id === jobId);
      const list = filtered.length > 0 ? filtered : _mockCandidates;
      const ranked: RankedCandidate[] = list.map((c, idx) => ({
        rank: idx + 1,
        candidate_id: c.id,
        display_name: c.name,
        source_filename: c.file_name,
        status: c.status,
        score: c.overall_score,
        must_have_met: c.security_status === 'CLEAN' ? 3 : 1,
        must_have_total: 3,
        justification: c.evaluation_summary || 'Screened via offline keyword engine.',
        criteria_results: (c.evaluations || []).reduce((acc: any, ev: any) => {
          acc[ev.id || ev.criterion_name] = {
            criterion_id: ev.criterion_name,
            met: ev.score >= 50,
            score: ev.score,
            weight: ev.criterion_weight || 2,
            evidence_quote: ev.evidence_quote,
            reason: ev.reasoning,
          };
          return acc;
        }, {}),
        risk_level: c.security_status === 'SUSPICIOUS_FLAGGED' ? 'high' : 'clean',
        risk_flags: (c.security_findings || []).map((f: any) => `${f.rule}: ${f.snippet}`),
        rejected_evidence: c.security_status === 'SUSPICIOUS_FLAGGED' ? ['Claims dropped: raw quote not found'] : [],
        engine: 'SIMULATED',
      }));

      return {
        job: {
          id: jobId,
          title: 'Junior Data Analyst',
          description: 'Demo job specification.',
          criteria: [],
          created_at: new Date().toISOString(),
        },
        ranked,
        not_ranked: [],
      };
    }
    return request<RankingResponse>(`/api/jobs/${jobId}/ranking`);
  },

  // ---- Proposals & Governance Gateway ----
  async getProposals(status?: string): Promise<Proposal[]> {
    if (_mockMode) {
      let list = _mockApprovals;
      if (status) {
        list = list.filter((p) => p.status.toLowerCase() === status.toLowerCase());
      }
      return list.map((a) => ({
        id: a.id,
        type: 'shortlist',
        job_id: 'job-demo',
        payload: {
          candidate_ids: [a.candidate_id],
          recipient_email: a.payload?.to_email,
          subject: a.payload?.subject,
          body: a.payload?.body,
        },
        evidence: {
          ranking: [{ candidate_id: a.candidate_id, score: a.candidate_score, name: a.candidate_name }],
          needs_review: [],
          missing_must_haves: [],
        },
        risk_flags: a.candidate_security_status === 'SUSPICIOUS_FLAGGED' ? ['High risk candidate'] : [],
        status: a.status.toLowerCase() as any,
        created_by: 'system',
        created_at: a.created_at,
        reviewed_by: a.reviewed_by,
        reviewed_at: a.reviewed_at,
        review_note: a.review_notes,
        execution_result: a.executed_at ? { status: 'dispatched', simulated: true } : null,
      }));
    }
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<Proposal[]>(`/api/proposals${query}`);
  },

  async approveProposal(
    proposalId: string,
    body: { candidate_ids?: string[]; note?: string } = {}
  ): Promise<Proposal> {
    if (_mockMode) {
      const found = _mockApprovals.find((a) => a.id === proposalId);
      if (found) {
        found.status = 'EXECUTED';
        found.reviewed_at = new Date().toISOString();
        found.executed_at = new Date().toISOString();
        found.review_notes = body.note || 'Approved via demo mode';
      }
      return {
        id: proposalId,
        type: 'shortlist',
        job_id: 'job-demo',
        payload: { candidate_ids: body.candidate_ids || [] },
        evidence: {},
        risk_flags: [],
        status: 'executed',
        created_by: 'system',
        created_at: new Date().toISOString(),
        reviewed_by: 'current-user',
        reviewed_at: new Date().toISOString(),
        review_note: body.note || null,
        execution_result: { status: 'shortlist_locked', candidate_count: body.candidate_ids?.length || 1 },
      };
    }
    return request<Proposal>(`/api/proposals/${proposalId}/approve`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async rejectProposal(proposalId: string, body: { note?: string } = {}): Promise<Proposal> {
    if (_mockMode) {
      const found = _mockApprovals.find((a) => a.id === proposalId);
      if (found) {
        found.status = 'REJECTED';
        found.reviewed_at = new Date().toISOString();
        found.review_notes = body.note || 'Rejected via demo mode';
      }
      return {
        id: proposalId,
        type: 'shortlist',
        job_id: 'job-demo',
        payload: {},
        evidence: {},
        risk_flags: [],
        status: 'rejected',
        created_by: 'system',
        created_at: new Date().toISOString(),
        reviewed_by: 'current-user',
        reviewed_at: new Date().toISOString(),
        review_note: body.note || null,
        execution_result: null,
      };
    }
    return request<Proposal>(`/api/proposals/${proposalId}/reject`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // ---- Audit Trail ----
  async getAuditTrail(limit = 200): Promise<AuditEntry[]> {
    if (_mockMode) {
      return _mockAuditLogs.map((l, idx) => ({
        id: idx + 1,
        at: l.timestamp,
        actor_type: 'user',
        actor_id: l.actor,
        action: l.action,
        entity_type: 'log',
        entity_id: l.target_id || String(idx),
        details: l.details || {},
        hash: l.hash,
      }));
    }
    return request<AuditEntry[]>(`/api/audit?limit=${limit}`);
  },

  async verifyAuditChain(): Promise<AuditVerifyResponse> {
    if (_mockMode) {
      return { ok: true, checked: _mockAuditLogs.length, first_bad_id: null };
    }
    return request<AuditVerifyResponse>('/api/audit/verify');
  },

  // ---- Overview Real KPIs ----
  async getHomeStats(): Promise<HomeStats> {
    if (_mockMode) {
      const pendingCount = _mockApprovals.filter((a) => a.status === 'PENDING').length;
      const flaggedCount = _mockCandidates.filter((c) => c.security_status === 'SUSPICIOUS_FLAGGED').length;
      const avgScore =
        _mockCandidates.length > 0
          ? _mockCandidates.reduce((acc, c) => acc + c.overall_score, 0) / _mockCandidates.length
          : 0;
      return {
        candidatesScreened: _mockCandidates.length,
        pendingApprovals: pendingCount,
        inboxUnread: _mockInbox.filter((m) => m.needs_human).length,
        interviewsScheduled: _mockSlots.length,
        securityThreatsIntercepted: flaggedCount,
        hashChainIntegrity: true,
        averageMatchScore: Number(avgScore.toFixed(1)),
      };
    }

    try {
      const [jobs, proposals] = await Promise.all([
        this.getJobs().catch(() => []),
        this.getProposals('pending').catch(() => []),
      ]);

      let totalCandidates = 0;
      let totalThreats = 0;
      let totalScoreSum = 0;
      let scoreCount = 0;

      for (const job of jobs) {
        try {
          const ranking = await this.getRanking(job.id);
          totalCandidates += ranking.ranked.length + ranking.not_ranked.length;
          for (const cand of ranking.ranked) {
            totalScoreSum += cand.score;
            scoreCount++;
            if (cand.risk_level !== 'clean' || (cand.risk_flags && cand.risk_flags.length > 0)) {
              totalThreats++;
            }
          }
          for (const nr of ranking.not_ranked) {
            if (nr.risk_level !== 'clean' || (nr.risk_flags && nr.risk_flags.length > 0)) {
              totalThreats++;
            }
          }
        } catch {
          // ignore job ranking error for KPI aggregation
        }
      }

      // Check audit chain if admin, or default true
      let integrity = true;
      try {
        const verifyRes = await this.verifyAuditChain();
        integrity = verifyRes.ok;
      } catch {
        // Recruiter might get 403 on /audit/verify
      }

      return {
        candidatesScreened: totalCandidates,
        pendingApprovals: proposals.length,
        inboxUnread: 0, // Roadmap M2
        interviewsScheduled: 0, // Roadmap M2
        securityThreatsIntercepted: totalThreats,
        hashChainIntegrity: integrity,
        averageMatchScore: scoreCount > 0 ? Number((totalScoreSum / scoreCount).toFixed(1)) : 0,
      };
    } catch (err) {
      throw err;
    }
  },

  // ---- Roadmap Features (Simulated / Fictional) ----
  async getInbox() {
    return _mockInbox;
  },

  async getInboxDigest() {
    return this.getInbox();
  },

  async updateInboxDraft(itemId: string, draft: string, approved = false) {
    const item = _mockInbox.find((i) => i.id === itemId);
    if (item) {
      item.ai_response_draft = draft;
      if (approved) item.needs_human = false;
    }
    return { ok: true };
  },

  async getSchedulingSlots() {
    return _mockSlots;
  },

  async confirmSlot(slotId: string) {
    const slot = _mockSlots.find((s) => s.id === slotId);
    if (slot) slot.status = 'CONFIRMED';
    return { ok: true };
  },

  async proposeInterviewSlot(payload: any) {
    const slot = {
      id: `slot-${Date.now()}`,
      candidate_name: payload.candidate_name,
      candidate_email: payload.candidate_email,
      role: payload.role,
      interviewer: payload.interviewer,
      day: payload.day,
      time: payload.time,
      status: 'PROPOSED',
    };
    _mockSlots.unshift(slot as any);
    return slot;
  },

  async proposeSlot(
    candidateName: string,
    role: string,
    interviewer: string,
    day: any,
    time: string,
    email: string
  ) {
    return this.proposeInterviewSlot({
      candidate_name: candidateName,
      role,
      interviewer,
      day,
      time,
      candidate_email: email,
    });
  },

  async askPolicy(question: string) {
    const found = MOCK_POLICY_KB.find(
      (k) =>
        k.question.toLowerCase().includes(question.toLowerCase()) ||
        question.toLowerCase().includes(k.question.toLowerCase())
    );
    return found || MOCK_POLICY_KB[0];
  },

  async askPolicyAssistant(question: string) {
    return this.askPolicy(question);
  },
};
