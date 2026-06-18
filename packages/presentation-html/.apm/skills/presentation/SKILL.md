---
name: presentation
description: "Use this skill to create or revise reveal.js HTML presentations in the Yuma style."
---

# Presentation Skill

Use this skill for end-to-end Yuma HTML presentation work: structuring the story, choosing slide types, composing a coherent slide sequence, and implementing a polished reveal.js file that follows the Yuma design system.

## Dependency Boundary

This skill depends on one packaged skill and one browser dependency:

- `yuma-design-system` owns the brand palette, typography, logos, and Y-symbol motif backgrounds.
- reveal.js should be loaded from a public CDN in the generated HTML file. Do not require a local package install unless the user explicitly asks for it.

When creating a presentation, load and follow `yuma-design-system`.

## Workflow

1. Establish the presentation goal, audience, source material, required output filename, and any constraints from the user.
2. Use `yuma-design-system` for all brand choices and asset references.
3. Build a slide plan before implementation: title, agenda if useful, section flow, content slides, evidence/data slides, and closing.
4. Create the HTML file, open or render it for inspection, fix issues, and verify again.

## Yuma Presentation Structure

Prefer a restrained editorial rhythm:

- Title slide using the Yuma title background.
- Optional agenda slide for presentations with three or more sections.
- Section dividers when the presentation has meaningful chapters.
- Content slides that use whitespace, hierarchy, and varied layouts rather than repeated bullet pages.
- Statement or quote slides for sharp narrative turns.
- Chart or evidence slides where data needs to be compared.
- Closing slide using the Yuma closing background.

For most presentations, use a dark/light/accent rhythm: branded title, clean white content slides, and a pink closing slide.

## Slide Composition Guidance

Use these patterns as presentation-level starting points. Apply exact colors, fonts, logos, and backgrounds from `yuma-design-system`.

Executives and senior leaders may read only slide titles and skip the body. Every slide title must state the core actionable insight the audience should take away, not just name the topic. Prefer titles like "Retention risk is concentrated in the first 30 days" over "Retention analysis".

Yuma presentations should feel editorial, spacious, and confident. Use strong left alignment, large expressive headlines, quiet body text, and generous negative space. Let the oversized Y-symbol motif appear as a branded background gesture on major moments, but do not force it onto every slide. The visual rhythm should suggest the Yuma template without mechanically copying any single example.

### Title / Cover

- Use the Yuma title background.
- Keep the title large, left-aligned, and placed in the open area of the background.
- Include author, date, or context only when useful.

### Agenda

- Use only when it helps the audience follow the presentation.
- Prefer a designed sequence over a plain bullet list.
- Use zero-padded numbers for section labels.

### Section Divider

- Use to mark a real change in topic, not as filler.
- Pair a short section title with a concise setup line.
- Keep the layout sparse.

### Content Slide

- Lead with one clear, actionable message in the title.
- Use bullets sparingly; turn dense material into grouped claims, comparisons, steps, or annotated visuals.
- Leave enough negative space for the Yuma style to feel calm and deliberate.

### Two-Column / Comparison

- Use for before/after, tradeoffs, roles, risks, or opposing ideas.
- Keep column widths and baselines consistent.
- Avoid making both columns equally dense if one side is the key takeaway.

### Content + Image

- Use images only when they clarify the point or add concrete context.
- Crop and size images deliberately; avoid generic decorative imagery.
- Balance image weight against the text block.

### Statement / Quote

- Use for a memorable conclusion, framing insight, or transition.
- Keep copy short enough to read at a glance.
- Let the background and whitespace carry the emphasis.

### Chart / Evidence

- Put the takeaway in the title.
- Simplify chart labels and remove decorative chart furniture.
- Use Yuma palette colors from `yuma-design-system`.

### Closing

- Use the Yuma closing background.
- Include only the closing message and necessary contact details.

## Presentation-Specific Rules

- Use a standard widescreen presentation format.
- Output a single `.html` file unless the user asks for a different structure.
- Load reveal.js CSS and JavaScript from a CDN, and initialize reveal.js at the end of the document.
- Keep the presentation usable by opening the HTML file directly in a browser when possible.
- Keep layouts flat, clean, and left-aligned by default.
- Vary layouts across the presentation: do not repeat the same title-plus-bullets structure.
- Use content slides for substance and Y-symbol backgrounds for title, divider, statement, or closing moments.
- Include visual evidence where appropriate: charts, screenshots, product images, diagrams, or simple structured layouts.
- Avoid decorative lines, shadows, gradients, generic palettes, and text-only filler slides.
- Use semantic HTML and readable CSS. Keep slide content in reveal.js `<section>` elements and keep supporting styles organized in the document head or a nearby stylesheet if the user requested multiple files.
- Make slides responsive enough that text remains legible and does not overlap at common browser window sizes.

## Completion Criteria

A Yuma presentation is not done until:

- The presentation follows `yuma-design-system` brand guidance.
- The HTML file uses reveal.js from a CDN and initializes successfully.
- A content check catches no missing or leftover placeholder text.
- The rendered presentation has been visually inspected in a browser or browser screenshot.
- Any visual issues found during inspection have been fixed and rechecked.
