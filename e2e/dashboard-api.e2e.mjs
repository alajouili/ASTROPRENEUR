// End-to-end test of the whole application through the dashboard's API layer
// (frontend/src/services/api.ts) against a running stack. It bundles the real api.ts,
// then plays the browser: a cookie jar stands in for document.cookie, fetch goes to
// the stack's URL. Approved emails are checked in Mailpit's real inbox.
//
// Run (stack up and seeded, see README):
//   E2E_BASE_URL=http://localhost:8080 E2E_MAILPIT_URL=http://localhost:8025 \
//   E2E_RECRUITER_PASSWORD=... E2E_ADMIN_PASSWORD=... E2E_EMPLOYEE_PASSWORD=... \
//   node --test e2e/dashboard-api.e2e.mjs
//
// Each run creates its own job ("E2E <timestamp>"), so other data is never touched.
// The login limit is 5 per minute per IP and this file logs in 4 times: wait a minute
// between runs. Needs `npm install` in frontend/ (for esbuild).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8080';
const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';
const USERS = {
  recruiter: ['recruiter@trusthr.demo', process.env.E2E_RECRUITER_PASSWORD],
  hr_admin: ['admin@trusthr.demo', process.env.E2E_ADMIN_PASSWORD],
  employee: ['employee@trusthr.demo', process.env.E2E_EMPLOYEE_PASSWORD],
};
for (const [role, [, pw]] of Object.entries(USERS)) {
  if (!pw) throw new Error(`Set the password for ${role} (E2E_*_PASSWORD), see the header of this file`);
}

// --- a minimal browser: cookie jar, sessionStorage, same-origin fetch ---
const jar = new Map();
globalThis.document = {
  get cookie() {
    // Only cookies JavaScript may read (the session cookie is httpOnly).
    return [...jar].filter(([, c]) => !c.httpOnly).map(([k, c]) => `${k}=${c.value}`).join('; ');
  },
};
const store = new Map();
globalThis.sessionStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
};
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const headers = new Headers(init.headers);
  if (jar.size > 0) headers.set('cookie', [...jar].map(([k, c]) => `${k}=${c.value}`).join('; '));
  const res = await realFetch(new URL(url, BASE_URL), { ...init, headers });
  for (const line of res.headers.getSetCookie()) {
    const [pair, ...attrs] = line.split(';').map(s => s.trim());
    const [name, ...rest] = pair.split('=');
    const lower = attrs.map(a => a.toLowerCase());
    const expired = lower.some(a => a === 'max-age=0' || a.startsWith('expires=thu, 01 jan 1970'));
    if (expired) jar.delete(name);
    else jar.set(name, { value: rest.join('='), httpOnly: lower.includes('httponly') });
  }
  return res;
};

// --- load the real api.ts ---
const require = createRequire(path.join(ROOT, 'frontend', 'package.json'));
const esbuild = require('esbuild');
const outfile = path.join(tmpdir(), `trusthr-api-${process.pid}.mjs`);
await esbuild.build({
  entryPoints: [path.join(ROOT, 'frontend/src/services/api.ts')],
  bundle: true, format: 'esm', platform: 'neutral', outfile, logLevel: 'error',
});
const { api, ApiError } = await import(pathToFileURL(outfile).href);
api.setMockMode(false);

const samples = path.join(ROOT, 'data/samples');
const sampleFile = async name => new File([await readFile(path.join(samples, name))], name);

let currentRole = null;
async function loginAs(role) {
  if (currentRole === role) return;
  if (currentRole) await api.logout();
  const [email, password] = USERS[role];
  const res = await api.login({ email, password });
  assert.equal(res.user.role, role);
  currentRole = role;
}

async function rejectsWith(promise, status) {
  await assert.rejects(promise, err => err instanceof ApiError && err.status === status,
    `expected HTTP ${status}`);
}

async function waitForTask(taskId) {
  for (let i = 0; i < 180; i++) {
    const task = await api.getTask(taskId);
    if (task.status === 'done' || task.status === 'failed') return task;
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('screening did not finish in 3 minutes');
}

async function mailpitMessagesTo(address) {
  const res = await realFetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`);
  assert.equal(res.status, 200, 'Mailpit API reachable');
  return (await res.json()).messages ?? [];
}

const RUN = Date.now();
const JOB = {
  title: `E2E ${new Date(RUN).toISOString()}`,
  description: 'Fictional job created by the end-to-end test.',
  criteria: [
    { id: 'python', label: 'Python', kind: 'must', weight: 3, type: 'keywords', keywords: ['python', 'pandas'] },
    { id: 'sql', label: 'SQL', kind: 'must', weight: 3, type: 'keywords', keywords: ['sql', 'postgresql', 'mysql'] },
    { id: 'experience', label: '2+ years of experience', kind: 'must', weight: 2, type: 'min_years', min_years: 2 },
    { id: 'bi', label: 'BI dashboards', kind: 'nice', weight: 2, type: 'keywords', keywords: ['power bi', 'tableau'] },
  ],
};
const REPLY_TO = `e2e-${RUN}@example.test`;
const state = {};

test('no session: protected calls are refused with 401', async () => {
  await rejectsWith(api.getJobs(), 401);
});

test('login: a wrong password is refused', async () => {
  await rejectsWith(api.login({ email: USERS.recruiter[0], password: 'definitely-wrong' }), 401);
});

test('roles: the employee cannot read jobs, proposals or the audit log', async () => {
  await loginAs('employee');
  assert.equal((await api.getMe()).role, 'employee');
  await rejectsWith(api.getJobs(), 403);
  await rejectsWith(api.getProposals(), 403);
  await rejectsWith(api.getAuditTrail(), 403);
});

test('login sets an httpOnly session cookie and a readable CSRF cookie', async () => {
  await loginAs('recruiter');
  assert.equal(jar.get('trusthr_session')?.httpOnly, true);
  assert.equal(jar.get('trusthr_csrf')?.httpOnly, false);
});

test('CSRF: a state-changing call without the token is refused', async () => {
  const res = await fetch('/api/jobs', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'no csrf', criteria: JOB.criteria }),
  });
  assert.equal(res.status, 403);
});

test('recruiter creates a job', async () => {
  state.job = await api.createJob(JOB);
  assert.equal(state.job.title, JOB.title);
});

test('security scan (Member 2): white-text attack flagged, clean CV passes', async () => {
  const attack = await api.scanPdf(await sampleFile('attack_white_text_youssef.pdf'));
  assert.equal(attack.is_malicious, true);
  assert.ok(attack.hidden_text_flags.length > 0);
  const clean = await api.scanPdf(await sampleFile('amira_ben_salah.pdf'));
  assert.equal(clean.is_malicious, false);
});

test('upload: Security Guard rejects a non-CV file and a duplicate', async () => {
  const res = await api.uploadResumes(state.job.id, [new File(['not a pdf'], 'notes.txt')]);
  assert.equal(res.accepted.length, 0);
  assert.equal(res.rejected[0].filename, 'notes.txt');
});

test('upload + screening: CVs screened by the worker', async () => {
  const files = await Promise.all(
    ['amira_ben_salah.pdf', 'twin_a_leila.pdf', 'twin_b_karim.pdf', 'attack_hidden_docx.docx'].map(sampleFile));
  const up = await api.uploadResumes(state.job.id, files);
  assert.equal(up.accepted.length, 4, JSON.stringify(up.rejected));
  const again = await api.uploadResumes(state.job.id, [await sampleFile('amira_ben_salah.pdf')]);
  assert.equal(again.rejected[0].reason, 'duplicate');
  const { task_id } = await api.startScreening(state.job.id);
  const task = await waitForTask(task_id);
  assert.equal(task.status, 'done', task.error ?? '');
});

test('ranking: deterministic scores, fairness twins equal, attack flagged, clean CVs "clean"', async () => {
  const ranking = await api.getRanking(state.job.id);
  const by = Object.fromEntries(ranking.ranked.map(r => [r.source_filename, r]));
  assert.equal(ranking.ranked[0].source_filename, 'amira_ben_salah.pdf');
  assert.equal(by['twin_a_leila.pdf'].score, by['twin_b_karim.pdf'].score);
  assert.equal(by['attack_hidden_docx.docx'].risk_level, 'high');
  assert.equal(by['amira_ben_salah.pdf'].risk_level, 'clean');
  assert.ok(ranking.ranked.every(r => r.status === 'screened'), 'nothing decided before approval');
  state.ranking = ranking;
});

test('evidence: candidate detail has verified quotes and the CV text', async () => {
  const top = state.ranking.ranked[0];
  const detail = await api.getCandidateDetail(top.candidate_id);
  assert.ok(detail.resume_text.length > 0);
  const met = detail.screening.criteria_results.filter(c => c.result === 'met');
  assert.ok(met.length > 0 && met.every(c => c.evidence.every(q => detail.resume_text.includes(q))));
});

test('shortlist approval runs the Action Gateway; a replay is refused', async () => {
  const pending = (await api.getProposals('pending')).filter(p => p.type === 'shortlist' && p.job_id === state.job.id);
  assert.equal(pending.length, 1);
  const attackId = state.ranking.ranked.find(r => r.source_filename === 'attack_hidden_docx.docx').candidate_id;
  assert.ok(!pending[0].payload.candidate_ids.includes(attackId), 'high-risk CV never proposed automatically');
  const done = await api.approveProposal(pending[0].id, { note: 'E2E approval' });
  assert.equal(done.status, 'executed');
  await rejectsWith(api.approveProposal(pending[0].id), 409);
  const after = await api.getRanking(state.job.id);
  const shortlisted = after.ranked.filter(r => r.status === 'shortlisted').map(r => r.candidate_id);
  assert.deepEqual(new Set(shortlisted), new Set(pending[0].payload.candidate_ids));
  state.shortlistId = pending[0].id;
});

test('inbox (Member 3): sample emails load and the injection email is flagged', async () => {
  const inbox = await api.getInbox();
  assert.ok(inbox.length >= 3, `inbox has ${inbox.length} emails (sample file mounted?)`);
  assert.ok(inbox.some(m => m.is_suspicious));
  state.email = inbox[0];
});

test('Output Guard (Member 2): a draft with a hiring promise never reaches the queue', async () => {
  await rejectsWith(api.proposeInboxReply(state.email.id, {
    to: REPLY_TO, subject: 'Offer', body: 'Congratulations, you are hired!',
  }), 422);
  await rejectsWith(api.proposeInboxReply(state.email.id, {
    to: REPLY_TO, subject: 'Hi\r\nBcc: attacker@evil.test', body: 'Hello',
  }), 422);
});

test('email reply: nothing sent before approval, exactly one email in Mailpit after', async () => {
  const draft = await api.proposeInboxReply(state.email.id, {
    to: REPLY_TO, subject: `Your application (E2E ${RUN})`, body: 'Thank you, your application is under review.',
  });
  assert.equal(draft.status, 'pending');
  assert.equal((await mailpitMessagesTo(REPLY_TO)).length, 0);
  const sent = await api.approveProposal(draft.id, { note: 'E2E reply' });
  assert.equal(sent.status, 'executed');
  const inbox = await mailpitMessagesTo(REPLY_TO);
  assert.equal(inbox.length, 1);
  assert.equal(inbox[0].Subject, `Your application (E2E ${RUN})`);
  await rejectsWith(api.approveProposal(draft.id), 409);
  assert.equal((await mailpitMessagesTo(REPLY_TO)).length, 1);
  state.emailProposalId = draft.id;
});

test('interview scheduling: proposed, then executed only after approval', async () => {
  const proposal = await api.proposeInterviewSlot({
    candidate_name: 'Amira Ben Salah', candidate_email: 'amira.bensalah@example.test',
    role: JOB.title, interviewer: 'Recruiter', day: 'Wednesday', time: '14:00',
  });
  assert.equal(proposal.status, 'pending');
  const done = await api.approveProposal(proposal.id);
  assert.equal(done.status, 'executed');
});

test('audit (HR admin): chain valid, approvals recorded, tamper simulation detected', async () => {
  await rejectsWith(api.verifyAuditChain(), 403); // the recruiter cannot
  const recruiterId = (await api.getMe()).id;
  await loginAs('hr_admin');
  const chain = await api.verifyAuditChain();
  assert.equal(chain.ok, true);
  const entries = await api.getAuditTrail(1000);
  for (const id of [state.shortlistId, state.emailProposalId]) {
    assert.ok(entries.some(e => e.action === 'proposal.approved' && e.entity_id === id && e.actor_id === recruiterId));
  }
  assert.ok(entries.some(e => e.action === 'email.dispatched' && e.entity_id === state.emailProposalId));
  const tampered = await api.verifyAuditChain(entries[entries.length - 1].id);
  assert.equal(tampered.ok, false);
  assert.equal((await api.verifyAuditChain()).ok, true, 'the simulation changes nothing');
});

test('logout revokes the session', async () => {
  const stolen = jar.get('trusthr_session').value;
  await api.logout();
  currentRole = null;
  assert.equal(jar.has('trusthr_session'), false);
  const replay = await realFetch(new URL('/api/auth/me', BASE_URL), { headers: { cookie: `trusthr_session=${stolen}` } });
  assert.equal(replay.status, 401, 'a token captured before logout no longer works');
});
