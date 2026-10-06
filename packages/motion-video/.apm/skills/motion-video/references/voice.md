# Voice-over

HyperFrames mixes the audio (placement, ducking the music under the voice, loudness). This file covers what it does not decide for you: which voice, how a coined name is pronounced, and how to make the picture land on the words.

## Generating the narration

`scripts/voice.mjs` turns a `narration.json` into one clip per line and a `words.json` with the timing of every word:

```bash
ELEVENLABS_API_KEY=… OPENAI_API_KEY=… node <skill>/scripts/voice.mjs narration.json
node <skill>/scripts/voice.mjs --voices                 # voices available on the key
```

- Default model: ElevenLabs `eleven_v4`. Models change: check the provider's current list before a new video. `eleven_v4` takes only *stability* and *similarity* (no speed or style control, no SSML).
- Pick a voice made for narration. Offer the user a male and a female option and let them choose.
- Only lines whose text or settings changed are regenerated.
- Keys come from the environment. Ask the user to put them in a file they edit themselves and `source` it; never ask for a key in the conversation, and never print one.

HyperFrames' own `media-use` skill can also produce a voice-over. Use it when the user prefers it; the pronunciation and sync rules below apply either way.

## Budgeting lines

Narration runs at about **2.5 words per second**; a pause at a full stop or a dash costs about half a second. Draft to that budget, generate, then read the real `dur` values in `words.json` and set each clip's start so that no two overlap. A line that does not fit is a script problem: shorten it or move its neighbours. Changing the voice changes every length.

## Pronunciation of coined names

You cannot hear the result, and a transcript only shows whether letters were spelled out, not whether the word sounds right.

1. `node <skill>/scripts/voice.mjs narration.json --test "Name" "Na-me" "Nahme"` writes one short clip per spelling.
2. Give the user a one-line command to play them in order, and ask which number is right.
3. Put the winner in `pronounce` (`"Name": "Na-me"`). It changes only what is sent to the voice; on-screen text is untouched.
4. After generating everything, transcribe the final audio and check every occurrence. A name can behave differently next to certain words (for example after "an"): rephrase that line rather than fight the voice.

Re-test after changing the voice or the provider.

## Placing the clips in the composition

Each clip is an `<audio>` element with an `id`, `data-audio-group="voiceover"`, `data-start` and `data-duration` (its `dur`). The music track carries the carve that ducks it under that group:

```html
<audio id="vo-00" data-audio-group="voiceover" src="assets/voice/00.mp3" data-start="0.2" data-duration="2.24"></audio>
<audio id="music" src="assets/music.mp3" data-start="0" data-duration="56" data-volume="0.3"
       data-fx-carve='{"enabled":true,"sources":["voiceover"],"strength":0.8}'></audio>
```

Let the music run to the end of the video, past the last line.

## Making the picture land on the words

When the voice names things that appear on screen, the picture must not lead or lag the word.

- A word spoken at `start` in `words.json` is heard at *clip start + start*. Use that time as the timeline position of the element it names.
- For a list of things named one after another (tabs, features, steps), start each about a quarter of a second before its word so the motion has landed when the word is heard.
- If the narration says more than the screen shows ("It's not one agent answering" over the words "One agent answers"), map each on-screen word to the spoken word that carries it.
- A negation must be audible, not only visual: a struck-through line on screen needs "it's not …" in the voice.
