"""Original Flowboard idea-to-delivery factory. Rebuild with Blender --background --python."""
import math
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.frame_start, scene.frame_end, scene.render.fps = 1, 193, 24

def material(name, color, metallic=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    s = m.node_tree.nodes.get("Principled BSDF")
    s.inputs["Base Color"].default_value = (*color, 1)
    s.inputs["Roughness"].default_value = .36
    s.inputs["Metallic"].default_value = metallic
    return m

colors = {n: material(n, c) for n, c in {
    "ink": (.035,.045,.065), "steel": (.19,.23,.29), "silver": (.58,.65,.72),
    "white": (.93,.95,.97), "paper": (.78,.83,.9), "yellow": (1,.72,.04),
    "orange": (1,.25,.035), "blue": (.055,.35,.95), "mint": (.13,.72,.48),
    "violet": (.42,.22,.86), "skin": (.65,.32,.16), "skin2": (.96,.63,.4),
}.items()}

def finish(obj, name, color, parent=None):
    obj.name = name
    obj.data.materials.append(colors[color])
    if parent: obj.parent = parent
    return obj

def box(name, pos, size, color, bevel=.04, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    b = obj.modifiers.new("Soft manufactured edge", "BEVEL")
    b.width, b.segments = bevel, 2
    bpy.ops.object.modifier_apply(modifier=b.name)
    obj.modifiers.new("Weighted surfaces", "WEIGHTED_NORMAL")
    bpy.ops.object.modifier_apply(modifier="Weighted surfaces")
    return finish(obj, name, color, parent)

def sphere(name, pos, radius, color, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=radius, location=pos)
    obj = finish(bpy.context.object, name, color, parent)
    for p in obj.data.polygons: p.use_smooth = True
    return obj

def cylinder(name, pos, radius, depth, color):
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=radius, depth=depth, location=pos)
    return finish(bpy.context.object, name, color)

def text(value, pos, size, color):
    bpy.ops.object.text_add(location=pos, rotation=(math.pi/2, 0, 0))
    obj = bpy.context.object
    obj.data.body, obj.data.size, obj.data.extrude = value, size, .004
    obj.data.materials.append(colors[color])
    bpy.ops.object.convert(target="MESH")
    obj.name = value

def animate(obj, frames, prop="location"):
    for frame, value in frames:
        setattr(obj, prop, value)
        obj.keyframe_insert(data_path=prop, frame=frame)

def group(name):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    return obj

# A stepped production floor and a large collaborative planning wall.
box("Factory foundation", (0,0,-.27), (11,7.4,.5), "ink", .16)
box("Inlaid floor", (0,0,.005), (10.7,7.1,.09), "steel", .12)
for i in range(4): box("Entry stair", (4.4,-2.5-i*.24,-.05-i*.09), (1.5,.55,.16), "silver")
box("Planning wall", (-1.45,2.4,2.1), (7.25,.23,4.2), "ink", .12)
text("FLOWBOARD", (-4.55,2.23,3.57), .48, "white")
text("IDEAS IN MOTION", (-4.5,2.23,3.25), .13, "yellow")
for i, label in enumerate(("PLAN", "BUILD", "DELIVER")):
    x = -3.8 + i*2.18
    box(label+" screen", (x,2.22,2.53), (1.92,.09,.89), "white", .08)
    text(label, (x-.78,2.16,2.72), .17, "ink")
    for j in range(3):
        bar = box("Live progress bar", (x-.68+j*.53,2.13,2.32), (.3,.045,.33+j*.1), ("blue","violet","orange")[i], .025)
        animate(bar, [(1,(1,1,1)),(65,(1,1,.45+j*.18)),(129,(1,1,1.1)),(193,(1,1,1))], "scale")
box("Shared board", (-1.55,2.21,1.18), (6.6,.1,1.5), "paper", .08)
for col in range(5):
    for row in range(2):
        x,z = -4.04+col*1.26, .84+row*.65
        box("Editable note", (x,2.12,z), (1.02,.08,.48), ("yellow","white","mint","white","blue")[(col+row)%5])
        for line in range(2): box("Note content", (x-.08,2.06,z+.06-line*.13), (.66-line*.19,.02,.045), "steel", .01)

# The production loop: rounded rails, rollers and animated idea parcels.
for x,y,sx,sy in [(0,-1.85,7.7,1.02),(0,.72,7.7,1.02),(-3.5,-.55,1.02,2.6),(3.5,-.55,1.02,2.6)]:
    box("Conveyor chassis", (x,y,.28), (sx,sy,.42), "ink", .12)
    box("Conveyor belt", (x,y,.53), (sx-.1,sy-.1,.09), "silver", .1)
for i in range(22):
    for y in (-1.85,.72):
        roller=cylinder("Belt roller", (-3.55+i*.34,y,.59), .045,.83,"steel")
        roller.rotation_euler=(math.pi/2,0,0)
for x in (-3.5,3.5):
    for i in range(6):
        roller=cylinder("Transfer roller", (x,-1.46+i*.37,.59), .045,.83,"steel")
        roller.rotation_euler=(0,math.pi/2,0)
route=[(-3.5,-1.85),(3.5,-1.85),(3.5,.72),(-3.5,.72)]
for i in range(8):
    carrier=group("Idea parcel %02d"%i)
    box("Card package", (0,0,.86), (.64,.53,.5), ("orange","blue","violet","yellow")[i%4], parent=carrier)
    box("Label", (0,-.272,.87), (.4,.015,.21), "white", .015, carrier)
    box("Package seal", (0,0,1.12), (.08,.54,.025), "white", .008, carrier)
    for frame in range(1,194,4):
        phase=((frame-1)/192*4+i/2)%4
        a=int(phase); t=phase-a
        start,end=route[a],route[(a+1)%4]
        carrier.location=(start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t,0)
        carrier.keyframe_insert(data_path="location",frame=frame)
for x, label in [(-2.2,"SYNC"),(2.25,"SHIP")]:
    for dx in (-.53,.53): box("Scanner pillar", (x+dx,-1.85,1.08), (.16,1.1,1.14),"white")
    box("Scanner lintel", (x,-1.85,1.7), (1.25,1.1,.17),"white")
    box("Scanner status", (x,-2.42,1.7), (.7,.02,.065),"mint",.012)
    text(label,(x-.24,-2.42,1.45),.16,"yellow")

# Shelves of reusable templates, small collaborators and a dispatch cart.
for x in (4.25,):
    for z in (.45,1.25,2.05):
        box("Template shelf", (x,2.0,z), (1.65,1.12,.1),"white")
        for j in range(3):
            box("Template archive", (x-.55+j*.53,2,z+.28),(.42,.73,.46),("orange","blue","yellow")[j])
    for dx in (-.82,.82): box("Rack column",(x+dx,2,1.35),(.08,1.13,2.8),"silver",.012)

def worker(x,y,color,skin):
    for dx in (-.09,.09):
        box("Boot",(x+dx,y-.06,.18),(.15,.28,.12),"ink")
        box("Trouser leg",(x+dx,y,.42),(.13,.18,.42),"blue")
    box("Work jacket",(x,y,.8),(.4,.28,.43),color,.1)
    sphere("Collaborator",(x,y,1.16),.17,skin)
    helmet=sphere("Safety helmet",(x,y,1.28),.18,"yellow");helmet.scale=(1.08,1.08,.62)
    box("Sleeve",(x-.26,y,.8),(.13,.18,.36),color)
    hand=sphere("Wave",(x+.28,y-.09,.95),.075,skin)
    animate(hand,[(1,(x+.28,y-.09,.95)),(97,(x+.33,y-.09,1.2)),(193,(x+.28,y-.09,.95))])
    box("Sleeve",(x+.23,y,.9),(.14,.18,.35),color)
for args in [(-4.6,-2.1,"orange","skin"),(.35,-3.0,"orange","skin2"),(4.6,.0,"blue","skin"),(-.8,.0,"mint","skin2")]: worker(*args)
box("Dispatch chassis",(2,-3.35,.28),(1.65,.65,.18),"yellow")
for x in (1.4,2.6):
    for y in (-3.68,-3.05):
        wheel=cylinder("Cart wheel",(x,y,.2),.19,.12,"ink");wheel.rotation_euler=(math.pi/2,0,0)
box("Dispatch handle",(2.8,-3.35,.78),(.09,.65,.95),"silver")
for x in (1.65,2.25): box("Ready for delivery",(x,-3.35,.57),(.48,.5,.42),"orange")
for i in range(8): box("Floor marker",(-4.6+i*.45,-3.38,.08),(.22,.14,.015),"yellow",.005)

scene.frame_set(49)
bpy.ops.object.camera_add(location=(11,-15,12))
camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,1))-camera.location).to_track_quat("-Z","Y").to_euler()
camera.data.type,camera.data.ortho_scale="ORTHO",15.7
scene.camera=camera
for pos,energy,size in [((1,-6,12),2100,8),((-6,-1,8),1400,7),((5,6,10),1700,6)]:
    bpy.ops.object.light_add(type="AREA",location=pos)
    lamp=bpy.context.object;lamp.data.energy,lamp.data.size=energy,size
    lamp.rotation_euler=(-lamp.location).to_track_quat("-Z","Y").to_euler()
scene.render.engine="CYCLES"
scene.cycles.samples,scene.cycles.use_denoising=24,True
scene.render.resolution_x,scene.render.resolution_y,scene.render.resolution_percentage=1400,1000,100
scene.render.film_transparent=True
scene.world.color=(.35,.35,.35)
scene.render.image_settings.file_format="PNG"
scene.render.filepath=str(ROOT/"apps/web/public/models/workflow.png")
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/"assets/blender/workflow.blend"))
bpy.ops.object.select_all(action="DESELECT")
for obj in scene.objects:
    if obj.type in {"MESH","EMPTY"}:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/"apps/web/public/models/workflow.glb"),export_format="GLB",use_selection=True,export_yup=True,export_animations=True,export_animation_mode="SCENE",export_frame_range=True,export_force_sampling=True)
bpy.ops.render.render(write_still=True)
print("FLOWBOARD_WORKFLOW_DONE",flush=True)
