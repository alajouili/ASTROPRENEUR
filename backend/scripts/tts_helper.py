import sys
import asyncio
import edge_tts
from pathlib import Path

async def synthesize_with_retry(text, out_file, voice, rate):
    voices_to_try = [voice, "fr-FR-RemyMultilingualNeural", "fr-FR-VivienneMultilingualNeural"]
    for v in voices_to_try:
        for attempt in range(3):
            try:
                communicate = edge_tts.Communicate(text, voice=v, rate=rate)
                await communicate.save(out_file)
                print(f"Synthesized {out_file} using {v} (rate: {rate})")
                return
            except Exception as e:
                print(f"Attempt {attempt+1} failed with {v}: {e}")
                await asyncio.sleep(1.5)
    raise RuntimeError(f"Failed to synthesize {out_file} after retries")

async def main():
    text_file = sys.argv[1]
    out_file = sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 else "fr-FR-HenriNeural"
    rate = sys.argv[4] if len(sys.argv) > 4 else "+18%"
    
    text = Path(text_file).read_text(encoding="utf-8").strip()
    await synthesize_with_retry(text, out_file, voice, rate)

if __name__ == "__main__":
    asyncio.run(main())
