"""Cinematic Architecture and Code Tour Video Generator for TrustHR AI.
Renders high-definition 1080p architectural blueprint and code inspection slides via headless Edge,
synthesizes synchronous professional voice narration via Windows SpeechSynthesizer,
and compiles a high-quality H.264 / AAC MP4 video using Proteus FFmpeg.
"""
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

BASE_DIR = Path("C:/Users/user/.gemini/antigravity/scratch/trusthr-ai")
SLIDES_DIR = BASE_DIR / "backend" / "scripts" / "cinematic_slides"
MEDIA_DIR = BASE_DIR / "media"
FINAL_VIDEO_MP4 = MEDIA_DIR / "trusthr_ai_cinematic_architecture.mp4"
PUBLIC_VIDEO_MP4 = BASE_DIR / "frontend" / "public" / "presentation" / "trusthr_ai_cinematic_architecture.mp4"

EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
FFMPEG_EXE = r"C:\Program Files\Labcenter Electronics\Proteus 9 Professional\Tools\Python\ffmpeg.exe"

SCENES = [
    {
        "file": "01_intro.html",
        "narration": "Welcome to the engineering and architectural tour of Trust H R A I. Built from the ground up for high-stakes enterprise recruitment, Trust H R A I enforces mathematical defense, verifiable evidence extraction, and air-gapped human governance."
    },
    {
        "file": "02_blueprint.html",
        "narration": "At the core of Trust H R A I lies a three-tier defense architecture. Data ingestion is protected by binary forensic pre-processing. The intelligence tier utilizes deterministic citation constraints to eliminate hallucination, and the execution tier remains strictly air-gapped behind the Human Action Gateway."
    },
    {
        "file": "03_extract.html",
        "narration": "Deep inside extract dot py, Trust H R A I performs binary forensic extraction using PyMuPDF. Before any text reaches a language model, the system analyzes every font point and color value, actively pruning invisible near-white text and micro-fonts below four points."
    },
    {
        "file": "04_injection.html",
        "narration": "In injection dot py, our security engine defends against adversarial prompt injections. It normalizes Cyrillic and Greek homoglyphs to standard ASCII, then applies bilingual regex patterns to immediately flag and neutralize override commands in both English and French."
    },
    {
        "file": "05_scoring.html",
        "narration": "Unlike black-box models, scoring dot py uses deterministic arithmetic. Must-have criteria act as hard knockouts. Every claim requires an exact verbatim quotation from the candidate's CV, guaranteeing zero hallucinations and verifiable auditability."
    },
    {
        "file": "06_executor.html",
        "narration": "In executor dot py, the Action Gateway enforces our non-negotiable Golden Rule. Autonomous models have zero dispatch authority. Proposals remain quarantined until an authenticated recruiter signs the approval, ensuring human accountability at every turn."
    },
    {
        "file": "07_audit.html",
        "narration": "Trust H R A I guarantees enterprise integrity through an immutable SHA 256 backward hash chain in log dot py. Each audit record cryptographically binds to its predecessor. Any unauthorized database modification immediately breaks the chain and triggers tamper alerts."
    },
    {
        "file": "08_production.html",
        "narration": "In production, the platform cleanly neutralizes real-world attacks like Eve Infiltrator while ranking genuine talent like Amira Ben Salah with ninety-two point five percent precision, producing automated EU AI Act conformity certificates and candidate explanations."
    },
    {
        "file": "09_outro.html",
        "narration": "Engineered with scientific rigor by team ASTROPRENEUR: Ala Jouili, Chiheb Ben Taleb, Hamza, and Mohamed Jerbi. Trust H R A I brings safety, transparency, and human dignity back to recruitment. Thank you."
    }
]

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
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    temp_dir = Path(tempfile.mkdtemp(prefix="trusthr_cinematic_"))
    print(f"[*] Workspace temporary directory: {temp_dir}")

    clip_paths = []

    for idx, scene in enumerate(SCENES):
        slide_file = SLIDES_DIR / scene["file"]
        narration = scene["narration"]

        print(f"[*] Processing Scene {idx+1}/{len(SCENES)}: [{scene['file']}]")

        # 1. Screenshot 1080p slide
        png_file = temp_dir / f"{idx}_{scene['file']}.png"
        screenshot_page(slide_file, png_file)

        # 2. Synthesize speech
        wav_file = temp_dir / f"{idx}_{scene['file']}.wav"
        synthesize_speech(narration, wav_file)

        # 3. Encode MP4 scene clip
        clip_file = temp_dir / f"clip_{idx}.mp4"
        encode_scene_clip(png_file, wav_file, clip_file)
        clip_paths.append(clip_file)
        print(f"    [OK] Scene {idx+1} successfully encoded ({clip_file.name})")

    # 4. Concatenate all clips
    print("[*] Stitching master cinematic video...")
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
    print(f"[SUCCESS] Master cinematic video rendered at: {FINAL_VIDEO_MP4}")

    # Copy to public folder
    PUBLIC_VIDEO_MP4.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(FINAL_VIDEO_MP4, PUBLIC_VIDEO_MP4)
    print(f"[SUCCESS] Deployed to frontend web root: {PUBLIC_VIDEO_MP4}")

    # Clean up temp files safely
    try:
        shutil.rmtree(temp_dir)
    except Exception:
        pass

if __name__ == "__main__":
    main()
