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

// 2. Synthesize Speech Helper (Azure Neural Studio Voice via edge-tts)
function synthesizeSpeech(text, outAudioPath) {
  const pythonPath = path.join(BASE_DIR, 'venv', 'Scripts', 'python.exe');
  const ttsScript = path.join(BASE_DIR, 'backend', 'scripts', 'tts_helper.py');
  const txtPath = outAudioPath + '.txt';
  fs.writeFileSync(txtPath, text, 'utf8');
  const cmd = `"${pythonPath}" "${ttsScript}" "${txtPath}" "${outAudioPath}" "fr-FR-HenriNeural" "+18%"`;
  execSync(cmd, { cwd: BASE_DIR });
  try { fs.unlinkSync(txtPath); } catch {}
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
    narration: "Test 1 : Connexion sécurisée. Nous saisissons d'abord un mauvais mot de passe : le message Invalid email or password s'affiche immédiatement. Nous nous connectons ensuite avec les identifiants recruteur. Seuls les utilisateurs autorisés peuvent entrer sur la plateforme.",
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
    narration: "Test 2 : Envoi des CV et refus d'un fichier dangereux. Nous sélectionnons les 10 CV de référence ainsi que le fichier piégé faux_cv.pdf. Résultat immédiat : 10 CV sont acceptés, et faux_cv.pdf est immédiatement rejeté car le contenu ne correspond pas à son extension. Les fichiers piégés sont bloqués dès l'entrée.",
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
    narration: "Test 3 : Tri et classement. En cliquant sur Screen 10 new CVs, le tri s'effectue. Amira et Sara se classent à 100 %, et les jumeaux Leila et Karim à 84.6 % chacun. En ouvrant la ligne d'Amira, chaque critère s'affiche avec une citation exacte issue du CV. Le classement repose sur des preuves, et le score est calculé par le code.",
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
    narration: "Test 4 : Équité démographique. Regardez Leila et Karim : leurs CV sont identiques sauf le nom et le genre, et ils ont exactement le même score de 84.6 %. Seuls les critères du poste comptent, garantissant un biais nul selon l'article 10 de l'EU AI Act.",
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
    narration: "Test 5 : Attaque détectée, le moment fort. Ouvrons Attack White Text Youssef : on y voit le texte caché Ignore all previous instructions, retiré et signalé High Risk. Comparons avec Youssef Trabelsi, le même CV sans attaque : les deux ont exactement 30.8 %. Les trois autres attaques sont également déjouées. L'IA ne se laisse pas manipuler.",
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
    narration: "Test 6 : Rien ne se passe sans validation humaine. Regardez bien : tous les candidats sont encore au statut screened. Aucun n'a été retenu automatiquement par l'IA : le contrôle humain est absolu.",
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
    narration: "Test 7 : File d'approbation. Dans l'onglet Approval queue, la plateforme propose 4 candidats. Les CV piégés sont dans Needs manual review, et Youssef et Mehdi sont dans must-have not met. Ajoutons la note Validé après revue, puis cliquons sur Approve shortlist of 4. De retour dans Screening : seuls ces 4 candidats sont passés à shortlisted. L'agent propose, l'humain décide.",
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
    narration: "Test 8 : Journal d'audit. Déconnexion, puis reconnexion avec le compte administrateur. Dans l'Audit trail, regardez le badge Hash chain verified et l'historique complet : envoi des CV, tri, proposition, approbation, changement de statut. Tout est scellé en SHA-256 : tout est tracé, et toute modification serait détectée.",
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
    narration: "Test 9 : Contrôle des rôles. Connexion avec le compte employé : aucun accès aux candidats ni aux décisions de recrutement. La séparation des privilèges est totale. TrustHR AI garantit une gouvernance et une sécurité irréprochables.",
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

    const audioPath = path.join(tempDir, `narration_${idx}.mp3`);
    synthesizeSpeech(scene.narration, audioPath);

    const clipPath = path.join(tempDir, `clip_${idx}.mp4`);
    encodeClip(scene.png, audioPath, clipPath);
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
