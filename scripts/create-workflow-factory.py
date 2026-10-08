"""Flowboard logistics diorama. Blender --background --python scripts/create-workflow-factory.py.

Reference motion study: docs/wiki/Workflow-Animation.md. All geometry is editable;
the source video/frames are study material, not shipped website assets.
"""
import math
import json
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
FPS, END = 24, 289  # Twelve-second seamless master timeline, including closing pose.
scene.frame_start, scene.frame_end, scene.render.fps = 0, END-1, FPS
scene.render.fps_base = 1
bpy.context.preferences.filepaths.save_version = 0

def mat(name, rgb, metal=0, emission=0):
    m = bpy.data.materials.new(name); m.diffuse_color = (*rgb, 1); m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*rgb, 1)
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = .36 if metal else .55
    if emission:
        p.inputs["Emission Color"].default_value = (*rgb, 1)
        p.inputs["Emission Strength"].default_value = emission
    return m

M = {n: mat(n, c, metal) for n, c, metal in [
    ("ink", (.025,.032,.042),0), ("floor",(.095,.105,.12),0),
    ("belt",(.26,.28,.30),0), ("steel",(.42,.48,.54),.65),
    ("silver",(.72,.77,.80),.6), ("white",(.92,.94,.94),0),
    ("paper",(.76,.80,.82),0), ("orange",(1,.24,.025),0),
    ("blue",(.025,.32,.69),0), ("navy",(.012,.12,.29),0),
    ("glass",(.045,.115,.17),.3), ("cardboard",(.56,.285,.125),0),
    ("tape",(.83,.60,.36),0), ("wood",(.57,.33,.16),0),
    ("skin",(.79,.45,.26),0), ("skin2",(.37,.18,.09),0),
    ("yellow",(1,.63,.018),0), ("mint",(.09,.62,.46),0),
]}
M["glow"] = mat("Warm scanner illumination",(1,.23,.012),emission=3)

def group(name, parent=None, pos=(0,0,0)):
    o=bpy.data.objects.new(name,None); scene.collection.objects.link(o)
    o.parent=parent; o.location=pos
    return o

def finish(o,name,color,parent):
    o.name=name; o.data.materials.append(M[color]); o.parent=parent
    return o

def box(name,pos,size,color,bevel=.025,parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos)
    o=bpy.context.object; o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        b=o.modifiers.new("Rounded edges","BEVEL"); b.width=bevel; b.segments=2
        bpy.ops.object.modifier_apply(modifier=b.name)
        n=o.modifiers.new("Surface normals","WEIGHTED_NORMAL")
        bpy.ops.object.modifier_apply(modifier=n.name)
    return finish(o,name,color,parent)

def sphere(name,pos,size,color,parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=1,location=pos)
    o=finish(bpy.context.object,name,color,parent); o.scale=size
    for p in o.data.polygons:p.use_smooth=True
    return o

def cylinder(name,pos,radius,depth,color,parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=radius,depth=depth,location=pos)
    o=finish(bpy.context.object,name,color,parent)
    for p in o.data.polygons:p.use_smooth=True
    return o

def rod(name,a,b,radius,color,parent=None):
    a,b=Vector(a),Vector(b)
    o=cylinder(name,(a+b)/2,radius,(b-a).length,color,parent)
    o.rotation_euler=(b-a).to_track_quat("Z","Y").to_euler()
    return o

def text(value,pos,size,color,parent=None):
    bpy.ops.object.text_add(location=pos,rotation=(math.pi/2,0,0))
    o=bpy.context.object; o.data.body=value; o.data.size=size; o.data.extrude=.002
    o.data.align_x="CENTER"; o.data.materials.append(M[color])
    bpy.ops.object.convert(target="MESH"); o.name=value; o.parent=parent
    return o

def key(o,frame,**values):
    for prop,value in values.items():
        setattr(o,prop,value); o.keyframe_insert(data_path=prop,frame=frame-1)

def parcel(name,pos=(0,0,0),scale=1,parent=None):
    g=group(name,parent,pos); g.scale=(scale,)*3
    box("Corrugated carton",(0,0,.23),(.60,.48,.46),"cardboard",.016,g)
    box("Top sealing tape",(0,0,.465),(.095,.49,.012),"tape",.002,g)
    box("Front sealing tape",(0,-.246,.24),(.095,.009,.46),"tape",.001,g)
    box("Shipping label",(.15,-.252,.25),(.17,.008,.13),"white",.001,g)
    for j in range(5):box("Barcode",(.095+j*.022,-.26,.25),(.009,.005,.08),"ink",0,g)
    return g

def pallet(pos,parent=None):
    g=group("Timber pallet",parent,pos)
    for x in (-.44,0,.44):box("Pallet foot",(x,0,.06),(.12,.8,.12),"wood",.006,g)
    for y in (-.34,-.17,0,.17,.34):box("Deck board",(0,y,.145),(1,.13,.06),"tape",.005,g)
    return g

# Grounded black platform, white warehouse apron and a tall planning wall.
box("White loading apron",(.7,-.7,-.37),(15.7,12.6,.12),"white",.16)
box("Factory foundation",(-1,.65,-.13),(9.7,7.2,.42),"ink",.12)
box("Warehouse floor",(-1,.65,.09),(9.55,7.05,.09),"floor",.05)
box("Rack foundation",(4.6,1.75,-.13),(4.0,4.65,.42),"ink",.08)
box("Rack loading floor",(4.6,1.75,.09),(3.95,4.60,.09),"floor",.035)
for i in range(5):box("Dispatch stair",(3.65,-1.65-i*.20,-.01-i*.058),(1.6,.45,.14),"floor",.025)
for i in range(19):
    stripe=box("Safety edge stripe",(-5.45+i*.46,-2.76,.151),(.21,.34,.015),"silver",.001)
    stripe.rotation_euler.z=-.45
box("Planning wall",(-2.8,3.35,2.63),(6.65,.20,5.1),"ink",.045)
box("Flowboard illuminated sign",(-4.1,3.15,5.15),(3.2,.15,.65),"orange",.06)
text("Flowboard",(-4.1,3.05,4.97),.48,"white")
text("PLAN  /  BUILD  /  DELIVER",(-1.2,3.18,4.85),.14,"white")
# Analytics panels, ring chart, growing bars and a large line graph.
for x in (-4.92,-3.13,-1.34):box("Dashboard panel",(x,3.18,4.10),(1.62,.12,.98),"white",.06)
for i in range(4):box("Activity metric",(-5.5+i*.35,3.10,4.1),(.22,.03,.20+.1*i),"orange" if i==3 else "paper",.012)
for i in range(24):
    a=i/24*math.tau
    p=box("Ring chart segment",(-3.13+.28*math.cos(a),3.08,4.10+.28*math.sin(a)),(.08,.035,.14),"orange" if i<7 else "blue",.01)
    p.rotation_euler.y=-a
for i in range(4):
    o=box("Live chart bar",(-1.87+i*.35,3.09,3.84),(.20,.04,.45+i*.11),"blue" if i%2 else "orange",.025)
    for f,s in [(1,1),(73,.55+i*.12),(145,1),(217,.75),(END,1)]:key(o,f,scale=(1,1,s))
box("Workflow chart",(-2.8,3.17,2.43),(6.10,.12,2.1),"white",.08)
text("WORKSPACE PERFORMANCE",(-2.8,3.07,3.20),.18,"ink")
for j in range(5):box("Chart grid",(-2.8,3.085,1.64+j*.29),(5.6,.012,.012),"paper",0)
for color,offset in [("orange",0),("blue",.17)]:
    pts=[(-5.36+i*.64,3.05,1.65+((i*3+(1 if color=="blue" else 0))%7)*.17+offset) for i in range(9)]
    for a,b in zip(pts,pts[1:]):rod("Analytics line",a,b,.018,color)
    for p in pts:sphere("Chart point",p,(.05,.025,.05),color)
for i in range(5):
    box("Workflow state",(-5.1+i*1.16,3.17,.91),(1.02,.12,.52),"paper",.035)
    text(["IDEAS","REVIEW","PLAN","BUILD","DONE"][i],(-5.1+i*1.16,3.08,.85),.13,"ink")

# Smooth closed conveyor. Arc-length lookup gives constant speed through bends.
def rounded_route():
    pts=[]
    for cx,cy,start in [(1.65,1.55,0),(-4.1,1.55,90),(-4.1,-1.65,180),(1.65,-1.65,270)]:
        for j in range(13):
            a=math.radians(start+j*90/12)
            pts.append(Vector((cx+.62*math.cos(a),cy+.62*math.sin(a),.62)))
    return pts

route=rounded_route()
lengths=[(route[(i+1)%len(route)]-p).length for i,p in enumerate(route)]
total=sum(lengths)
def belt_point(distance):
    d=distance%total
    for i,length in enumerate(lengths):
        if d<=length:
            p=route[i].lerp(route[(i+1)%len(route)],d/length)
            tangent=(route[(i+1)%len(route)]-route[i]).normalized()
            return p,math.atan2(tangent.y,tangent.x)
        d-=length
    return route[0],0

def ribbon(name,width,z,depth,color):
    verts=[]
    for i,p in enumerate(route):
        tangent=(route[(i+1)%len(route)]-route[i-1]).normalized()
        normal=Vector((-tangent.y,tangent.x,0))*width/2
        for zz in (z-depth,z):
            for sign in (-1,1):verts.append((p.x+normal.x*sign,p.y+normal.y*sign,zz))
    faces=[]
    for i in range(len(route)):
        a=i*4;b=((i+1)%len(route))*4
        faces.extend([(a+2,a+3,b+3,b+2),(a,b,b+1,a+1),(a,a+2,b+2,b),(a+1,b+1,b+3,a+3)])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);o.data.materials.append(M[color])
    return o
ribbon("Curved conveyor chassis",1.1,.55,.28,"ink")
ribbon("Continuous curved belt",.96,.63,.07,"belt")
for i in range(105):
    p,a=belt_point(i/105*total)
    o=box("Belt seam",(p.x,p.y,.638),(.014,.90,.008),"silver",0);o.rotation_euler.z=a
for i in range(8):
    g=parcel("Conveyor carton %02d"%i)
    heading=None
    for f in range(1,END+1,2):
        p,a=belt_point((f-1)/(END-1)*total+i*total/8)
        if heading is not None:a=heading+(a-heading+math.pi)%math.tau-math.pi
        heading=a
        key(g,f,location=p,rotation_euler=(0,0,a))
for x,y in [(-3.6,2.12),(-1.0,-2.25),(1.65,-2.10)]:
    for dx in (-.58,.58):box("Scanner side",(x+dx,y,1.0),(.14,1.03,.95),"silver",.035)
    box("Scanner roof",(x,y,1.50),(1.3,1.03,.17),"silver",.04)
    box("Scanner orange light",(x,y+.35,1.38),(1.0,.09,.055),"glow",.01)
    for dx in (-.48,.48):box("Scanner edge light",(x+dx,y,1.06),(.025,.70,.70),"glow",.005)

# Open industrial shelves, stacked cartons, pallets, drums and product bins.
def rack(x,y,width=1.8):
    for dx in (-width/2,width/2):
        for dy in (-.5,.5):
            box("Rack upright",(x+dx,y+dy,1.74),(.055,.055,3.32),"silver",.007)
        rod("Rack diagonal brace",(x+dx,y-.5,.35),(x+dx,y+.5,3.22),.018,"steel")
    for level in range(4):
        z=.24+level*.83
        box("Shelf deck",(x,y,z),(width+ .08,1.12,.075),"wood",.01)
        box("Shelf lip",(x,y-.55,z+.035),(width+ .08,.05,.09),"orange",.006)
        for j in range(3):
            if (j+level)%4:
                parcel("Stored carton",(x-width/2+.29+j*(width-.55)/2,y,z+.04),.72+(level%2)*.15)
            else:
                drum=cylinder("Warehouse drum",(x-width/2+.30+j*(width-.55)/2,y,z+.31),.23,.53,"silver")
                for dz in (-.20,0,.20):cylinder("Drum rim",(drum.location.x,y,z+.31+dz),.245,.027,"steel")
for xy in [(3.35,3.0),(5.6,3.0),(3.45,.75)]:rack(*xy)
for z in (.38,1.07,1.76):
    box("Packing bench shelf",(.45,3.0,z),(1.95,.85,.10),"wood")
    for j in range(4):
        x=-.25+j*.43
        box("Open product bin",(x,2.86,z+.16),(.37,.60,.21),"cardboard",.016)
        sphere("Packable product",(x,2.86,z+.34),(.14,.16,.14),["orange","navy","mint","white"][j])
for x,y in [(-2.5,-3.25),(-1.5,-3.55),(5.45,-1.65)]:
    pallet((x,y,-.27))
    parcel("Dispatch stack bottom",(x-.16,y,-.10),.82)
    parcel("Dispatch stack top",(x+.12,y,.28),.68)

# Workers: one moving body coordinate frame holds the carton, hands and sleeves.
# Knees bend independently; grasp remains fixed while the body walks/leans.
def worker(index,origin,travel,phase=0,skin="skin"):
    root=group("Worker %02d route"%index)
    torso=group("Worker %02d upper body"%index,root,(0,0,.70))
    sphere("Work shirt",(0,0,.25),(.25,.17,.32),"orange",torso)
    box("Overall bib",(0,-.16,.22),(.31,.035,.31),"blue",.035,torso)
    for x in (-.13,.13):box("Overall strap",(x,-.145,.42),(.045,.045,.22),"blue",.01,torso)
    box("Belt",(0,0,.005),(.42,.32,.085),"ink",.015,torso)
    sphere("Head",(0,-.012,.65),(.16,.145,.205),skin,torso)
    sphere("Nose",(0,-.157,.65),(.042,.046,.045),skin,torso)
    for x in (-.062,.062):sphere("Eye",(x,-.141,.70),(.016,.012,.018),"ink",torso)
    sphere("Hard hat",(0,0,.82),(.19,.18,.11),"orange",torso)
    box("Hat brim",(0,-.055,.765),(.41,.39,.032),"orange",.025,torso)
    cargo=parcel("Worker %02d held carton"%index,(0,-.43,.14),.88,torso)
    for side in (-1,1):
        shoulder=(side*.23,0,.42); elbow=(side*.34,-.17,.21); hand=(side*.285,-.44,.28)
        rod("Sleeve",shoulder,elbow,.095,"orange",torso)
        rod("Forearm",elbow,hand,.066,skin,torso)
        sphere("Hand gripping carton",hand,(.066,.073,.064),skin,torso)
    hips=[]
    for side in (-1,1):
        hip=group("Worker %02d hip %d"%(index,side),root,(side*.12,0,.72))
        rod("Thigh",(0,0,0),(0,0,-.34),.095,"blue",hip)
        knee=group("Worker %02d knee %d"%(index,side),hip,(0,0,-.34))
        sphere("Knee",(0,0,0),(.09,.09,.09),"blue",knee)
        rod("Shin",(0,0,0),(0,0,-.32),.077,"blue",knee)
        boot=box("Safety boot",(0,-.075,-.32),(.19,.32,.14),"ink",.045,knee)
        hips.append((hip,knee,boot))
    # Travel out loaded, pause and bend at each end, turn before returning.
    previous_heading=None
    for f in range(1,END+1,2):
        t=((f-1)/(END-1)+phase)%1
        forward=t<.5; q=(t% .5)*2
        progress=max(0,min(1,(q-.13)/.70)); smooth=progress*progress*(3-2*progress)
        distance=smooth if forward else 1-smooth
        moving=.13<q<.83
        heading=math.atan2(travel[1],travel[0])+math.pi/2
        if not forward:heading+=math.pi
        # Turn while stopped. Equivalent orientations meet at the loop seam.
        if q<.13:heading-=math.pi*(1-q/.13)
        if previous_heading is not None:heading=previous_heading+(heading-previous_heading+math.pi)%math.tau-math.pi
        previous_heading=heading
        stride=smooth*math.hypot(*travel)/.58*math.tau
        stride_weight=min(1,progress/.15,(1-progress)/.15) if moving else 0
        angles=[(.40*math.sin(stride+j*math.pi)*stride_weight,-.50*max(0,-math.sin(stride+j*math.pi))*stride_weight) for j in range(2)]
        # Keep the support boot on the loading floor and its sole level.
        ankle=min(.72-.34*math.cos(a)-.32*math.cos(a+b)-.075*math.sin(a+b) for a,b in angles)
        key(root,f,location=(origin[0]+travel[0]*distance,origin[1]+travel[1]*distance,.135+.07-ankle),rotation_euler=(0,0,heading))
        bend=.26*math.sin(max(0,(q-.83)/.17)*math.pi) if q>=.83 else 0
        key(torso,f,rotation_euler=(bend,0,.025*math.sin(stride) if moving else 0))
        for (hip,knee,boot),(a,b) in zip(hips,angles):
            key(hip,f,rotation_euler=(a,0,0))
            key(knee,f,rotation_euler=(b,0,0))
            key(boot,f,rotation_euler=(-a-b,0,0))
    return root,cargo

workers=[worker(0,(-.9,-.85),(1.6,0),0),worker(1,(-5.48,-1.7),(0,2.1),.23,"skin2"),worker(2,(2.9,-.30),(1.65,0),.10),worker(3,(-3.2,-2.72),(1.1,0),.34,"skin2")]

# Two detailed trucks. White truck stays parked; orange truck creeps along its lane.
def truck(name,x,y,color,moving=False):
    g=group(name,pos=(x,y,-.38))
    box("Truck chassis",(0,0,.42),(1.22,3.25,.22),"ink",.045,g)
    box("Cargo body",(0,.43,1.28),(1.35,2.48,1.54),"white",.07,g)
    box("Container lower trim",(0,.43,.55),(1.4,2.5,.10),"silver",.012,g)
    for side in (-1,1):
        label=text("Flowboard",(side*.68,.43,1.20),.25,"orange",g)
        label.rotation_euler=(math.pi/2,0,side*math.pi/2)
        box("Cab mirror",(side*.74,-1.37,1.29),(.14,.17,.22),"ink",.02,g)
        rod("Mirror support",(side*.56,-1.37,1.29),(side*.73,-1.37,1.29),.025,"silver",g)
        for yy in (-1.48,.50,1.23):
            axle=group("Wheel axle",g,(side*.63,yy,.35));axle.rotation_euler=(0,math.pi/2,0)
            w=cylinder("Road tire",(0,0,0),.28,.17,"ink",axle)
            cylinder("Wheel hub",(0,0,side*.10),.15,.026,"silver",w)
            box("Hub spoke",(0,0,side*.12),(.23,.035,.02),"ink",.005,w)
            if moving:
                for f,d in [(1,0),(73,.85),(145,0),(217,.85),(END,0)]:key(w,f,rotation_euler=(0,0,d/.28))
    box("Driver cab",(0,-1.3,1.0),(1.27,1.02,1.31),color,.16,g)
    box("Front windshield",(0,-1.825,1.36),(1.04,.022,.45),"glass",.04,g)
    for side in (-1,1):box("Side window",(side*.64,-1.29,1.37),(.022,.64,.42),"glass",.035,g)
    box("Truck bumper",(0,-1.88,.52),(1.31,.14,.18),"silver",.035,g)
    box("Grille",(0,-1.843,.79),(.75,.03,.29),"ink",.015,g)
    for z in (.69,.78,.87):box("Grille slat",(0,-1.865,z),(.68,.015,.015),"steel",.003,g)
    for side in (-1,1):box("Headlight",(side*.47,-1.85,.86),(.19,.03,.15),"white",.025,g)
    box("Roof vent",(0,-1.27,1.70),(.7,.48,.045),"ink",.015,g)
    if moving:
        for f,d in [(1,0),(73,.85),(145,0),(217,.85),(END,0)]:key(g,f,location=(x,y-d,-.38))
    return g
truck("Orange dispatch truck",1.3,-4.25,"orange",True)
truck("White parked truck",3.65,-3.65,"white")

# Forklift with lifting mast, pallet jack, hand trolley, cones and dispatch robot.
fork=group("Forklift",pos=(6.1,-1.25,-.33))
box("Forklift body",(0,0,.56),(.88,1.35,.75),"orange",.13,fork)
box("Driver seat",(0,.05,.94),(.5,.43,.16),"ink",.07,fork)
for x in (-.39,.39):
    for y in (-.52,.52):
        w=cylinder("Forklift tire",(x,y,.27),.25,.15,"ink",fork);w.rotation_euler=(0,math.pi/2,0)
    for y in (-.42,.42):rod("Overhead guard",(x,y,.8),(x,y,1.75),.032,"ink",fork)
box("Forklift canopy",(0,0,1.77),(.96,1.05,.09),"ink",.03,fork)
for x in (-.34,.34):box("Mast rail",(x,-.72,1.02),(.10,.10,1.90),"ink",.015,fork)
lift=group("Forklift lifting carriage",fork)
for x in (-.30,.30):box("Fork",(x,-1.1,.18),(.12,1.1,.055),"steel",.007,lift)
parcel("Forklift cargo",(0,-1.03,.21),1.0,lift)
for f,z in [(1,0),(73,.55),(145,.55),(217,0),(END,0)]:key(lift,f,location=(0,0,z))
for x,y in [(5.2,-1.15),(5.8,-1.40)]:
    box("Cone base",(x,y,-.22),(.36,.36,.045),"white",.015)
    bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=.14,radius2=.025,depth=.45,location=(x,y,.025))
    finish(bpy.context.object,"Traffic cone","orange",None)
    cylinder("Cone reflective band",(x,y,.065),.088,.065,"white")
trolley=group("Blue hand trolley",pos=(-3.85,-3.5,-.27))
for x in (-.25,.25):
    rod("Trolley frame",(x,0,.15),(x,.15,1.45),.026,"blue",trolley)
    w=cylinder("Trolley wheel",(x,0,.16),.16,.10,"ink",trolley);w.rotation_euler=(0,math.pi/2,0)
for z in (.5,.8,1.1,1.45):rod("Trolley crossbar",(-.25,z*.1,z),(.25,z*.1,z),.025,"blue",trolley)
box("Trolley toe",(0,-.19,.12),(.62,.44,.045),"blue",.01,trolley)
robot=group("Autonomous delivery robot")
cylinder("Robot base",(0,0,.02),.41,.20,"ink",robot)
cylinder("Robot orange shell",(0,0,.14),.43,.17,"orange",robot)
box("Robot sensor",(0,-.4,.15),(.22,.045,.08),"glass",.02,robot)
parcel("Robot carried box",(0,0,.24),.7,robot)
for f in range(1,END+1,2):
    t=(f-1)/(END-1)*math.tau
    key(robot,f,location=(-4.9+ .60*math.cos(t),-4.05+.42*math.sin(t),-.23),rotation_euler=(0,0,t))
drone=group("Hovering parcel drone")
sphere("Drone shell",(0,0,0),(.33,.25,.12),"orange",drone)
parcel("Drone suspended carton",(0,0,-.80),.68,drone)
for x in (-.47,.47):
    for y in (-.37,.37):
        rod("Drone arm",(0,0,0),(x,y,.02),.035,"ink",drone)
        rotor=group("Spinning rotor",drone,(x,y,.08))
        box("Rotor blade",(0,0,0),(.56,.045,.015),"ink",.014,rotor)
        for f in range(1,END+1,2):key(rotor,f,rotation_euler=(0,0,(f-1)/(END-1)*math.tau*17))
for x in (-.20,.20):rod("Cargo tether",(x,0,-.08),(x,0,-.48),.009,"steel",drone)
for f in range(1,END+1,2):
    t=(f-1)/(END-1)*math.tau
    key(drone,f,location=(-6.2+.16*math.sin(t),-2.7,1.38+.13*math.sin(2*t)),rotation_euler=(.025*math.sin(t),.025*math.cos(t),0))

# Linear keys avoid easing each two-frame sample; curves are sampled analytically.
for action in bpy.data.actions:
    for layer in action.layers:
        for strip in layer.strips:
            for slot in action.slots:
                bag=strip.channelbag(slot)
                if bag:
                    for curve in bag.fcurves:
                        for point in curve.keyframe_points:point.interpolation="LINEAR"

# Freeze the same two-second pose used by reduced-motion playback.
scene.frame_set(48)
bpy.ops.object.camera_add(location=(13,-18,13))
camera=bpy.context.object; target=Vector((.25,-.65,1.45))
camera.rotation_euler=(target-camera.location).to_track_quat("-Z","Y").to_euler()
camera.data.type="ORTHO";camera.data.ortho_scale=19.6;scene.camera=camera
for pos,energy,size in [((-5,-7,13),2400,8),((7,-1,11),1800,7),((0,8,12),2200,6)]:
    bpy.ops.object.light_add(type="AREA",location=pos)
    o=bpy.context.object;o.data.energy=energy;o.data.size=size
    o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat("-Z","Y").to_euler()
scene.world.color=(.4,.4,.4)
scene.render.engine="CYCLES";scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.film_transparent=True;scene.render.image_settings.file_format="PNG"
scene.render.filepath=str(ROOT/"apps/web/public/models/workflow.png")
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/"assets/blender/workflow.blend"))
# Batch only unanimated world geometry for WebGL; the saved .blend stays editable.
static={}
for o in scene.objects:
    if o.type=="MESH" and not o.parent and not o.animation_data:
        static.setdefault(o.active_material.name,[]).append(o)
for material,objects in static.items():
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join();bpy.context.object.name="Static warehouse - "+material
bpy.ops.object.select_all(action="DESELECT")
for o in scene.objects:
    if o.type in {"MESH","EMPTY"}:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/"apps/web/public/models/workflow.glb"),export_format="GLB",use_selection=True,export_yup=True,export_animations=True,export_animation_mode="SCENE",export_anim_scene_split_object=False,export_frame_range=True,export_force_sampling=True)
bpy.ops.render.render(write_still=True)
print("FLOWBOARD_WORKFLOW_DONE",json.dumps({"fps":FPS,"frames":END,"objects":len(scene.objects)}),flush=True)
