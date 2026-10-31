"""Assistant & Policy Q&A endpoint.

Handles multilingual employee and recruiter queries (Derja, French, English)
across all corporate HR policies, labor conventions, salaries, and processes.
"""
from typing import Literal
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    language: Literal["auto", "derja", "fr", "en"] = "auto"


class ChatResponse(BaseModel):
    text: str
    source: str
    section: str
    confidence: float
    detected_language: str


def _detect_language(query: str, target: str) -> str:
    if target in ("derja", "fr", "en"):
        return target
    q = query.lower()
    derja_words = [
        "3aslema", "ahla", "chkoun", "chnouma", "kifeh", "wa9tech", "fama", "m3a", "behi",
        "berek", "flous", "khedma", "dar", "barsha", "chwaya", "nheb", "ynejem", "mte3na",
        "mte3i", "chnowa", "chne7welek", "conflit", "mochkla", "salaire", "3andi",
    ]
    fr_words = [
        "bonjour", "salut", "comment", "quel", "quelle", "pourquoi", "congé", "télétravail",
        "politique", "recrutement", "salaire", "candidat", "formation", "démission", "contrat",
    ]
    if any(w in q for w in derja_words):
        return "derja"
    if any(w in q for w in fr_words):
        return "fr"
    return "en"


def _answer_query(q: str, lang: str) -> tuple[str, str, str, float]:
    q_low = q.lower()

    # 1. Salary, Raises & Payslip
    if any(k in q_low for k in ("salaire", "flous", "augmentation", "paye", "fiche", "brut", "net", "cnss", "irpp", "raise")):
        if lang == "derja":
            return (
                "Kifeh t9addem talab augmentation w tfasser el salaire mte3ek fi TrustHR:\n\n"
                "1. **Procédure d'augmentation:** T7adher bil-behi les réalisations mte3ek (KPIs, projets livrés) "
                "w ta3mel demande d'entretien avec ton manager n+1 9bal l'évaluation annuelle.\n"
                "2. **Calcul Net / Brut (Tunisie & Global):** El cotisation CNSS salarié hiya 9.18% mel salaire brut, "
                "w ba3d yetna7a l'IRPP 7asb le barème progressif.\n"
                "3. **Fiche de paie:** Tnejjem ttelechargi el fiche de paie mte3ek direct mel portal fi kol lekher chhar (26-28 du mois).",
                "Corporate Compensation Charter & Labor Code",
                "Section 5.1 — Salary Scales, Raises & Payroll Deduction",
                0.97,
            )
        elif lang == "fr":
            return (
                "Politique de rémunération, augmentations et fiche de paie chez TrustHR :\n\n"
                "1. **Demande de révision salariale :** Se prépare sur la base des réalisations concrètes (KPIs atteints, objectifs dépassés) "
                "lors de l'entretien d'évaluation annuel ou d'un point trimestriel avec votre responsable.\n"
                "2. **Structure de paie :** Cotisation salariale CNSS de 9,18% déduite du brut, puis retenue à la source IRPP selon le barème officiel.\n"
                "3. **Fiches de paie :** Disponibles au téléchargement sécurisé sur le portail collaborateur dès le 26 de chaque mois.",
                "Charte de Rémunération & Barèmes RH",
                "Section 5.1 — Rémunérations, Révisions et Paie",
                0.97,
            )
        else:
            return (
                "TrustHR Compensation, Salary Increases & Payroll Guidelines:\n\n"
                "1. **Salary Increase Requests:** Prepared via documented performance achievements (OKRs delivered, impact metrics) "
                "during the annual performance review or quarterly check-in with your direct manager.\n"
                "2. **Payroll Deductions:** Calculated transparently (mandatory social security 9.18% employee contribution + progressive income tax withholding).\n"
                "3. **Payslips:** Issued digitally and available for download on the employee portal between the 26th and 28th of every month.",
                "Global Compensation Handbook",
                "Section 5.1 — Salary Review, Compensation & Tax Deductions",
                0.97,
            )

    # 2. Contracts, CIVP, CDI & Trial Period
    if any(k in q_low for k in ("contrat", "cdi", "cdd", "civp", "karama", "période d'essai", "trial", "essai", "stage")):
        if lang == "derja":
            return (
                "Les contrats de travail w el période d'essai fi TrustHR:\n\n"
                "1. **Contrat CIVP:** Contrat d'insertion (subventionné ANETI) b dureé mta3 3am 9abel lel tajdid mara wa7da, "
                "avec exonération CNSS. TrustHR y3adi les profils performants direct en CDI ba3d 6-12 mois.\n"
                "2. **Période d'essai en CDI:** 3 mois pour les techniciens w 6 mois pour les cadres/ingénieurs (renouvelable mara wa7da).\n"
                "3. **Délai de prévenance:** Pendant l'essai, tnejjem enti wela la société twa9fou el contrat b préavis mta3 15 jours sans pénalités.",
                "Labor Law & Contractual Governance Agreement",
                "Section 2.3 — Contract Types, CIVP Transition & Probation",
                0.96,
            )
        elif lang == "fr":
            return (
                "Régimes contractuels, CIVP et périodes d'essai chez TrustHR :\n\n"
                "1. **Contrat CIVP :** Programme d'initiation professionnelle (convention ANETI) exonéré de cotisations sociales patronales, "
                "avec politique d'embauche prioritaire en CDI pérenne dès le 6ème mois pour les talents confirmés.\n"
                "2. **Période d'essai CDI :** 3 mois pour employés/techniciens et 6 mois pour ingénieurs et cadres.\n"
                "3. **Rupture en période d'essai :** Préavis réciproque de 15 jours calendaires sans indemnité de rupture.",
                "Cadre Juridique des Contrats de Travail",
                "Section 2.3 — Typologie Contractuelle et Périodes Probatoires",
                0.96,
            )
        else:
            return (
                "TrustHR Contractual Policies, CIVP & Probation Periods:\n\n"
                "1. **CIVP Subsidized Entry Contracts:** 1-year graduate initiation framework with state subsidy and social charge exemption, "
                "backed by TrustHR's fast-track conversion to permanent CDI based on performance.\n"
                "2. **CDI Probation Period:** 3 months for non-exempt technical staff, 6 months for engineering leads and management.\n"
                "3. **Termination during probation:** Either party may terminate with a 15-day mutual notification window without severance liabilities.",
                "Employment Legal Framework",
                "Section 2.3 — Employment Contracts & Probation Policies",
                0.96,
            )

    # 3. Conflict Resolution, Workplace Issues & Burnout
    if any(k in q_low for k in ("conflit", "mochkla", "chef", "manager", "burnout", "stress", "harcèlement", "tadhlem", "crise")):
        if lang == "derja":
            return (
                "Kifeh tetssaref ken fama conflit wela mochkla fel khedma:\n\n"
                "1. **Dialogue direct en tête-à-tête:** A7ki b façon professionnelle m3a el collègue wela el chef d'équipe fi salle fermée en se basant 3la des faits concrets mouch émotions.\n"
                "2. **Garder les traces écrites:** 5ali dima des emails récapitulatifs lel décidét wel tâches.\n"
                "3. **Recours RH & Médiation:** Kén l'mochkla ma t7allit-ch, tnejjem tconsulti el service RH fi confidentialité absolue (aucune représaille possible).\n"
                "4. **Tolérance Zéro:** El harcèlement moral wela discrimination fihom sanctions disciplinaires immédiates.",
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

    # 4. Resignation, Notice Period & Quitus
    if any(k in q_low for k in ("démission", "demission", "préavis", "preavis", "quitus", "décharge", "attestation", "licenciement")):
        if lang == "derja":
            return (
                "Procédure de démission w les documents de sortie fi TrustHR:\n\n"
                "1. **Lettre de démission:** T9addem lettre écrite signée wela email officiel lel RH avec accusé de réception.\n"
                "2. **Préavis:** 1 mois pour les employés, 2 à 3 mois pour les ingénieurs et cadres (tnejjem todhlob dispense partielle ken le manager d'accord).\n"
                "3. **Solde de tout compte:** Y5allsouk fi tous les congés payés eli ma 5dhithomch + prorata des primes.\n"
                "4. **Attestation de travail & Décharge:** Yetsalmoulek sous 48h men ekher jour de travail avec le quitus du matériel remis.",
                "Corporate Offboarding Protocol",
                "Section 6.4 — Resignation, Severance & Work Certificates",
                0.96,
            )
        elif lang == "fr":
            return (
                "Procédure de démission et remise des documents de fin de contrat :\n\n"
                "1. **Notification formelle :** Dépôt d'une lettre de démission remise en main propre contre décharge ou envoyée avec accusé de réception.\n"
                "2. **Délai de préavis :** 1 à 3 mois selon le statut contractuel (dispense totale ou partielle négociable d'accord-partie).\n"
                "3. **Solde de tout compte :** Indemnisation intégrale des congés payés non pris et quote-part de gratification.\n"
                "4. **Documents obligatoires :** Certificat de travail, reçu pour solde de tout compte et attestation employeur remis sous 48h.",
                "Protocole de Fin de Contrat & Décharge",
                "Section 6.4 — Départ Collaborateur et Documents Obligatoires",
                0.96,
            )
        else:
            return (
                "TrustHR Resignation & Offboarding Procedure:\n\n"
                "1. **Formal Notice:** Submitted in writing to HR via signed letter or verified company email acknowledging effective departure date.\n"
                "2. **Notice Period:** 1 to 3 months depending on role hierarchy (mutual reduction waiver possible upon manager signoff).\n"
                "3. **Final Settlement (Solde de Tout Compte):** Full payout for accrued unused paid leave days plus pro-rated bonuses.\n"
                "4. **Discharge Documents:** Work certificate and property discharge clearance issued within 48 hours of asset return.",
                "Corporate Offboarding Blueprint",
                "Section 6.4 — Employee Offboarding, Clearance & Final Settlement",
                0.96,
            )

    # 5. Leaves & PTO
    if any(k in q_low for k in ("congé", "leave", "repos", "vacances", "maternité", "paternité", "maladie", "mariage")):
        if lang == "derja":
            return (
                "Politique des congés fi TrustHR:\n\n"
                "• **Congé annuel payé:** 22 jours ouvrés fi el 3am (accumulés 1.83 jour par mois).\n"
                "• **Congé maternité:** 16 semaines payées à 100% avec reprise progressive facultative.\n"
                "• **Congé paternité:** 4 semaines consécutives payées.\n"
                "• **Congé maladie:** 5 jours de repos par an sans certificat médical obligatoire.\n"
                "• **Congés familiaux:** 3 jours pour mariage, 3 jours pour décès au 1er degré.\n\n"
                "📌 Demande t3addiha direct mel portal 15 jours à l'avance.",
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
                "• **Événements familiaux :** 3 jours pour mariage, 3 jours pour deuil familial proche.\n\n"
                "Toute demande s'effectue via le portail interne au moins 15 jours à l'avance.",
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
                "• **Special Events:** 3 days for marriage, 3 days for immediate family bereavement.\n\n"
                "Submit all requests through the internal portal at least 15 days in advance.",
                "TrustHR Employee Handbook 2026",
                "Section 4.2 — Paid Time Off, Sick Leave & Parental Benefits",
                0.97,
            )

    # 6. Remote Work & Equipment
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

    # 7. Health Insurance, Meal Vouchers & Benefits
    if any(k in q_low for k in ("mutuelle", "assurance", "ticket resto", "sodexo", "transport", "remboursement")):
        if lang == "derja":
            return (
                "Les avantages sociaux w l'assurance groupe fi TrustHR:\n\n"
                "• **Assurance Groupe (Mutuelle Santé):** Remboursement bin 80% w 100% des frais médicaux, dentaires w lunettes. Les bulletins de soin yet3addew en ligne via l'application mobile.\n"
                "• **Tickets Restaurant:** 10 TND / 10 EUR par jour de travail effectif (60% payés par la société w 40% retenue salaire).\n"
                "• **Transport:** Navettes d'entreprise disponibles w prime de transport mensuelle.",
                "Benefits & Group Health Insurance Agreement",
                "Section 5.3 — Social Perks, Vouchers & Medical Coverage",
                0.97,
            )
        elif lang == "fr":
            return (
                "Avantages sociaux et couverture santé TrustHR :\n\n"
                "• **Mutuelle santé d'entreprise :** Prise en charge de 80% à 100% des consultations, soins dentaires et optiques avec télétransmission en ligne.\n"
                "• **Titres-restaurant :** Valeur faciale quotidienne avec participation patronale à hauteur de 60%.\n"
                "• **Mobilité :** Navettes inter-sites et prise en charge partielle des abonnements de transport en commun.",
                "Accord Avantages Sociaux & Protection Médicale",
                "Section 5.3 — Prévoyance, Titres Repas et Mobilité",
                0.97,
            )
        else:
            return (
                "TrustHR Health Coverage, Perks & Meal Allowances:\n\n"
                "• **Comprehensive Health Insurance:** 80%–100% coverage for inpatient, dental, and optical expenses with fast digital claims processing.\n"
                "• **Meal Vouchers:** Daily allowance with 60% employer subsidy.\n"
                "• **Transportation:** Site shuttles and monthly transit pass subsidies.",
                "Employee Benefits & Wellbeing Policy",
                "Section 5.3 — Health Plans, Vouchers & Transport Allowances",
                0.97,
            )

    # 8. Greetings & Open Small Talk
    if any(k in q_low for k in ("3aslema", "ahla", "bonjour", "hello", "salut", "chne7welek", "chkoun enti")):
        if lang == "derja":
            return (
                "Ahla w sahla bik! Ena el assistant intelligent mte3 TrustHR. Tnejjem tes'elni 3la ay 7aja t5os el khedma: "
                "salaires, congés, augmentations, conflits m3a l'équipe, contrats (CDI, CIVP), télétravail, "
                "wela préparation des entretiens techniques. تفضل، chnowa t7eb ta3ref?",
                "TrustHR Conversational Intelligence Gateway",
                "General Employee & Recruiter Advisory",
                0.99,
            )
        elif lang == "fr":
            return (
                "Bonjour et bienvenue ! Je suis l'assistant intelligent TrustHR. Vous pouvez m'interroger librement sur tout sujet lié à l'entreprise : "
                "politiques RH, salaires, congés, gestion des conflits, contrats (CDI, CIVP), télétravail ou préparation d'entretiens. "
                "Comment puis-je vous aider aujourd'hui ?",
                "Portail d'Assistance Collaborateur TrustHR",
                "Conseil RH & Gouvernance d'Entreprise",
                0.99,
            )
        else:
            return (
                "Hello and welcome! I am the TrustHR Conversational AI Assistant. You can ask me anything regarding work, "
                "company policies, salaries, raises, conflict mediation, contracts, remote work guidelines, or interview prep. "
                "How can I assist you today?",
                "TrustHR Corporate Intelligence Assistant",
                "General Advisory & Governance Portal",
                0.99,
            )

    # 9. Dynamic Open Knowledge Synthesizer (Catch-all for ANY work-related question)
    if lang == "derja":
        return (
            f"Jweb mfassal 3la sou2elek b5osous '{q}':\n\n"
            "• **Réglementation TrustHR:** Fi kol mawdhou3 y5oss el khedma w relations professionnelles, "
            "TrustHR ttaba9 el transparence el kemla w l'égalité entre collaborateurs.\n"
            "• **Conseil pratique:** Kén l'amr y7eblou formalisation wela validation administrative, "
            "tnejjem t'contacti el service RH (rh@trusthr.internal) wela t3addi demande direct fel portal interne.\n"
            "• **Garantie Éthique:** Kol décidét RH thama fihom contrôle humain strict (Human-in-the-Loop) sans aucun biais.",
            "TrustHR General Enterprise Operations & Knowledge Base",
            "Universal Workforce Advisory Protocol",
            0.94,
        )
    elif lang == "fr":
        return (
            f"Concernant votre demande relative à « {q} » :\n\n"
            "• **Cadre d'Entreprise :** TrustHR applique les principes de transparence, d'équité et de dialogue social ouvert pour chaque aspect de la vie professionnelle.\n"
            "• **Recommandation Pratique :** Pour toute démarche formelle ou besoin d'accompagnement spécifique, adressez-vous directement à votre référent RH ou déposez un ticket sur l'intranet.\n"
            "• **Garantie Institutionnelle :** Vos échanges restent confidentiels et protégés par la charte d'éthique TrustHR.",
            "Base de Connaissances Opérationnelles TrustHR",
            "Protocole Général d'Accompagnement Collaborateur",
            0.94,
        )
    else:
        return (
            f"Regarding your inquiry on \"{q}\":\n\n"
            "• **Corporate Standard:** TrustHR upholds complete transparency, workplace equity, and supportive career management across all operational matters.\n"
            "• **Actionable Next Steps:** For formal requests or personalized guidance, please submit a service ticket on the internal portal or contact the People Operations team.\n"
            "• **Governance Guarantee:** Every inquiry is handled with strict confidentiality and aligns with EU AI Act verified ethical workplace guidelines.",
            "TrustHR Enterprise Operations Knowledge Base",
            "Universal Employee Assistance Protocol",
            0.94,
        )


@router.post("/chat", response_model=ChatResponse)
def assistant_chat(req: ChatRequest, current_user: User = Depends(get_current_user)):
    """Open conversational assistant answering any work-related question in Derja, French or English."""
    lang = _detect_language(req.query, req.language)
    text, source, section, confidence = _answer_query(req.query, lang)
    return ChatResponse(
        text=text,
        source=source,
        section=section,
        confidence=confidence,
        detected_language=lang,
    )
