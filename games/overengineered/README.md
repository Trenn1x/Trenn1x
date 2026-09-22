# Overengineered

A tiny Rube Goldberg inspired chain-reaction puzzle game by Thomas Verdier. Build a wonderfully unnecessary machine to ring a bell.

**Prototype v0.1.0:** eight designed puzzles, an unlimited-parts free-build mode, responsive touch controls, keyboard controls, synthesized sound, undo, hints, visible failure traces, and local completion progress.

## Play

Open `index.html` in a modern browser. No install, CDN, account, build tools, or internet required. On a phone, play through an HTML5 host such as itch.io.

1. Choose a part and tap an empty socket.
2. Tap a placed part again to rotate its arrow clockwise.
3. Press **Run machine**. Reach all brass checkpoints, then the bell.
4. Use the eraser to return a part, Undo to reverse an edit, or Hint when stuck.

Ramps and dominoes hand off one socket. Springs jump two sockets. Fans blow three sockets. Only the landing socket activates; skipped sockets and obstacles are flown over. Fixed parts cannot rotate. The start always moves one socket to the right.

This is a **deterministic grid-based mechanical relay puzzle**, not a continuous rigid-body physics simulator. The deliberately simplified rules make every result reproducible. All levels are immediately available, with no monetization or sign-in.

## Develop

Requires Node.js 18+ for the development commands only; the game itself uses ordinary browser JavaScript.

```sh
npm test
npm run dev
# Open http://localhost:4173
npm run build
```

`engine.js` contains the reusable engine and level definitions. `game.js` handles input, animation, audio, and progress. The tests verify all eight solutions and important failure rules. `build.cjs` copies the four required browser files to `dist/`. There are no dependencies to install.

## Publish on itch.io

Create a game project and choose **HTML** / playable in browser. Upload a ZIP containing `index.html`, `style.css`, `engine.js`, and `game.js` at its root. Mark the ZIP as playable in browser. Use a viewport of 1200 × 900, allow fullscreen, and enable mobile support. Choose free/no payments for this prototype. `ITCH_PAGE.md` contains page copy and suggested metadata.

## Privacy and accessibility

No analytics, network requests, ads, or personal data collection. Completion flags are stored in localStorage when available. Private browsing or clearing site data can remove progress. Sound starts off. Reduced-motion preferences shorten the marble animation and disable decorative animation. Every socket is a labeled button; Tab and Enter support placement and rotation. Z undoes. Space runs the machine when focus is outside a button; focused buttons use their native Space/Enter behavior. Escape stops a run.

## Next experiments

- Watch five people attempt the first three puzzles before expanding the scope.
- Explore a gravity-based free-placement mode as a distinct follow-up prototype.
- Add shareable sandbox layouts, more tactile domino animation, and richer sound.

Copyright © 2026 Thomas Verdier. All rights reserved. No third-party assets or runtime libraries are bundled.
