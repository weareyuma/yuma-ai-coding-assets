# Voice, music and mix

## Narration script (`narration.json`)

One entry per spoken line: `at` is when it starts, `until` the latest it may end, `text` what is said — all in absolute video time. Lines are numbered from 0 (`voice/00.mp3` is the first). Write one line per beat of the picture and leave a short breath between lines.

Budget before generating: narration runs at about **2.5 words per second**, and a pause at a full stop or a dash costs about half a second. A 4-second slot holds roughly nine words. Draft to that budget, then let `--check` give the real lengths.

`voice.mjs --tts` regenerates only the lines whose text or voice settings changed, so iterating on one sentence costs one request. It is the only mode that spends voice credits; `--check` and `--mux` work from the clips already on disk.

## Voice

Default: ElevenLabs `eleven_v4` — the highest-quality model at the time of writing. Models change: before a new video, check the provider's current model list rather than trusting this file. `eleven_v4` takes only *stability* and *similarity* settings (no speed or style slider, no SSML).

- `node voice.mjs --voices` lists the voices on the key. Pick one made for narration; offer the user a male and a female option and let them choose.
- Set `tts.provider` to `openai` to use the OpenAI block instead (`gpt-4o-mini-tts`, voices `marin` or `cedar`), which also accepts free-text speaking instructions. Conversational "realtime" models are not narration models: they may paraphrase the script.

## Pronunciation

A voice will mangle or spell out coined names. You cannot hear the result, and a transcript only tells you whether letters were spelled out, not whether the word sounds right. So:

1. Generate one short test sentence in several spellings (plain, hyphenated, respelled) into `voice/test/`.
2. Transcribe each to rule out spelled-out letters.
3. Give the user a one-line command to play them in order, and ask which number is right.
4. Put the winner in the `pronounce` map (`"Akgents": "Ak-gents"`). It rewrites only what is sent to the voice; on-screen text is untouched.
5. After generating the full narration, transcribe the final mix and check every occurrence. A name can behave differently next to certain words (for example after "an"); rephrase that line rather than fight the voice.

Pronunciation does not carry over between voices or providers: re-test after changing either.

## Fitting lines to their slots

`node voice.mjs --check` prints each line's real length against its slot. When a line runs over:

1. Use the natural gaps first: move neighbouring lines a few tenths of a second.
2. Then shorten the sentence. Spoken text should be tighter than on-screen text.
3. A speed-up of two or three percent is inaudible; `voice.mjs` refuses more than twelve. Treat anything above five as a script problem.

Changing the voice changes every length. Re-run `--check` after any voice change.

## Syncing the picture to the words

When the narration names things that appear one after another (tabs, features, steps), the picture must not lead or lag the word.

1. `node voice.mjs --words N` prints the absolute time of every word in line N.
2. Set each on-screen event to start about a quarter of a second before its word, so the motion has landed when the word is heard.
3. Prefer moving the picture to the audio. If an event cannot move, split the line in two entries and place each.
4. Confirm with stills taken at the word times.

## Music (`music.py`)

The track is synthesised, so there is nothing to license. It is arranged by a few constants set from the video's scene boundaries:

- `DUR` — the video's `DURATION`.
- `BASS_FROM` — the start of the second scene.
- `ARP_FROM` — the start of the first scene where things move.
- `DRUMS` — the busy scenes. Leave a gap under the line that should land hardest.
- `ARP16` — the most energetic stretch inside the drum spans, if any.
- `RISERS` — the start of a scene that deserves an entrance (a riser needs 1.8 s of lead).
- `OUTRO` — the outro scene's start plus 0.4 s.

A 20-second video wants one drum span and one riser at most; the pad and the final chord do most of the work.

To use a licensed track instead, point `music.file` in `narration.json` at it; ducking and levelling apply the same way.

## Mix

`voice.mjs --mux` places the lines, side-chain ducks the music under them, normalises to about −16 LUFS and muxes with the video (the video stream is copied, so re-mixing takes seconds).

Check the balance by measurement: the mean level in a gap between lines (music alone) should sit several dB below a passage with speech. If the music is as loud in the gaps as the voice, lower `music.gain`.
