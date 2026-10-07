# Games and documentation

The Guide is a searchable help center with native keyboard-accessible disclosure sections, a topic index, shortcuts, and links to templates, settings, and games. The route remains `/guide`; there is no separate welcome site.

The Games library contains 22 solo mini-games. Every card has an SVG identity, category, mode, and an image captured from its actual game. Rebuild the committed PNG previews with `node scripts/create-game-covers.cjs` after changing game visuals. The script uses Playwright Chromium and esbuild, with a deterministic preview seed. Gameplay retains normal randomization.

Canvas games dynamically load Three.js. Keyboard actions apply only inside the focused game. Paused, hidden, and completed games stop requesting animation frames; returning to the game resumes without a large time jump. Touch controls release held keys on blur/cancel/capture loss. GPU failure provides a recoverable notice, and Restart creates a fresh engine. Puzzle timers and GPU resources are released on leaving the game.

Best scores stay on the current device and storage failures do not prevent play. WebGL availability and performance vary by device; the six puzzle games remain usable without a GPU. Use a supported Node 24 LTS runtime for development and CI with Nano ID 6. The merged TypeScript 7 and ESLint 10 upgrades were reconciled back to compatible majors because current Liveblocks types and React lint plugins fail their checks.
