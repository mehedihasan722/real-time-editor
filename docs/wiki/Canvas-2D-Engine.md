# Canvas 2D engine

Open a board and choose **Canvas 2D** in its header. `/board/<boardId>/engine` is a separate vector workspace on the same board. Existing SVG diagrams, templates and workspace editors remain available on the original board route; their objects are not silently converted into the new representation.

## Data and synchronization

`convex/vector.ts` exposes a reactive, indexed, paginated `getBoardLayers` query and transactional `commitLayers` mutation. Both derive the active organization from a verified Clerk JWT and compare it with the stored board organization. Guests may query, but cannot commit. `board.createBoard` and the existing `board.create` share the same authorized implementation and record creator/timestamps.

`canvas_layers` stores one vector per document with a stable layer ID, geometry, RGBA colors, stroke width, numeric stacking order, text, local path points, version and deletion flag. Indexes support board pagination and board/layer lookup. Query pages are capped at 50; commits contain at most 100 unique layers. A stale expected version rejects the whole transaction rather than overwriting a collaborator's accepted work. New board timestamp/counter fields are optional in the schema for compatibility with existing documents; all new boards populate them. Older empty vector workspaces initialize counters on their first commit. An existing vector workspace lacking counters fails closed and requires migration.

The dedicated `vector:<boardId>` Liveblocks room contains `layers: LiveMap<string, LiveObject<VectorLayer>>`. Its typed presence carries cursor, selection and active drag IDs. Room authorization verifies the underlying board, and board deletion schedules bounded layer cleanup and deletion of both Liveblocks rooms. Convex is the durable source of truth; Liveblocks provides CRDT storage previews and ephemeral presence. A completed gesture or property edit commits to Convex, then publishes its accepted version to Liveblocks. Late responses cannot overwrite newer versions. Reactive snapshots repair abandoned previews after a peer disconnects. Active peer drags are excluded from snapshot repair until the gesture ends.

Drag previews send only x/y coordinates. Durable movement commits also send position patches, so moving a dense path does not repeatedly retransmit its points or text. Creation and property edits validate the full shape document.

Changes to committed CRDT versions trigger snapshot reconciliation even when an older acknowledgement arrives after a newer one. Unknown abandoned previews are swept after a five-second grace period, excluding active peer drags and local pending commits.

Deletion tombstones preserve version checks and prevent stale edits from resurrecting deleted layers. Boards permit 5,000 active layers and 20,000 total records including tombstones. Paths are limited to 2,048 points and text to 4,096 characters. These explicit ceilings protect query, document, transport and rendering budgets. Start another board when its history ceiling is reached.

## Rendering and interaction

`CanvasWorkspace.tsx` owns a CSS-pixel camera in refs and one animation frame loop. Device pixel ratio affects the backing store, not input coordinates. The canvas is limited to a 16-million-pixel backing store. The renderer redraws only when scene, camera, theme, selection, draft or presence changes; offscreen objects are rejected before drawing. Z-order ties resolve by layer ID. Cursor and drag updates are coalesced and sent at most once every 30 milliseconds.

`screenToCanvas` applies the inverse camera transform. `zoomAt` retains the world coordinate under the cursor while clamping zoom to 0.1–8. Pointer capture keeps drags reliable outside the element. Space + drag or middle-button drag pans. V/R/O/N/T/P select tools; Delete/Backspace deletes up to 100 selected objects. Page Up/Down selects layers without a mouse. Keyboard handlers exclude form controls and act only within the workspace. Wheel deltas normalize pixel, line and page units.

Freehand previews keep bounded raw points without repeatedly simplifying them inside the animation loop. On commit, iterative Douglas–Peucker simplification retains meaningful vertices. Optional rectangle recognition checks closure and agreement with all four bounding edges. Paths remain movable and their stroke is editable. Rectangle, ellipse, sticky and text layers have contextual dimension controls. Sticky text selects a contrasting foreground from its composited fill.

The Pan tool (H) also supports touch panning. Enter creates a rectangle, ellipse, sticky or text layer at the viewport center when that tool is active. Arrow keys move selected objects by one world unit; Shift increases the step to ten. These controls complement pointer drawing and the keyboard-accessible property panel.

Resize observers, native event listeners and animation frames are removed on unmount; the backing store is released. Interrupted drags restore the last accepted state. While disconnected, existing content remains visible and panning/selection work, but durable edits are paused. Pending saves trigger a browser unload warning. This engine does not promise durable offline editing.

## Verification

Regression tests cover pivot-preserving zoom, simplification, shape hit testing, 5,000-object culling, organization isolation, guest denial, bounded pagination, version conflicts, tombstones/counters and invalid inputs. Browser tests inspect actual Canvas 2D pixels at DPR 2 in both themes. The live multi-user engine test requires dedicated Clerk storage states configured for the live test suite. A representative device/board benchmark is still required before advertising a 60 FPS service-level guarantee.
