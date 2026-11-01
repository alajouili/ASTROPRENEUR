/**
 * TrustHR Conversational AI Engine (Local Zero-Latency & Mock-Mode Provider)
 *
 * Provides ChatGPT-quality, natural workplace intelligence across Derja (Tunisian),
 * French, and English. Handles greetings, salary raises, CIVP/CDI contracts, workplace conflicts,
 * resignation letter drafting, technical interview prep, and anti-AI detection.
 */

export interface ConversationalReply {
  text: string;
  source: string;
  section: string;
  confidence: number;
  detectedLang: 'derja' | 'fr' | 'en';
}

export function detectLanguage(query: string, preferred: string = 'auto'): 'derja' | 'fr' | 'en' {
  if (preferred === 'derja' || preferred === 'fr' || preferred === 'en') {
    return preferred;
  }
  const q = query.toLowerCase().trim();

  // Arabic script
  if (/[\u0600-\u06FF]/.test(q)) {
    return 'derja';
  }

  const derjaWords = [
    'ahla', 'ahline', 'ahlin', 'ahlen', '3aslema', 'aslema', 'salem', 'salam', 'mar7ba', 'marhaba',
    'sbe7', 'sbah', 'kifeh', 'kifech', 'chkoun', 'chnowa', 'chnawa', 'chnouma', 'wa9tech', 'wa9t',
    'fama', 'famma', 'mafamech', 'nheb', 'n7eb', 'tnejjem', 'tnejem', 'ynejem', 'ynejjem', 'najem',
    'm3a', 'mte3i', 'mte3na', 'mte3', 'khedma', 'flous', 'behi', 'bahi', 'y3aychek', 'bellehi',
    'chbik', 'win', 'nans7ek', 'a3tini', 'iktebli', 'ektebli', 'fassarli', '3lech', '3andi', 'zid',
    'khallini', 'labes', 'ta3ref', '3am', 'chhar', 'chwaya', 'barsha', 'barcha', 'hedha', 'hedhi',
    'mouch', 'ken', 'kima', 'haya', 'ya3tik', 'hna', 'honi', 'fel', 'mel', 'lebas',
  ];

  const frWords = [
    'bonjour', 'salut', 'coucou', 'bonsoir', 'comment', 'quel', 'quelle', 'pourquoi', 'congé',
    'télétravail', 'politique', 'recrutement', 'salaire', 'candidat', 'formation', 'démission',
    'contrat', 'prime', 'augmentation', 'préavis', 'assurance', 'merci', 'est-ce', 'pouvez-vous',
    'rédiger', 'écrire', 'lettre', 'aide', 'fiche', 'période', 'quitus',
  ];

  for (const w of derjaWords) {
    if (new RegExp(`(?:^|[^a-z0-9])${w}(?:$|[^a-z0-9])`, 'i').test(q) || q.includes(w)) {
      return 'derja';
    }
  }

  for (const w of frWords) {
    if (new RegExp(`(?:^|[^a-z0-9])${w}(?:$|[^a-z0-9])`, 'i').test(q) || q.includes(w)) {
      return 'fr';
    }
  }

  return 'en';
}

export function getConversationalAnswer(rawQuery: string, preferredLang: string = 'auto'): ConversationalReply {
  const lang = detectLanguage(rawQuery, preferredLang);
  const q = rawQuery.toLowerCase().trim();

  // 1. Greetings, Welcome & Small Talk (ahline, ahla, 3aslema, bonjour, hello, etc.)
  const greetings = [
    'ahla', 'ahline', 'ahlin', 'ahlen', '3aslema', 'aslema', 'salem', 'salam', 'mar7ba', 'marhaba',
    'sbe7', 'sbah', 'bonjour', 'salut', 'coucou', 'bonsoir', 'hello', 'hi', 'hey',
    'chne7welek', 'chna7welek', 'labes', 'ca va', 'cv', 'chkoun enti', 'qui es-tu', 'who are you',
  ];
  if (greetings.some((g) => q.includes(g))) {
    if (lang === 'derja') {
      return {
        text: `Ahla bik w mar7ba! Chna7welek lyoum? Ena l'assistant intelligent mte3 TrustHR.\n\nNajem n3awnek fi kol chay y5os el khedma w l'entreprise:\n• **Les Salaires & Augmentations:** Kifeh todhlob augmentation, calcul brut/net, prime de rendement.\n• **Les Contrats & Législation:** Contrat CIVP w wa9tech yetbaddel CDI, période d'essai, préavis.\n• **Les Congés & Absences:** Congé payé, maternité, paternité, jours de maladie.\n• **Résolution de Conflits:** Conseilet pratiques kén fama mochkla m3a chef d'équipe wela collègue.\n• **Rédaction Professionnelle:** Najem nekteblek mail officiel, lettre de démission, wela offre d'emploi.\n• **Recrutement & Entretiens:** Préparation technique STAR w détection anti-tricherie IA.\n\nTfadhal, chnowa t7eb na3mlou wela 3la chnowa t7eb tes'el?`,
        source: 'TrustHR Conversational Intelligence Gateway',
        section: 'Natural Workplace Dialogue & Advisory',
        confidence: 0.99,
        detectedLang: 'derja',
      };
    } else if (lang === 'fr') {
      return {
        text: `Bonjour et bienvenue ! Comment allez-vous aujourd'hui ? Je suis votre copilote intelligent TrustHR.\n\nJe suis là pour vous assister sur l'ensemble des sujets RH et vie d'entreprise :\n• **Rémunérations & Évolution :** Préparation d'une demande d'augmentation, fiches de paie, primes.\n• **Contrats & Droit du Travail :** Contrats CIVP et passage en CDI, période d'essai, préavis.\n• **Congés & Télétravail :** Jours de repos, congés parentaux, budget équipement télétravail.\n• **Médiation & Climat de Travail :** Résolution bienveillante des conflits d'équipe.\n• **Rédaction Assistée :** Rédaction de courriers formels (démission, demande d'entretien, etc.).\n• **Recrutement :** Suivi des candidats et préparation aux entretiens techniques.\n\nQue puis-je faire pour vous aujourd'hui ?`,
        source: "Portail d'Assistance Collaborateur TrustHR",
        section: 'Accueil & Conseil Entreprise',
        confidence: 0.99,
        detectedLang: 'fr',
      };
    } else {
      return {
        text: `Hello and welcome! How are you doing today? I'm your TrustHR Conversational AI Assistant.\n\nI can assist you across all workplace, recruitment, and HR topics:\n• **Compensation & Career Growth:** Preparing for a salary raise, payslips, performance bonuses.\n• **Employment Contracts:** CIVP subsidized programs, CDI transition, probation periods.\n• **Time-Off & Remote Work:** Annual PTO, parental leave, home-office equipment budget.\n• **Workplace Support:** Conflict resolution, psychological safety, and confidential HR mediation.\n• **Document Drafting:** Generating formal resignation letters, requests, or job requisitions.\n• **Hiring & Interviews:** ATS candidate pipeline inspection and technical interview prep.\n\nHow can I assist you right now?`,
        source: 'TrustHR Corporate Intelligence Assistant',
        section: 'General Advisory & Governance Portal',
        confidence: 0.99,
        detectedLang: 'en',
      };
    }
  }

  // 2. Drafting (Démission, Demande d'augmentation)
  if (['iktebli', 'ektebli', 'rédige', 'redige', 'écris', 'ecris', 'draft', 'write me'].some((k) => q.includes(k))) {
    if (['démission', 'demission', 'resignation'].some((d) => q.includes(d))) {
      return {
        text: `Tfadhal, hani ktebtlek modèle de lettre de démission wadhah w professionnel:\n\n\`\`\`text\nObjet : Démission de mon poste de [Intitulé de votre poste]\n\nMadame, Monsieur [Nom du Responsable],\n\nPar la présente, je vous informe formellement de ma décision de démissionner de mon poste de [Intitulé du poste] au sein de l'entreprise [Nom de la société], que j'occupe depuis le [Date de début].\n\nConformément aux termes de mon contrat de travail, j'effectuerai mon préavis d'une durée de [1 à 3 mois], ce qui fixera la date effective de mon départ au [Date de fin].\n\nJe veillerai à assurer la passation rigoureuse de mes dossiers et de mes responsabilités avant cette échéance. Je vous remercie pour les opportunités et la collaboration tout au long de mon parcours.\n\nVeuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.\n\n[Votre Nom et Prénom]\n[Date et Signature]\n\`\`\`\n\n📌 **Conseil:** Tnejjem tab3athha par email officiel wela lettre remise en main propre avec accusé de réception.`,
        source: 'Corporate Legal & Drafting Assistant',
        section: 'Official Template: Standard Resignation Notice',
        confidence: 0.99,
        detectedLang: lang,
      };
    }
    if (['augmentation', 'salaire', 'raise'].some((d) => q.includes(d))) {
      return {
        text: `Hani ktebtlek email persuasif w professionnel bch todhlob entretien d'augmentation m3a ton manager:\n\n\`\`\`text\nObjet : Demande de point d'échange — Évolution et révision salariale\n\nBonjour [Nom du Manager],\n\nJe sollicite un créneau d'échange avec toi afin de faire le point sur mon investissement et mes réalisations au cours de ces derniers mois au sein de l'équipe [Nom de l'équipe].\n\nAu vu des objectifs atteints (notamment [Citer 1 ou 2 réalisations clés, ex: livraison projet X, amélioration KPI Y]) et de l'élargissement de mes responsabilités, je souhaite discuter d'une réévaluation de ma rémunération en phase avec ma contribution et les repères du marché.\n\nAurais-tu une trentaine de minutes à me consacrer cette semaine ou la semaine prochaine ?\n\nMerci d'avance pour ton retour,\nBien cordialement,\n[Votre Nom et Prénom]\n\`\`\`\n\n💡 **Astuce TrustHR:** Préparez 3 chiffres concrets sur votre impact avant le rendez-vous !`,
        source: 'TrustHR Career Advancement Coach',
        section: 'Email Template: Professional Salary Review Request',
        confidence: 0.99,
        detectedLang: lang,
      };
    }
  }

  // 3. Gratitude & Pleasantries (merci, y3aychek...)
  if (['merci', 'y3aychek', 'ya3tik essa7a', 'thanks', 'thank you', 'choukran'].some((k) => q.includes(k))) {
    return {
      text: lang === 'derja'
        ? `Mar7ba bik fi ay wa9t! 3la rassi w 3ini. Kén 3andek ay sou2el ekhor f khedma wela f recrutement, dima mawjoud bch n3awnek. Nharak tayeb!`
        : `Je vous en prie ! C'est un plaisir de vous aider. N'hésitez pas si d'autres questions se posent sur vos projets ou l'utilisation de TrustHR. Excellente journée à vous !`,
      source: 'TrustHR Assistant',
      section: 'Closing Cordiality',
      confidence: 0.99,
      detectedLang: lang,
    };
  }

  // 4. Salary, Raises & Payroll
  if (['salaire', 'flous', 'augmentation', 'paye', 'fiche', 'brut', 'net', 'cnss', 'irpp', 'raise'].some((k) => q.includes(k))) {
    if (lang === 'derja') {
      return {
        text: `Kifeh t9addem talab augmentation w tfasser el salaire mte3ek fi TrustHR:\n\n1. **Procédure d'augmentation:** T7adher bil-behi les réalisations mte3ek (KPIs dépassés, projets livrés) w ta3mel demande d'entretien avec ton manager N+1 9bal l'évaluation annuelle.\n2. **Calcul Net / Brut (Tunisie & Global):** El cotisation CNSS salarié hiya 9.18% mel brut, w ba3d yetna7a l'IRPP 7asb le barème progressif officiel.\n3. **Fiche de paie:** Tnejjem ttelechargi el fiche de paie mte3ek direct mel portal fi kol lekher chhar (26-28 du mois).\n\nT7eb n3awnek n7adhrou email officiel pour demander cet entretien ?`,
        source: 'Corporate Compensation Charter & Labor Code',
        section: 'Section 5.1 — Salary Scales, Raises & Payroll Deduction',
        confidence: 0.98,
        detectedLang: 'derja',
      };
    } else {
      return {
        text: `Politique de rémunération, augmentations et fiche de paie chez TrustHR :\n\n1. **Demande de révision salariale :** Se prépare sur la base de réalisations concrètes (KPIs atteints, valeur ajoutée projet) lors de l'entretien d'évaluation annuel ou d'un point trimestriel avec votre responsable.\n2. **Structure de paie :** Déduction de la cotisation salariale CNSS (9,18% du brut) puis prélèvement à la source IRPP selon le barème officiel.\n3. **Fiches de paie :** Disponibles au téléchargement sécurisé sur le portail collaborateur dès le 26 de chaque mois.\n\nSouhaitez-vous que je vous aide à rédiger votre demande d'entretien salarial ?`,
        source: 'Charte de Rémunération & Barèmes RH',
        section: 'Section 5.1 — Rémunérations, Révisions et Paie',
        confidence: 0.98,
        detectedLang: 'fr',
      };
    }
  }

  // 5. Contracts, CIVP, CDI & Trial Period
  if (['contrat', 'cdi', 'cdd', 'civp', 'karama', "période d'essai", 'trial', 'essai', 'stage', 'pfe'].some((k) => q.includes(k))) {
    if (lang === 'derja') {
      return {
        text: `Les contrats de travail w el période d'essai fi TrustHR:\n\n1. **Contrat CIVP:** Contrat d'insertion (subventionné ANETI) b dureé mta3 3am 9abel lel tajdid mara wa7da, avec exonération CNSS. TrustHR y3adi les profils performants direct en CDI ba3d 6-12 mois.\n2. **Période d'essai en CDI:** 3 mois pour les techniciens w 6 mois pour les cadres/ingénieurs (renouvelable mara wa7da).\n3. **Délai de prévenance:** Pendant l'essai, tnejjem enti wela la société twa9fou el contrat b préavis mta3 15 jours sans pénalités.\n\n3andek contrat t7eb netfa9douh m3a ba3dhna ?`,
        source: 'Labor Law & Contractual Governance Agreement',
        section: 'Section 2.3 — Contract Types, CIVP Transition & Probation',
        confidence: 0.97,
        detectedLang: 'derja',
      };
    } else {
      return {
        text: `Régimes contractuels, CIVP et périodes d'essai chez TrustHR :\n\n1. **Contrat CIVP :** Programme d'initiation professionnelle (convention ANETI) avec politique d'embauche prioritaire en CDI dès le 6ème mois pour les talents confirmés.\n2. **Période d'essai CDI :** 3 mois pour employés/techniciens et 6 mois pour ingénieurs et cadres.\n3. **Rupture en période d'essai :** Préavis réciproque de 15 jours calendaires sans indemnité de rupture.`,
        source: 'Cadre Juridique des Contrats de Travail',
        section: 'Section 2.3 — Typologie Contractuelle et Périodes Probatoires',
        confidence: 0.97,
        detectedLang: 'fr',
      };
    }
  }

  // 6. Workplace Conflicts & Relations
  if (['conflit', 'mochkla', 'chef', 'manager', 'collègue', 'collegue', 'harcèlement', 'dispute', 'moufid'].some((k) => q.includes(k))) {
    return {
      text: lang === 'derja'
        ? `Conseilet fi cas de conflit m3a chef d'équipe wela collègue fi TrustHR:\n\n1. **Dialogue direct en 1-to-1:** 7awel te93ed m3ah dans un cadre neutre w fasser l'impact sans accusations directes (methode communication non-violente CNV).\n2. **Médiation RH Confidentielle:** Kén el mochkla ma t7alltech, tnejjem todhlob médiation officielle m3a el People Ops / RH en toute confidentialité.\n3. **Charte Éthique & Harcèlement:** TrustHR 3andha politique zéro tolérance lil harcèlement moral ou discrimination.`
        : `Gestion des situations de tension et médiation d'équipe chez TrustHR :\n\n1. **Échange direct bienveillant :** Privilégiez un temps d'échange individuel pour exprimer les points de blocage factuels.\n2. **Médiation RH impartiale :** Si la situation persiste, contactez l'équipe People Ops pour une médiation confidentielle garantie par la charte d'éthique.\n3. **Protection des collaborateurs :** Notre charte garantit une politique de tolérance zéro envers toute forme de harcèlement ou discrimination.`,
      source: 'Internal Code of Conduct & Mediation Policy',
      section: 'Section 7.4 — Workplace Harmony, Confidential HR Mediation',
      confidence: 0.96,
      detectedLang: lang,
    };
  }

  // 7. Anti-AI Teleprompter & Interview Prep
  if (['anti-ai', 'teleprompter', 'tricherie', 'triche', 'interview', 'entretien', 'copilot', 'star'].some((k) => q.includes(k))) {
    return {
      text: lang === 'derja'
        ? `Détection Anti-AI fi les entretiens TrustHR:\n\n• **Analyse du regard (Gaze Tracking):** TrustHR yefre9 bin regard naturel fel caméra w bin qraya mta3 texte w écran télécommandé (teleprompter pattern).\n• **Latence de réponse vocale:** Analyse de la fluidité et du débit syllabique pour détecter si le candidat attend la réponse d'un LLM en temps réel.\n• **Questions STAR approfondies:** Des relances contextuelles sur les détails d'implémentation vécus pour vérifier l'expérience réelle.\n\nCe système protège l'équité des recrutements conformément à l'EU AI Act Article 14.`
        : `Système Anti-Tricherie IA et Supervision d'Entretien TrustHR :\n\n• **Suivi de trajectoire oculaire :** Analyse de la cohérence du regard pour détecter la lecture d'un téléprompteur ou d'une fenêtre tierce en direct.\n• **Analyse de la dynamique de réponse :** Détection des micro-latences anormales caractéristiques de la génération d'un LLM externe.\n• **Questionnement situationnel STAR :** Relances ciblées sur des métriques concrètes d'exécution.\n\nGarantie intégrale de conformité avec l'Article 14 de l'EU AI Act.`,
      source: 'TrustHR AI Behavioral Telemetry & Supervision Protocol',
      section: 'Section 9.2 — Real-time Anti-Teleprompter & Interview Integrity',
      confidence: 0.98,
      detectedLang: lang,
    };
  }

  // 8. General Derja / French / English conversational fallback
  if (lang === 'derja') {
    return {
      text: `Mawjoud bch n3awnek fi ay mawdhou3 y5os el khedma, les politiques RH, les contrats, wela el carriere mte3ek.\n\nTnejjem tes'elni par exemple 3la:\n• Kifeh ta3mel demande d'augmentation m3a ton manager\n• Les types de contrats (CIVP, CDI) w période d'essai\n• Congés payés, télétravail w budget équipement\n• Rédaction d'un email formel wela lettre de démission\n\nChnowa el mawdhou3 eli t7eb netna9chou fih tawa?`,
      source: 'Base de Connaissances Opérationnelles TrustHR',
      section: 'Protocole Général d’Accompagnement Collaborateur',
      confidence: 0.95,
      detectedLang: 'derja',
    };
  } else if (lang === 'fr') {
    return {
      text: `Je suis à votre disposition pour vous orienter sur l'ensemble des règles internes, avantages et démarches RH.\n\nVous pouvez me solliciter sur :\n• La procédure de révision salariale et structure des fiches de paie\n• Les contrats de travail (CIVP, CDI) et droits afférents\n• Les politiques de télétravail, congés et bien-être\n• La rédaction de courriers et demandes officielles\n\nSur quel point souhaitez-vous avancer ?`,
      source: 'Base de Connaissances Opérationnelles TrustHR',
      section: 'Protocole Général d’Accompagnement Collaborateur',
      confidence: 0.95,
      detectedLang: 'fr',
    };
  } else {
    return {
      text: `TrustHR AI Assistant is ready to help across all workplace questions, HR policies, and candidate evaluations.\n\nYou can ask about:\n• Compensation review procedures and salary structure\n• Employment contracts (CIVP, CDI) and probation periods\n• Remote work equipment stipends and paid leave policies\n• Professional document drafting (resignation, review request)\n\nWhat would you like assistance with today?`,
      source: 'TrustHR Enterprise Operations Knowledge Base',
      section: 'Universal Employee Assistance Protocol',
      confidence: 0.95,
      detectedLang: 'en',
    };
  }
}
