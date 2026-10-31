# app/core/input_guard.py
import re
import fitz  # PyMuPDF
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import Tuple, List

# 1. Regex to remove Zero-Width Characters (invisible text)
ZERO_WIDTH_PATTERN = re.compile(r'[\u200B-\u200D\uFEFF\u2060]')

# 2. Prompt Injection Regex Rules (EN/FR)
SUSPICIOUS_PATTERNS = [
    re.compile(r"ignore (all )?previous instructions", re.I),
    re.compile(r"ignorez les instructions", re.I),
    re.compile(r"system prompt", re.I),
    re.compile(r"you are now", re.I),
    re.compile(r"disregard (all )?prior", re.I),
    re.compile(r"oubliez les instructions", re.I),
]

class InputGuard:
    def __init__(self, use_meta_model: bool = False):
        """
        Initializes the Prompt Guard model. 
        Set use_meta_model=True once your Hugging Face access is approved.
        """
        self.model_type = "Meta" if use_meta_model else "Fallback"
        if use_meta_model:
            print("Loading Meta Prompt Guard...")
            mid = "meta-llama/Llama-Prompt-Guard-2-86M"
            self.tok = AutoTokenizer.from_pretrained(mid)
            self.model = AutoModelForSequenceClassification.from_pretrained(mid)
        else:
            print("Loading Fallback Prompt Guard...")
            mid = "protectai/deberta-v3-base-prompt-injection-v2"
            self.tok = AutoTokenizer.from_pretrained(mid)
            self.model = AutoModelForSequenceClassification.from_pretrained(mid)

    def sanitize_text(self, text: str) -> Tuple[str, List[str]]:
        """Removes zero-width chars and checks for regex injections."""
        flags = []
        
        # Remove zero-width characters
        if ZERO_WIDTH_PATTERN.search(text):
            flags.append("zero_width_chars_detected")
            text = ZERO_WIDTH_PATTERN.sub("", text)
            
        # Check regex patterns
        for pattern in SUSPICIOUS_PATTERNS:
            if pattern.search(text):
                flags.append(f"regex_match_{pattern.pattern[:20]}")
                
        return text, flags

    def scan_chunk(self, text: str) -> float:
        """Returns a probability score (0.0 to 1.0) of prompt injection."""
        if not text.strip():
            return 0.0
            
        inputs = self.tok(text, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            logits = self.model(**inputs).logits
            probs = torch.softmax(logits, dim=-1)[0]
            
        # Fallback model labels: 0 = SAFE, 1 = INJECTION (Check config.id2label)
        # We assume index 1 is the malicious score.
        return probs[1].item() if len(probs) > 1 else 0.0

    def extract_pdf_secure(self, file_bytes: bytes) -> Tuple[str, List[dict]]:
        """Extracts text from PDF, but strips hidden text and flags it."""
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        clean_text = ""
        risk_flags = []

        for page_num, page in enumerate(doc):
            blocks = page.get_text("dict")["blocks"]
            for block in blocks:
                if block.get("type") == 0: # Text block
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            text = span["text"]
                            color = span["color"] # 0x000000 = Black, 0xFFFFFF = White
                            size = span["size"]
                            
                            # PENTESTER FIX: Hide text that is white or tiny
                            if color == 16777215 or size < 2.0: 
                                risk_flags.append({
                                    "page": page_num + 1,
                                    "type": "hidden_text",
                                    "text": text,
                                    "reason": f"color={color}, size={size}"
                                })
                            else:
                                clean_text += text + " "
        return clean_text.strip(), risk_flags

# Singleton instance for the app
guard_engine = InputGuard(use_meta_model=False) # Change to True when approved