# Production notes

Lessons from building Yuma videos with HyperFrames. HyperFrames' own skills remain the reference for how the framework works; these notes cover what tripped us up. They were written against HyperFrames 0.8.111: check that they still hold on a newer version.

## Lay words out in flowing text

Put the words of a line in `<span>`s inside one line element and animate each span, instead of giving each word its own absolute position. Hard-coded positions depend on font metrics you cannot measure reliably at build time, and words end up overlapping or running together ("Humanreplacement."). `npx hyperframes check` catches these overlaps: run it before looking at frames.

When two lines are stacked on purpose (a two-line headline with tight leading), mark the line elements with `data-layout-allow-overlap` so the layout audit does not flag them.

## One file or sub-compositions

HyperFrames recommends one sub-composition per scene. A single `index.html` with one clip per scene and one timeline also renders correctly; lint only warns (`timeline_track_too_dense`, `nested_structure_needs_subcomposition`). Prefer sub-compositions for a new video, since they give a readable Studio timeline. A single file is acceptable for a quick rebuild.

Keep one root `index.html` in the project folder. A second HTML file with a `data-composition-id` at the root (a template, a backup) is a lint error.

## Porting an existing time-driven page

A page whose frames are already a pure function of time (`renderAt(t)`) can be brought into HyperFrames without rewriting its animation: register one paused timeline whose only tween moves a clock object from 0 to the duration and calls the page's render function on update.

```js
const tl = gsap.timeline({ paused: true });
const clock = { t: 0 };
tl.fromTo(clock, { t: 0 }, { t: DURATION, duration: DURATION, ease: "none", onUpdate: () => renderAt(clock.t) }, 0);
renderAt(0);
window.__timelines["main"] = tl;
```

Wrap the page in one clip that lasts the whole duration, make the fonts local, declare the audio as `<audio>` tags, and turn URL switches (a theme, a language) into composition variables read with `window.__hyperframes.getVariables()`, rendered with `--variables '{"theme":"light"}'`.

This is a port: Studio shows one long clip, and the layout audit may report findings that come from the original design. Say so when delivering. For a new video, author the scenes natively instead.

## Resolution and file size

- `--resolution 4k` renders the 1920×1080 layout at twice the density. A two-minute video takes about four minutes.
- The default 4K encode is large (well over 100 MB for two minutes), above GitHub's file limit. Re-compress before committing, keeping the audio as it is:

  ```bash
  ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -c:a copy -movflags +faststart out.mp4
  ```

  Look at a full-resolution crop afterwards to confirm text is still clean.

## Motion blur and grain

- The CLI has no motion-blur flag. The engine supports real sub-frame motion blur through the producer API (`motionBlur` on the render configuration). It multiplies render time by the number of samples (a one-minute video at 60 fps with 8 samples takes about 25 minutes), and our one attempt crashed mid-capture. Treat it as experimental; do not promise it.
- For a selected fast move, HyperFrames has a per-element `motion-blur` registry component and a `motion-blur-streak` rule; neither has been tried on a Yuma video yet.
- A full-frame SVG noise filter as film grain forces the slower `screenshot` capture path. Prefer the registry's `grain-overlay` component, and confirm on a rendered frame that the grain is visible.
- A render without blur or grain is the default and is acceptable: cuts on the beat and word-synced type carry the rhythm.

## Audio levels

`data-volume` on the music track sets the bed's level and the carve ducks it under the voice. A music volume around 0.5 with a carve strength of 0.8 gave about −16.5 LUFS overall with the bed clearly audible between lines. Measure the finished file rather than trusting the numbers: overall loudness, the level in a gap between lines, and the last second of the video.

## Things the documentation got wrong

- `executeRenderJob` takes `(job, projectDir, outputPath, onProgress)`, not the `(job, onProgress)` shown in the producer README.
- `hyperframes init` installs the HyperFrames skills into the user's global agent folders and announces anonymous telemetry on first run (`npx hyperframes telemetry disable` turns it off). Tell the user about both.
