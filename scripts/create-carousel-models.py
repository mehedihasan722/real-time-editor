"""Original sculptural carousel artwork. Run with Blender --background --python.
No external textures or reference-video imagery is used.
"""
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]


def material(name, color, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = .26
    return mat


def finish(obj, name, mat, parent=None):
    obj.name = name
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = True
    if parent:
        obj.parent = parent
    return obj


def box(name, pos, size, mat, parent=None, bevel=.12):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new("Soft sculpted edges", "BEVEL")
    modifier.width, modifier.segments = bevel, 5
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    finish(obj, name, mat, parent)
    modifier = obj.modifiers.new("Surface normals", "WEIGHTED_NORMAL")
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def sphere(name, pos, size, mat, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=24, radius=1, location=pos)
    obj = bpy.context.object
    obj.scale = size
    return finish(obj, name, mat, parent)


def cylinder(name, pos, radius, depth, mat, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=radius, depth=depth, location=pos)
    obj = finish(bpy.context.object, name, mat, parent)
    modifier = obj.modifiers.new("Rounded rim", "BEVEL")
    modifier.width, modifier.segments = .07, 3
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def ring(name, pos, radius, mat, parent=None, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=64, minor_segments=12, major_radius=radius,
                                   minor_radius=.065, location=pos, rotation=rotation)
    return finish(bpy.context.object, name, mat, parent)


for theme in ("roadmap", "tasks", "ideas"):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.frame_start, scene.frame_end, scene.render.fps = 1, 193, 24
    ivory = material("Porcelain", (.89, .93, 1), .15)
    dark = material("Midnight enamel", (.028, .045, .12), .45)
    gold = material("Warm brass", (1, .48, .085), .5)
    blue = material("Azure glass enamel", (.025, .27, .95), .4)
    lilac = material("Lavender alloy", (.43, .18, .85), .4)
    mint = material("Mint enamel", (.10, .87, .59), .25)
    bpy.ops.object.empty_add(type="PLAIN_AXES")
    sculpture = bpy.context.object
    sculpture.name = "Floating " + theme + " sculpture"

    if theme == "roadmap":
        sphere("Rocket porcelain hull", (0, 0, 2.55), (.74, .63, 1.6), ivory, sculpture)
        sphere("Rocket cobalt nose", (0, 0, 3.75), (.53, .49, .62), blue, sculpture)
        port = cylinder("Brass portal rim", (0, -.59, 2.8), .36, .12, gold, sculpture)
        port.rotation_euler.x = math.pi / 2
        glass = cylinder("Portal midnight glass", (0, -.67, 2.8), .26, .10, dark, sculpture)
        glass.rotation_euler.x = math.pi / 2
        sphere("Portal glint", (-.085, -.74, 2.88), (.085, .03, .085), ivory, sculpture)
        for x in (-.73, .73):
            fin = box("Swept cobalt fin", (x, 0, 1.65), (.32, .67, 1.0), blue, sculpture)
            fin.rotation_euler.y = -.38 if x < 0 else .38
        cylinder("Engine collar", (0, 0, 1.12), .49, .22, dark, sculpture)
        sphere("Golden thrust", (0, 0, .65), (.29, .29, .59), gold, sculpture)
        ring("Trajectory", (0, 0, .3), 1.2, gold, sculpture, (.18, .18, 0))
        for x, z in [(-1.25, 2.4), (1.14, 3.45)]:
            sphere("Milestone satellite", (x, .15, z), (.15, .15, .15), gold, sculpture)
    elif theme == "tasks":
        # Cards sit vertically like the tall products in the reference carousel.
        for i, mat in enumerate((lilac, ivory, blue)):
            bpy.ops.object.empty_add(type="PLAIN_AXES", location=((i-1)*.36, (1-i)*.34, 1.9+i*.4))
            card = bpy.context.object
            card.name = "Orbiting task card " + str(i)
            card.parent = sculpture
            box("Thick task card", (0, 0, 0), (1.9, .19, 2.5), mat, card)
            box("Card heading", (0, -.13, .78), (1.1, .055, .12), gold, card, .035)
            for row in range(3):
                check = box("Task checkbox", (-.55, -.14, .32-row*.42), (.22, .06, .22), mint, card, .055)
                box("Task text", (.12, -.14, .32-row*.42), (.78-row*.12, .055, .07), dark if i == 1 else ivory, card, .025)
            for frame, tilt in [(1, -.08+i*.15), (97, .08+i*.15), (193, -.08+i*.15)]:
                card.rotation_euler.z = tilt
                card.keyframe_insert(data_path="rotation_euler", frame=frame)
        ring("Task orbit", (0, 0, .5), 1.3, mint, sculpture, (.15, .3, 0))
        sphere("Completed milestone", (1.26, -.2, .7), (.24, .24, .24), gold, sculpture)
    else:
        sphere("Luminous idea bulb", (0, 0, 3.02), (.98, .82, 1.1), gold, sculpture)
        cylinder("Porcelain socket", (0, 0, 1.89), .54, .65, ivory, sculpture)
        for z in (1.65, 1.85, 2.05):
            ring("Socket thread", (0, 0, z), .54, lilac, sculpture)
        cylinder("Idea contact", (0, 0, 1.47), .29, .14, dark, sculpture)
        ring("Creative orbit", (0, 0, 2.8), 1.5, ivory, sculpture, (.9, .35, 0))
        for x, z, mat in [(-1.1, 1.18, mint), (1.2, 3.9, lilac), (1.2, 1.3, ivory)]:
            note = box("Floating idea tile", (x, 0, z), (.65, .15, .73), mat, sculpture)
            note.rotation_euler.y, note.rotation_euler.z = .2, -.25

    # One seamless exported loop, with independently animated cards where useful.
    for frame, height, tilt in [(1, 0, -.12), (49, .12, 0), (97, 0, .12), (145, -.12, 0), (193, 0, -.12)]:
        sculpture.location.z = height
        sculpture.rotation_euler.z, sculpture.rotation_euler.y = .055, tilt
        sculpture.keyframe_insert(data_path="location", frame=frame)
        sculpture.keyframe_insert(data_path="rotation_euler", frame=frame)
    cylinder("Floating display plinth", (0, .18, -.18), 1.36, .22, dark)
    ring("Plinth accent", (0, .18, -.07), 1.28, ivory)
    scene.frame_set(49)
    bpy.ops.object.camera_add(location=(.8, -11, 4.4))
    camera = bpy.context.object
    camera.rotation_euler = (Vector((0, 0, 2.15))-camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type, camera.data.ortho_scale = "ORTHO", 5.7
    scene.camera = camera
    for pos, energy, size, color in [((-3, -4, 6), 850, 5, (1, .9, .8)), ((3, -2, 4), 550, 4, (.6, .8, 1)), ((0, 4, 5), 1200, 3, (1, 1, 1))]:
        bpy.ops.object.light_add(type="AREA", location=pos)
        light = bpy.context.object
        light.data.energy, light.data.size, light.data.color = energy, size, color
        light.rotation_euler = (Vector((0, 0, 2))-light.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.engine = "CYCLES"
    scene.cycles.samples, scene.cycles.use_denoising = 32, True
    scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 760, 1000, 100
    scene.render.film_transparent = True
    scene.world.color = (.15, .15, .15)
    scene.render.image_settings.file_format = "PNG"
    name = "carousel-" + theme
    scene.render.filepath = str(ROOT / "apps/web/public/models" / (name + ".png"))
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / "assets/blender" / (name + ".blend")))
    bpy.ops.object.select_all(action="DESELECT")
    for obj in scene.objects:
        if obj.type in ("MESH", "EMPTY"):
            obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT / "apps/web/public/models" / (name + ".glb")), export_format="GLB", use_selection=True,
                              export_yup=True, export_animations=True, export_animation_mode="SCENE", export_frame_range=True, export_force_sampling=True)
    bpy.ops.render.render(write_still=True)
    print("FLOWBOARD_CAROUSEL_DONE", name, flush=True)
