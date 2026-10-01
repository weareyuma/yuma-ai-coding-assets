# The timeline engine

`assets/template/index.html` is the whole engine. Read it once; it is short and commented.

## How it works

- The stage is a fixed 1920×1080 box. `record.mjs` renders it at 2× density for 4K, so lay out in 1080p pixels.
- `SCENES` lists `[id, start, end]`. Neighbouring scenes overlap by about 0.4 s: one fades out as the next fades in, through the background.
- Each scene has one function that sets styles from **the time since that scene started**. `window.renderAt(t)` calls the visible ones with `t - start`. So every number inside a scene — keyframes, caption times, message times — is scene-local, and moving, shortening or reordering a scene is an edit to `SCENES` alone.
- `narration.json` and `music.py` use absolute video time. After moving a scene, move its narration lines and music sections by the same amount.
- Data (cards, messages, captions, camera keyframes) lives in plain lists at the top of each scene. The DOM is built once from those lists; `renderAt` only styles it. Editing a video is mostly editing lists.

Helpers: `prog(t, a, b)` gives 0→1 between two times; `eo` eases arrivals, `eio` eases travel and camera moves, `eback` gives a small pop; `lerp` interpolates; `style(el, opacity, {x, y, s})` applies the result.

A typical element:

```js
const a = eo(prog(t, 2.0, 2.8));            // arrives 2.0–2.8 s into its scene
style(el, a, { y: lerp(30, 0, a) });        // fades in while rising 30 px
```

To make something leave, multiply by `1 - prog(t, out0, out1)`.

## Rules

- Derive everything from `t`. No CSS transitions, `setTimeout`, `Math.random()` or `Date`; for "random" motion use a seeded formula (see the background network).
- Measure, do not guess, anything that depends on text width — the strike-through line reads `offsetWidth` every frame, so rewording never breaks it.
- Anything that must react to another scene (the background fading under the outro) reads that scene's start from `SCENES` (`startOf('outro')`) instead of repeating the number.
- Screenshots and logos go in `assets/`; wait for images and fonts before recording (the recorder does).
- Keep text at least 22 px in the 1080p layout; it must survive a phone screen.
- Shorter video than the template: delete scenes from `SCENES` and the markup, set `DURATION` to the last scene's end, and tighten each scene's end time. Nothing else needs renumbering.

## Themes

Colours are CSS tokens (`--bg`, `--text`, `--accent`, `--surface`, `--line`, …) with a dark default and a `[data-theme="light"]` override; `?theme=light` selects it. Colours used from JavaScript come from the theme-aware `C` palette.

What changes on light:

- Future Green is unreadable as text on beige: the accent becomes Forest Green, and bright green is kept for fills only.
- Glows do not read on a light ground: use soft shadows.
- A palette colour used for text on dark (initials in a circle) moves to the ring, and the text turns black.
- Pink and Earth are faint on beige, as thin lines and as small fills: draw lines thicker and fully opaque, and give small dots a hairline ring.
- A black logo image takes `class="logo"` (`filter: var(--logo-filter)`): inverted to white on dark, untouched on light. On the Forest Green outro use the white logo file.
- A dimmed image looks washed out: dim less.
- Code panels, terminals and the Forest Green outro stay dark in both themes — scope the tokens on those elements.

Keep both themes in one file so every later edit applies to both, and re-check a few stills of the other theme after any theme-specific change.

## Scene patterns

**Statement.** A grey line appears, a coloured stroke crosses it out, the replacement line lands beneath with one word in the accent colour. Use it to open and to close.

**Catalog to instances.** A grid of cards (the building blocks) appears; then instances fly out of the cards to their place in the next scene, each card flashing as it spawns. One card can spawn several instances — that is how you show "template versus live thing".

**Zoomable world.** Put several groups in one coordinate space and move a camera over it:

```js
const CAMK = [[t, cx, cy, scale], …];                      // keyframes
const w2s = (x, y, c) => [960 + (x - c.cx) * c.s, 540 + (y - c.cy) * c.s];
```

Interpolate the centre linearly and the scale geometrically (`exp(lerp(log s0, log s1, e))`). Zoom into one group, pull back through a mid-zoom keyframe, zoom into the next. When zoomed in, fade the other groups out so a neighbour's element never looks like part of this group. Show labels and message text only above a zoom threshold.

**Messages between actors.** Do not pre-draw links. A message is a dot travelling from sender to receiver with a short text chip; a line follows it and fades a second after arrival. Give each actor a spinner while it works and a small counter for messages waiting in its mailbox. Keep three plain lists: messages `[t, from, to, kind, text]`, busy spans `[actor, start, end]`, captions `[start, end, text]`. Background chatter in the groups the camera is not looking at keeps the wide shots alive; generate it with a seeded formula.

**States worth showing.** Offline (dashed, dimmed, with a queued message), joining through another channel (a branded pill flies in, the actor turns solid), crashed (red, a short shake, then fades) and relaunched (a new instance pops in the same place), waiting on someone (a small label, while others keep moving).

**Real screenshots.** Capture them from the running product with a script, at 2× density, so they can be refreshed. Bring the main screenshot in with a slight 3D tilt, then set it back and flip detail panels in front like a deck, each with a two-line caption. Element-level screenshots of a widened panel beat cropping a full-page capture.

**Typed code.** Reveal monospace lines by width (`ch` units) so syntax colouring is preserved, and make the result of each line appear as the line completes.

**Outro.** The Forest Green Yuma title background, the name, the one action (typed), a closing line, the Yuma logo. The action is typed in a mono pill: keep the `$` prompt for a shell command, and set `CTA_PROMPT` to `›` or nothing for a date, a URL or a plain call to action.

## A worked example

The Akgents promo (`promo/` in the private `b12consulting/akgentic-quick-start` repository — ask for access) uses every pattern above across nine scenes, in both themes, and is the reference implementation to read when a pattern needs more detail than this page gives.
