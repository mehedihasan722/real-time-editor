# Workspace audit — 2 October 2026

## Changes

- Added a three-slide home carousel with original SVG illustrations, slide entrance and floating animations, keyboard controls, reduced-motion support, and fixed heights within responsive container widths. Images stay inside their panel, away from the controls.
- Matched footer colors to shared light/dark theme tokens and added navigation icons. Restricted administration remains accessible through the role-aware main navigation rather than an unconditional footer link.
- Added mobile favourites, active route indicators and board search. Mobile dashboard pages use the full available width; task, requirements and weekly workspaces use dynamic viewport heights. Task headings and form controls wrap on small screens.
- Fixed cross-section board search and prevented stale debounce values from redirecting users after they leave search results.
- Added settings tab and command palette icons, favourites in the command palette, and a clear empty search result.
- Exposed existing AI provider setup and connection diagnostics in Settings. Removed misleading Hermes-specific labeling for general AI chat availability.
- Replaced fabricated unread notifications with truthful recent-board/loading/empty activity states.
- Preserved saved browser preferences during hydration and kept preferences usable when local storage is blocked.
- Disabled task writes for read-only collaborators, including mutation-level guards. Upcoming tasks now exclude today's tasks.

## Validation and limits

The production build, strict TypeScript check, lint and 126 unit checks pass. Browser checks cover board/admin actions, pagination, theme contrast, uploads, exports, offline fallback and canvas interactions. Carousel checks cover keyboard navigation, storage restrictions, loaded illustrations, fixed height and overflow at 320, 375, 768, 1024 and 1440 pixels in Chromium, WebKit and mobile emulation. Static internal link validation covers literal JSX links and navigation definitions; it does not assert that every external service or dynamic board ID is reachable.

Browser fixtures simulate authentication and collaborative state. Real simultaneous authenticated users, invitation delivery and external AI inference need configured service credentials and accounts. Gemini/Nano Banana, Grok and DeepSeek keys have not been supplied. No claim is made that every possible device or live external-service combination was tested. The existing Windows Firefox runtime limitation remains; Firefox coverage runs in CI.
