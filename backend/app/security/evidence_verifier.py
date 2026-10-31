import re
import difflib

def normalize_text_for_matching(text: str) -> str:
    """
    Normalizes whitespace and standardizes common punctuation and quotes
    for robust verbatim substring comparison.
    """
    if not text:
        return ""
    # Standardize curly quotes and hyphens
    t = text.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
    t = t.replace("–", "-").replace("—", "-")
    # Collapse whitespaces
    t = re.sub(r"\s+", " ", t).strip().lower()
    return t

def verify_quote_against_source(source_text: str, quote: str, tolerance_ratio: float = 0.85) -> tuple[bool, float, str]:
    """
    Deterministically verifies whether an LLM-cited evidence quote exists in the source text.
    
    Returns:
        (is_verified: bool, confidence: float, matched_subtext: str)
    """
    if not quote or len(quote.strip()) < 8:
        return (False, 0.0, "Quote is empty or too short to be verifiable.")

    norm_source = normalize_text_for_matching(source_text)
    norm_quote = normalize_text_for_matching(quote)

    # 1. Direct exact normalized substring check
    if norm_quote in norm_source:
        return (True, 1.0, quote.strip())

    # 2. Check if a clean token subset exists contiguously
    quote_tokens = norm_quote.split()
    if len(quote_tokens) >= 4:
        # Check if the core ngram exists
        core_ngram = " ".join(quote_tokens[:min(len(quote_tokens), 8)])
        if core_ngram in norm_source:
            return (True, 0.95, quote.strip())

    # 3. Sliding window fuzzy matching using difflib
    window_len = len(norm_quote)
    step = max(1, window_len // 3)
    best_ratio = 0.0
    best_chunk = ""

    for i in range(0, max(1, len(norm_source) - window_len + 1), step):
        chunk = norm_source[i : i + window_len]
        ratio = difflib.SequenceMatcher(None, norm_quote, chunk).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_chunk = chunk
        if best_ratio >= 0.95:
            break

    if best_ratio >= tolerance_ratio:
        return (True, round(best_ratio, 3), best_chunk)

    return (False, round(best_ratio, 3), "Quote not found in original resume text (potential AI hallucination)")

def calculate_deterministic_ranking_score(criteria_results: list[dict]) -> tuple[float, list[dict]]:
    """
    Calculates the candidate's final ranking score mathematically in deterministic Python code.
    
    Rules:
    - Candidate ranking uses job-related criteria only.
    - If a criterion's evidence quote fails verification, its score is penalized to 0.0.
    - Formula: sum(score * weight) / sum(weights)
    """
    total_weight = 0.0
    weighted_sum = 0.0
    updated_results = []

    for item in criteria_results:
        weight = float(item.get("criterion_weight", 1.0))
        raw_score = float(item.get("score", 0.0))
        quote = item.get("evidence_quote", "")
        verified = bool(item.get("evidence_verified", False))

        # Strict security constraint: Unverified quotes cannot earn points
        effective_score = raw_score if verified else 0.0
        
        reasoning = item.get("reasoning", "")
        if not verified and raw_score > 0:
            reasoning += " [PENALIZED: Evidence quote could not be verified in original CV text]"

        updated_results.append({
            **item,
            "score": effective_score,
            "raw_claimed_score": raw_score,
            "evidence_verified": verified,
            "reasoning": reasoning
        })

        total_weight += weight
        weighted_sum += effective_score * weight

    if total_weight <= 0:
        return (0.0, updated_results)

    final_score = round(weighted_sum / total_weight, 2)
    return (final_score, updated_results)
