---
name: revealjs
description: "Use this skill when creating or revising reveal.js HTML presentations. It owns the HTML scaffold, CDN setup, slide structure, reveal.js initialization, responsive behavior, and browser QA for single-file slide presentations."
---

# Reveal.js Skill

Use this skill for the technical mechanics of reveal.js presentations. It does not own presentation strategy, brand choices, visual language, or content quality.

## Output Contract

- Prefer a single `.html` file with embedded CSS and reveal.js loaded from a public CDN.
- Do not require `npm install`, local build tools, or a dev server unless the user explicitly asks for them.
- Use direct HTML inside reveal.js sections for designed presentations. Use Markdown slides only when the user specifically asks for Markdown-driven slides.
- Keep all reveal.js CDN assets on the same major version. Avoid mixing core CSS, theme CSS, scripts, and plugins from different versions.
- Use relative paths for local images and assets so the HTML file can move with its asset folder.

## Required Scaffold

Every reveal.js presentation should include this structure:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Presentation Title</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reset.css"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.css"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/white.css"
    />
    <style>
      /* Presentation styles go here. */
    </style>
  </head>
  <body>
    <div class="reveal">
      <div class="slides">
        <section>
          <h1>Presentation Title</h1>
        </section>
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.js"></script>
    <script>
      Reveal.initialize({
        hash: true,
        controls: true,
        progress: true,
        center: false,
        width: 1600,
        height: 900,
        margin: 0.04,
      });
    </script>
  </body>
</html>
```

## Slide Structure

- Place all slides inside `.reveal > .slides`.
- Use one top-level `<section>` per horizontal slide.
- Use nested `<section>` elements only when vertical navigation genuinely helps the presentation flow.
- Use semantic HTML inside slides: headings, paragraphs, lists, figures, tables, and diagrams where appropriate.
- Keep slide content concise enough to fit without relying on tiny text.

## Styling Guidance

- Treat each slide as a 16:9 canvas and design with stable dimensions, spacing, and typographic hierarchy.
- Prefer CSS classes for repeated slide types instead of inline styles on every element.
- Set `box-sizing: border-box` globally.
- Avoid styles that fight reveal.js scaling, such as fixed viewport-sized wrappers inside every slide.
- Use `center: false` when designing custom slide layouts so CSS controls vertical rhythm.
- Keep theme CSS as a base only; override it with presentation-specific CSS as needed.

## Optional Features

- Use fragments only when progressive disclosure improves the live presentation. Avoid fragmenting every bullet by default.
- Use speaker notes only when requested or clearly useful. If notes are used, include the notes plugin from the same reveal.js CDN version and initialize it.
- Use reveal.js plugins sparingly and only when they serve the presentation: notes, search, highlight, or zoom.
- If plugin scripts are added, include them after reveal.js and before `Reveal.initialize()`.

## Browser QA

A reveal.js presentation is not done until:

- The HTML file opens in a browser and `Reveal.initialize()` runs without console errors.
- Keyboard navigation works through every slide.
- Text, images, and charts fit within slides at common desktop browser sizes.
- No placeholder copy remains.
- Local asset paths resolve correctly from the HTML file location.
- Any visual issues found during inspection have been fixed and rechecked.
