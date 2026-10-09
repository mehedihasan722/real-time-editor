# Workflow animation study and rebuild

The pre-footer warehouse is an original, editable Flowboard Blender scene based on the supplied logistics animation's composition and motion style. It remains inside the authenticated workspace. It does not embed the reference video or its branding.

## Reference study

The supplied MP4 is 4000 × 3000, 30 fps, approximately 13.17 seconds. Extraction at 24 fps produces 316 PNG images. Frame N represents `(N - 1) / 24` seconds. All 316 were visually reviewed in twenty numbered contact sheets, including the final partial sheet. Resampling selects frames from the original; it does not invent intermediate motion.

The full-resolution frames and CRC-verified ZIP are local study deliverables under `.local-tools`, not repository assets or website downloads. The ZIP is approximately 3.35 GB.

| Element | Observation across the reference frames | Flowboard implementation |
| --- | --- | --- |
| Camera | Fixed elevated isometric view; no orbit | Orthographic camera, responsive framing |
| Workers | Orange safety clothing, blue overalls, bent elbows supporting cartons; walking, leaning and handling motions | Four staggered carrying routes, articulated hips/knees, level boots, body lean, hands and cartons sharing a torso parent |
| Conveyors | Cartons move continuously through rounded bends and warm illuminated tunnels | Arc-length sampled closed route with eight labeled cartons and three scanners |
| Trucks | Both large trucks stay parked in this particular clip | Detailed parked white truck plus a slow orange dispatch maneuver requested by the user |
| Forklift | Warehouse loading equipment is largely stationary | Parked chassis with a lifting loaded carriage |
| Drone | Hovering parcel carrier with subtle drift and turning propellers | Suspended carton, tethers, phased hover and looped rotors |
| Small robot | Loaded low vehicle travels in the foreground | Separate oval delivery route with attached load |
| Dashboard | White panels against a tall dark wall, orange/blue animated indicators | Flowboard charts, state cards and changing bars |
| Environment | Dense open racks, boxes, drums, pallets, trolleys and soft contact shadows | Modeled warehouse props, loading apron, raised floor and stairs |

The original rig and keyframes cannot be recovered from a rendered video. These are procedural approximations of the observed motions. Workers keep carrying their cartons throughout the loop; this version does not simulate independent pickup/release or transfer between workers. Trucks moving is a deliberate addition, not a claim about the reference.

## Animation and assets

The master loop is 12 seconds at 24 fps, Blender frames 0–288 inclusive (the last pose closes the loop). Worker phases are staggered. Each half-cycle turns while stopped, traverses its route, then leans at the station. Cartons and hands share the same moving torso frame so loads cannot drift away during turns. Conveyor positions use distance along the route rather than uniform point indices, avoiding speed changes at bends. Wheel spins use a fixed axle parent; the forklift load belongs to its carriage.

Rebuild from the repository root:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' --background --threads 4 --python scripts/create-workflow-factory.py
```

Commit these together:

- `scripts/create-workflow-factory.py`: geometry and animation source
- `assets/blender/workflow.blend`: editable scene before static-mesh batching
- `apps/web/public/models/workflow.glb`: web export with animation
- `apps/web/public/models/workflow.png`: frame 48 / two-second still

`SpatialScene` and the shared preview retain pause controls, reduced-motion stills, off-screen/document-hidden suspension, WebGL failure posters, and mixer/geometry/material/texture cleanup. Only the workflow uses the new orthographic camera; other scenes retain their existing framing. This change does not relax route or API authorization.

## Validation

`apps/web/tests/workflow-animation.test.cjs` loads the real GLB, samples all 289 timeline frames, checks finite transforms and unchanged local grasps, verifies loop continuity and vehicle/carriage/drone/robot motion. `apps/web/e2e/blender-models.spec.ts` exercises actual rendering, animated frames, reduced motion, poster fallback and GPU cleanup. Visual checks remain necessary for composition, intersections and perceived quality; transform tests alone do not establish visual equivalence to the reference.
