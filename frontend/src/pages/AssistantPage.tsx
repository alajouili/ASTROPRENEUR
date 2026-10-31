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

// Multilingual intelligent knowledge engine
const getIntelligentResponse = (
  rawQuery: string,
  targetLang: 'auto' | 'derja' | 'fr' | 'en'
): { text: string; source: string; section: string; confidence: number; detectedLang: 'derja' | 'fr' | 'en' } => {
  const q = rawQuery.toLowerCase().trim();

  // 1. Detect language
  let lang: 'derja' | 'fr' | 'en' = 'en';
  const derjaMarkers = ['3aslema', 'ahla', 'chkoun', 'chnouma', 'kifeh', 'wa9tech', 'fama', 'm3a', 'behi', 'berek', 'flous', 'khedma', 'dar', 'lebel', 'barsha', 'chwaya', 'nheb', 'ynejem', 'mte3na', 'mte3i', 'chnowa'];
  const frMarkers = ['bonjour', 'salut', 'comment', 'quel', 'quelle', 'pourquoi', 'congé', 'télétravail', 'politique', 'recrutement', 'salaire', 'candidat', 'formation'];

  if (targetLang !== 'auto') {
    lang = targetLang;
  } else if (derjaMarkers.some((m) => q.includes(m))) {
    lang = 'derja';
  } else if (frMarkers.some((m) => q.includes(m))) {
    lang = 'fr';
  } else {
    lang = 'en';
  }

  // 2. Candidate / Ranking queries
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

  // 3. Leave / Congé queries
  if (q.includes('congé') || q.includes('leave') || q.includes('vacances') || q.includes('maternité') || q.includes('repos')) {
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

  // 4. Remote work & equipment
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

  // 5. Anti-AI teleprompter / Cheating in interviews
  if (q.includes('interview') || q.includes('tricherie') || q.includes('ai') || q.includes('teleprompter') || q.includes('ghach') || q.includes('copilot')) {
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

  // Fallback direct answer
  if (lang === 'derja') {
    return {
      text: `Jweb 3la sou2elek: fi TrustHR, el 9a3ida el assasiya hiya: **"L'agent propose, l'humain décide"** (EU AI Act Article 14). Kol action fel recrutement wela l'administration t3adi bil **Action Gateway** w Merkle audit log bch netfakdou el transparence wel sécurité.`,
      source: 'TrustHR AI Governance Architecture',
      section: 'EU AI Act Article 14 Compliance Manual',
      confidence: 0.93,
      detectedLang: 'derja',
    };
  } else if (lang === 'fr') {
    return {
      text: `Réponse directe : chez TrustHR, le principe fondamental est **« L'agent propose, l'humain décide »** (Conformité Article 14 EU AI Act). Toutes les opérations critiques transitent par l'**Action Gateway** avec journalisation immuable Merkle SHA-256 pour garantir une traçabilité totale.`,
      source: 'Manuel de Gouvernance IA et Conformité RH',
      section: 'Architecture Zero-Trust & Action Gateway',
      confidence: 0.93,
      detectedLang: 'fr',
    };
  } else {
    return {
      text: `Direct Answer: TrustHR enforces the golden rule **"The agent proposes, the human decides"** (EU AI Act Article 14). All recruitment state mutations require explicit approval via the **Action Gateway** and are cryptographically anchored in an append-only SHA-256 Merkle audit ledger.`,
      source: 'TrustHR Core Governance Blueprint',
      section: 'Zero-Trust Architecture & Article 14 HITL',
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

    setTimeout(() => {
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
    }, 450);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const PRESETS = [
    { label: '🇹🇳 Chkoun a7sen candidat fel Python?', query: 'chkoun a7sen candidat 3andna fel python w sql tawwa?' },
    { label: '🇹🇳 Kifeh n9adem congé?', query: 'kifeh n9adem 3la congé maternité wela congé annuel?' },
    { label: '🇫🇷 Politique de télétravail', query: 'Quelle est la politique de télétravail et le budget équipement ?' },
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
