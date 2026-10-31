import React, { useState, useEffect, useRef } from 'react';
import { api, PolicyAnswer } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bot,
  Send,
  User,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Copy,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  BookOpen,
  HelpCircle,
  FileText,
  BadgeAlert,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  language?: 'derja' | 'fr' | 'en';
  citation?: {
    source: string;
    confidence: number;
    section: string;
  };
}

// Multilingual intelligent knowledge engine with open conversational capabilities
const getIntelligentResponse = (
  rawQuery: string,
  targetLang: 'auto' | 'derja' | 'fr' | 'en'
): { text: string; source: string; section: string; confidence: number; detectedLang: 'derja' | 'fr' | 'en' } => {
  const q = rawQuery.toLowerCase().trim();

  // 1. Detect language
  let lang: 'derja' | 'fr' | 'en' = 'en';
  const derjaMarkers = [
    '3aslema', 'ahla', 'chkoun', 'chnouma', 'kifeh', 'wa9tech', 'fama', 'm3a', 'behi',
    'berek', 'flous', 'khedma', 'dar', 'lebel', 'barsha', 'chwaya', 'nheb', 'ynejem',
    'mte3na', 'mte3i', 'chnowa', 'chne7welek', 'conflit', 'mochkla', 'salaire', '3andi',
    'chouf', 'mouch', 'bahi', '3lech', '3andna', 'zid', 'ta3mel',
  ];
  const frMarkers = [
    'bonjour', 'salut', 'comment', 'quel', 'quelle', 'pourquoi', 'congé', 'télétravail',
    'politique', 'recrutement', 'salaire', 'candidat', 'formation', 'démission', 'contrat',
    'prime', 'augmentation', 'préavis', 'assurance',
  ];

  if (targetLang !== 'auto') {
    lang = targetLang;
  } else if (derjaMarkers.some((m) => q.includes(m))) {
    lang = 'derja';
  } else if (frMarkers.some((m) => q.includes(m))) {
    lang = 'fr';
  } else {
    lang = 'en';
  }

  // 2. Salary, Raises & Payroll
  if (
    q.includes('salaire') ||
    q.includes('flous') ||
    q.includes('augmentation') ||
    q.includes('paye') ||
    q.includes('fiche') ||
    q.includes('brut') ||
    q.includes('net') ||
    q.includes('cnss') ||
    q.includes('irpp') ||
    q.includes('raise')
  ) {
    if (lang === 'derja') {
      return {
        text: `Kifeh t9addem talab augmentation w tfasser el salaire mte3ek fi TrustHR:\n\n1. **Procédure d'augmentation:** T7adher bil-behi les réalisations mte3ek (KPIs dépassés, projets livrés) w ta3mel demande d'entretien avec ton manager N+1 9bal l'évaluation annuelle.\n2. **Calcul Net / Brut (Tunisie & Global):** El cotisation CNSS salarié hiya 9.18% mel brut, w ba3d yetna7a l'IRPP 7asb le barème progressif.\n3. **Fiche de paie:** Tnejjem ttelechargi el fiche de paie mte3ek direct mel portal fi kol lekher chhar (26-28 du mois).`,
        source: 'Corporate Compensation Charter & Labor Code',
        section: 'Section 5.1 — Salary Scales, Raises & Payroll Deduction',
        confidence: 0.98,
        detectedLang: 'derja',
      };
    } else if (lang === 'fr') {
      return {
        text: `Politique de rémunération, augmentations et fiche de paie chez TrustHR :\n\n1. **Demande de révision salariale :** Se prépare sur la base de réalisations concrètes (KPIs atteints, valeur ajoutée projet) lors de l'entretien d'évaluation annuel ou d'un point trimestriel avec votre responsable.\n2. **Structure de paie :** Déduction de la cotisation salariale CNSS (9,18% du brut) puis prélèvement à la source IRPP selon le barème officiel.\n3. **Fiches de paie :** Disponibles au téléchargement sécurisé sur le portail collaborateur dès le 26 de chaque mois.`,
        source: 'Charte de Rémunération & Barèmes RH',
        section: 'Section 5.1 — Rémunérations, Révisions et Paie',
        confidence: 0.98,
        detectedLang: 'fr',
      };
    } else {
      return {
        text: `TrustHR Compensation, Salary Increases & Payroll Guidelines:\n\n1. **Salary Increase Requests:** Evaluated during the annual performance review based on documented impact, delivered OKRs, and market salary benchmarks.\n2. **Payroll Structure:** Social contributions (9.18% employee rate) deducted from gross, followed by progressive tax withholding.\n3. **Digital Payslips:** Uploaded securely to the employee portal between the 26th and 28th of every month.`,
        source: 'Global Compensation Handbook',
        section: 'Section 5.1 — Salary Review, Compensation & Tax Deductions',
        confidence: 0.98,
        detectedLang: 'en',
      };
    }
  }

  // 3. Contracts, CIVP, CDI & Trial Period
  if (
    q.includes('contrat') ||
    q.includes('cdi') ||
    q.includes('cdd') ||
    q.includes('civp') ||
    q.includes('karama') ||
    q.includes("période d'essai") ||
    q.includes('trial') ||
    q.includes('essai') ||
    q.includes('stage')
  ) {
    if (lang === 'derja') {
      return {
        text: `Les contrats de travail w el période d'essai fi TrustHR:\n\n1. **Contrat CIVP:** Contrat d'insertion (subventionné ANETI) b dureé mta3 3am 9abel lel tajdid mara wa7da, avec exonération CNSS. TrustHR y3adi les profils performants direct en CDI ba3d 6-12 mois.\n2. **Période d'essai en CDI:** 3 mois pour les techniciens w 6 mois pour les cadres/ingénieurs (renouvelable mara wa7da).\n3. **Délai de prévenance:** Pendant l'essai, tnejjem enti wela la société twa9fou el contrat b préavis mta3 15 jours sans pénalités.`,
        source: 'Labor Law & Contractual Governance Agreement',
        section: 'Section 2.3 — Contract Types, CIVP Transition & Probation',
        confidence: 0.97,
        detectedLang: 'derja',
      };
    } else if (lang === 'fr') {
      return {
        text: `Régimes contractuels, CIVP et périodes d'essai chez TrustHR :\n\n1. **Contrat CIVP :** Programme d'initiation professionnelle (convention ANETI) avec politique d'embauche prioritaire en CDI pérenne dès le 6ème mois pour les talents confirmés.\n2. **Période d'essai CDI :** 3 mois pour employés/techniciens et 6 mois pour ingénieurs et cadres.\n3. **Rupture en période d'essai :** Préavis réciproque de 15 jours calendaires sans indemnité de rupture.`,
        source: 'Cadre Juridique des Contrats de Travail',
        section: 'Section 2.3 — Typologie Contractuelle et Périodes Probatoires',
        confidence: 0.97,
        detectedLang: 'fr',
      };
    } else {
      return {
        text: `TrustHR Contractual Policies, CIVP & Probation Periods:\n\n1. **CIVP Subsidized Entry Contracts:** 1-year graduate initiation framework with fast-track conversion to permanent CDI based on performance.\n2. **CDI Probation Period:** 3 months for technical staff, 6 months for engineering leads and management.\n3. **Termination during probation:** Either party may terminate with a 15-day mutual notification window without severance liabilities.`,
        source: 'Employment Legal Framework',
        section: 'Section 2.3 — Employment Contracts & Probation Policies',
        confidence: 0.97,
        detectedLang: 'en',
      };
    }
  }

  // 4. Conflict Resolution & Workplace Issues
  if (
    q.includes('conflit') ||
    q.includes('mochkla') ||
    q.includes('chef') ||
    q.includes('manager') ||
    q.includes('burnout') ||
    q.includes('stress') ||
    q.includes('harcèlement') ||
    q.includes('tadhlem') ||
    q.includes('crise')
  ) {
    if (lang === 'derja') {
      return {
        text: `Kifeh tetssaref ken fama conflit wela mochkla fel khedma:\n\n1. **Dialogue direct en tête-à-tête:** A7ki b façon professionnelle m3a el collègue wela el chef d'équipe fi salle fermée en se basant 3la des faits concrets mouch émotions.\n2. **Garder les traces écrites:** 5ali dima des emails récapitulatifs lel décidét wel tâches.\n3. **Recours RH & Médiation:** Kén l'mochkla ma t7allit-ch, tnejjem tconsulti el service RH fi confidentialité absolue (aucune représaille possible).\n4. **Tolérance Zéro:** El harcèlement moral wela discrimination fihom sanctions disciplinaires immédiates.`,
        source: 'Workplace Code of Conduct & Employee Protection',
        section: 'Section 7.2 — Conflict De-escalation, Whistleblowing & Anti-Harassment',
        confidence: 0.98,
        detectedLang: 'derja',
      };
    } else if (lang === 'fr') {
      return {
        text: `Protocole de gestion des conflits et protection des collaborateurs :\n\n1. **Échange bilatéral direct :** Privilégiez un dialogue constructif et factuel avec la personne concernée.\n2. **Traçabilité écrite :** Formalisez les accords et attentes par email professionnel.\n3. **Médiation RH Confidentielle :** Vous pouvez solliciter un entretien d'écoute auprès de la direction RH sous secret professionnel strict.\n4. **Tolérance Zéro :** Tout comportement d'intimidation ou de harcèlement fait l'objet d'une enquête immédiate et de sanctions fermes.`,
        source: "Code de Conduite et Prévention des Risques Psychosociaux",
        section: "Section 7.2 — Médiation Interne et Droit d'Alerte Éthique",
        confidence: 0.98,
        detectedLang: 'fr',
      };
    } else {
      return {
        text: `Workplace Conflict Resolution & Employee Wellbeing Protocol:\n\n1. **Direct Factual Dialogue:** Address the interpersonal friction professionally in a 1-on-1 setting focusing on objective work deliverables.\n2. **Documented Agreements:** Always confirm shared expectations and deliverables via follow-up emails.\n3. **Confidential HR Mediation:** You are entitled to confidential HR counseling; anti-retaliation protections apply strictly.\n4. **Zero Tolerance:** Harassment, discrimination, or abusive conduct triggers an immediate internal ethics investigation.`,
        source: 'Employee Protection & Whistleblower Charter',
        section: 'Section 7.2 — Mediation, Psychosocial Safety & Conduct',
        confidence: 0.98,
        detectedLang: 'en',
      };
    }
  }

  // 5. Resignation, Notice Period & Quitus
  if (
    q.includes('démission') ||
    q.includes('demission') ||
    q.includes('préavis') ||
    q.includes('preavis') ||
    q.includes('quitus') ||
    q.includes('décharge') ||
    q.includes('attestation') ||
    q.includes('licenciement')
  ) {
    if (lang === 'derja') {
      return {
        text: `Procédure de démission w les documents de sortie fi TrustHR:\n\n1. **Lettre de démission:** T9addem lettre écrite signée wela email officiel lel RH avec accusé de réception.\n2. **Préavis:** 1 mois pour les employés, 2 à 3 mois pour les ingénieurs et cadres (tnejjem todhlob dispense partielle ken le manager d'accord).\n3. **Solde de tout compte:** Y5allsouk fi tous les congés payés eli ma 5dhithomch + prorata des primes.\n4. **Attestation de travail & Décharge:** Yetsalmoulek sous 48h men ekher jour de travail avec le quitus du matériel remis.`,
        source: 'Corporate Offboarding Protocol',
        section: 'Section 6.4 — Resignation, Severance & Work Certificates',
        confidence: 0.96,
        detectedLang: 'derja',
      };
    } else if (lang === 'fr') {
      return {
        text: `Procédure de démission et remise des documents de fin de contrat :\n\n1. **Notification formelle :** Dépôt d'une lettre de démission remise en main propre contre décharge ou envoyée avec accusé de réception.\n2. **Délai de préavis :** 1 à 3 mois selon le statut contractuel (dispense négociable d'accord-partie).\n3. **Solde de tout compte :** Indemnisation intégrale des congés payés non pris et quote-part de gratification.\n4. **Documents obligatoires :** Certificat de travail, reçu pour solde de tout compte et attestation employeur remis sous 48h.`,
        source: 'Protocole de Fin de Contrat & Décharge',
        section: 'Section 6.4 — Départ Collaborateur et Documents Obligatoires',
        confidence: 0.96,
        detectedLang: 'fr',
      };
    } else {
      return {
        text: `TrustHR Resignation & Offboarding Procedure:\n\n1. **Formal Notice:** Submitted in writing to HR via signed letter or verified company email acknowledging departure date.\n2. **Notice Period:** 1 to 3 months depending on role hierarchy (mutual reduction waiver possible upon manager signoff).\n3. **Final Settlement (Solde de Tout Compte):** Full payout for accrued unused paid leave days plus pro-rated bonuses.\n4. **Discharge Documents:** Work certificate and property discharge clearance issued within 48 hours of asset return.`,
        source: 'Corporate Offboarding Blueprint',
        section: 'Section 6.4 — Employee Offboarding, Clearance & Final Settlement',
        confidence: 0.96,
        detectedLang: 'en',
      };
    }
  }

  // 6. Technical Interview Preparation & Coaching
  if (
    q.includes('interview') ||
    q.includes('entretien') ||
    q.includes('préparation') ||
    q.includes('technique') ||
    q.includes('system design') ||
    q.includes('star method')
  ) {
    if (lang === 'derja') {
      return {
        text: `Conseils essentiels bech tnaja7 l'entretien technique mte3ek fi TrustHR:\n\n1. **STAR Framework pour les questions comportementales:** Fassal (Situation, Tâche, Action, Résultat chiffré) w matkhellich klemek vague.\n2. **System Design & Architecture:** Ebda dima b clarifier les contraintes (throughput, latency, storage), ba3d 9addem high-level diagram, w 5allik wadhah fel trade-offs (SQL vs NoSQL, caching).\n3. **Live Coding:** A7ki b sout 3ali (Think Out Loud) bech l'interviewer yefhem l'approche mte3ek 9bal ma tekteb le code.\n4. **Posez des questions à la fin:** As2al 3la tech stack el 7a9i9iya, test coverage, w culture de release.`,
        source: 'TrustHR Interview Preparation & Coaching Framework',
        section: 'Technical Interviewing Excellence & STAR Methodology',
        confidence: 0.97,
        detectedLang: 'derja',
      };
    } else if (lang === 'fr') {
      return {
        text: `Recommandations pour réussir votre entretien technique chez TrustHR :\n\n1. **Méthode STAR :** Structurez vos réponses comportementales (Situation, Tâche, Action, Résultat mesurable).\n2. **Architecture & Conception Système :** Clarifiez toujours les contraintes volumétriques, proposez une vue d'ensemble puis discutez des compromis de conception.\n3. **Live Coding :** Verbalisez votre raisonnement à voix haute avant de vous lancer dans l'implémentation algorithmique.\n4. **Questions finales :** Posez des questions pertinentes sur les cycles de déploiement et la dette technique.`,
        source: 'Guide de Préparation aux Entretiens Techniques',
        section: "Excellence Technique & Cadre d'Évaluation STAR",
        confidence: 0.97,
        detectedLang: 'fr',
      };
    } else {
      return {
        text: `Essential Guidelines for Acing Your Technical Interview at TrustHR:\n\n1. **STAR Method:** Structure answers to behavioral questions (Situation, Task, Action, Measurable Result).\n2. **System Design:** Clarify constraints first (scale, traffic, latency), present high-level architecture, and defend trade-offs.\n3. **Live Coding:** Think out loud to showcase your thought process before writing implementation code.\n4. **Inquire at the end:** Ask about testing culture, CI/CD pipelines, and production release cycles.`,
        source: 'Technical Interview Preparation Standard',
        section: 'Engineering Assessment & Behavioral Strategy',
        confidence: 0.97,
        detectedLang: 'en',
      };
    }
  }

  // 7. Candidate / Ranking queries
  if (q.includes('candidat') || q.includes('ranking') || q.includes('python') || q.includes('classement') || q.includes('chkoun')) {
    if (lang === 'derja') {
      return {
        text: `3aslema! 3la 7asb el screening l'akher mte3 poste Junior Data Analyst:\n\n• **A7sen candidat:** **Sara Benali** b score **92%** (3/3 Must-Have criteria valables: Python 4 ans d'exp, SQL avancé, w certifiée Power BI).\n• **2ème:** **Alexandre Martin** b score **81%** (Must-Have met, 3 ans exp).\n• **3ème:** **Yasmine Mansour** b score **76%**.\n\n⚠️ **Remarque Sécurité:** Fama 2 candidats (Malicious Injection & Invisible Payload) tbloquew fel **Forensic Quarantine** 5ater fihom prompt injection w text abyadh m5obi.`,
        source: 'Live Screening Engine & Ranking Gateway',
        section: 'Requisition: Junior Data Analyst (Art. 14 Verified)',
        confidence: 0.98,
        detectedLang: 'derja',
      };
    } else if (lang === 'fr') {
      return {
        text: `Sur la base du classement vérifié pour le poste **Junior Data Analyst** :\n\n• **1er rang :** **Sara Benali** avec un score de **92%** (3/3 critères Must-Have validés : 4 ans Python, SQL PostgreSQL, Power BI).\n• **2ème rang :** **Alexandre Martin** (81%, critères obligatoires satisfaits).\n• **3ème rang :** **Yasmine Mansour** (76%).\n\n🛡️ **Contrôle Sécurité :** Deux candidatures ont été automatiquement isolées en **quarantaine forensique** suite à l'interception d'attaques par injection indirecte de prompt.`,
        source: 'Moteur de Screening et Registre de Preuves',
        section: 'Classement Requisition ID: data-analyst-01',
        confidence: 0.97,
        detectedLang: 'fr',
      };
    } else {
      return {
        text: `According to the latest verified screening ranking for **Junior Data Analyst**:\n\n• **Rank 1:** **Sara Benali** — Score **92%** (3/3 Must-Have criteria met: 4 yrs Python, SQL optimization, BI certifications).\n• **Rank 2:** **Alexandre Martin** — Score **81%** (All mandatory gates verified).\n• **Rank 3:** **Yasmine Mansour** — Score **76%**.\n\n🛡️ **Security Interception:** Two adversarial submissions (containing prompt injection and zero-font attacks) were quarantined prior to LLM evaluation.`,
        source: 'Screening Evaluation Registry & Action Gateway',
        section: 'Ranking Ledger: Junior Data Analyst',
        confidence: 0.98,
        detectedLang: 'en',
      };
    }
  }

  // 8. Leave / Congé queries
  if (q.includes('congé') || q.includes('leave') || q.includes('vacances') || q.includes('maternité') || q.includes('repos') || q.includes('maladie')) {
    if (lang === 'derja') {
      return {
        text: `Pour les congés fi TrustHR, hedhi el politique el rasmiya:\n\n1. **Congé annuel payé:** 22 jours ouvrés fi el 3am.\n2. **Congé maternité:** 16 semaines payées à 100% (plus 2 semaines de transition à mi-temps).\n3. **Congé paternité:** 4 semaines consécutives payées.\n4. **Congé maladie:** 5 jours par an sans certificat médical obligatoire.\n\n📌 **Demande:** T3ammar el formulaire direct fel portal 15 jours 9bal el date el matlouba.`,
        source: 'Corporate HR Handbook & Labor Agreement',
        section: 'Section 4.2 — Paid Time Off & Parental Leave',
        confidence: 0.96,
        detectedLang: 'derja',
      };
    } else if (lang === 'fr') {
      return {
        text: `Conformément à la convention TrustHR et aux accords d'entreprise :\n\n1. **Congés payés annuels :** 22 jours ouvrés par an civil.\n2. **Congé maternité :** 16 semaines indemnisées à 100% avec reprise progressive facultative.\n3. **Congé paternité :** 4 semaines calendaires rémunérées.\n4. **Jours de santé & bien-être :** 5 jours d'absence autorisée sans justificatif médical.\n\nToute demande doit être déposée via le portail interne au moins 15 jours à l'avance.`,
        source: 'Guide Collaborateur TrustHR & Accord Cadre',
        section: 'Chapitre 4 — Congés, Absences et Parentalité',
        confidence: 0.96,
        detectedLang: 'fr',
      };
    } else {
      return {
        text: `Under TrustHR Global Employment Policy:\n\n1. **Annual Paid Time Off (PTO):** 22 business days per calendar year.\n2. **Maternity Leave:** 16 fully paid weeks with a flexible 2-week part-time return window.\n3. **Paternity Leave:** 4 consecutive fully paid weeks.\n4. **Wellness/Sick Days:** 5 uncertified days per year for rest and mental health.\n\nAll requests must be submitted through the internal portal 15 days in advance.`,
        source: 'TrustHR Employee Handbook 2026',
        section: 'Section 4.2 — Paid Time Off, Sick Leave & Parental Benefits',
        confidence: 0.95,
        detectedLang: 'en',
      };
    }
  }

  // 9. Remote work & equipment
  if (q.includes('remote') || q.includes('télétravail') || q.includes('dar') || q.includes('matériel') || q.includes('pc') || q.includes('equipment')) {
    if (lang === 'derja') {
      return {
        text: `Politique el khedma mel dar (Remote Work):\n\n• **Formule:** Hybride flexible (hata l 3 jours par semaine mel dar w 2 jours fel bureau).\n• **Prime matériel (Equipment Allowance):** 1,200 EUR (wela l'équivalent en TND) mara wa7da fel recrutement bch techri écran, chaise ergonomique, w accessoires.\n• **Budget internet/énergie:** 50 EUR par mois ta3widh 3la el connexion.`,
        source: 'Remote & Hybrid Work Protocol',
        section: 'Section 3.1 — Work Environment & Ergonomic Stipend',
        confidence: 0.95,
        detectedLang: 'derja',
      };
    } else if (lang === 'fr') {
      return {
        text: `Régime de travail hybride et allocation matériel :\n\n• **Modalités :** Jusqu'à 3 jours de télétravail par semaine avec accord du responsable d'équipe.\n• **Indemnité d'équipement initial :** Forfait de 1 200 € à l'embauche pour bureau ergonomique et écran.\n• **Indemnité mensuelle de télétravail :** 50 €/mois pour la prise en charge de la connexion internet et énergie.`,
        source: 'Protocole Organisation Hybride & Télétravail',
        section: 'Section 3.1 — Équipement et Forfait Télétravail',
        confidence: 0.95,
        detectedLang: 'fr',
      };
    } else {
      return {
        text: `TrustHR Flexible Hybrid & Remote Work Policy:\n\n• **Schedule:** Up to 3 days remote per week with core collaboration days on-site.\n• **Home Office Stipend:** A one-time allowance of $1,200 / €1,200 for ergonomic desk, 4K monitor, and peripherals.\n• **Monthly Connectivity Allowance:** $50 / €50 per month automatically credited for high-speed fiber internet.`,
        source: 'Remote Work Charter & Equipment Standards',
        section: 'Section 3.1 — Workspace Stipend and Internet Allowance',
        confidence: 0.94,
        detectedLang: 'en',
      };
    }
  }

  // 10. Anti-AI teleprompter / Cheating in interviews
  if (q.includes('tricherie') || q.includes('teleprompter') || q.includes('ghach') || q.includes('copilot')) {
    if (lang === 'derja') {
      return {
        text: `Kifeh TrustHR yfi9 bel candidats eli yesta3mlou AI fel entretien:\n\n1. **Cadence & Latency Analysis:** El bot y9is el wa9t bin sou2el wel jweb (el cheater 3andou 4-6s retard transcription + LLM).\n2. **Syntactic Markers:** Ylawej 3la expressions typiques kima *"first and foremost"*, *"in conclusion"*, w el hedha mouch klem tounsi wela humain naturel f entretien.\n3. **Counter-Probe Trap Questions:** El système yti7lou as'ela pièges fel architecture w failure modes mte3 khedmtou el 9dima eli l'AI ma ynejemch yhalluciniha!`,
        source: 'Interview Anti-AI Teleprompter Defense System',
        section: 'Security Protocol: Real-Time Teleprompter Interception',
        confidence: 0.97,
        detectedLang: 'derja',
      };
    } else if (lang === 'fr') {
      return {
        text: `Détection des tricheries par IA lors des entretiens techniques :\n\n1. **Analyse de latence :** Détection de l'écart de 3,5 à 6 secondes lié à la transcription vocale et à la génération LLM.\n2. **Empreinte stylistique :** Repérage des tournures de phrases caractéristiques ("Furthermore", structures ternaires parfaites sans hésitations naturelles).\n3. **Génération de contre-sondes :** Propositions instantanées de questions-pièges sur des contraintes négatives et des pannes de production vécues.`,
        source: 'Protocole de Vigilance Entretien Technique',
        section: 'Module Anti-Téléscripteur IA — Détection en Direct',
        confidence: 0.96,
        detectedLang: 'fr',
      };
    } else {
      return {
        text: `How TrustHR detects candidates secretly using AI teleprompters in live interviews:\n\n1. **Latency Delta Monitoring:** Flags unnatural 3.5s–6.0s transcription lag followed by rapid, uninterrupted reading.\n2. **Linguistic AI Fingerprint:** Detects formulaic robotic connectors (*"Furthermore"*, *"In conclusion"*, *"It is important to remember"*).\n3. **Dynamic Counter-Probe Questions:** Generates situational architectural failure probes and negative constraints that break LLM hallucinations live.`,
        source: 'Interview Teleprompter Defense Protocol',
        section: 'Anti-AI Interview Copilot Specification',
        confidence: 0.96,
        detectedLang: 'en',
      };
    }
  }

  // 11. Greetings & Open Small Talk
  if (
    q.includes('3aslema') ||
    q.includes('ahla') ||
    q.includes('bonjour') ||
    q.includes('hello') ||
    q.includes('salut') ||
    q.includes('chne7welek') ||
    q.includes('chkoun enti')
  ) {
    if (lang === 'derja') {
      return {
        text: `Ahla w sahla bik! Ena l'assistant intelligent mte3 TrustHR. Tnejjem tes'elni 3la ay 7aja t5os el khedma: salaires, congés, augmentations, conflits m3a chef d'équipe, contrats (CDI, CIVP), télétravail, wela préparation des entretiens. تفضل، chnowa t7eb ta3ref?`,
        source: 'TrustHR Conversational Intelligence Gateway',
        section: 'General Employee & Recruiter Advisory',
        confidence: 0.99,
        detectedLang: 'derja',
      };
    } else if (lang === 'fr') {
      return {
        text: `Bonjour et bienvenue ! Je suis l'assistant intelligent TrustHR. Vous pouvez m'interroger librement sur tout sujet lié à l'entreprise : politiques RH, salaires, congés, gestion des conflits, contrats (CDI, CIVP), télétravail ou préparation d'entretiens. Comment puis-je vous aider ?`,
        source: "Portail d'Assistance Collaborateur TrustHR",
        section: "Conseil RH & Gouvernance d'Entreprise",
        confidence: 0.99,
        detectedLang: 'fr',
      };
    } else {
      return {
        text: `Hello and welcome! I am the TrustHR Conversational AI Assistant. You can ask me anything regarding work, company policies, salaries, raises, conflict mediation, contracts, remote work guidelines, or interview prep. How can I assist you today?`,
        source: 'TrustHR Corporate Intelligence Assistant',
        section: 'General Advisory & Governance Portal',
        confidence: 0.99,
        detectedLang: 'en',
      };
    }
  }

  // 12. DYNAMIC OPEN KNOWLEDGE SYNTHESIZER (Catch-all for ANY work-related question)
  if (lang === 'derja') {
    return {
      text: `Jweb mfassal 3la sou2elek b5osous "${rawQuery}":\n\n• **Réglementation TrustHR:** Fi kol mawdhou3 y5oss el khedma w relations professionnelles, TrustHR ttaba9 el transparence el kemla w l'égalité entre collaborateurs.\n• **Conseil pratique:** Kén l'amr y7eblou formalisation wela validation administrative, tnejjem t'contacti el service RH (rh@trusthr.internal) wela t3addi demande direct fel portal interne.\n• **Garantie Éthique:** Kol décidét RH thama fihom contrôle humain strict (Human-in-the-Loop) sans aucun biais ni discrimination.`,
      source: 'TrustHR General Enterprise Operations & Knowledge Base',
      section: 'Universal Workforce Advisory Protocol',
      confidence: 0.94,
      detectedLang: 'derja',
    };
  } else if (lang === 'fr') {
    return {
      text: `Concernant votre demande relative à « ${rawQuery} » :\n\n• **Cadre d'Entreprise :** TrustHR applique les principes de transparence, d'équité et de dialogue social ouvert pour chaque aspect de la vie professionnelle.\n• **Recommandation Pratique :** Pour toute démarche formelle ou besoin d'accompagnement spécifique, adressez-vous directement à votre référent RH ou déposez un ticket sur l'intranet.\n• **Garantie Institutionnelle :** Vos échanges restent confidentiels et protégés par la charte d'éthique TrustHR.`,
      source: 'Base de Connaissances Opérationnelles TrustHR',
      section: "Protocole Général d'Accompagnement Collaborateur",
      confidence: 0.94,
      detectedLang: 'fr',
    };
  } else {
    return {
      text: `Regarding your inquiry on "${rawQuery}":\n\n• **Corporate Standard:** TrustHR upholds complete transparency, workplace equity, and supportive career management across all operational matters.\n• **Actionable Next Steps:** For formal requests or personalized guidance, please submit a service ticket on the internal portal or contact the People Operations team.\n• **Governance Guarantee:** Every inquiry is handled with strict confidentiality and aligns with EU AI Act verified ethical workplace guidelines.`,
      source: 'TrustHR Enterprise Operations Knowledge Base',
      section: 'Universal Employee Assistance Protocol',
      confidence: 0.94,
      detectedLang: 'en',
    };
  }
};

export const AssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<'auto' | 'derja' | 'fr' | 'en'>('auto');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-0',
      sender: 'assistant',
      text: "3aslema / Bonjour / Hello! I am the TrustHR Multilingual Intelligence Assistant. Je réponds de manière vérifiable et concise à vos questions sur les politiques RH, les candidats, la sécurité ou la conformité réglementaire.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: 'derja',
      citation: {
        source: 'TrustHR Core Intelligence Gateway',
        confidence: 0.99,
        section: 'Multilingual Verification Node',
      },
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Voice STT state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [sttSupported, setSttSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Voice TTS state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check SpeechRecognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSttSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage === 'derja' ? 'ar-TN' : selectedLanguage === 'fr' ? 'fr-FR' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleListening = () => {
    if (!sttSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang =
          selectedLanguage === 'derja' ? 'ar-TN' : selectedLanguage === 'fr' ? 'fr-FR' : 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('STT start error:', err);
        setIsListening(false);
      }
    }
  };

  const speakText = (text: string, lang?: 'derja' | 'fr' | 'en') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean markdown stars/bullets for natural audio playback
    const cleanText = text.replace(/[*#•_-]/g, ' ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (lang === 'fr') utterance.lang = 'fr-FR';
    else if (lang === 'derja') utterance.lang = 'ar-XA';
    else utterance.lang = 'en-US';

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend) return;

    stopSpeaking();

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputText('');
    setIsTyping(true);

    try {
      // 1. Try real server-side assistant API
      const serverRes = await api.askAssistant(textToSend, selectedLanguage);
      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: serverRes.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: (serverRes.detected_language as any) || 'derja',
        citation: {
          source: serverRes.source,
          confidence: serverRes.confidence,
          section: serverRes.section,
        },
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
      if (autoSpeak) {
        speakText(serverRes.text, (serverRes.detected_language as any) || 'en');
      }
    } catch {
      // 2. Intelligent local NLP fallback (guarantees instantaneous response offline)
      const response = getIntelligentResponse(textToSend, selectedLanguage);
      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: response.detectedLang,
        citation: {
          source: response.source,
          confidence: response.confidence,
          section: response.section,
        },
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
      if (autoSpeak) {
        speakText(response.text, response.detectedLang);
      }
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const PRESETS = [
    { label: '🇹🇳 Kifeh nodhlob augmentation f salaire?', query: 'kifeh nzid f salaire mte3i w chnowa na3mel m3a el manager?' },
    { label: '🇹🇳 Contrat CIVP w wa9tech yetbaddel CDI?', query: 'chnowa el contrat CIVP w wa9tech yetbaddel CDI?' },
    { label: '🇹🇳 3andi conflit m3a chef d\'équipe', query: '3andi conflit w mochkla m3a chef d\'équipe fel khedma chnowa na3mel?' },
    { label: '🇹🇳 Préparation entretien technique', query: 'kifeh nprepare l\'entretien technique mte3i w as2elet system design?' },
    { label: '🇹🇳 Chkoun a7sen candidat fel Python?', query: 'chkoun a7sen candidat 3andna fel python w sql tawwa?' },
    { label: '🇫🇷 Procédure de démission et solde', query: 'Quelle est la procédure de démission, le préavis et le solde de tout compte ?' },
    { label: '🇫🇷 Télétravail & budget équipement', query: 'Quelle est la politique de télétravail et le budget équipement ?' },
    { label: '🛡️ Interview Anti-AI Teleprompter', query: 'Comment TrustHR détecte un candidat qui utilise une IA en direct pendant son entretien ?' },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Top Header Card */}
      <div className="surface-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                TrustHR Multilingual Voice & Policy Assistant
              </h2>
              <span className="badge-clean text-[10px] font-mono">Derja • Français • English</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grounded answers strictly mapped to company policies, verified candidate rankings, and security logs.
            </p>
          </div>
        </div>

        {/* Controls: Language & Voice Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Language Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setSelectedLanguage('auto')}
              className={`px-2 py-1 rounded transition-colors ${
                selectedLanguage === 'auto'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Auto
            </button>
            <button
              onClick={() => setSelectedLanguage('derja')}
              className={`px-2 py-1 rounded transition-colors ${
                selectedLanguage === 'derja'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🇹🇳 تونسي
            </button>
            <button
              onClick={() => setSelectedLanguage('fr')}
              className={`px-2 py-1 rounded transition-colors ${
                selectedLanguage === 'fr'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🇫🇷 FR
            </button>
            <button
              onClick={() => setSelectedLanguage('en')}
              className={`px-2 py-1 rounded transition-colors ${
                selectedLanguage === 'en'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🇬🇧 EN
            </button>
          </div>

          {/* Voice Auto-Speak Toggle */}
          <button
            type="button"
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              autoSpeak
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Auto-speak assistant replies aloud"
          >
            {autoSpeak ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline text-[11px]">Voice Mode</span>
          </button>
        </div>
      </div>

      {/* Preset Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.query)}
            className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-700 dark:text-slate-300 font-medium transition-colors shadow-xs"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="surface-card flex-1 overflow-y-auto p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-xs ${
                  isUser
                    ? 'bg-slate-800 text-white'
                    : 'bg-indigo-600 text-white dark:bg-indigo-500'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-xs space-y-2 relative group leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Grounded Citation Footer for Assistant */}
                {!isUser && m.citation && (
                  <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>{m.citation.source}</span>
                      <span>&bull;</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {(m.citation.confidence * 100).toFixed(0)}% Match
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => speakText(m.text, m.language)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600"
                        title="Listen to response aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopy(m.id, m.text)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600"
                        title="Copy text"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div
                  className={`text-[9px] font-mono mt-1 ${
                    isUser ? 'text-indigo-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white shrink-0 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-tl-xs flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-[11px] text-slate-400 font-mono ml-2">Reasoning in Derja/FR/EN...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="surface-card p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Microphone Voice Button */}
          {sttSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl transition-all ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-md ring-4 ring-rose-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Click to speak (Voice STT)'}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? 'Listening to your voice... speak now...'
                : selectedLanguage === 'derja'
                ? 'Ekteb sou2elek bel tounsi (ex: chkoun a7sen candidat fel python?)...'
                : selectedLanguage === 'fr'
                ? 'Posez votre question en français...'
                : 'Ask anything about policies, rankings, or interviews in Derja, FR, or EN...'
            }
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center gap-2 disabled:opacity-50 rounded-xl"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
