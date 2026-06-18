---
name: yuma-design-system
description: "Use this skill when creating or reviewing Yuma-branded visual assets. It owns the Yuma brand palette, typography, logo assets, and Y-symbol motif backgrounds."
license: MIT
metadata:
  author: b12consulting
  version: "1.0.0"
---

# Yuma Design System

This skill is the source of truth for Yuma brand decisions. Other skills may depend on it, but they should not duplicate or redefine the brand palette, typography, logo files, or Y-symbol background assets.

## Color Palette

Use only these colors for Yuma-branded assets unless the user explicitly provides an approved brand update.

| Color         | Hex       | RGB             | Role                                 |
| ------------- | --------- | --------------- | ------------------------------------ |
| Black         | `#000000` | `0, 0, 0`       | Primary text, dark assets            |
| White         | `#ffffff` | `255, 255, 255` | Light backgrounds, text on dark      |
| Off White     | `#f8f5f5` | `248, 245, 245` | Subtle light background              |
| Earth         | `#c4a892` | `196, 168, 146` | Warm neutral accent                  |
| Future Green  | `#21e467` | `33, 228, 103`  | Bright green brand accent            |
| Granular Grey | `#f0ece9` | `240, 236, 233` | Secondary surface and footer neutral |
| Forest Green  | `#005d46` | `0, 93, 70`     | Primary brand color                  |
| Purple        | `#6434da` | `100, 52, 218`  | Accent color                         |
| Pink          | `#eba9ff` | `235, 169, 255` | Closing and expressive accent        |

## Typography

Yuma uses two brand typefaces:

- **Headlines:** BogueSlab Thin. When BogueSlab is unavailable, use Merriweather as the closest Google Fonts substitute.
- **Body copy:** Inter. Use Inter Light for most text, with Inter Regular or Inter SemiBold for emphasis.

Fallbacks are only for environments where the brand fonts are unavailable:

- Headline fallback: Times New Roman
- Body fallback: Arial Regular

Headlines should feel light and expressive. Avoid bold headline styling unless an approved source asset already uses it.

## Logo Assets

Logo assets live in `references/`.

| Asset Pattern     | Use                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------- |
| `Yuma_logo_*`     | Primary Yuma logo with symbol and wordmark. Use in most branded layouts.              |
| `Yuma_Symbol_*`   | Standalone Yuma symbol. Use when the full logo is too large or when creating a motif. |
| `Yuma_Wordmark_*` | Wordmark only. Use when the symbol is already present elsewhere.                      |

Each logo family includes black and white variants. Use black variants on light backgrounds and white variants on dark backgrounds.

## Y-Symbol Backgrounds

The oversized Y-symbol motif is a signature Yuma background treatment. The symbol should be large, cropped by the canvas edge, and tone-on-tone or closely related to the background color.

Pre-generated backgrounds live in `references/`:

| File                         | Use                                                |
| ---------------------------- | -------------------------------------------------- |
| `yuma-bg-title-green.png`    | Forest Green background with bright Y on the right |
| `yuma-bg-section-green.png`  | Forest Green background with bright Y on the left  |
| `yuma-bg-content-subtle.png` | White background with subtle grey Y on the right   |
| `yuma-bg-closing-pink.png`   | Pink background with darker pink Y on the right    |

Use these assets directly rather than recreating the motif by hand.
Use these backgrounds for example in transition slides, title slides, or any layout where the Yuma brand should be strongly represented.
