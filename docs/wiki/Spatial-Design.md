# Spatial design and authentication

Flowboard uses original Blender assets, a navy/electric-blue visual system, and raised surfaces inspired by the owner's supplied motion references. The videos are reference material; their brands, screenshots, audio, and clips are not bundled into the website.

## Where the design appears

- Sign-in and sign-up: branded split layout, animated cloud studio, illuminated authentication panel, responsive mobile stacking, and styled Clerk forms.
- Home: cloud, task-board, and collaborative-studio scenes in the carousel.
- Templates, Settings, Admin, Guide, and Games: shared scene banners and page entrance effects.
- Board list and arcade: raised cards with mouse hover depth. Touch devices keep stable surfaces.
- SVG boards and Canvas 2D: depth on toolbars, headers, and floating controls. Drawing geometry and hit planes remain flat.
- Navigation, footers, and existing loading screens retain the shared layered style. Light/Dark/System preferences remain available; authentication artwork has its own dark palette.

## Account configuration and preview

Public sign-in/sign-up pages can display the design before Clerk and Convex setup. They show an account-configuration notice instead of collecting credentials. They render real Clerk widgets only when public configuration and the server Clerk key are available. The root provider also receives a server-side readiness boolean to avoid initializing a build-time Clerk placeholder in an unconfigured runtime.

This exception applies only to `/sign-in` and `/sign-up` and their subpaths. Protected pages, API routes, and Clerk proxy routes retain the existing fail-closed setup behavior. No authentication provider is replaced, and no credential form is implemented by Flowboard. Provider MFA, recovery, OAuth, invitations, and actual login require a configured Clerk instance and live verification.

## Asset lifecycle

`assets/blender/cloud.blend` is editable. `apps/web/public/models/cloud.glb` contains the exported animation clips and `cloud.png` provides a transparent poster. Rebuild through:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' --background --python scripts/create-cloud-scene.py
```

`SpatialScene` lazily loads the existing Three.js preview and exposes pause/play controls. System/app reduced-motion preferences freeze a representative frame. WebGL failures preserve posters; off-screen and hidden-tab scenes stop rendering. Animation mixers, materials, geometry, observers, pending fetches, and GPU resources are released on removal. Ambient CSS entrance effects are brief; hover depth applies only to fine pointers.

## Verification

Browser checks cover real unconfigured sign-in/sign-up routes at 320, 375, 768, and 1440 pixels, link navigation, configuration messaging, pause controls, and protected-page/API refusal. A mocked Clerk fixture checks keyboard access within the branded shell; it does not verify live authentication. Existing GLB checks validate exported animation channels, playback, reduced-motion still frames, and fallback behavior. Test actual GPUs, sustained performance, and configured Clerk forms before launch.

The optimized production build, TypeScript, ESLint, and 138 regression tests passed. The complete local Chromium/WebKit/mobile browser suite passed 107 checks, with one Windows WebKit GLB fixture skipped. The previous published revision also passed GitHub Quality; check the pushed revision's Actions result independently.
