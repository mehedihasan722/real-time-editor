# Spatial design and authentication

The workflow factory contains four walking collaborators carrying parcels with both hands, curved conveyors, loaded warehouse racks, trucks, a lifting forklift, a parcel drone and a delivery robot. Each worker's package and hands share a moving torso parent, with articulated knees and looped turns. The workflow camera uses orthographic projection and fits camera-space bounds at desktop/mobile widths. See [Workflow animation](Workflow-Animation) for the 316-frame reference study, motion differences and validation. Regenerate the `.blend`, GLB and PNG together using `scripts/create-workflow-factory.py`; the shared viewer retains pause, reduced-motion and off-screen handling.

Flowboard uses original Blender assets, a navy/electric-blue visual system, and raised surfaces inspired by the owner's supplied motion references. The videos are reference material; their brands, screenshots, audio, and clips are not bundled into the website.

## Where the design appears

- Sign-in and sign-up: branded split layout, animated cloud studio, illuminated authentication panel, responsive mobile stacking, and styled Clerk forms.
- Home: an expanding purple/blue/green carousel with original roadmap-rocket, task-card, and idea-bulb sculptures.
- Templates, Settings, Admin, Guide, and Games: shared scene banners and page entrance effects.
- Board list and arcade: raised cards with mouse hover depth. Touch devices keep stable surfaces.
- SVG boards and Canvas 2D: depth on toolbars, headers, and floating controls. Drawing geometry and hit planes remain flat.
- Navigation, footers, and existing loading screens retain the shared layered style. Light/Dark/System preferences remain available; authentication, provider controls, and route banners now follow the selected theme. Saturated carousel artwork retains white text over darker purple/blue/green backgrounds, with theme-aware navigation controls.

## Account configuration and preview

Public sign-in/sign-up pages can display the design before Clerk and Convex setup. They show an account-configuration notice instead of collecting credentials. They render real Clerk widgets only when public configuration and the server Clerk key are available. The root provider also receives a server-side readiness boolean to avoid initializing a build-time Clerk placeholder in an unconfigured runtime.

This exception applies only to `/sign-in` and `/sign-up` and their subpaths. Protected pages, API routes, and Clerk proxy routes retain the existing fail-closed setup behavior. No authentication provider is replaced, and no credential form is implemented by Flowboard. Provider MFA, recovery, OAuth, invitations, and actual login require a configured Clerk instance and live verification.

## Asset lifecycle

`assets/blender/cloud.blend` is editable. `apps/web/public/models/cloud.glb` contains the exported animation clips and `cloud.png` provides a transparent poster. Rebuild through:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' --background --python scripts/create-cloud-scene.py
```

`SpatialScene` lazily loads the existing Three.js preview and exposes pause/play controls. System/app reduced-motion preferences freeze a representative frame. WebGL failures preserve posters; off-screen and hidden-tab scenes stop rendering. Animation mixers, textures/image bitmaps, materials, geometry, observers, pending fetches, and GPU resources are released on removal. Ambient CSS entrance effects are brief; hover depth applies only to fine pointers.

## Verification

Browser checks cover real unconfigured sign-in/sign-up routes at 320, 375, 768, and 1440 pixels, link navigation, configuration messaging, pause controls, and protected-page/API refusal. A mocked Clerk fixture checks keyboard access within the branded shell; it does not verify live authentication. Existing GLB checks validate exported animation channels, playback, reduced-motion still frames, and fallback behavior. Test actual GPUs, sustained performance, and configured Clerk forms before launch.

The optimized production build, TypeScript, ESLint, and 138 regression tests passed. The complete local Chromium/WebKit/mobile browser suite passed 107 checks, with one Windows WebKit GLB fixture skipped. The previous published revision also passed GitHub Quality; check the pushed revision's Actions result independently.

## Expanding sculpture carousel

The home carousel follows the supplied product-carousel reference: three colored panels, prominent slide numbers, vertical collapsed titles, large sculptural artwork, and expanding selection. Flowboard uses original planning objects instead of the reference's guitars, performers, brands, and audio. Purple Roadmap, blue Focus, and green Create panels retain the existing template links.

Only the selected panel mounts a WebGL preview. Collapsed panels use decorative posters. Tab/Enter operates numbered selectors and collapsed panels; Previous/Next wraps selection. The active sculpture has its own Pause/Play button. There is no automatic slide advance. Reduced motion disables panel transitions and freezes the Blender animation. Each responsive layout holds the same height when changing slides, and narrow screens retain compact side tabs.

Rebuild all three editable scenes, exported animation clips, and transparent posters:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' --background --python scripts/create-carousel-models.py
```

Sources: `assets/blender/carousel-{roadmap,tasks,ideas}.blend`. Website assets: `apps/web/public/models/carousel-{roadmap,tasks,ideas}.{glb,png}`. The three models use local geometry and materials; no external textures or service accounts are required. Browser tests cover panel selection, wrapping, pause controls, asset availability, and layout at 320/375/768/1024/1440 pixels. GLB checks require exported animation channels.

## Community review section

The home page displays a device-framed community review section below the board list and above the footer. Search and favorites views omit the promotional sections. The reference's dark glass surfaces, lime accents, phone outline, neighboring cards, and light lower strip are expressed with CSS depth and manual slide transitions. Previous/Next and category selectors work with the keyboard. There is no auto-advance; reduced-motion settings remove slide transitions.

The owner approved clearly labeled sample cards. Section, reviewer, and card labels identify illustrative content; there are no fabricated customer identities, logos, aggregate ratings, or verified endorsements. Replace the three `reviews` records in `home-reviews.tsx` with approved customer content before presenting them as real testimonials, then revise the sample labels accordingly.

## Theme and model audit — 4 October 2026

Authentication uses shared CSS variables for Clerk surfaces, inputs, and text so theme changes propagate without remounting a sign-in form. Light-mode destructive actions and muted text now have stronger foreground/background separation. Browser contrast checks cover normal text at a minimum 4.5:1 on sampled workspace and authentication surfaces; they do not certify every rendered state or externally hosted Clerk screen.

The new carousel sculptures are retained after visual inspection. They are approximately 276–409 KiB and 13,096–18,024 triangles per GLB, with static posters for collapsed panels and failed WebGL. No higher-poly replacement is needed for these small hero previews. The shared renderer now also disposes textures and closes image bitmaps, and keeps camera aspect ratios positive when a host collapses to zero width. Live provider authentication and long-running performance on physical low-end devices remain launch checks.


## Workspace workflow factory

The separate welcome site has been removed. The workspace keeps the editorial footer and animated workflow section. The footer home link returns to the board library.

The pre-footer factory is original Blender artwork: planning dashboard, moving idea parcels, conveyor stations, template shelves, collaborators, and a dispatch cart. Rebuild with:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' --background --threads 2 --python scripts/create-workflow-factory.py
```

Commit `assets/blender/workflow.blend`, `apps/web/public/models/workflow.glb`, and `apps/web/public/models/workflow.png`. Shared `SpatialScene` mounts WebGL only near the viewport; the renderer preserves exported animation clips, explicit pause, reduced-motion still frames, hidden/off-screen pause, context-loss fallback, and resource disposal. The PNG remains available when GPU rendering fails.

Board-editing modals mount inside the authenticated provider. Protected pages and APIs continue to reject requests when service configuration is missing. The footer links to implemented workspace destinations and the repository; it does not offer a nonfunctional newsletter form.
