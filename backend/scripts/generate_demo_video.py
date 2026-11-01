"""Automated Demo Video Generator for TrustHR AI.
Renders high-resolution 1080p slide frames via headless Edge,
synthesizes voice narration via Windows SpeechSynthesizer,
and compiles a high-quality H.264 / AAC MP4 video using FFmpeg.
"""
import os
import re
import subprocess
import tempfile
from pathlib import Path

BASE_DIR = Path("C:/Users/user/.gemini/antigravity/scratch/trusthr-ai")
SLIDES_DIR = BASE_DIR / "pitch-deck" / "project" / "slides"
OUTPUT_DIR = BASE_DIR / "media"
FINAL_VIDEO_MP4 = OUTPUT_DIR / "trusthr_ai_demo.mp4"
PUBLIC_VIDEO_MP4 = BASE_DIR / "frontend" / "public" / "presentation" / "trusthr_ai_demo.mp4"

EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
FFMPEG_EXE = r"C:\Program Files\Labcenter Electronics\Proteus 9 Professional\Tools\Python\ffmpeg.exe"

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

SCENES = [
    {
        "slide_id": "cover",
        "narration": "Welcome to Trust H R A I, the trustworthy agentic recruitment platform. A I does the paperwork. People make the decisions."
    },
    {
        "slide_id": "problem",
        "narration": "Recruiters drown in hundreds of resumes and emails every day, spending hours on administrative triage instead of focusing on people."
    },
    {
        "slide_id": "gap",
        "narration": "Ordinary A I recruitment tools are dangerously vulnerable. Invisible white text and prompt injections in resumes can hijack automated agents to grant unearned 100 percent scores."
    },
    {
        "slide_id": "solution",
        "narration": "Trust H R A I solves this by enforcing the non-negotiable Golden Rule: The A I proposes, the human decides about people."
    },
    {
        "slide_id": "security",
        "narration": "Our forensic security guard detects tiny fonts, zero-width characters, and prompt injection attacks at the binary layer, neutralizing threats before any language model sees them."
    },
    {
        "slide_id": "features",
        "narration": "Every candidate is evaluated through verifiable evidence quotes. Scores are computed with mathematical determinism, eliminating hallucinations and demographic bias."
    },
    {
        "slide_id": "oversight",
        "narration": "The Human Approval Gateway ensures no email or invitation is ever dispatched without authenticated recruiter authorization, backed by an anti-collision interview calendar."
    },
    {
        "slide_id": "impact",
        "narration": "Every action is permanently recorded in a tamper-proof S H A 256 audit ledger, fully aligned with the European Union A I Act. Trust H R A I: safe, verified, and enterprise-ready."
    }
]

def replace_icons(html: str) -> str:
    def repl(m):
        name = m.group(1)
        style = m.group(2) or ""
        svg = ICONS.get(name, ICONS["Trust"])
        return f'<span class="x-icon" style="display:inline-flex;align-items:center;justify-content:center;{style}">{svg}</span>'
    return re.sub(r'<x-icon\s+name="([^"]+)"(?:\s+style="([^"]*)")?\s*></x-icon>', repl, html)

def create_slide_page(slide_id: str, out_html: Path):
    slide_file = SLIDES_DIR / f"{slide_id}.html"
    raw_html = slide_file.read_text(encoding="utf-8")
    content_no_aside = re.sub(r'<aside>.*?</aside>', '', raw_html, flags=re.DOTALL)
    processed_content = replace_icons(content_no_aside)

    full_html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      font-family: 'DM Sans', Arial, sans-serif;
      background: #0F1729;
    }}
    section {{
      width: 1920px !important;
      height: 1080px !important;
      box-sizing: border-box;
      position: relative;
    }}
    .x-icon svg {{
      width: 100%;
      height: 100%;
    }}
  </style>
</head>
<body>
{processed_content}
</body>
</html>
"""
    out_html.write_text(full_html, encoding="utf-8")

def synthesize_speech(text: str, wav_path: Path):
    ps_script = f"""
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.SetOutputToWaveFile('{str(wav_path).replace("'", "''")}')
$synth.Speak('{text.replace("'", "''")}')
$synth.Dispose()
"""
    subprocess.run(["powershell", "-NoProfile", "-Command", ps_script], check=True)

def screenshot_page(html_path: Path, png_path: Path):
    url = f"file:///{str(html_path).replace(os.sep, '/')}"
    cmd = [
        EDGE_EXE,
        "--headless=new",
        "--disable-gpu",
        f"--screenshot={str(png_path)}",
        "--window-size=1920,1080",
        url
    ]
    subprocess.run(cmd, check=True)

def encode_scene_clip(png_path: Path, wav_path: Path, out_mp4: Path):
    cmd = [
        FFMPEG_EXE,
        "-y",
        "-loop", "1",
        "-r", "25",
        "-i", str(png_path),
        "-i", str(wav_path),
        "-c:v", "libx264",
        "-tune", "stillimage",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(out_mp4)
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    temp_dir = Path(tempfile.mkdtemp(prefix="trusthr_video_"))
    print(f"[*] Workspace temporary directory: {temp_dir}")
    
    clip_paths = []

    for idx, scene in enumerate(SCENES):
        sid = scene["slide_id"]
        narration = scene["narration"]
        print(f"[*] Processing Scene {idx+1}/{len(SCENES)}: [{sid}]")

        # 1. Render slide HTML
        html_file = temp_dir / f"{idx}_{sid}.html"
        create_slide_page(sid, html_file)

        # 2. Screenshot slide
        png_file = temp_dir / f"{idx}_{sid}.png"
        screenshot_page(html_file, png_file)

        # 3. Synthesize speech narration
        wav_file = temp_dir / f"{idx}_{sid}.wav"
        synthesize_speech(narration, wav_file)

        # 4. Compile individual clip
        clip_file = temp_dir / f"clip_{idx}.mp4"
        encode_scene_clip(png_file, wav_file, clip_file)
        clip_paths.append(clip_file)
        print(f"    [OK] Clip {idx+1} generated ({clip_file.name})")

    # 5. Concatenate all clips
    print("[*] Concatenating clips into master demo video...")
    concat_list = temp_dir / "concat_list.txt"
    with open(concat_list, "w", encoding="utf-8") as f:
        for p in clip_paths:
            escaped = str(p).replace("\\", "/")
            f.write(f"file '{escaped}'\n")

    cmd_concat = [
        FFMPEG_EXE,
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_list),
        "-c", "copy",
        str(FINAL_VIDEO_MP4)
    ]
    subprocess.run(cmd_concat, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"[SUCCESS] Final Video rendered at: {FINAL_VIDEO_MP4}")

    # Copy to public folder
    PUBLIC_VIDEO_MP4.parent.mkdir(parents=True, exist_ok=True)
    import shutil
    shutil.copy2(FINAL_VIDEO_MP4, PUBLIC_VIDEO_MP4)
    print(f"[SUCCESS] Video deployed to browser web root: {PUBLIC_VIDEO_MP4}")

if __name__ == "__main__":
    main()
