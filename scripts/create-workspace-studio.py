"""Original isometric Flowboard studio with an eight-second Blender animation.
blender --background --python scripts/create-workspace-studio.py
"""
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.frame_start, scene.frame_end, scene.render.fps = 1, 193, 24

def mat(name, color, metal=0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = .42
    shader.inputs["Metallic"].default_value = metal
    return material

palette = {name: mat(name, color) for name, color in {
    "cream": (.91,.92,.97), "white": (.99,.99,1), "ink": (.065,.08,.16),
    "violet": (.35,.18,.85), "lavender": (.71,.62,.96), "blue": (.13,.43,.95),
    "coral": (1,.36,.15), "yellow": (1,.74,.19), "mint": (.16,.77,.61),
    "skin": (.70,.40,.25), "light_skin": (.98,.68,.46), "steel": (.37,.43,.57),
}.items()}

def cube(name, pos, size, color, bevel=.06, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(palette[color])
    edge = obj.modifiers.new("Rounded silhouette", "BEVEL")
    edge.width, edge.segments = bevel, 3
    bpy.ops.object.modifier_apply(modifier=edge.name)
    obj.modifiers.new("Surface normals", "WEIGHTED_NORMAL")
    bpy.ops.object.modifier_apply(modifier="Surface normals")
    if parent: obj.parent = parent
    return obj

def sphere(name, pos, radius, color, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=radius, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(palette[color])
    for face in obj.data.polygons: face.use_smooth = True
    if parent: obj.parent = parent
    return obj

def cylinder(name, pos, radius, depth, color):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=radius, depth=depth, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(palette[color])
    edge = obj.modifiers.new("Soft rim", "BEVEL")
    edge.width, edge.segments = .035, 2
    bpy.ops.object.modifier_apply(modifier=edge.name)
    obj.modifiers.new("Surface normals", "WEIGHTED_NORMAL")
    bpy.ops.object.modifier_apply(modifier="Surface normals")
    return obj

def wire(name, points, color, thickness=.035):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions, curve.bevel_depth, curve.bevel_resolution = "3D", thickness, 2
    path = curve.splines.new("POLY")
    path.points.add(len(points)-1)
    for vertex, pos in zip(path.points, points): vertex.co = (*pos,1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(palette[color])
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)

def text(value, pos, size, color):
    bpy.ops.object.text_add(location=pos, rotation=(math.pi/2,0,0))
    obj = bpy.context.object
    obj.name = value
    obj.data.body, obj.data.size, obj.data.extrude = value, size, .003
    obj.data.materials.append(palette[color])
    bpy.ops.object.convert(target="MESH")

def animate(obj, values, property="location"):
    for frame, value in values:
        setattr(obj, property, value)
        obj.keyframe_insert(data_path=property, frame=frame)

# A layered stage, with a collaborative dashboard as the visual anchor.
cube("Studio foundation", (0,0,-.30), (9,6.6,.45), "violet", .24)
cube("Porcelain stage", (0,0,-.04), (8.85,6.45,.14), "cream", .22)
cube("Dashboard housing", (-.9,1.95,2.4), (5.4,.25,3.15), "ink", .16)
cube("Dashboard surface", (-.9,1.79,2.4), (5.06,.04,2.85), "white", .08)
cube("Dashboard header", (-.9,1.75,3.6), (4.85,.025,.37), "violet", .035)
text("FLOWBOARD", (-3.12,1.71,3.50), .23, "white")
text("WORK IN MOTION", (-2.95,1.72,3.05), .13, "ink")
for x in (-2.4,.55):
    cube("Monitor support", (x,1.95,.54), (.18,.24,1), "steel")
    cube("Monitor foot", (x,1.82,.08), (.78,.65,.13), "ink")
# Graph panel and animated bars.
cube("Chart panel", (-1.68,1.74,2.27), (2.75,.026,1.18), "cream", .04)
for row in range(4):
    cube("Chart grid", (-1.68,1.705,1.85+row*.25), (2.5,.018,.013), "white", .004)
points = [(-2.8,1.67,1.96),(-2.3,1.67,2.14),(-1.85,1.67,2.07),(-1.4,1.67,2.43),(-.9,1.67,2.37),(-.55,1.67,2.69)]
wire("Progress curve", points, "violet", .025)
for pos in points: sphere("Graph node", pos, .055, "coral")
for i in range(4):
    x, height = .05+i*.32, .30+i*.17
    bar = cube("Animated progress bar", (x,1.71,1.85+height/2), (.21,.04,height), ("blue","lavender","mint","coral")[i], .02)
    animate(bar, [(1,(1,1,1)),(49,(1,1,.60)),(97,(1,1,1.08)),(145,(1,1,.82)),(193,(1,1,1))], "scale")
for i, color in enumerate(("mint","coral","blue")):
    cube("Metric badge", (-2.35+i*1.62,1.72,1.30), (1.30,.05,.36), color, .04)
    text(("IDEAS", "IN PROGRESS", "DELIVERED")[i], (-2.85+i*1.62,1.675,1.25), .11, "white")

# A continuous workflow lane with individually animated cards.
cube("Workflow belt", (-.25,-.80,.25), (6.9,1.20,.33), "ink", .13)
for x in (-3.75,3.25):
    cylinder("Belt end drum", (x,-.80,.25), .60,.33,"steel")
    cube("Lane gate", (x,-.8,.94), (.10,1.45,1.2), "lavender", .025)
    cube("Gate top", (x,-.8,1.55), (.30,1.65,.18), "violet")
for i in range(22):
    cube("Belt stripe", (-3.35+i*.29,-.8,.43), (.035,1.01,.02), "steel", .005)
for i, color in enumerate(("yellow","coral","mint","lavender")):
    root = bpy.data.objects.new(f"Moving task {i}", None)
    bpy.context.collection.objects.link(root)
    cube("Task parcel", (0,0,0), (.70,.68,.13), color, .06, root)
    for row in range(3):
        cube("Task text", (0,.17-row*.14,.08), (.42-row*.05,.035,.012), "ink", .008, root)
    # Invisible reset at the gates makes a seamless eight-second loop.
    for frame in range(1,194,4):
        phase = ((frame-1)/192+i/4)%1
        root.location = (-3.4+6.4*phase,-.8,.60+.06*math.sin(phase*math.pi*2))
        root.scale = (1,1,1) if .04 < phase < .96 else (0,0,0)
        root.keyframe_insert(data_path="location",frame=frame)
        root.keyframe_insert(data_path="scale",frame=frame)
    root.location = (-3.4+6.4*(i/4),-.8,.60+.06*math.sin(i/4*math.pi*2))
    root.scale = (1,1,1) if i else (0,0,0)
    root.keyframe_insert(data_path="location",frame=193)
    root.keyframe_insert(data_path="scale",frame=193)

# Right-hand Kanban tower and connected idea station.
cube("Kanban stand", (3.15,1.5,1.64), (2.0,.18,2.90), "violet", .11)
cube("Kanban face", (3.15,1.39,1.64), (1.81,.04,2.69), "white")
text("TEAM PLAN", (2.47,1.35,2.68), .18, "ink")
for col,color in enumerate(("yellow","lavender","mint")):
    for row in range(3):
        cube("Kanban note", (2.6+col*.55,1.32,2.30-row*.64), (.43,.08,.46), color, .035)
        cube("Kanban title", (2.6+col*.55,1.27,2.40-row*.64), (.29,.02,.025), "ink", .005)
for x,y in ((-3.05,-2.3),(1.30,-2.15)):
    cylinder("Collaboration plinth", (x,y,.12), .76,.20,"lavender")
    cube("Desk", (x,y,.86), (1.1,.65,.12), "white")
    for dx in (-.4,.4): cube("Desk leg", (x+dx,y,.44), (.09,.09,.75), "violet", .015)
    cube("Laptop base", (x,y,.96), (.58,.39,.035), "steel", .025)
    cube("Laptop screen", (x,y+.15,1.16), (.58,.045,.40), "ink", .035)
    cube("Laptop display", (x,y+.12,1.16), (.49,.015,.32), "blue", .015)

def teammate(x,y,shirt,skin,phase):
    cylinder("Teammate platform", (x,y,.10), .32,.15,"white")
    for dx in (-.10,.10):
        cube("Trousers", (x+dx,y,.40), (.13,.16,.52), "ink", .05)
        cube("Shoes", (x+dx,y-.055,.16), (.16,.27,.10), "white", .035)
    cube("Jacket", (x,y,.85), (.40,.26,.50), shirt, .12)
    sphere("Head", (x,y,1.29), .18,skin)
    sphere("Hair", (x,y+.035,1.39), .16,"ink")
    for dx in (-.065,.065): sphere("Eyes", (x+dx,y-.17,1.31), .021,"ink")
    cube("Left sleeve", (x-.25,y,.91), (.13,.15,.38),shirt,.06)
    hand = sphere("Collaborator gesture", (x+.3,y-.10,1.03), .075,skin)
    arm = cube("Right sleeve", (x+.24,y,.99), (.15,.15,.39),shirt,.06)
    animate(hand, [(1,(x+.3,y-.10,1.03)),(49,(x+.38,y-.16,1.22)),(97,(x+.3,y-.10,1.03)),(145,(x+.36,y-.13,1.18)),(193,(x+.3,y-.10,1.03))])
    animate(arm, [(1,(0,-.20,0)),(49,(0,-.65,0)),(97,(0,-.20,0)),(145,(0,-.55,0)),(193,(0,-.20,0))], "rotation_euler")

teammate(-3.05,-2.9,"coral","skin",0)
teammate(1.3,-2.75,"blue","light_skin",1)
teammate(3.65,.2,"mint","skin",2)
teammate(-3.75,.85,"violet","light_skin",3)
# Idea shelving and small studio details.
for level in range(3):
    cube("Idea shelf", (-3.65,1.4,.42+level*.62), (1.0,.70,.09),"white")
    for item in range(2): cube("Idea archive", (-3.9+item*.50,1.4,.61+level*.62), (.35,.42,.30),("coral","yellow","lavender")[(level+item)%3])
for x in (-4.14,-3.15): cube("Shelf frame", (x,1.4,1.1), (.06,.70,2.1),"steel",.01)
for x,y in ((4,-2.65),(-4,2.7)):
    cylinder("Planter", (x,y,.28), .23,.45,"coral")
    for dx,dy in ((0,0),(.13,.04),(-.10,-.08)):
        leaf = sphere("Plant canopy", (x+dx,y+dy,.85+dx), .23,"mint")
        leaf.scale = (.65,.7,1.8)
wire("Studio dependency", [(-3,-1.6,.09),(-3,-1.8,.09),(.5,-1.8,.09),(.5,-2.1,.09)],"violet",.025)
for i in range(3):
    cylinder("Idea token", (-.55+i*.40,-2.5,.19), .13,.08,("yellow","coral","mint")[i])

scene.frame_set(49)
bpy.ops.object.camera_add(location=(10,-13,10))
camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,1.2))-camera.location).to_track_quat("-Z","Y").to_euler()
camera.data.type, camera.data.ortho_scale="ORTHO",13.2
scene.camera=camera
for location,energy,size in [((1,-5,10),1500,7),((-5,-1,6),900,6),((4,5,8),1200,5)]:
    bpy.ops.object.light_add(type="AREA",location=location)
    lamp=bpy.context.object
    lamp.data.energy,lamp.data.size=energy,size
    lamp.rotation_euler=(-lamp.location).to_track_quat("-Z","Y").to_euler()
scene.render.engine="CYCLES"
scene.cycles.samples,scene.cycles.use_denoising=32,True
scene.render.resolution_x,scene.render.resolution_y,scene.render.resolution_percentage=1200,900,100
scene.render.film_transparent=True
scene.world.color=(.3,.3,.3)
scene.render.image_settings.file_format="PNG"
scene.render.filepath=str(ROOT/"apps/web/public/models/workspace.png")
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/"assets/blender/workspace.blend"))
bpy.ops.object.select_all(action="DESELECT")
for obj in scene.objects:
    if obj.type in {"MESH","EMPTY"}: obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/"apps/web/public/models/workspace.glb"),export_format="GLB",use_selection=True,export_yup=True,export_animations=True,export_animation_mode="SCENE",export_frame_range=True,export_force_sampling=True)
bpy.ops.render.render(write_still=True)
print("FLOWBOARD_STUDIO_DONE",flush=True)
