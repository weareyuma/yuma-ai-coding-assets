---
name: revealjs
description: "Use this skill when creating or revising reveal.js HTML presentations. It owns the HTML scaffold, CDN setup, slide structure, reveal.js initialization, responsive behavior, and browser QA for single-file slide presentations."
---

# Reveal.js Skill

Use this skill for the technical mechanics of reveal.js presentations. It does not own presentation strategy, brand choices, visual language, or content quality.

## Output Contract

- Prefer a single `.html` file with embedded CSS and reveal.js loaded from a public CDN.
- Do not require `npm install`, local build tools, or a dev server to create the presentation unless the user explicitly asks for them. Browser verification is separate and may require installing Node, Playwright, and Chromium.
- Use direct HTML inside reveal.js sections for designed presentations. Use Markdown slides only when the user specifically asks for Markdown-driven slides.
- Keep all reveal.js CDN assets on the same major version. Avoid mixing core CSS, theme CSS, scripts, and plugins from different versions.
- Use relative paths for local images and assets so the HTML file can move with its asset folder.

## Verification Tooling

Playwright screenshots are the preferred verification path. Before verifying, run the dependency preflight from this skill directory:

```bash
node scripts/check-deps.mjs
```

The preflight checks whether these required tools are available:

- Node and npm or npx
- the `playwright` npm package resolvable from the workspace
- the Playwright-managed Chromium browser

If `node` itself is missing and the preflight cannot run, ask the user for permission to install Node first. If the preflight reports missing dependencies, ask the user for permission before installing them, then run the commands it suggests. Do not silently rely on a system Chrome, Chromium, or browser installed on the machine. Common commands after permission:

```bash
# If Node is missing on macOS and Homebrew is available
brew install node

# If the workspace has package.json
npm install --save-dev playwright

# If the workspace has no package.json and the user wants a temporary install
npm install --no-save playwright

# Install the Playwright-managed Chromium browser
npx playwright install chromium
```

If the user declines installation, use an available browser tool for interactive inspection. Use PDF export only as a secondary artifact or last-resort review path, and clearly report that it is not equivalent to live browser screenshot QA.

## Workflow

1. Create or revise the HTML file using the required scaffold below.
2. Check the file for leftover placeholder text and unresolved local asset paths.
3. Run the dependency preflight and install missing dependencies only after the user grants permission:

   ```bash
   node scripts/check-deps.mjs
   ```

4. Verify the browser-rendered presentation with Playwright screenshots:

   ```bash
   node scripts/verify.mjs path/to/presentation.html --out presentation-qa
   ```

5. Inspect the generated screenshots or contact sheet. Fix overflow, missing assets, console errors, unreadable text, and layout issues, then rerun the script.
6. Generate a PDF only when the user asks for a printable/export artifact or when a single review artifact is useful. Use the Playwright PDF script after the preflight passes:

   ```bash
   node scripts/export-pdf.mjs path/to/presentation.html presentation.pdf
   ```

If Playwright cannot be installed but a browser tool is available, use the browser tool: open the HTML file, navigate every slide, check for visual defects, and inspect console errors if possible. If neither Playwright nor a browser tool is available, explain that visual QA is blocked and ask how the user wants to proceed. PDF uses reveal.js `?print-pdf` mode and can differ from live presentation rendering, so never treat PDF alone as full visual QA unless the user accepts that limitation.

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
- Playwright screenshots have been captured and inspected, or the user accepted a clearly reported browser-tool or PDF-only fallback.
- Keyboard navigation works through every slide when an interactive browser is available.
- Text, images, and charts fit within slides at common desktop browser sizes.
- No placeholder copy remains.
- Local asset paths resolve correctly from the HTML file location.
- Any visual issues found during inspection have been fixed and rechecked.
