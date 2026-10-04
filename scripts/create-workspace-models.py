"""Rebuild original Flowboard assets with Blender 5.1 in background mode.
blender --background --python scripts/create-workspace-models.py
"""
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "apps/web/public/models"
SOURCES = ROOT / "assets/blender"
MODELS.mkdir(parents=True, exist_ok=True)
SOURCES.mkdir(parents=True, exist_ok=True)

def material(name, color, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = 0.36
    shader.inputs["Metallic"].default_value = metallic
    return mat

def box(name, position, dimensions, mat, bevel=0.10):
    bpy.ops.mesh.primitive_cube_add(size=1, location=position)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    edge = obj.modifiers.new("Soft edges", "BEVEL")
    edge.width = bevel
    edge.segments = 3
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=edge.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    normal = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    bpy.ops.object.modifier_apply(modifier=normal.name)
    return obj

def line(name, start, end, mat, radius=0.04):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(1)
    spline.points[0].co = (*start, 1)
    spline.points[1].co = (*end, 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)

for kind in ("ideas", "tasks", "roadmap"):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    palette = {"base": material("Porcelain", (0.88, 0.92, 1)),
               "blue": material("Flowboard blue", (0.10, 0.24, 0.95), 0.12),
               "yellow": material("Warm note", (1, 0.72, 0.12)),
               "mint": material("Mint", (0.22, 0.82, 0.68)),
               "purple": material("Lavender", (0.61, 0.38, 0.96)),
               "ink": material("Ink", (0.15, 0.20, 0.38))}
    box("Floating workspace", (0, 0, -0.12), (4.8, 3.4, 0.24), palette["base"], 0.18)
    box("Blue lower edge", (0, 0, -0.29), (4.65, 3.25, 0.16), palette["blue"], 0.14)
    if kind == "ideas":
        positions = [(-1.35, 0.55, 0.22), (0.25, 0.7, 0.42), (1.35, -0.50, 0.25), (-0.65, -0.75, 0.5)]
        for i, position in enumerate(positions):
            mat = palette[("yellow", "purple", "mint", "yellow")[i]]
            note = box(f"Sticky note {i+1}", position, (1.15, 1.10, 0.13), mat, 0.07)
            note.rotation_euler.z = (-0.12, 0.12, -0.16, 0.08)[i]
            for row in range(3):
                box(f"Idea line {i}-{row}", (position[0], position[1] + 0.22 - row * 0.20, position[2] + 0.08), (0.7 - row*0.10, 0.055, 0.025), palette["ink"], 0.015)
        line("Connection", (-1.35, 0.55, 0.12), (1.35, -0.5, 0.12), palette["blue"])
    elif kind == "tasks":
        for col, color in enumerate(("blue", "purple", "mint")):
            x = (col - 1) * 1.45
            box(f"Column header {col}", (x, 1.02, 0.12), (1.15, 0.28, 0.12), palette[color], 0.05)
            for row in range(3 if col != 2 else 2):
                y = 0.38 - row * 0.68
                box(f"Task card {col}-{row}", (x, y, 0.18), (1.15, 0.50, 0.18), palette["yellow" if col == 0 else "base"], 0.07)
                box(f"Task label {col}-{row}", (x+0.08, y, 0.285), (0.65, 0.055, 0.02), palette["ink"], 0.012)
                bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=0.065, location=(x-0.4, y, 0.30))
                bpy.context.object.data.materials.append(palette[color])
    else:
        positions = [(-1.4, -0.65, 0.18), (0, 0.60, 0.35), (1.4, -0.35, 0.55)]
        for a, b in zip(positions, positions[1:]):
            line("Milestone connector", a, b, palette["blue"], 0.065)
        for i, position in enumerate(positions):
            box(f"Milestone {i+1}", position, (1.10, 0.80, 0.22), palette[("yellow", "purple", "mint")[i]], 0.11)
            for row in range(2):
                box(f"Milestone label {i}-{row}", (position[0], position[1]+0.15-row*0.25, position[2]+0.125), (0.65, 0.06, 0.025), palette["ink"], 0.015)

    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH": obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(MODELS / f"{kind}.glb"), export_format="GLB", use_selection=True, export_yup=True)

    bpy.ops.object.camera_add(location=(5.4, -7.3, 8.4))
    camera = bpy.context.object
    camera.rotation_euler = (Vector((0, 0, 0.2)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 6.8
    bpy.context.scene.camera = camera
    for location, energy, size in [((1,-4,8), 1000, 6), ((-4,2,6), 800, 5), ((4,4,5), 700, 4)]:
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        light.rotation_euler = (-light.location).to_track_quat("-Z", "Y").to_euler()
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 720
    scene.render.resolution_y = 460
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.world.color = (0.3, 0.3, 0.3)
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(MODELS / f"{kind}.png")
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCES / f"{kind}.blend"))
    bpy.ops.render.render(write_still=True)
    print(f"FLOWBOARD_ASSET_DONE {kind}", flush=True)
