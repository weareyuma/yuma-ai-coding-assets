---
name: motion-video
description: "Use this skill to create or revise a Yuma-branded video — a promo, product launch, trailer, explainer or announcement with animation, voice-over and music. It is the Yuma layer on top of HyperFrames: the brand frame spec, how a Yuma video tells its story, and the voice-over rules. Use it whenever someone asks for a Yuma video, promo, teaser or animated explainer, or wants to change the narration, voice, pronunciation or story of one."
---

# Motion Video Skill

Yuma videos are built with [HyperFrames](https://github.com/heygen-com/hyperframes): HTML compositions rendered to video. HyperFrames owns the engine, the rendering, the audio mix, the checks and the preview. This skill adds what it cannot know: the Yuma brand at frame scale, how a Yuma video is told, and how its voice-over is produced.

## Dependency Boundary

- **HyperFrames skills** own composition structure, animation, audio mixing, the CLI and rendering. Start every video from `/hyperframes` and follow its workflow; do not restate or override its rules here. If the skills are missing, install them with `npx hyperframes skills update` (Node 22+ and FFmpeg required).
- **`yuma-design-system`** owns the palette, typography, logos and Y-symbol backgrounds. `assets/frame.md` mirrors its values at frame scale; when the two differ, the design system wins and `frame.md` is corrected.
- **This skill** owns `assets/frame.md`, the storytelling guidance and the voice-over rules.

## Workflow

1. **Brief.** Establish the audience, the single idea the viewer should leave with, the length (60–120 s for a product video, 45–60 s for a business trailer, 15–30 s for an announcement) and the facts. For a product, read its real material rather than inventing features. When the brief is the only source, add no facts beyond it, and tell the user about any wording you supplied.
2. **Story.** Write the story as SCQA, then the shot list, following `references/storytelling.md`. Get the user's agreement on the shot list and the narration before building.
3. **Project.** Create the HyperFrames project through `/hyperframes`. Copy `assets/frame.md` into the project root as `frame.md`: HyperFrames reads it as the brand truth. Copy the Yuma title background and white logo from `yuma-design-system` for the outro, and local font files for the faces `frame.md` names (HyperFrames requires an in-file `@font-face` to a local file).
4. **Voice.** Generate the narration and its word timings, settle pronunciation with the user, and place the clips, following `references/voice.md`.
5. **Build, check, preview, render** with the HyperFrames workflow. Time on-screen words to the spoken words. Read `references/production-notes.md` before the first build.
6. **Verify the finished file**, not the sources: look at frames from it, transcribe its audio against the script, confirm the audio lasts as long as the video, and measure loudness. Say plainly what you could not verify: you cannot hear the result, so pronunciation, tone and music are the user's call.
7. **Deliver** following the repository's own contribution rules.

Show the user frames early and often. Wording, pronunciation and pacing take several rounds; keep each round cheap.

## Rules

- **Say only what is true of the subject.** A staged scene is an illustration; real screenshots must come from the real product. Use no figure that is not real and sourced.
- **People are part of the picture.** When people and software appear together, draw the people among the other elements and mark them consistently (pink in `frame.md`).
- **What is named must be on screen when it is named**, and a negation must be spoken, not only shown.
- **One copy of a rendered video in git history.** Amend an unpushed commit rather than stacking renders, and keep files under the host's size limit.

## Reference files

- `assets/frame.md` — the Yuma frame spec for HyperFrames: colours, type ramp, components, composition rules.
- `references/storytelling.md` — SCQA structure, audiences, on-screen wording, the Yuma voice, product vocabulary.
- `references/voice.md` — narration, voice choice, pronunciation of coined names, placing clips, syncing the picture to words.
- `references/production-notes.md` — lessons from real builds: word layout, porting an existing page, 4K file size, motion blur and grain, audio levels.
- `scripts/voice.mjs` — generates the narration clips and word timings (ElevenLabs, with Whisper for timings).
