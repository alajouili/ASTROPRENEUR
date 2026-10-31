export interface JobOffer {
  id: string;
  title: string;
  department: string;
  criteria_count: number;
  created_at: string;
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

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  file_name: string;
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
  pending_actions: Array<{
    id: string;
    type?: string;
    action_type?: string;
    status: string;
  }>;
  created_at: string;
}

export interface CandidateDetail extends Omit<Candidate, 'pending_actions'> {
  file_hash: string;
  evaluation_summary: string;
  evaluations: CriterionEvaluation[];
  pending_actions: Array<{
    id: string;
    action_type: string;
    type?: string;
    status: string;
    payload: any;
    reviewed_by: string | null;
    review_notes: string | null;
    created_at: string;
    reviewed_at: string | null;
    executed_at: string | null;
  }>;
}

export interface PendingApproval {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_security_status: string;
  candidate_score: number;
  action_type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  payload: {
    to_email: string;
    subject: string;
    body: string;
    proposed_slots?: string[];
  };
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  executed_at: string | null;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target_id: string | null;
  details: any;
  prev_hash: string | null;
  hash: string;
}

export interface AuditResponse {
  integrity_verified: boolean;
  total_records: number;
  logs: AuditRecord[];
}

const API_BASE = '/api';

export const api = {
  async getJobs(): Promise<JobOffer[]> {
    const res = await fetch(`${API_BASE}/jobs`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  async createJob(payload: { title: string; department: string; description: string; criteria: any[] }): Promise<any> {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create job');
    return res.json();
  },

  async getRankedCandidates(jobId: string): Promise<Candidate[]> {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/candidates`);
    if (!res.ok) throw new Error('Failed to fetch candidates');
    return res.json();
  },

  async getCandidateDetails(candidateId: string): Promise<CandidateDetail> {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}`);
    if (!res.ok) throw new Error('Failed to fetch candidate details');
    return res.json();
  },

  async uploadResume(jobId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/jobs/${jobId}/upload-resume`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async getApprovals(): Promise<PendingApproval[]> {
    const res = await fetch(`${API_BASE}/approvals`);
    if (!res.ok) throw new Error('Failed to fetch approvals');
    return res.json();
  },

  async reviewApproval(actionId: string, decision: 'APPROVED' | 'REJECTED', notes: string, editedPayload?: any): Promise<any> {
    const res = await fetch(`${API_BASE}/approvals/${actionId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        reviewer: 'lead_recruiter_sarah',
        review_notes: notes,
        edited_payload: editedPayload,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Review submission failed' }));
      throw new Error(err.detail || 'Review failed');
    }
    return res.json();
  },

  async dispatchAction(actionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/approvals/${actionId}/dispatch`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Action dispatch failed' }));
      throw new Error(err.detail || 'Action dispatch failed');
    }
    return res.json();
  },

  async getAuditTrail(): Promise<AuditResponse> {
    const res = await fetch(`${API_BASE}/audit`);
    if (!res.ok) throw new Error('Failed to fetch audit trail');
    return res.json();
  },
};
