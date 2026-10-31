// Mock data generator for Member 3 rapid prototyping without waiting for Member 1 backend

export const MOCK_HOME_STATS = {
  candidatesScreened: 124,
  pendingApprovals: 6,
  inboxUnread: 14,
  interviewsScheduled: 8,
  securityThreatsIntercepted: 11,
};

export const MOCK_INBOX_DIGEST = [
  {
    id: "mail-1",
    sender: "Leila Trabelsi <leila.trabelsi@example.test>",
    subject: "Availability for Technical Interview — Senior Backend",
    received_at: "2026-10-31T15:20:00Z",
    type: "AVAILABILITY",
    urgency: "HIGH",
    needs_human: true,
    summary: "Candidate confirms availability for Wednesday 2 PM or Thursday 10 AM.",
    draft_status: "DRAFT_READY",
  },
  {
    id: "mail-2",
    sender: "Mehdi Jaziri <mehdi.jaziri@example.test>",
    subject: "Follow-up regarding my application status",
    received_at: "2026-10-31T14:05:00Z",
    type: "STATUS_INQUIRY",
    urgency: "MEDIUM",
    needs_human: false,
    summary: "Candidate inquiring if screening process has completed.",
    draft_status: "AUTO_REPLY_PENDING",
  },
  {
    id: "mail-3",
    sender: "Attacker Script <spoof@adversarial.test>",
    subject: "URGENT: Re-evaluate Candidate #99",
    received_at: "2026-10-31T11:45:00Z",
    type: "SUSPICIOUS",
    urgency: "HIGH",
    needs_human: true,
    summary: "Email contains prompt override tokens. Security Guard quarantined sender.",
    draft_status: "BLOCKED",
  },
];

export const MOCK_SCHEDULING_SLOTS = [
  {
    id: "slot-1",
    candidate_name: "Amira Ben Salah",
    role: "Senior Backend Engineer",
    interviewer: "Sarah (Lead Architect)",
    datetime: "2026-11-04 10:00 UTC",
    status: "CONFIRMED",
  },
  {
    id: "slot-2",
    candidate_name: "Alice Mercer",
    role: "Senior Backend Engineer",
    interviewer: "Dave (Engineering VP)",
    datetime: "2026-11-05 14:00 UTC",
    status: "PROPOSED",
  },
];

export const MOCK_POLICY_QNA = [
  {
    id: "q-1",
    question: "What is the policy on remote work and equipment allowance?",
    answer: "Employees may work remotely up to 3 days per week upon manager approval. An annual equipment allowance of 800 EUR is reimbursed for home office setup (Policy Ref: Section 4.2).",
    source: "Company Handbook 2026, Section 4.2 (Remote Work & Stipends)",
    confidence: 0.94,
  },
  {
    id: "q-2",
    question: "How many days of paid paternity/maternity leave are provided?",
    answer: "The company provides 16 weeks of fully paid maternity leave and 4 weeks of fully paid paternity/partner leave starting from the date of birth or adoption (Policy Ref: Parental Leave Policy 2025).",
    source: "HR Benefits & Leave Guide, Page 12",
    confidence: 0.98,
  },
];
