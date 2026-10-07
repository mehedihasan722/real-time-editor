# Repository workflow

- For every completed change, update GitHub with a gitmoji-prefixed commit and PR title. Push the working branch after the relevant checks pass; do not merge or deploy unless the user requests it.
- Maintain the relevant GitHub issue with the problem, result, validation, and remaining work. Link issues and PRs without closing unresolved launch requirements.
- Update CHANGELOG.md and affected docs/wiki pages when behavior or operations change, and publish maintained Wiki pages when authenticated access is available.
- Keep AGENTS.md instructions current when development procedures change. Preserve the generated Next.js rules in apps/web/AGENTS.md.
- Check the Actions results for the pushed revision. Fix failures caused by the change and report queued or external failures accurately.
- Add relevant issues and PRs to the configured GitHub Project when access permits. Use the existing project-sync workflow; report missing PROJECT_URL or Projects permission instead of inventing a project.
- Never print credentials or commit local environment files. If any GitHub surface cannot be updated, finish the accessible updates and report the exact limitation.
- Optional cloud services use server-side REST calls with Clerk/Convex board authorization; preserve tenant namespaces and fail-closed Upstash limits. Keep PostHog consent explicit and workspace content out of telemetry.
- Rebuild website 3D assets through scripts/create-workspace-models.py with Blender. Commit editable .blend sources, GLB assets, and fallback PNGs; preserve reduced-motion, off-screen pause, and GPU cleanup behavior.
- Rebuild the animated isometric home studio with scripts/create-workspace-studio.py. Preserve exported Blender animation clips, a reduced-motion still frame, and mixer cleanup in the shared preview.
- Rebuild the blue cloud scene with scripts/create-cloud-scene.py. Use shared SpatialScene for public/authentication and dashboard artwork, preserve pause controls and reduced motion, and keep 3D transforms off editable canvas hit planes. Authentication previews may render before setup; protected pages and APIs must keep failing closed.
- Rebuild the expanding home carousel sculptures with scripts/create-carousel-models.py. Keep one active WebGL scene, static posters in collapsed panels, keyboard panel selection, fixed responsive height, and explicit scene pause controls.

- Rebuild the pre-footer workflow factory with `scripts/create-workflow-factory.py`; commit `assets/blender/workflow.blend` and its GLB/PNG exports. Keep the workflow inside the workspace; protected routes and APIs must remain fail-closed.

- Rebuild game-library screenshots with `node scripts/create-game-covers.cjs`. They must depict actual game engines; keep games keyboard/touch accessible, and verify pause, restart, context-loss recovery, and disposal before merging.
