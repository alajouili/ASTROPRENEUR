"""Policy Assistant API. Every signed-in role may ask; each role only sees its documents.

Conversational AI copilot and Policy Assistant API for TrustHR.
Every signed-in role may ask; each role only sees its documents.
Supports multilingual queries (Tunisian Derja, French, English) across all corporate
HR policies, labor conventions, salaries, and processes.
"""
import re
import time
from collections import defaultdict, deque
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.agents.llm import build_llm_client
from app.agents.policy_assistant.knowledge import AUDIENCES_BY_ROLE
from app.agents.policy_assistant.service import OFFLINE_MODE, Turn, answer_question, get_index, resolve_policy_dir
from app.audit.log import append as audit
from app.auth.security import get_current_user
from app.config import get_settings
from app.db import get_db
from app.models import User

router = APIRouter(prefix="/api/assistant", tags=["assistant"])
_recent: dict[str, deque] = defaultdict(deque)  # per user, in memory (one API process)


class TurnIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1500)
    language: Literal["auto", "derja", "fr", "en"] = "auto"


class ChatResponse(BaseModel):
    text: str
    source: str
    section: str
    confidence: float
    detected_language: str


class AskIn(BaseModel):
    question: str = Field(max_length=1000)
    history: list[TurnIn] = Field(default_factory=list, max_length=10)

    @field_validator("question")
    @classmethod
    def _not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("question must not be empty")
        return v.strip()


def _rate_limit(user_id: str, per_minute: int) -> None:
    now = time.monotonic()
    window = _recent[user_id]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= per_minute:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many questions, wait a minute")
    window.append(now)


@router.get("/status")
def assistant_status(user: User = Depends(get_current_user)) -> dict:
    settings = get_settings()
    index = get_index(resolve_policy_dir(settings.policy_dir))
    llm = build_llm_client(settings)
    return {
        "mode": llm.label if llm else OFFLINE_MODE,
        "llm_configured": llm is not None,
        "documents": index.documents(AUDIENCES_BY_ROLE.get(user.role, {"all"})),
    }


@router.post("/ask")
def ask(body: AskIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    settings = get_settings()
    _rate_limit(user.id, settings.assistant_questions_per_minute)
    index = get_index(resolve_policy_dir(settings.policy_dir))
    if not index.passages:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "No policy documents are available")
    reply = answer_question(body.question, [Turn(t.role, t.content) for t in body.history], user.role, index,
                            build_llm_client(settings))
    audit(db, actor_type="user", actor_id=user.id, action="assistant.asked", entity_type="user", entity_id=user.id,
          details={"found": reply.found, "mode": reply.mode, "flagged": reply.flagged,
                   "sources": [s["id"] for s in reply.sources], "llm_error": reply.error})
    db.commit()
    return {"answer": reply.answer, "found": reply.found, "mode": reply.mode, "notice": reply.notice,
            "flagged": reply.flagged, "sources": reply.sources}

def _detect_language(query: str, target: str) -> str:
    if target in ("derja", "fr", "en"):
        return target
    q = query.lower().strip()

    # Arabic script
    if any("\u0600" <= c <= "\u06FF" for c in q):
        return "derja"

    derja_patterns = [
        "ahla", "ahline", "ahlin", "ahlen", "3aslema", "aslema", "salem", "salam", "mar7ba", "marhaba",
        "sbe7", "sbah", "kifeh", "kifech", "chkoun", "chnowa", "chnawa", "chnouma", "wa9tech", "wa9t",
        "fama", "famma", "mafamech", "nheb", "n7eb", "tnejjem", "tnejem", "ynejem", "ynejjem", "najem",
        "m3a", "mte3i", "mte3na", "mte3", "khedma", "flous", "behi", "bahi", "y3aychek", "bellehi",
        "chbik", "win", "nans7ek", "a3tini", "iktebli", "ektebli", "fassarli", "3lech", "3andi", "zid",
        "khallini", "labes", "ta3ref", "3am", "chhar", "chwaya", "barsha", "barcha", "hedha", "hedhi",
        "mouch", "ken", "kima", "haya", "ya3tik", "hna", "honi", "fel", "mel", "lebas",
    ]

    fr_patterns = [
        "bonjour", "salut", "coucou", "bonsoir", "comment", "quel", "quelle", "pourquoi", "congé",
        "télétravail", "politique", "recrutement", "salaire", "candidat", "formation", "démission",
        "contrat", "prime", "augmentation", "préavis", "assurance", "merci", "est-ce", "pouvez-vous",
        "rédiger", "écrire", "lettre", "aide", "fiche", "période", "quitus",
    ]

    for p in derja_patterns:
        if re.search(r"(?<![a-z0-9])" + re.escape(p) + r"(?![a-z0-9])", q) or p in q:
            return "derja"

    for p in fr_patterns:
        if re.search(r"(?<![a-z0-9])" + re.escape(p) + r"(?![a-z0-9])", q) or p in q:
            return "fr"

    return "en"


def _answer_query(q: str, lang: str) -> tuple[str, str, str, float]:
    q_low = q.lower().strip()

    # 1. Greetings, Welcome & Small Talk (ahline, ahla, 3aslema, bonjour, hello, etc.)
    greetings = [
        "ahla", "ahline", "ahlin", "ahlen", "3aslema", "aslema", "salem", "salam", "mar7ba", "marhaba",
        "sbe7", "sbah", "bonjour", "salut", "coucou", "bonsoir", "hello", "hi", "hey",
        "chne7welek", "chna7welek", "labes", "ca va", "cv", "chkoun enti", "qui es-tu", "who are you",
    ]
    if any(g in q_low for g in greetings):
        if lang == "derja":
            return (
                "Ahla bik w mar7ba! Chna7welek lyoum? Ena l'assistant intelligent mte3 TrustHR.\n\n"
                "Najem n3awnek fi kol chay y5os el khedma w l'entreprise:\n"
                "• **Les Salaires & Augmentations:** Kifeh todhlob augmentation, calcul brut/net, prime de rendement.\n"
                "• **Les Contrats & Législation:** Contrat CIVP w wa9tech yetbaddel CDI, période d'essai, préavis.\n"
                "• **Les Congés & Absences:** Congé payé, maternité, paternité, jours de maladie.\n"
                "• **Résolution de Conflits:** Conseilet pratiques kén fama mochkla m3a chef d'équipe wela collègue.\n"
                "• **Rédaction Professionnelle:** Najem nekteblek mail officiel, lettre de démission, wela offre d'emploi.\n"
                "• **Recrutement & Entretiens:** Préparation technique STAR w détection anti-tricherie IA.\n\n"
                "Tfadhal, chnowa t7eb na3mlou wela 3la chnowa t7eb tes'el?",
                "TrustHR Conversational Intelligence Gateway",
                "Natural Workplace Dialogue & Advisory",
                0.99,
            )
        elif lang == "fr":
            return (
                "Bonjour et bienvenue ! Comment allez-vous aujourd'hui ? Je suis votre copilote intelligent TrustHR.\n\n"
                "Je suis là pour vous assister sur l'ensemble des sujets RH et vie d'entreprise :\n"
                "• **Rémunérations & Évolution :** Préparation d'une demande d'augmentation, fiches de paie, primes.\n"
                "• **Contrats & Droit du Travail :** Contrats CIVP et passage en CDI, période d'essai, préavis.\n"
                "• **Congés & Télétravail :** Jours de repos, congés parentaux, budget équipement télétravail.\n"
                "• **Médiation & Climat de Travail :** Résolution bienveillante des conflits d'équipe.\n"
                "• **Rédaction Assistée :** Rédaction de courriers formels (démission, demande d'entretien, etc.).\n"
                "• **Recrutement :** Suivi des candidats et préparation aux entretiens techniques.\n\n"
                "Que puis-je faire pour vous aujourd'hui ?",
                "Portail d'Assistance Collaborateur TrustHR",
                "Accueil & Conseil Entreprise",
                0.99,
            )
        else:
            return (
                "Hello and welcome! How are you doing today? I'm your TrustHR Conversational AI Assistant.\n\n"
                "I can assist you across all workplace, recruitment, and HR topics:\n"
                "• **Compensation & Career Growth:** Preparing for a salary raise, payslips, performance bonuses.\n"
                "• **Employment Contracts:** CIVP subsidized programs, CDI transition, probation periods.\n"
                "• **Time-Off & Remote Work:** Annual PTO, parental leave, home-office equipment budget.\n"
                "• **Workplace Support:** Conflict resolution, psychological safety, and confidential HR mediation.\n"
                "• **Document Drafting:** Generating formal resignation letters, requests, or job requisitions.\n"
                "• **Hiring & Interviews:** ATS candidate pipeline inspection and technical interview prep.\n\n"
                "How can I assist you right now?",
                "TrustHR Corporate Intelligence Assistant",
                "General Advisory & Governance Portal",
                0.99,
            )

    # 2. Drafting Requests (Lettr de démission, mail d'augmentation, offre d'emploi...)
    if any(k in q_low for k in ("iktebli", "ektebli", "rédige", "redige", "écris", "ecris", "draft", "write me")):
        if any(d in q_low for d in ("démission", "demission", "resignation")):
            if lang == "derja":
                return (
                    "Tfadhal, hani ktebtlek modèle de lettre de démission wadhah w professionnel:\n\n"
                    "```text\n"
                    "Objet : Démission de mon poste de [Intitulé de votre poste]\n\n"
                    "Madame, Monsieur [Nom du Responsable],\n\n"
                    "Par la présente, je vous informe formellement de ma décision de démissionner de mon poste "
                    "de [Intitulé du poste] au sein de l'entreprise [Nom de la société], que j'occupe depuis le [Date de début].\n\n"
                    "Conformément aux termes de mon contrat de travail, j'effectuerai mon préavis d'une durée de [1 à 3 mois], "
                    "ce qui fixera la date effective de mon départ au [Date de fin].\n\n"
                    "Je veillerai à assurer la passation rigoureuse de mes dossiers et de mes responsabilités avant cette échéance. "
                    "Je vous remercie pour les opportunités et la collaboration tout au long de mon parcours.\n\n"
                    "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.\n\n"
                    "[Votre Nom et Prénom]\n"
                    "[Date et Signature]\n"
                    "```\n\n"
                    "📌 **Conseil:** Tnejjem tab3athha par email officiel wela lettre remise en main propre avec accusé de réception.",
                    "Corporate Legal & Drafting Assistant",
                    "Official Template: Standard Resignation Notice",
                    0.99,
                )
            else:
                return (
                    "Voici un modèle officiel de lettre de démission, clair, courtois et juridiquement conforme :\n\n"
                    "```text\n"
                    "Objet : Notification de démission du poste de [Votre Fonction]\n\n"
                    "Madame, Monsieur [Nom du Responsable ou Direction RH],\n\n"
                    "Par la présente, je vous notifie formellement ma décision de démissionner de mes fonctions de "
                    "[Votre Fonction] au sein de [Nom de l'Entreprise], fonction que j'exerce depuis le [Date de début].\n\n"
                    "Conformément aux stipulations de mon contrat de travail, j'effectuerai mon délai de préavis de [Durée], "
                    "ce qui portera l'échéance définitive de mon contrat au [Date de départ].\n\n"
                    "Je reste pleinement engagé(e) pour organiser une passation soignée et ordonnée de mes dossiers en cours.\n\n"
                    "Je vous prie d'agréer, Madame, Monsieur, l'expression de ma considération distinguée.\n\n"
                    "[Votre Prénom et Nom]\n"
                    "[Date et Signature]\n"
                    "```\n\n"
                    "N'hésitez pas si vous souhaitez ajuster la durée du préavis ou ajouter des clauses spécifiques !",
                    "Assistance Juridique et Rédactionnelle TrustHR",
                    "Modèle Formel : Démission avec Préavis",
                    0.99,
                )

        if any(d in q_low for d in ("augmentation", "salaire", "raise")):
            if lang == "derja":
                return (
                    "Hani ktebtlek email persuasif w professionnel bch todhlob entretien d'augmentation m3a ton manager:\n\n"
                    "```text\n"
                    "Objet : Demande de point d'échange — Évolution et révision salariale\n\n"
                    "Bonjour [Nom du Manager],\n\n"
                    "Je sollicite un créneau d'échange avec toi afin de faire le point sur mon investissement et mes réalisations "
                    "au cours de ces derniers mois au sein de l'équipe [Nom de l'équipe].\n\n"
                    "Au vu des objectifs atteints (notamment [Citer 1 ou 2 réalisations clés, ex: livraison projet X, amélioration KPI Y]) "
                    "et de l'élargissement de mes responsabilités, je souhaite discuter d'une réévaluation de ma rémunération "
                    "en phase avec ma contribution et les repères du marché.\n\n"
                    "Aurais-tu une trentaine de minutes à me consacrer cette semaine ou la semaine prochaine ?\n\n"
                    "Merci d'avance pour ton retour,\n"
                    "Bien cordialement,\n"
                    "[Votre Nom et Prénom]\n"
                    "```\n\n"
                    "💡 **Astuce TrustHR:** Préparez 3 chiffres concrets sur votre impact avant le rendez-vous !",
                    "TrustHR Career Advancement Coach",
                    "Email Template: Professional Salary Review Request",
                    0.99,
                )

    # 3. Gratitude & Pleasantries (merci, y3aychek, thanks...)
    if any(k in q_low for k in ("merci", "y3aychek", "ya3tik essa7a", "thanks", "thank you", "choukran")):
        if lang == "derja":
            return (
                "Mar7ba bik fi ay wa9t! 3la rassi w 3ini. Kén 3andek ay sou2el ekhor f khedma wela f recrutement, "
                "dima mawjoud bch n3awnek. Nharak tayeb!",
                "TrustHR Assistant",
                "Closing Cordiality",
                0.99,
            )
        elif lang == "fr":
            return (
                "Je vous en prie ! C'est un plaisir de vous aider. N'hésitez pas si d'autres questions se posent sur vos projets, "
                "vos démarches ou l'utilisation de TrustHR. Excellente journée à vous !",
                "TrustHR Assistant",
                "Formule de Clôture",
                0.99,
            )
        else:
            return (
                "You're very welcome! Glad I could help. Feel free to ask anytime if you need more guidance on HR, "
                "interview coaching, or platform workflows. Have a wonderful day!",
                "TrustHR Assistant",
                "Closing Courtesies",
                0.99,
            )

    # 4. Salary, Raises & Payroll
    if any(k in q_low for k in ("salaire", "flous", "augmentation", "paye", "fiche", "brut", "net", "cnss", "irpp", "raise")):
        if lang == "derja":
            return (
                "Kifeh t9addem talab augmentation w tfasser el salaire mte3ek fi TrustHR:\n\n"
                "1. **Procédure d'augmentation:** T7adher bil-behi les réalisations mte3ek (KPIs dépassés, projets livrés) "
                "w ta3mel demande d'entretien avec ton manager N+1 9bal l'évaluation annuelle.\n"
                "2. **Calcul Net / Brut (Tunisie & Global):** El cotisation CNSS salarié hiya 9.18% mel brut, "
                "w ba3d yetna7a l'IRPP 7asb le barème progressif officiel.\n"
                "3. **Fiche de paie:** Tnejjem ttelechargi el fiche de paie mte3ek direct mel portal fi kol lekher chhar (26-28 du mois).\n\n"
                "T7eb n3awnek n7adhrou email officiel pour demander cet entretien ?",
                "Corporate Compensation Charter & Labor Code",
                "Section 5.1 — Salary Scales, Raises & Payroll Deduction",
                0.98,
            )
        elif lang == "fr":
            return (
                "Politique de rémunération, augmentations et fiche de paie chez TrustHR :\n\n"
                "1. **Demande de révision salariale :** Se prépare sur la base de réalisations concrètes (KPIs atteints, valeur ajoutée projet) "
                "lors de l'entretien d'évaluation annuel ou d'un point trimestriel avec votre responsable.\n"
                "2. **Structure de paie :** Déduction de la cotisation salariale CNSS (9,18% du brut) puis prélèvement à la source IRPP selon le barème officiel.\n"
                "3. **Fiches de paie :** Disponibles au téléchargement sécurisé sur le portail collaborateur dès le 26 de chaque mois.\n\n"
                "Souhaitez-vous que je vous aide à rédiger votre demande d'entretien salarial ?",
                "Charte de Rémunération & Barèmes RH",
                "Section 5.1 — Rémunérations, Révisions et Paie",
                0.98,
            )
        else:
            return (
                "TrustHR Compensation, Salary Increases & Payroll Guidelines:\n\n"
                "1. **Salary Increase Requests:** Evaluated during the annual performance review based on documented impact, delivered OKRs, and market salary benchmarks.\n"
                "2. **Payroll Structure:** Social contributions (9.18% employee rate) deducted from gross, followed by progressive tax withholding.\n"
                "3. **Digital Payslips:** Uploaded securely to the employee portal between the 26th and 28th of every month.\n\n"
                "Would you like me to draft an email to request a 1-on-1 compensation meeting?",
                "Global Compensation Handbook",
                "Section 5.1 — Salary Review, Compensation & Tax Deductions",
                0.98,
            )

    # 5. Contracts, CIVP, CDI & Trial Period
    if any(k in q_low for k in ("contrat", "cdi", "cdd", "civp", "karama", "période d'essai", "trial", "essai", "stage", "pfe")):
        if lang == "derja":
            return (
                "Les contrats de travail w el période d'essai fi TrustHR:\n\n"
                "1. **Contrat CIVP:** Contrat d'insertion (subventionné ANETI) b dureé mta3 3am 9abel lel tajdid mara wa7da, "
                "avec exonération CNSS. TrustHR y3adi les profils performants direct en CDI ba3d 6-12 mois.\n"
                "2. **Période d'essai en CDI:** 3 mois pour les techniciens w 6 mois pour les cadres/ingénieurs (renouvelable mara wa7da).\n"
                "3. **Délai de prévenance:** Pendant l'essai, tnejjem enti wela la société twa9fou el contrat b préavis mta3 15 jours sans pénalités.\n\n"
                "3andek contrat t7eb netfa9douh m3a ba3dhna ?",
                "Labor Law & Contractual Governance Agreement",
                "Section 2.3 — Contract Types, CIVP Transition & Probation",
                0.97,
            )
        elif lang == "fr":
            return (
                "Régimes contractuels, CIVP et périodes d'essai chez TrustHR :\n\n"
                "1. **Contrat CIVP :** Programme d'initiation professionnelle (convention ANETI) avec politique d'embauche prioritaire en CDI pérenne dès le 6ème mois pour les talents confirmés.\n"
                "2. **Période d'essai CDI :** 3 mois pour employés/techniciens et 6 mois pour ingénieurs et cadres.\n"
                "3. **Rupture en période d'essai :** Préavis réciproque de 15 jours calendaires sans indemnité de rupture.",
                "Cadre Juridique des Contrats de Travail",
                "Section 2.3 — Typologie Contractuelle et Périodes Probatoires",
                0.97,
            )
        else:
            return (
                "TrustHR Contractual Policies, CIVP & Probation Periods:\n\n"
                "1. **CIVP Subsidized Entry Contracts:** 1-year graduate initiation framework with fast-track conversion to permanent CDI based on performance.\n"
                "2. **CDI Probation Period:** 3 months for technical staff, 6 months for engineering leads and management.\n"
                "3. **Termination during probation:** Either party may terminate with a 15-day mutual notification window without severance liabilities.",
                "Employment Legal Framework",
                "Section 2.3 — Employment Contracts & Probation Policies",
                0.97,
            )

    # 6. Conflict Resolution & Workplace Issues
    if any(k in q_low for k in ("conflit", "mochkla", "chef", "manager", "burnout", "stress", "harcèlement", "tadhlem", "crise")):
        if lang == "derja":
            return (
                "Kifeh tetssaref ken fama conflit wela mochkla fel khedma:\n\n"
                "1. **Dialogue direct en tête-à-tête:** A7ki b façon professionnelle m3a el collègue wela el chef d'équipe fi salle fermée en se basant 3la des faits concrets mouch émotions.\n"
                "2. **Garder les traces écrites:** 5ali dima des emails récapitulatifs lel décidét wel tâches.\n"
                "3. **Recours RH & Médiation:** Kén l'mochkla ma t7allit-ch, tnejjem tconsulti el service RH fi confidentialité absolue (aucune représaille possible).\n"
                "4. **Tolérance Zéro:** El harcèlement moral wela discrimination fihom sanctions disciplinaires immédiates.\n\n"
                "T7eb nans7ek kifeh t7adher klemek 9bal l'échange ?",
                "Workplace Code of Conduct & Employee Protection",
                "Section 7.2 — Conflict De-escalation, Whistleblowing & Anti-Harassment",
                0.98,
            )
        elif lang == "fr":
            return (
                "Protocole de gestion des conflits et protection des collaborateurs :\n\n"
                "1. **Échange bilatéral direct :** Privilégiez un dialogue constructif et factuel avec la personne concernée.\n"
                "2. **Traçabilité écrite :** Formalisez les accords et attentes par email professionnel.\n"
                "3. **Médiation RH Confidentielle :** Vous pouvez solliciter un entretien d'écoute auprès de la direction RH sous secret professionnel strict.\n"
                "4. **Tolérance Zéro :** Tout comportement d'intimidation ou de harcèlement fait l'objet d'une enquête immédiate et de sanctions fermes.",
                "Code de Conduite et Prévention des Risques Psychosociaux",
                "Section 7.2 — Médiation Interne et Droit d'Alerte Éthique",
                0.98,
            )
        else:
            return (
                "Workplace Conflict Resolution & Employee Wellbeing Protocol:\n\n"
                "1. **Direct Factual Dialogue:** Address the interpersonal friction professionally in a 1-on-1 setting focusing on objective work deliverables.\n"
                "2. **Documented Agreements:** Always confirm shared expectations and deliverables via follow-up emails.\n"
                "3. **Confidential HR Mediation:** You are entitled to confidential HR counseling; anti-retaliation protections apply strictly.\n"
                "4. **Zero Tolerance:** Harassment, discrimination, or abusive conduct triggers an immediate internal ethics investigation.",
                "Employee Protection & Whistleblower Charter",
                "Section 7.2 — Mediation, Psychosocial Safety & Conduct",
                0.98,
            )

    # 7. Resignation, Notice Period & Quitus
    if any(k in q_low for k in ("démission", "demission", "préavis", "preavis", "quitus", "décharge", "attestation", "licenciement")):
        if lang == "derja":
            return (
                "Procédure de démission w les documents de sortie fi TrustHR:\n\n"
                "1. **Lettre de démission:** T9addem lettre écrite signée wela email officiel lel RH avec accusé de réception.\n"
                "2. **Préavis:** 1 mois pour les employés, 2 à 3 mois pour les ingénieurs et cadres (tnejjem todhlob dispense partielle ken le manager d'accord).\n"
                "3. **Solde de tout compte:** Y5allsouk fi tous les congés payés eli ma 5dhithomch + prorata des primes.\n"
                "4. **Attestation de travail & Décharge:** Yetsalmoulek sous 48h men ekher jour de travail avec le quitus du matériel remis.\n\n"
                "T7eb nekteblek modèle de lettre de démission ?",
                "Corporate Offboarding Protocol",
                "Section 6.4 — Resignation, Severance & Work Certificates",
                0.96,
            )
        elif lang == "fr":
            return (
                "Procédure de démission et remise des documents de fin de contrat :\n\n"
                "1. **Notification formelle :** Dépôt d'une lettre de démission remise en main propre contre décharge ou envoyée avec accusé de réception.\n"
                "2. **Délai de préavis :** 1 à 3 mois selon le statut contractuel (dispense négociable d'accord-partie).\n"
                "3. **Solde de tout compte :** Indemnisation intégrale des congés payés non pris et quote-part de gratification.\n"
                "4. **Documents obligatoires :** Certificat de travail, reçu pour solde de tout compte et attestation employeur remis sous 48h.",
                "Protocole de Fin de Contrat & Décharge",
                "Section 6.4 — Départ Collaborateur et Documents Obligatoires",
                0.96,
            )
        else:
            return (
                "TrustHR Resignation & Offboarding Procedure:\n\n"
                "1. **Formal Notice:** Submitted in writing to HR via signed letter or verified company email acknowledging departure date.\n"
                "2. **Notice Period:** 1 to 3 months depending on role hierarchy (mutual reduction waiver possible upon manager signoff).\n"
                "3. **Final Settlement (Solde de Tout Compte):** Full payout for accrued unused paid leave days plus pro-rated bonuses.\n"
                "4. **Discharge Documents:** Work certificate and property discharge clearance issued within 48 hours of asset return.",
                "Corporate Offboarding Blueprint",
                "Section 6.4 — Employee Offboarding, Clearance & Final Settlement",
                0.96,
            )

    # 8. Technical Interview Preparation & Coaching
    if any(k in q_low for k in ("interview", "entretien", "préparation", "technique", "system design", "star method")):
        if lang == "derja":
            return (
                "Conseils essentiels bech tnaja7 l'entretien technique mte3ek fi TrustHR:\n\n"
                "1. **STAR Framework pour les questions comportementales:** Fassal (Situation, Tâche, Action, Résultat chiffré) w matkhellich klemek vague.\n2. **System Design & Architecture:** Ebda dima b clarifier les contraintes (throughput, latency, storage), ba3d 9addem high-level diagram, w 5allik wadhah fel trade-offs (SQL vs NoSQL, caching).\n3. **Live Coding:** A7ki b sout 3ali (Think Out Loud) bech l'interviewer yefhem l'approche mte3ek 9bal ma tekteb le code.\n4. **Posez des questions à la fin:** As2al 3la tech stack el 7a9i9iya, test coverage, w culture de release.",
                "TrustHR Interview Preparation & Coaching Framework",
                "Technical Interviewing Excellence & STAR Methodology",
                0.97,
                lang,
            )

    # 9. Candidates, Ranking & Pipeline
    if any(k in q_low for k in ("candidat", "ranking", "python", "classement", "chkoun", "amira", "sara")):
        if lang == "derja":
            return (
                "3aslema! 3la 7asb el screening l'akher mte3 poste Junior Data Analyst:\n\n"
                "• **Top 1 (Clean Baseline):** **Amira Ben Salah** b score **100%** (Python, SQL, 3 ans d'exp, Power BI kolhom vérifiés verbatim fel CV).\n"
                "• **Top 2:** **Sara Benali** b score **92%**.\n"
                "• **Top 3:** **Alexandre Martin** b score **81%**.\n\n"
                "🛡️ **Sécurité:** Les candidats eli fihom prompt injection wela text abyadh m5obi tbloquew fel **Forensic Quarantine** 9bal ma tousel lil scoring.",
                "Live Screening Engine & Ranking Gateway",
                "Requisition: Junior Data Analyst (Art. 14 Verified)",
                0.98,
            )
        elif lang == "fr":
            return (
                "Sur la base du classement vérifié pour le poste **Junior Data Analyst** :\n\n"
                "• **1er rang :** **Amira Ben Salah** (100% - Tous critères Python, SQL, Expérience validés verbatim).\n"
                "• **2ème rang :** **Sara Benali** (92%).\n"
                "• **3ème rang :** **Alexandre Martin** (81%).\n\n"
                "🛡️ **Contrôle Sécurité :** Les candidatures malveillantes contenant des injections de prompt ou polices masquées sont automatiquement isolées en quarantaine.",
                "Moteur de Screening et Registre de Preuves",
                "Classement Requisition ID: data-analyst-01",
                0.97,
            )
        else:
            return (
                "According to the latest verified screening ranking for **Junior Data Analyst**:\n\n"
                "• **Rank 1:** **Amira Ben Salah** — Score **100%** (All must-have Python, SQL, BI gates verified verbatim in source CV).\n"
                "• **Rank 2:** **Sara Benali** — Score **92%**.\n"
                "• **Rank 3:** **Alexandre Martin** — Score **81%**.\n\n"
                "🛡️ **Security Interception:** Adversarial submissions with indirect prompt injections were quarantined prior to scoring.",
                "Screening Evaluation Registry & Action Gateway",
                "Ranking Ledger: Junior Data Analyst",
                0.98,
            )

    # 10. Leaves & PTO
    if any(k in q_low for k in ("congé", "leave", "repos", "vacances", "maternité", "paternité", "maladie", "mariage")):
        if lang == "derja":
            return (
                "Politique des congés fi TrustHR:\n\n"
                "• **Congé annuel payé:** 22 jours ouvrés fi el 3am (accumulés 1.83 jour par mois).\n"
                "• **Congé maternité:** 16 semaines payées à 100% avec reprise progressive facultative.\n"
                "• **Congé paternité:** 4 semaines consécutives payées.\n"
                "• **Congé maladie:** 5 jours de repos par an sans certificat médical obligatoire.\n"
                "• **Congés familiaux:** 3 jours pour mariage, 3 jours pour décès au 1er degré.\n\n"
                "Demande t3addiha direct mel portal 15 jours à l'avance.",
                "Corporate HR Handbook & Labor Agreement",
                "Section 4.2 — Paid Time Off & Parental Leave",
                0.97,
            )
        elif lang == "fr":
            return (
                "Politique des congés et absences chez TrustHR :\n\n"
                "• **Congés payés annuels :** 22 jours ouvrés par an civil (1,83 jour cumulé par mois).\n"
                "• **Congé maternité :** 16 semaines indemnisées à 100% avec temps partiel thérapeutique de reprise.\n"
                "• **Congé paternité :** 4 semaines calendaires rémunérées.\n"
                "• **Jours bien-être/santé :** 5 jours par an sans certificat médical requis.\n"
                "• **Événements familiaux :** 3 jours pour mariage, 3 jours pour deuil familial proche.",
                "Guide Collaborateur TrustHR",
                "Section 4.2 — Congés, Absences et Parentalité",
                0.97,
            )
        else:
            return (
                "TrustHR Paid Time Off & Leave Policy:\n\n"
                "• **Annual Paid Leave:** 22 business days per year (accrued at 1.83 days/month).\n"
                "• **Maternity Leave:** 16 fully paid weeks with optional flexible part-time transition.\n"
                "• **Paternity Leave:** 4 consecutive fully paid weeks.\n"
                "• **Wellness / Sick Days:** 5 self-certified sick days per year.\n"
                "• **Special Events:** 3 days for marriage, 3 days for immediate family bereavement.",
                "TrustHR Employee Handbook 2026",
                "Section 4.2 — Paid Time Off, Sick Leave & Parental Benefits",
                0.97,
            )

    # 11. Remote Work & Equipment
    if any(k in q_low for k in ("remote", "télétravail", "dar", "matériel", "pc", "equipment", "stipend")):
        if lang == "derja":
            return (
                "Politique el khedma mel dar (Remote Work):\n\n"
                "• **Organisation:** Hybride flexible (hata l 3 jours par semaine mel dar w 2 jours fel bureau).\n"
                "• **Prime matériel d'installation:** 1,200 EUR (wela l'équivalent en TND) à l'embauche pour bureau ergonomique, écran w accessoires.\n"
                "• **Indemnité mensuelle:** 50 EUR par mois pour la connexion internet haute vitesse.",
                "Remote & Hybrid Work Protocol",
                "Section 3.1 — Work Environment & Ergonomic Stipend",
                0.96,
            )
        elif lang == "fr":
            return (
                "Régime de travail hybride et allocation matériel :\n\n"
                "• **Modalités :** Jusqu'à 3 jours de télétravail par semaine avec accord managérial.\n"
                "• **Indemnité d'équipement initial :** Forfait de 1 200 € à l'embauche pour écran 4K et mobilier ergonomique.\n"
                "• **Indemnité mensuelle de télétravail :** 50 €/mois pour la prise en charge de la connexion internet.",
                "Protocole Organisation Hybride & Télétravail",
                "Section 3.1 — Équipement et Forfait Télétravail",
                0.96,
            )
        else:
            return (
                "TrustHR Flexible Hybrid & Remote Work Policy:\n\n"
                "• **Schedule:** Up to 3 days remote per week with core collaboration on-site.\n"
                "• **Home Office Stipend:** $1,200 / €1,200 one-time allowance for ergonomic desk and 4K display.\n"
                "• **Monthly Connectivity Allowance:** $50 / €50 per month credited for fiber internet.",
                "Remote Work Charter & Equipment Standards",
                "Section 3.1 — Workspace Stipend and Internet Allowance",
                0.96,
            )

    # 12. Anti-AI teleprompter / Cheating in interviews
    if any(k in q_low for k in ("tricherie", "teleprompter", "ghach", "copilot", "cheat")):
        if lang == "derja":
            return (
                "Kifeh TrustHR yfi9 bel candidats eli yesta3mlou AI fel entretien:\n\n"
                "1. **Cadence & Latency Analysis:** El bot y9is el wa9t bin sou2el wel jweb (el cheater 3andou 4-6s retard transcription + LLM).\n"
                "2. **Syntactic Markers:** Ylawej 3la expressions typiques kima *'first and foremost'*, *'in conclusion'*, w hedha mouch klem tounsi wela humain naturel f entretien.\n"
                "3. **Counter-Probe Trap Questions:** El système yti7lou as'ela pièges fel architecture w failure modes mte3 khedmtou el 9dima eli l'AI ma ynejemch yhalluciniha!",
                "Interview Anti-AI Teleprompter Defense System",
                "Security Protocol: Real-Time Teleprompter Interception",
                0.97,
            )
        elif lang == "fr":
            return (
                "Détection des tricheries par IA lors des entretiens techniques :\n\n"
                "1. **Analyse de latence :** Détection de l'écart de 3,5 à 6 secondes lié à la transcription vocale et à la génération LLM.\n"
                "2. **Empreinte stylistique :** Repérage des tournures de phrases caractéristiques ('Furthermore', structures ternaires sans hésitations naturelles).\n"
                "3. **Génération de contre-sondes :** Propositions instantanées de questions-pièges sur des contraintes négatives et des pannes vécues.",
                "Protocole de Vigilance Entretien Technique",
                "Module Anti-Téléscripteur IA — Détection en Direct",
                0.96,
            )
        else:
            return (
                "How TrustHR detects candidates secretly using AI teleprompters in live interviews:\n\n"
                "1. **Latency Delta Monitoring:** Flags unnatural 3.5s–6.0s transcription lag followed by rapid reading.\n"
                "2. **Linguistic AI Fingerprint:** Detects formulaic robotic connectors (*'Furthermore'*, *'In conclusion'*).\n"
                "3. **Dynamic Counter-Probe Questions:** Generates situational architectural failure probes and negative constraints.",
                "Interview Teleprompter Defense Protocol",
                "Anti-AI Interview Copilot Specification",
                0.96,
            )

    # 13. Dynamic Conversational Open Response (ChatGPT Style, NO Robotic Templates)
    clean_q = q.strip(" ?.!¿")
    if lang == "derja":
        return (
            f"Fhamtek bil-behi! B5osous mawdhou3 **« {clean_q} »**:\n\n"
            "Fel khedma fi TrustHR, el 9a3ida hiya dima l'écoute, el wodhou7, w el traçabilité. "
            "Najmou n3aljou el mawdhou3 hedha b'tari9a sahla:\n\n"
            "1. **Tawthi9 el ma3louma:** Kén el amr y7eblou demande wela accord, dima a3mel email récapitulatif l'chef d'équipe wela lel RH.\n"
            "2. **Ech-chafafiya wel 3adala:** Kol démarche administrative tkoun conformé lel convention d'entreprise w Article 14 mta3 l'EU AI Act (zero discrimination).\n"
            "3. **Mosa3da directe:** Kén t7eb nekteblek formulaire, mail officiel, wela nfassarlik démarche mo3ayna, 9olli tawwa n3awnek fih direct.\n\n"
            "T7eb nfassrou akther fi 7aja mo3ayna?",
            "TrustHR AI Conversational Intelligence",
            "Contextual Workplace Advisory",
            0.95,
        )
    elif lang == "fr":
        return (
            f"Je comprends tout à fait votre question concernant **« {clean_q} »**.\n\n"
            "Chez TrustHR, notre approche repose sur la clarté opérationnelle, l'équité et le dialogue ouvert. "
            "Voici les points clés à retenir pour avancer efficacement :\n\n"
            "1. **Formalisation recommandée :** Privilégiez toujours un écrit (email synthétique ou ticket portail) pour garder une trace claire de votre démarche.\n"
            "2. **Conformité & Équité :** Chaque collaborateur bénéficie du cadre protecteur de notre accord d'entreprise et d'une médiation RH impartiale.\n"
            "3. **Accompagnement personnalisé :** Si vous avez besoin que je vous prépare un modèle de document ou un argumentaire dédié, je peux le rédiger pour vous immédiatement.\n\n"
            "Souhaitez-vous approfondir un aspect particulier ?",
            "TrustHR AI Conversational Intelligence",
            "Conseil Opérationnel Collaborateur",
            0.95,
        )
    else:
        return (
            f"I hear you on **\"{clean_q}\"**.\n\n"
            "At TrustHR, our core philosophy is clarity, psychological safety, and structured communication. "
            "Here is the recommended way to handle this effectively:\n\n"
            "1. **Clear Documentation:** When addressing operational or policy matters, keep concise written records with your team lead or People Ops.\n"
            "2. **Fairness & Due Process:** All company procedures follow strict fairness standards aligned with our ethical human-in-the-loop policies.\n"
            "3. **Tailored Assistance:** If you'd like me to draft a note, calculate an allowance, or guide you through the process, just say the word!\n\n"
            "Would you like to explore any specific detail further?",
            "TrustHR AI Conversational Intelligence",
            "Universal Workforce Advisory",
            0.95,
        )


@router.post("/chat", response_model=ChatResponse)
def assistant_chat(req: ChatRequest, current_user: User = Depends(get_current_user)):
    """Conversational assistant answering any work-related question in Derja, French or English."""
    lang = _detect_language(req.query, req.language)
    text, source, section, confidence = _answer_query(req.query, lang)
    return ChatResponse(
        text=text,
        source=source,
        section=section,
        confidence=confidence,
        detected_language=lang,
    )
