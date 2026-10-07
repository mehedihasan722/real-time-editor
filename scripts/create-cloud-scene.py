"""Original midnight-blue Flowboard cloud scene, rebuilt with Blender 5.1.
blender --background --python scripts/create-cloud-scene.py
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

def material(name, color, metallic=0, glow=0):
    value=bpy.data.materials.new(name)
    value.use_nodes=True
    value.diffuse_color=(*color,1)
    shader=value.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value=(*color,1)
    shader.inputs["Metallic"].default_value=metallic
    shader.inputs["Roughness"].default_value=.30
    shader.inputs["Emission Color"].default_value=(*color,1)
    shader.inputs["Emission Strength"].default_value=glow
    return value

materials={"blue":material("Electric cobalt",(.11,.08,.85),.25),
           "steel":material("Midnight alloy",(.05,.065,.13),.55),
           "edge":material("Indigo rim",(.21,.30,.64),.45),
           "white":material("Ice white",(.77,.87,1),.1),
           "glow":material("Cyan signal",(.14,.65,1),.2,2.2),
           "violet":material("Violet signal",(.49,.20,1),.2,.6)}

def box(name, pos, size, mat, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos)
    obj=bpy.context.object
    obj.name=name
    obj.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(materials[mat])
    bevel=obj.modifiers.new("Precision roundover","BEVEL")
    bevel.width,bevel.segments=.065,3
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.modifiers.new("Weighted normals","WEIGHTED_NORMAL")
    bpy.ops.object.modifier_apply(modifier="Weighted normals")
    if parent: obj.parent=parent
    return obj

def sphere(name,pos,radius,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=radius,location=pos)
    obj=bpy.context.object
    obj.name=name
    obj.data.materials.append(materials[mat])
    for face in obj.data.polygons: face.use_smooth=True
    return obj

def wire(name, points, mat, radius=.018):
    curve=bpy.data.curves.new(name,"CURVE")
    curve.dimensions,curve.bevel_depth,curve.bevel_resolution="3D",radius,3
    spline=curve.splines.new("POLY")
    spline.points.add(len(points)-1)
    for vertex,pos in zip(spline.points,points): vertex.co=(*pos,1)
    obj=bpy.data.objects.new(name,curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(materials[mat])
    bpy.context.view_layer.objects.active=obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)

box("Studio platform",(0,0,-.18),(7,4.5,.3),"steel")
box("Illuminated platform rim",(0,0,-.35),(6.9,4.4,.08),"edge")
for x,y,height in [(-2.4,.6,.7),(2.4,.75,.95),(.1,1.35,.45)]:
    box("Raised workstation",(x,y,height/2),(1.3,1.2,height),"steel")
    box("Workstation edge",(x,y,height+.035),(1.32,1.22,.065),"edge")

# A beveled extruded silhouette creates the solid cloud in the reference style.
curve=bpy.data.curves.new("Flowboard cloud profile","CURVE")
curve.dimensions,curve.resolution_u,curve.fill_mode="2D",16,"BOTH"
curve.extrude,curve.bevel_depth,curve.bevel_resolution=.19,.075,4
outline=[(-2,-.55),(-2.40,-.15),(-2.34,.48),(-1.9,.77),(-1.35,.74),(-.95,1.48),(-.25,1.70),(.45,1.40),(.75,.82),(1.32,.90),(1.98,.54),(2.12,-.1),(1.75,-.55)]
spline=curve.splines.new("BEZIER")
spline.bezier_points.add(len(outline)-1)
for vertex,(x,y) in zip(spline.bezier_points,outline):
    vertex.co=(x,y,0)
    vertex.handle_left_type=vertex.handle_right_type="AUTO"
spline.use_cyclic_u=True
cloud=bpy.data.objects.new("Floating Flowboard cloud",curve)
bpy.context.collection.objects.link(cloud)
cloud.location=(0,.8,1.95)
cloud.rotation_euler.x=math.pi/2
cloud.data.materials.append(materials["blue"])
bpy.context.view_layer.objects.active=cloud
cloud.select_set(True)
bpy.ops.object.convert(target="MESH")
cloud.select_set(False)
# Face badges are parented while preserving their world placement.
for i in range(3):
    badge=box("Flowboard mark",(-.62+i*.42,.47,2.3+i*.10),(.28,.05,.48),"white")
    matrix=badge.matrix_world.copy()
    badge.parent=cloud
    badge.matrix_world=matrix
for frame,offset in [(1,0),(49,.18),(97,0),(145,-.12),(193,0)]:
    cloud.location.z=1.95+offset
    cloud.keyframe_insert(data_path="location",frame=frame)

# Laptop, glass orb, connected nodes, and small in-flight idea signals.
box("Laptop deck",(-2.4,.35,.79),(1.13,.75,.07),"edge")
screen=box("Laptop display",(-2.4,.72,1.17),(1.15,.085,.72),"steel")
screen.rotation_euler.x=-.13
box("Laptop screen light",(-2.4,.66,1.17),(.98,.03,.57),"blue")
for i in range(3): box("Laptop task",(-2.66+i*.25,.637,1.16),(.17,.012,.30-i*.045),"glow")
globe=sphere("Idea globe",(2.4,.75,1.48),.48,"blue")
for tilt in (0,math.pi/2):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=8,major_radius=.485,minor_radius=.015,location=globe.location,rotation=(tilt,.6,0))
    bpy.context.object.data.materials.append(materials["glow"])
for x,y in [(-2.4,-.5),(2.4,-.5),(0,-1.45)]:
    sphere("Connection hub",(x,y,.17),.12,"glow")
wire("Connected workspace",[(-2.4,-.5,.17),(-2.4,-1.45,.17),(2.4,-1.45,.17),(2.4,-.5,.17)],"glow")
wire("Cloud uplink",[(0,-1.45,.17),(0,-1.45,.65),(0,.2,.65)],"violet")
for i in range(3):
    token=sphere("Travelling idea",(-2.4+i*1.6,-1.45,.20),.07,"white")
    for frame in range(1,194,8):
        phase=((frame-1)/192+i/3)%1
        token.location.x=-2.4+4.8*phase
        token.keyframe_insert(data_path="location",frame=frame)
    token.location.x=-2.4+i*1.6
    token.keyframe_insert(data_path="location",frame=193)
for x in (-3.05,3.05):
    box("Idea archive",(x,1.3,.5),(.40,.70,.85),"steel")
    for z in (.28,.5,.72): box("Archive light",(x,.94,z),(.23,.022,.04),"glow")

scene.frame_set(49)
bpy.ops.object.camera_add(location=(8,-11,7.5))
camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,1.3))-camera.location).to_track_quat("-Z","Y").to_euler()
camera.data.type,camera.data.ortho_scale="ORTHO",9.6
scene.camera=camera
for pos,energy,size,color in [((0,-4,7),950,6,(.72,.79,1)),((-4,1,5),1100,5,(.3,.4,1)),((4,4,5),1300,4,(.55,.25,1))]:
    bpy.ops.object.light_add(type="AREA",location=pos)
    light=bpy.context.object
    light.data.energy,light.data.size,light.data.color=energy,size,color
    light.rotation_euler=(-light.location).to_track_quat("-Z","Y").to_euler()
scene.render.engine="CYCLES"
scene.cycles.samples,scene.cycles.use_denoising=32,True
scene.render.resolution_x,scene.render.resolution_y,scene.render.resolution_percentage=1000,800,100
scene.render.film_transparent=True
scene.world.color=(.025,.035,.09)
scene.render.image_settings.file_format="PNG"
scene.render.filepath=str(ROOT/"apps/web/public/models/cloud.png")
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/"assets/blender/cloud.blend"))
bpy.ops.object.select_all(action="DESELECT")
for obj in scene.objects:
    if obj.type=="MESH": obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/"apps/web/public/models/cloud.glb"),export_format="GLB",use_selection=True,export_yup=True,export_animations=True,export_animation_mode="SCENE",export_frame_range=True,export_force_sampling=True)
bpy.ops.render.render(write_still=True)
print("FLOWBOARD_CLOUD_DONE",flush=True)
