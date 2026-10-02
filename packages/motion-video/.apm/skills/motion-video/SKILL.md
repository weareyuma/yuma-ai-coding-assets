---
name: motion-video
description: "Use this skill to create or revise a Yuma motion video — a promo, product launch, explainer or demo video with animation, voice-over and music, rendered from HTML to MP4 (4K, dark and light themes). Use it whenever someone asks for a video, promo, teaser, animated explainer, motion graphics, or wants to add or change narration, voice, music, timing or theme on one, even if they do not say 'motion video'."
---

# Motion Video Skill

Use this skill for end-to-end Yuma video work: shaping the story, animating it as an HTML timeline, rendering it to MP4, and adding a voice-over and music.

The video is one HTML page in which **every frame is a pure function of time**. Headless Chrome captures it frame by frame, ffmpeg encodes it, a text-to-speech voice narrates it and a synthesised track sits under the voice. Because nothing is hand-edited, any change — a word, a colour, a beat — is a re-render, not a re-edit.

## Dependency Boundary

- `yuma-design-system` owns the palette, typography, logos and Y-symbol backgrounds. Load it and take every brand value and asset from it; do not restate or override them here.
- This skill owns the timeline engine, the render and audio pipeline, and how a Yuma video is told.

Chrome, ffmpeg, Node and `uv` must be installed. `npm install` in the video folder is a normal workspace dependency: do not install it as a throwaway, and do not remove it afterwards.

## Workflow

1. **Brief.** Establish the audience, the single idea the viewer should leave with, the length (60–120 s for a product video, 15–30 s for an announcement), the facts, and where the video lives (repo folder). For a product, read its real material — README, UI, catalog — rather than inventing features. When the brief is the only source, add no facts beyond it, and tell the user about any wording you supplied yourself.
2. **Story.** Write the story as SCQA (situation, complication, question, answer), then the scene list with times and one sentence each, before any code. Follow `references/storytelling.md` for the structure, on-screen wording and the Yuma voice.
3. **Scaffold.** Copy `assets/template/` into the project (for example `promo/`). Copy `yuma-bg-title-green.png` and `Yuma_logo_White-RGB.svg` from the `references/` folder of the installed `yuma-design-system` skill into the project's `assets/`, then run `npm install`. The template already uses the Yuma palette and typography, so it needs no brand audit — only keep to its tokens.
4. **Animate.** Build the scenes in `index.html`. Read `references/engine.md` first: it explains the timeline rules and the reusable scene patterns.
5. **Check stills, not videos.** `node record.mjs --scale 1 --stills 4,12,30` renders single frames in seconds. Look at them, fix, repeat. Render the full video only when the stills are right.
6. **Narrate.** Write `narration.json`, generate the voice, fit every line to its slot, and sync on-screen events to the spoken words. See `references/audio.md`.
7. **Music and mix.** Set the section times in `music.py`, generate the track, mix. See `references/audio.md`.
8. **Render and verify.** Render at 4K, mix, then verify the finished file — not the sources. See *Verification* below.
9. **Deliver.** Commit the sources and the MP4 following the repository's own contribution rules.

Show the user stills early and often. Wording, pronunciation and pacing are judged by eye and ear: expect several rounds, and make each round cheap.

## Commands

```bash
node record.mjs --scale 1 --stills 4,12,30   # frames/still-<t>.png — the fast feedback loop
node record.mjs --scale 1 --theme light --stills 4,12,30   # frames/still-light-<t>.png
node record.mjs                               # video-only.mp4, 4K (--scale 1 for 1080p)
node record.mjs --theme light                 # video-only-light.mp4
uv run music.py                               # music.wav
node voice.mjs --voices                       # voices available to the ElevenLabs key
node voice.mjs --tts                          # voice/NN.mp3, only lines that changed — this calls the paid voice API
node voice.mjs --check                        # each line's length against its slot
node voice.mjs --words 7                      # word timestamps of line 7 (lines count from 0), to sync visuals
node voice.mjs --mux [--theme light]          # <output>[-light].mp4 = video + voice + music
```

`voice.mjs` needs an explicit mode; with none it prints its usage. Stills accumulate in `frames/`: read the ones you just rendered, by name.

`ELEVENLABS_API_KEY` (voice) and `OPENAI_API_KEY` (`--words`, transcription checks, or the OpenAI voice) are read from the environment. Ask the user to put keys in a file they edit themselves and `source` it; never ask them to paste a key into the conversation, and never print one.

## Rules that keep the video correct

- **Time is the only input.** No CSS transitions or animations, no timers, no `Math.random()`, no `Date`. If a frame depends on anything but `t`, the render will not match the preview.
- **Style with theme tokens, not raw colours**, so the dark and light versions come from one file.
- **Say only what is true of the product.** A scripted scene (a staged conversation, a terminal line) is an illustration; real screenshots must come from the real product. Tell the user which is which.
- **A line that does not fit its slot is a script problem.** Shorten it or move its neighbours; do not speed the voice up more than a few percent.
- **What is named must be on screen when it is named.** Sync to word timestamps, not by guessing.
- **Check pronunciation of product names by ear** — the user's ear. Offer short variants and let them choose.
- **Keep the MP4 under the host's file limit** (GitHub rejects files over 100 MB), and keep one copy in history: amend an unpushed commit rather than stacking renders.

## Verification

Before saying the video is ready:

1. Build a contact sheet from the **final MP4** (`ffmpeg … select … tile`) and look at it: every scene present, transitions clean, no leftover element from a neighbouring scene.
2. Transcribe the final audio and compare it with the script, word for word.
3. Measure loudness (`ffmpeg -af ebur128`): about −16 LUFS overall, music well below the voice in the gaps.
4. Confirm resolution, duration and file size with `ffprobe`.
5. Re-check a few dark stills after any light-theme change, and the reverse.

Say plainly what you could not verify. You cannot hear the result: pronunciation, tone and musical taste are the user's call.

## Reference files

- `references/storytelling.md` — structuring the story with SCQA, on-screen wording, the Yuma voice, product vocabulary.
- `references/engine.md` — the timeline engine, themes, and scene patterns (statement, catalog, zoomable world, messages, screenshots, typed code).
- `references/audio.md` — narration, voice providers and models, pronunciation, slot fitting, word sync, music, mixing.
- `assets/template/` — a working starter: `index.html`, `record.mjs`, `voice.mjs`, `music.py`, `narration.json`.
