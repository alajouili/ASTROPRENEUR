"""Risk flags raised by the Security Guard and the screening checks."""
from dataclasses import asdict, dataclass

SEVERITY_ORDER = {"none": 0, "low": 1, "medium": 2, "high": 3}


@dataclass(frozen=True)
class RiskFlag:
    code: str
    severity: str  # low | medium | high
    detail: str
    excerpt: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


def max_severity(flags: list[RiskFlag] | list[dict]) -> str:
    level = "none"
    for f in flags:
        sev = f["severity"] if isinstance(f, dict) else f.severity
        if SEVERITY_ORDER[sev] > SEVERITY_ORDER[level]:
            level = sev
    return level
