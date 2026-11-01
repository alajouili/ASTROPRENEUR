"""Builds a single standalone interactive HTML presentation for TrustHR AI pitch deck."""
import json
import re
from pathlib import Path

DECK_DIR = Path(__file__).parent
PROJECT_DIR = DECK_DIR / "project"
SLIDES_DIR = PROJECT_DIR / "slides"
DECK_JSON = PROJECT_DIR / "deck.json"
OUTPUT_HTML = DECK_DIR / "index.html"

# SVG definitions for x-icon tags
ICONS = {
    "Trust": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    "Warning": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    "Search": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    "Lightning": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    "Lock": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    "Database": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    "Book": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>',
    "Chat": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    "Clock": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    "Verified": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 3.26L19.5 5.5l.74 4.43 3.76 2.07-2.07 3.76.74 4.43-4.41.24L15.09 22 12 19.88 8.91 22l-3.09-3.26L1.41 18.5l-.74-4.43 2.07-3.76L2 6.55l4.41-.24L8.91 2 12 2z"/><polyline points="9 12 11 14 15 10"/></svg>',
    "Users": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
}

def replace_icons(html: str) -> str:
    def repl(m):
        name = m.group(1)
        style = m.group(2) or ""
        svg = ICONS.get(name, ICONS["Trust"])
        return f'<span class="x-icon" style="display:inline-flex;align-items:center;justify-content:center;{style}">{svg}</span>'
    return re.sub(r'<x-icon\s+name="([^"]+)"(?:\s+style="([^"]*)")?\s*></x-icon>', repl, html)

def main():
    with open(DECK_JSON, "r", encoding="utf-8") as f:
        meta = json.load(f)
    
    order = meta.get("order", [])
    slides_data = []

    for idx, slide_id in enumerate(order):
        slide_path = SLIDES_DIR / f"{slide_id}.html"
        if not slide_path.exists():
            continue
        content = slide_path.read_text(encoding="utf-8")
        
        # Extract aside (speaker notes)
        aside_m = re.search(r'<aside>(.*?)</aside>', content, re.DOTALL)
        notes = aside_m.group(1).strip() if aside_m else ""
        content_no_aside = re.sub(r'<aside>.*?</aside>', '', content, flags=re.DOTALL)
        content_with_icons = replace_icons(content_no_aside)

        slides_data.append({
            "id": slide_id,
            "index": idx + 1,
            "content": content_with_icons,
            "notes": notes
        })

    # Render complete HTML template
    slides_html = "\n".join([
        f'<div class="slide-wrapper" id="slide-wrapper-{s["index"]}" data-index="{s["index"]}" data-id="{s["id"]}" style="display: {"flex" if s["index"]==1 else "none"};">'
        f'{s["content"]}'
        f'</div>'
        for s in slides_data
    ])

    notes_json = json.dumps({s["index"]: s["notes"] for s in slides_data})
    titles_json = json.dumps([{"index": s["index"], "id": s["id"]} for s in slides_data])

    full_page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TrustHR AI — Hackathon Pitch & Presentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..800;1,9..40,400..800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #090D16;
      color: #F1F5F9;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }}

    #presentation-stage {{
      position: relative;
      width: 1920px;
      height: 1080px;
      transform-origin: center center;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(79, 70, 229, 0.15);
      border-radius: 8px;
      overflow: hidden;
      background: #0F1729;
    }}

    .slide-wrapper {{
      width: 1920px;
      height: 1080px;
      position: absolute;
      top: 0;
      left: 0;
    }}

    .slide-wrapper > section {{
      width: 1920px !important;
      height: 1080px !important;
      box-sizing: border-box;
      position: relative;
    }}

    .x-icon svg {{
      width: 100%;
      height: 100%;
    }}

    /* Presentation Controls Floating Bar */
    #controls-bar {{
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9999px;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 100;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      transition: opacity 0.3s ease;
    }}

    #controls-bar:hover {{
      opacity: 1;
    }}

    .ctrl-btn {{
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #F1F5F9;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }}

    .ctrl-btn:hover {{
      background: #4F46E5;
      border-color: #6366F1;
      transform: translateY(-1px);
    }}

    .slide-counter {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      color: #94A3B8;
      padding: 0 8px;
    }}

    .timer-badge {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #10B981;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 4px 10px;
      border-radius: 9999px;
    }}

    /* Notes Drawer */
    #notes-drawer {{
      display: none;
      position: fixed;
      right: 24px;
      top: 24px;
      bottom: 90px;
      width: 420px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 24px;
      z-index: 90;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }}

    #notes-drawer h4 {{
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #818CF8;
      margin-bottom: 12px;
    }}

    #notes-drawer p {{
      font-size: 16px;
      line-height: 1.6;
      color: #CBD5E1;
    }}

    /* Slide Progress Bar */
    #progress-line {{
      position: fixed;
      top: 0;
      left: 0;
      height: 4px;
      background: #4F46E5;
      box-shadow: 0 0 12px #6366F1;
      transition: width 0.3s ease;
      z-index: 200;
    }}

    /* Print View */
    @media print {{
      body {{
        overflow: visible !important;
        background: white !important;
      }}
      #presentation-stage {{
        box-shadow: none !important;
        border-radius: 0 !important;
        width: 100% !important;
        height: auto !important;
        transform: none !important;
      }}
      .slide-wrapper {{
        display: block !important;
        page-break-after: always;
        position: relative !important;
        margin-bottom: 40px;
      }}
      #controls-bar, #notes-drawer, #progress-line {{
        display: none !important;
      }}
    }}
  </style>
</head>
<body>

  <div id="progress-line" style="width: 7.14%;"></div>

  <div id="presentation-stage">
    {slides_html}
  </div>

  <div id="notes-drawer">
    <h4>Speaker Notes (Key: S)</h4>
    <p id="notes-content"></p>
  </div>

  <div id="controls-bar">
    <button class="ctrl-btn" onclick="prevSlide()">◀ Prev</button>
    <span class="slide-counter" id="slide-num">01 / {len(slides_data)}</span>
    <button class="ctrl-btn" onclick="nextSlide()">Next ▶</button>
    <span class="timer-badge" id="deck-timer">00:00</span>
    <button class="ctrl-btn" onclick="toggleNotes()">Notes (S)</button>
    <button class="ctrl-btn" onclick="toggleFullscreen()">Fullscreen (F)</button>
    <button class="ctrl-btn" onclick="window.print()">Print PDF (P)</button>
    <a href="trusthr_ai_demo.mp4" target="_blank" class="ctrl-btn" style="background:rgba(16,185,129,0.2);border-color:#10B981;color:#6EE7B7;text-decoration:none">▶ Video Demo (MP4)</a>
  </div>

  <script>
    const totalSlides = {len(slides_data)};
    let currentSlide = 1;
    const notesData = {notes_json};
    let timerSecs = 0;
    let timerInterval = null;

    function resizeStage() {{
      const stage = document.getElementById('presentation-stage');
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = Math.min(w / 1920, h / 1080) * 0.96;
      stage.style.transform = `scale(${{scale}})`;
    }}

    window.addEventListener('resize', resizeStage);
    resizeStage();

    function updateView() {{
      for (let i = 1; i <= totalSlides; i++) {{
        const el = document.getElementById(`slide-wrapper-${{i}}`);
        if (el) {{
          el.style.display = (i === currentSlide) ? 'flex' : 'none';
        }}
      }}
      document.getElementById('slide-num').textContent = 
        String(currentSlide).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0');
      
      const pct = (currentSlide / totalSlides) * 100;
      document.getElementById('progress-line').style.width = pct + '%';

      const note = notesData[currentSlide] || "No speaker notes for this slide.";
      document.getElementById('notes-content').textContent = note;
    }}

    function nextSlide() {{
      if (currentSlide < totalSlides) {{
        currentSlide++;
        updateView();
      }}
    }}

    function prevSlide() {{
      if (currentSlide > 1) {{
        currentSlide--;
        updateView();
      }}
    }}

    function toggleNotes() {{
      const d = document.getElementById('notes-drawer');
      d.style.display = (d.style.display === 'block') ? 'none' : 'block';
    }}

    function toggleFullscreen() {{
      if (!document.fullscreenElement) {{
        document.documentElement.requestFullscreen().catch(() => {{}});
      }} else {{
        document.exitFullscreen().catch(() => {{}});
      }}
    }}

    document.addEventListener('keydown', (e) => {{
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {{
        e.preventDefault();
        nextSlide();
      }} else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') {{
        e.preventDefault();
        prevSlide();
      }} else if (e.key === 'f' || e.key === 'F') {{
        e.preventDefault();
        toggleFullscreen();
      }} else if (e.key === 's' || e.key === 'S') {{
        e.preventDefault();
        toggleNotes();
      }} else if (e.key === 'p' || e.key === 'P') {{
        window.print();
      }}
    }});

    // Start timer on load
    timerInterval = setInterval(() => {{
      timerSecs++;
      const m = String(Math.floor(timerSecs / 60)).padStart(2, '0');
      const s = String(timerSecs % 60).padStart(2, '0');
      const badge = document.getElementById('deck-timer');
      badge.textContent = `${{m}}:${{s}}`;
      if (timerSecs > 270) {{
        badge.style.color = '#EF4444';
        badge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        badge.style.background = 'rgba(239, 68, 68, 0.15)';
      }}
    }}, 1000);

    updateView();
  </script>
</body>
</html>
"""
    OUTPUT_HTML.write_text(full_page, encoding="utf-8")
    print(f"[OK] Pitch Deck compiled into {OUTPUT_HTML} ({len(slides_data)} slides)")
    
    # Also mirror to public web presentation directory
    public_target = Path("C:/Users/user/.gemini/antigravity/scratch/trusthr-ai/frontend/public/presentation/index.html")
    public_target.parent.mkdir(parents=True, exist_ok=True)
    import shutil
    shutil.copy2(OUTPUT_HTML, public_target)
    print(f"[OK] Pitch Deck mirrored to {public_target}")

if __name__ == "__main__":
    main()
