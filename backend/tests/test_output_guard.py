"""Tests for Output Guard (Member 2 Security Integration).

Verifies cross-candidate PII leaks, banned hiring promises, link allowlist, and CRLF injection.
"""
from app.security.output_guard import check_output


def test_banned_promises_are_blocked():
    safe, violations = check_output("Congratulations, you are hired for this position!")
    assert safe is False
    assert any("you are hired" in v.lower() for v in violations)


def test_salary_commitment_is_blocked():
    safe, violations = check_output("We offer you the role and your salary is 120,000 EUR.")
    assert safe is False
    assert any("salary is" in v.lower() or "we offer you" in v.lower() for v in violations)


def test_cross_candidate_data_leak_is_blocked():
    safe, violations = check_output(
        "Hi John, comparing your profile with Amira Ben Salah from Tunisia, your experience is lower.",
        other_candidate_names=["Amira Ben Salah", "Sara Khelifi"]
    )
    assert safe is False
    assert any("Data Leak" in v and "Amira Ben Salah" in v for v in violations)


def test_unapproved_links_are_blocked():
    safe, violations = check_output("Please visit http://evil-phishing-site.xyz/login to complete your onboarding.")
    assert safe is False
    assert any("Unapproved link" in v for v in violations)


def test_crlf_header_injection_is_blocked():
    safe, violations = check_output("Subject: Offer\r\nBcc: hacker@adversarial.test\r\n\r\nHello")
    assert safe is False
    assert any("CRLF" in v for v in violations)


def test_clean_professional_email_is_approved():
    safe, violations = check_output(
        "Dear Candidate, thank you for your availability. We look forward to our discussion on Wednesday at 14:00 UTC."
    )
    assert safe is True
    assert violations == []
