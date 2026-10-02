---
version: alpha
name: Yuma — Frame (video / frame layer)
description: >
  The Yuma brand at frame scale. Editorial, spacious and confident: a light serif at large sizes,
  quiet sans body, mono for small labels. Paper (off-white) and ink (near-black) grounds, Forest
  Green fields for statements and the outro, Future Green as the single glowing signal, pink
  reserved for people. Values mirror the yuma-design-system skill, which stays the source of truth.
unit: the frame — 1920×1080 primary; 9:16 and 1:1 by re-flowing, never by scaling
principle: one idea per frame · one colour glows · people are marked, never sidelined

colors:
  paper: "#f8f5f5"        # Off White — light ground
  paper-2: "#f0ece9"      # Granular Grey — secondary surface
  ink: "#06110d"          # dark ground (near-black, green-tinted); text on paper
  forest: "#005d46"       # Forest Green — statement and outro fields; accent text on paper
  signal: "#21e467"       # Future Green — the only colour that glows; fills and lines, never text on paper
  pink: "#eba9ff"         # people, on dark grounds
  pink-ink: "#b45fd0"     # people, on paper (pink is too faint there)
  purple: "#6434da"       # secondary accent on paper (strike-through, requests)
  earth: "#c4a892"        # warm neutral accent
  graphite: "#5d6a64"     # muted text and hairlines
  ash: "#9aa39f"          # muted text on dark
  alert: "#ff5d5d"        # failure states only

typography:
  # BogueSlab Thin is the brand headline face; Merriweather 300 is its open substitute.
  display-hero: { fontFamily: "Merriweather", cqw: 18, weight: 300, lineHeight: 0.98 }
  display:      { fontFamily: "Merriweather", cqw: 9, weight: 300, lineHeight: 1.02 }
  headline:     { fontFamily: "Merriweather", cqw: 5.6, weight: 300, lineHeight: 1.1 }
  caption:      { fontFamily: "Merriweather", cqw: 3.2, weight: 300, lineHeight: 1.3 }
  body:         { fontFamily: "Inter", cqw: 1.4, weight: 300, lineHeight: 1.5 }
  label:        { fontFamily: "JetBrains Mono", px: 22, weight: 400 }

spacing:
  frame-pad: "160px"       # left edge of every text block
  hairline: "2px"
  radius-card: "14px"

components:
  statement:
    typography: "{typography.display}"
    description: "A muted line is struck through by a {colors.signal} (dark) or {colors.purple} (paper) stroke; the replacement lands beneath with one word in the accent colour."
  slam:
    typography: "{typography.display-hero}"
    description: "A word arrives slightly oversize and settles in about 0.2 s, on the spoken word."
  actor:
    border: "2px solid {colors.paper} on dark / {colors.ink} on paper"
    rounded: "50%"
    typography: "{typography.caption} initials"
    description: "A person takes a thicker ring in {colors.pink} (dark) or {colors.pink-ink} (paper). People sit among the other actors."
  message:
    color: "{colors.signal} on dark / {colors.forest} on paper"
    description: "A dot travelling between two actors; its line exists only while it travels, then fades."
  spark:
    color: "{colors.signal}"
    description: "A bright point with a short tail: the one motif that may run through every frame (draws lines, strikes text, underlines the name)."
  card:
    backgroundColor: "#ffffff on paper / rgba(255,255,255,.05) on dark"
    rounded: "{spacing.radius-card}"
    shadow: "soft, on paper only"
  outro:
    backgroundColor: "{colors.forest} with the Yuma title background (yuma-design-system: yuma-bg-title-green.png)"
    description: "Name, the one action to take, the white Yuma logo. Dark in every theme."
---

# Yuma — Frame

## Overview

Yuma video frames read like an editorial spread: large light-serif type, generous empty space, strong left alignment, few elements. Effects are restrained; rhythm comes from alternating grounds.

## The Frame

- Text starts at the left pad (160 px at 1920). Centre only a logo or a single closing line.
- One idea per frame. A caption is one short sentence.
- Keep text at 22 px or larger at 1920×1080.

## Colors

- Alternate grounds for rhythm: ink → paper → ink, with a Forest Green field for the key statement and the outro.
- Only `signal` glows (a soft bloom on dark grounds). Type never glows.
- On paper, `signal` is unreadable as text: use `forest` for accent words and keep `signal` for fills.
- `pink` means people. Do not use it for anything else in a frame where people appear.
- Pink and earth are faint on paper as thin lines: draw them thicker and fully opaque.

## Typography

- Headlines are light (300). Never bold a headline.
- Mono is for small labels and anything typed (a command, a URL).

## Composition Rules

- Open and close with the same device (the struck-through statement).
- Real screenshots stay real: show them as cards with a soft shadow on paper.
- Code panels and terminals stay dark on any ground.
- No corner labels, figure numbers or decorative chrome.

## Numerals & Claims (hard rule)

Use no figure that is not a real, sourced one. Say only what the subject does today.

## Pre-Render Self-Audit

- Is there exactly one idea in each frame, and one glowing colour?
- Are people drawn among the other elements and marked consistently?
- Does every on-screen word that is spoken appear when it is spoken?
- Is the outro on Forest Green with the white Yuma logo?
