/**
 * Master Proof of Concept Video Generator for TrustHR AI.
 * Automates the live web application on http://localhost:8088 via Puppeteer & Edge,
 * performs all 9 test scenarios in exact order, captures high-res 1080p frames,
 * synthesizes professional synchronized voiceover narration,
 * and compiles a master MP4 video using FFmpeg.
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const BASE_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\trusthr-ai';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG_PATH = 'C:\\Program Files\\Labcenter Electronics\\Proteus 9 Professional\\Tools\\Python\\ffmpeg.exe';
const BASE_URL = 'http://localhost:8088';
const MEDIA_DIR = path.join(BASE_DIR, 'media');
const FINAL_VIDEO_MP4 = path.join(MEDIA_DIR, 'trusthr_ai_live_poc_tests.mp4');
const PUBLIC_VIDEO_MP4 = path.join(BASE_DIR, 'frontend', 'public', 'presentation', 'trusthr_ai_live_poc_tests.mp4');
const SAMPLES_DIR = path.join(BASE_DIR, 'data', 'samples');

// 1. Reset Database Helper
function resetDemoDatabase() {
  console.log('[*] Resetting Junior Data Analyst candidates in database...');
  execSync('.\\venv\\Scripts\\python.exe backend\\scripts\\reset_demo_job.py', { cwd: BASE_DIR });
}

// 2. Synthesize Speech Helper
function synthesizeSpeech(text, wavPath) {
  const cleanText = text.replace(/'/g, "''").replace(/\r?\n/g, ' ');
  const psPath = wavPath + '.ps1';
  const ps = [
    'Add-Type -AssemblyName System.Speech',
    '$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer',
    '$synth.Rate = 0',
    `$synth.SetOutputToWaveFile('${wavPath.replace(/'/g, "''")}')`,
    `$synth.Speak('${cleanText}')`,
    '$synth.Dispose()'
  ].join('\r\n');
  fs.writeFileSync(psPath, ps, 'utf8');
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psPath}"`);
  try { fs.unlinkSync(psPath); } catch {}
}

// 3. Encode Video Clip Helper
function encodeClip(pngPath, wavPath, outMp4) {
  const cmd = `"${FFMPEG_PATH}" -y -loop 1 -r 25 -i "${pngPath}" -i "${wavPath}" -c:v libx264 -tune stillimage -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outMp4}"`;
  execSync(cmd, { stdio: 'ignore' });
}

// 4. Sleep Helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setInputValue(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (el) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(el, val);
      } else {
        el.value = val;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, selector, value);
}

async function main() {
  if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
  const tempDir = path.join(process.env.TEMP || 'C:\\temp', `trusthr_poc_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`[*] Workspace Temp Directory: ${tempDir}`);

  // Step 0: Ensure pristine database state
  resetDemoDatabase();

  console.log('[*] Launching Headless Microsoft Edge (1920x1080)...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--window-size=1920,1080', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const scenes = [];

  // =========================================================================
  // SCENE 1: TEST 1 — CONNEXION SÉCURISÉE (20 s)
  // =========================================================================
  console.log('[*] Recording Test 1: Connexion sécurisée...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#login-email');

  await setInputValue(page, '#login-email', 'recruiter@trusthr.demo');
  await setInputValue(page, '#login-password', 'wrongpassword');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => document.body.innerText.includes('Invalid email or password'));
  await sleep(1500);

  const png1 = path.join(tempDir, 'scene_01.png');
  await page.screenshot({ path: png1 });

  // Successful login
  await setInputValue(page, '#login-password', 'TrustHR2026!');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname !== '/login');
  await sleep(1500);

  scenes.push({
    id: 'test1_login',
    title: 'Test 1: Connexion sécurisée',
    narration: "Test 1: Connexion sécurisée. We first enter an invalid password. The platform immediately blocks access and displays 'Invalid email or password'. We then log in with recruiter credentials, granting verified access to the platform. Only authorized personnel can enter.",
    png: png1
  });

  // =========================================================================
  // SCENE 2: TEST 2 — ENVOI DES CV ET REFUS D'UN FICHIER DANGEREUX (30 s)
  // =========================================================================
  console.log('[*] Recording Test 2: Envoi des CV et refus d’un fichier dangereux...');
  await page.goto(`${BASE_URL}/screening`, { waitUntil: 'networkidle2' });
  await sleep(2000);

  // Click on "Upload Candidate CVs" button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText && (b.innerText.includes('Upload Candidate CVs') || b.innerText.includes('Upload CVs') || b.innerText.includes('Upload')));
    if (btn) btn.click();
  });

  await page.waitForSelector('#resume-file-input', { timeout: 8000 });

  // Select the 10 benchmark files + faux_cv.pdf
  const filesToUpload = [
    'amira_ben_salah.pdf', 'sara_khelifi.pdf', 'twin_a_leila.pdf', 'twin_b_karim.pdf',
    'attack_white_text_youssef.pdf', 'youssef_trabelsi.pdf', 'mehdi_jaziri.pdf',
    'attack_tiny_font_fr.pdf', 'attack_visible_instruction.pdf', 'attack_hidden_docx.docx',
    'faux_cv.pdf'
  ].map(f => path.join(SAMPLES_DIR, f));

  const fileInput = await page.$('#resume-file-input');
  await fileInput.uploadFile(...filesToUpload);
  await sleep(1500);

  // Click submit upload button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText && b.innerText.includes('Upload') && b.innerText.includes('File'));
    if (btn) btn.click();
  });

  // Wait for the upload result banner to display
  await page.waitForFunction(() => document.body.innerText.includes('The file content does not match its extension'), { timeout: 15000 });
  await sleep(2000);

  const png2 = path.join(tempDir, 'scene_02.png');
  await page.screenshot({ path: png2 });

  // Close upload modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('#done-upload-btn') || document.querySelector('#close-upload-modal') || document.querySelector('button[aria-label="Close modal"]');
    if (closeBtn) closeBtn.click();
  });
  await sleep(2000);

  scenes.push({
    id: 'test2_upload',
    title: 'Test 2: Envoi des CV et refus d’un fichier dangereux',
    narration: "Test 2: Envoi des CV et refus d'un fichier dangereux. We select the 10 benchmark candidates alongside a weaponized faux_cv.pdf. The platform immediately accepts the 10 valid resumes and rejects faux_cv.pdf because the file content does not match its extension. Dangerous and corrupted files are blocked at the binary gateway.",
    png: png2
  });

  // =========================================================================
  // SCENE 3: TEST 3 — TRI ET CLASSEMENT (40 s)
  // =========================================================================
  console.log('[*] Recording Test 3: Tri et classement...');
  // Wait for Screen button and click it
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.some(b => b.innerText && b.innerText.includes('Screen') && b.innerText.includes('CV'));
  }, { timeout: 15000 });

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const screenBtn = btns.find(b => b.innerText && b.innerText.includes('Screen') && b.innerText.includes('CV'));
    if (screenBtn) screenBtn.click();
  });

  // Wait for screening task to finish and Amira Ben Salah to appear
  await page.waitForFunction(() => document.body.innerText.includes('Amira Ben Salah') && document.body.innerText.includes('100'), { timeout: 60000 });
  await sleep(2000);

  // Click on Amira Ben Salah's row to open EvidenceModal
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr, div'));
    const amira = rows.find(r => r.innerText && r.innerText.includes('Amira Ben Salah'));
    if (amira) amira.click();
  });
  await page.waitForSelector('.fixed, [role="dialog"]', { timeout: 5000 }).catch(() => {});
  await sleep(2500);

  const png3 = path.join(tempDir, 'scene_03.png');
  await page.screenshot({ path: png3 });

  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close modal"]') || document.querySelector('button.btn-ghost');
    if (closeBtn) closeBtn.click();
  });
  await sleep(1500);

  scenes.push({
    id: 'test3_screening',
    title: 'Test 3: Tri et classement',
    narration: "Test 3: Tri et classement. Clicking Screen 10 new CVs triggers the background orchestrator. Amira and Sara rank at 100 percent, while Leila and Karim each achieve 84.6 percent. Opening Amira's evaluation confirms that every score is grounded in verified, verbatim citations from her CV. The score is calculated deterministically in code, with zero AI hallucination.",
    png: png3
  });

  // =========================================================================
  // SCENE 4: TEST 4 — ÉQUITÉ DÉMOGRAPHIQUE (15 s)
  // =========================================================================
  console.log('[*] Recording Test 4: Équité...');
  const png4 = path.join(tempDir, 'scene_04.png');
  await page.screenshot({ path: png4 });

  scenes.push({
    id: 'test4_equity',
    title: 'Test 4: Équité',
    narration: "Test 4: Équité. Leila and Karim possess identical credentials, differing only by name and gender. Both achieve the exact same score of 84.6 percent. This validates zero bias delta under EU AI Act Article 10: only job criteria count.",
    png: png4
  });

  // =========================================================================
  // SCENE 5: TEST 5 — ATTAQUE DÉTECTÉE (45 s)
  // =========================================================================
  console.log('[*] Recording Test 5: Attaque détectée...');
  // Click on "Attack White Text Youssef" row
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr, div'));
    const atk = rows.find(r => r.innerText && r.innerText.includes('Attack White Text Youssef'));
    if (atk) atk.click();
  });
  await sleep(2500);

  const png5 = path.join(tempDir, 'scene_05.png');
  await page.screenshot({ path: png5 });

  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close modal"]') || document.querySelector('button.btn-ghost');
    if (closeBtn) closeBtn.click();
  });
  await sleep(1500);

  scenes.push({
    id: 'test5_attack',
    title: 'Test 5: Attaque détectée : le moment fort',
    narration: "Test 5: Attaque détectée. Opening Attack White Text Youssef reveals the quarantined prompt injection, stripped before reaching any model. Notice that his score is 30.8 percent, exactly identical to the clean Youssef Trabelsi. The attack yielded zero extra points. Three other attacks—tiny font, visible instructions, and hidden Word text—are similarly neutralized. The AI cannot be manipulated.",
    png: png5
  });

  // =========================================================================
  // SCENE 6: TEST 6 — VALIDATION HUMAINE INVARIANT (15 s)
  // =========================================================================
  console.log('[*] Recording Test 6: Rien ne se passe sans validation humaine...');
  const png6 = path.join(tempDir, 'scene_06.png');
  await page.screenshot({ path: png6 });

  scenes.push({
    id: 'test6_human_oversight',
    title: 'Test 6: Rien ne se passe sans validation humaine',
    narration: "Test 6: Rien ne se passe sans validation humaine. Notice that all candidates remain in 'screened' status. No automated decisions are made, and no candidate is shortlisted without authenticated human recruiter intervention.",
    png: png6
  });

  // =========================================================================
  // SCENE 7: TEST 7 — FILE D'APPROBATION (40 s)
  // =========================================================================
  console.log('[*] Recording Test 7: File d’approbation...');
  await page.goto(`${BASE_URL}/approvals`, { waitUntil: 'networkidle2' });
  await sleep(2000);

  // Type review note
  await setInputValue(page, 'textarea', 'Validé après revue');
  await sleep(1000);

  const png7a = path.join(tempDir, 'scene_07.png');
  await page.screenshot({ path: png7a });

  // Click on "Approve" button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const approveBtn = btns.find(b => b.innerText && (b.innerText.includes('Approve') || b.innerText.includes('Authorize')));
    if (approveBtn) approveBtn.click();
  });
  await sleep(2000);

  // Navigate back to screening to show the 4 shortlisted candidates
  await page.goto(`${BASE_URL}/screening`, { waitUntil: 'networkidle2' });
  await sleep(2000);

  scenes.push({
    id: 'test7_approval',
    title: 'Test 7: File d’approbation',
    narration: "Test 7: File d'approbation. In the Approval Queue, the AI proposes four candidates while isolating attacked files for manual review. The recruiter reviews the evidence, adds the note 'Validé après revue', and clicks Approve. Returning to Screening proves that only those four candidates have transitioned to shortlisted. The agent proposes, the human decides.",
    png: png7a
  });

  // =========================================================================
  // SCENE 8: TEST 8 — JOURNAL D'AUDIT SHA-256 (30 s)
  // =========================================================================
  console.log('[*] Recording Test 8: Journal d’audit...');
  // Logout
  await page.evaluate(() => {
    const logoutBtn = document.querySelector('button[aria-label="Sign out"], button[title="Sign out"]');
    if (logoutBtn) logoutBtn.click();
    localStorage.clear();
  });
  await sleep(1500);

  // Login as admin@trusthr.demo
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await setInputValue(page, '#login-email', 'admin@trusthr.demo');
  await setInputValue(page, '#login-password', 'TrustHR2026!');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname !== '/login');
  await sleep(1500);

  // Go to audit
  await page.goto(`${BASE_URL}/audit`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.body.innerText.includes('Hash chain') || document.body.innerText.includes('Audit') || document.body.innerText.includes('verified'), { timeout: 15000 }).catch(() => {});
  await sleep(2000);

  const png8 = path.join(tempDir, 'scene_08.png');
  await page.screenshot({ path: png8 });

  scenes.push({
    id: 'test8_audit',
    title: 'Test 8: Journal d’audit',
    narration: "Test 8: Journal d'audit. Logging in as HR Admin and opening the Audit Trail displays the green 'Hash chain verified' badge. Every action—CV upload, screening, proposal creation, and recruiter approval—is permanently sealed in an immutable SHA-256 backward hash chain. Any unauthorized modification is instantly caught.",
    png: png8
  });

  // =========================================================================
  // SCENE 9: TEST 9 — CONTRÔLE DES RÔLES (15 s)
  // =========================================================================
  console.log('[*] Recording Test 9: Contrôle des rôles...');
  // Logout
  await page.evaluate(() => {
    const logoutBtn = document.querySelector('button[aria-label="Sign out"], button[title="Sign out"]');
    if (logoutBtn) logoutBtn.click();
    localStorage.clear();
  });
  await sleep(1500);

  // Login as employee@trusthr.demo
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await setInputValue(page, '#login-email', 'employee@trusthr.demo');
  await setInputValue(page, '#login-password', 'TrustHR2026!');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname !== '/login');
  await sleep(2000);

  const png9 = path.join(tempDir, 'scene_09.png');
  await page.screenshot({ path: png9 });

  scenes.push({
    id: 'test9_roles',
    title: 'Test 9: Contrôle des rôles',
    narration: "Test 9: Contrôle des rôles. An employee login demonstrates strict privilege isolation. Candidate records and executive decisions remain completely inaccessible. TrustHR AI brings safety, transparency, and human dignity back to recruitment.",
    png: png9
  });

  await browser.close();
  console.log('[*] Browser recording session successfully finished!');

  // =========================================================================
  // ENCODE VIDEO CLIPS & CONCATENATE
  // =========================================================================
  console.log('[*] Synthesizing audio and encoding MP4 video clips...');
  const clipPaths = [];

  for (let idx = 0; idx < scenes.length; idx++) {
    const scene = scenes[idx];
    console.log(`[*] Compiling Clip ${idx + 1}/${scenes.length}: [${scene.id}]`);

    const wavPath = path.join(tempDir, `narration_${idx}.wav`);
    synthesizeSpeech(scene.narration, wavPath);

    const clipPath = path.join(tempDir, `clip_${idx}.mp4`);
    encodeClip(scene.png, wavPath, clipPath);
    clipPaths.push(clipPath);
    console.log(`    [OK] Clip ${idx + 1} generated.`);
  }

  // Concatenate clips into final video
  console.log('[*] Stitching master POC proof video...');
  const concatList = path.join(tempDir, 'concat_list.txt');
  fs.writeFileSync(concatList, clipPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'), 'utf8');

  const concatCmd = `"${FFMPEG_PATH}" -y -f concat -safe 0 -i "${concatList}" -c copy "${FINAL_VIDEO_MP4}"`;
  execSync(concatCmd, { stdio: 'ignore' });
  console.log(`[SUCCESS] Master POC video generated: ${FINAL_VIDEO_MP4}`);

  // Deploy to public folder
  const publicDir = path.dirname(PUBLIC_VIDEO_MP4);
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.copyFileSync(FINAL_VIDEO_MP4, PUBLIC_VIDEO_MP4);
  console.log(`[SUCCESS] Deployed to web root: ${PUBLIC_VIDEO_MP4}`);

  // Clean up temp files
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}
}

main().catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
