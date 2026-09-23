# The Ceremony · Decisio Year in Review

Direction D of the Decisio Year in Review: a six-chapter, black-tie awards night for a year of taste. Midnight ground, gold foil, spotlight glows.

It's a static web prototype built from the Paper artboards `D1–D6` (file "Week in Review").

## Chapters

| # | Chapter | The beat |
|---|---------|----------|
| 00 | Cover | Curtain rise: letters track in, the year rises digit by digit, foil catches the light |
| 01 | The Numbers | Odometer spins to **412**, lands with a sparkle; stats count up |
| 02 | Your #1 | A face-down "No. 1" card hovers, flips to the poster, and **10/10** stamps in |
| 03 | Your Worlds | The bars race; the winner glints |
| 04 | Your Persona | Orbit draws itself, rays open, the name is revealed, confetti cannons fire |
| 05 | Wrapped | The share card flies in from the dark with a holographic sweep and pointer tilt |

## Controls

- Tap the right side, swipe, or press <kbd>→</kbd>/<kbd>Space</kbd> to go forward. Tap the left third or press <kbd>←</kbd> to go back.
- <kbd>1</kbd>–<kbd>6</kbd> jump to a chapter, and <kbd>R</kbd> replays the show. Deep links work too: `#4` opens the persona.
- `prefers-reduced-motion` is respected: chapters appear without the choreography or confetti.

## Run locally

```bash
python3 -m http.server 4173
```

## Stack

It's plain HTML, CSS, and JS, with no build step. The motion runs on [GSAP](https://gsap.com) 3.13 (core, SplitText, CustomEase), vendored in `vendor/`. Confetti and gold dust are drawn on a small canvas particle system in `app.js`.

For debugging from the console, `ceremony.go(4); ceremony.seek(2.5)` freezes any chapter at any moment.
