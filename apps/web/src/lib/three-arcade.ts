import * as THREE from "three";
import { ArcadeWorld } from "./arcade-world";
import { GameId } from "./games";
const palette = [0xa78bfa, 0x34d399, 0xfb7185, 0xfbbf24, 0x38bdf8];
export class ThreeArcade {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(48, 720 / 440, .1, 180);
  private raycaster = new THREE.Raycaster();
  private objects = new Map<object, THREE.Group>();
  private tiles = new Map<number, THREE.Group>();
  private scenery: THREE.Group[] = [];
  private geometries = new Set<THREE.BufferGeometry>();
  private materials = new Map<number, THREE.MeshStandardMaterial>();
  private player = new THREE.Group();
  private keeper = new THREE.Group();
  private ball = new THREE.Group();
  private observer?: ResizeObserver;
  private shotTime = -10;
  private shotX = 0;
  private reactionPanel: THREE.Mesh | null = null;
  private lastScore = 0;
  private disposed = false;
  constructor(private canvas: HTMLCanvasElement, private id: GameId) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    try {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.25 : 1.5));
    this.renderer.shadowMap.enabled = window.innerWidth >= 768;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.scene.background = new THREE.Color(id === "plane" || id === "football" ? 0x9fc6dc : 0x111a2b);
    this.scene.fog = new THREE.Fog(this.scene.background, 40, 105);
    this.scene.add(new THREE.HemisphereLight(0xe4f0ff, 0x374532, 2));
    const sun = new THREE.DirectionalLight(0xffead1, 3); sun.position.set(-12, 24, 15); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -25; sun.shadow.camera.right = 25; sun.shadow.camera.top = 25; sun.shadow.camera.bottom = -25; sun.shadow.normalBias = .04; this.scene.add(sun);
    this.buildScene();
    this.observer = new ResizeObserver(() => { const width = Math.max(1, canvas.clientWidth); this.renderer.setSize(width, width * 440 / 720, false); this.camera.aspect = 720 / 440; this.camera.updateProjectionMatrix(); });
    this.observer.observe(canvas); this.renderer.setSize(Math.max(1, canvas.clientWidth), Math.max(1, canvas.clientWidth) * 440 / 720, false);
    } catch (error) { this.dispose(); throw error; }
  }
  private material(color: number) { if (!this.materials.has(color)) this.materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .15 })); return this.materials.get(color)!; }
  private mesh(group: THREE.Group, geometry: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0) {
    this.geometries.add(geometry); const mesh = new THREE.Mesh(geometry, this.material(color)); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
  }
  private box(group: THREE.Group, w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0) { return this.mesh(group, new THREE.BoxGeometry(w, h, d), color, x, y, z); }
  private sphere(group: THREE.Group, r: number, color: number, x = 0, y = 0, z = 0) { return this.mesh(group, new THREE.SphereGeometry(r, 16, 12), color, x, y, z); }
  private model(kind: string, color = 0x8065d5) {
    const group = new THREE.Group();
    if (kind === "car") {
      this.box(group, 1.45, .5, 2.8, color, 0, .65); this.box(group, 1.18, .55, 1.2, 0x263c50, 0, 1.12, .15);
      this.box(group, 1.4, .12, .15, 0xfef3c7, 0, .78, -1.42);
      this.box(group, 1.48, .14, 2.95, 0x172332, 0, .35);
      this.box(group, 1.08, .42, .05, 0x7298ae, 0, 1.08, -.48);
      this.box(group, 1.08, .36, .05, 0x476579, 0, 1.08, .78);
      this.box(group, .22, .025, 2.55, 0xe9edf2, 0, .915);
      for (const side of [-1,1]) { this.box(group, .22, .13, .24, color, side * .78, .98, -.22); this.box(group, .04, .26, .95, 0x7298ae, side * .6, 1.1, .14); }
 this.box(group, 1.3, .12, .15, 0xef4444, 0, .75, 1.42);
      for (const x of [-.75, .75]) for (const z of [-.85, .85]) { const wheel = this.mesh(group, new THREE.CylinderGeometry(.32, .32, .2, 12), 0x141820, x, .38, z); wheel.rotation.z = Math.PI / 2; const hub = this.mesh(group, new THREE.CylinderGeometry(.17, .17, .215, 12), 0x94a3b8, x, .38, z); hub.rotation.z = Math.PI / 2; }
    } else if (kind === "person") {
      this.box(group, .6, .9, .4, color, 0, 1.15); this.sphere(group, .23, 0xd7a47c, 0, 1.85);
      for (const x of [-.2, .2]) { this.box(group, .18, .8, .22, 0x26364a, x, .4); this.box(group, .18, .75, .18, color, x * 2, 1.1); }
    } else if (kind === "plane") {
      const body = this.mesh(group, new THREE.CapsuleGeometry(.22, 1.5, 4, 12), color, 0, .1); body.rotation.x = Math.PI / 2;
      this.box(group, 2.4, .08, .6, color, 0, .05, .1); this.box(group, .9, .07, .35, color, 0, .15, .9); this.box(group, .06, .6, .35, color, 0, .35, .8); this.sphere(group, .23, 0x23404f, 0, .26, -.2);
    } else if (kind === "drone") {
      this.sphere(group, .45, color); this.sphere(group, .18, 0xff5948, 0, 0, .4);
      this.box(group, 2, .1, .15, 0x475569); for (const x of [-.85, .85]) this.mesh(group, new THREE.TorusGeometry(.35, .07, 6, 16), 0x94a3b8, x, .1).rotation.x = Math.PI / 2;
    } else if (kind === "egg") { const egg = this.sphere(group, .36, color); egg.scale.y = 1.25; }
    else if (kind === "coin") this.mesh(group, new THREE.TorusGeometry(.32, .12, 8, 16), 0xffce51);
    else if (kind === "target") { this.mesh(group, new THREE.CylinderGeometry(.7,.7,.18,32), 0xf8fafc).rotation.x=Math.PI/2; this.mesh(group,new THREE.TorusGeometry(.46,.09,8,32),0xe85c55,0,0,.12); this.sphere(group,.16,0xe85c55,0,0,.14); }
    else if (kind === "basket") { this.box(group,1.8,.15,1,0xb47c42); for(const side of [-1,1]){this.box(group,1.8,.45,.12,0xd7a560,0,.25,side*.5);this.box(group,.12,.45,1,0xd7a560,side*.9,.25);} }
    else if (kind === "rock") this.mesh(group, new THREE.DodecahedronGeometry(.7), 0x74818d);
    else if (kind === "bird") { this.sphere(group, .38, 0xffc531); this.sphere(group, .18, 0xf1f5f9, .22, .1, -.18); this.mesh(group, new THREE.ConeGeometry(.13, .35, 6), 0xf97316, .42).rotation.z = -Math.PI / 2; }
    else if (kind === "ball") { this.sphere(group, .3, 0xf1f5f9); for (let i = 0; i < 6; i++) this.sphere(group, .085, 0x182232, Math.sin(i) * .26, Math.cos(i) * .26, .1); }
    else this.box(group, .8, .8, .8, color);
    return group;
  }
  private buildScene() {
    const environment = new THREE.Group(); this.scene.add(environment);
    const chase = this.id === "race" || this.id === "runner";
    if (chase) {
      this.box(environment, 11, .2, 100, 0x252b34, 0, -.1, -28);
      for (const side of [-1,1]) { this.box(environment,.15,.55,100,0x65798c,side*5.3,.4,-28); this.box(environment,.1,.025,100,0xffce73,side*4.7,.02,-28); for(let i=0;i<12;i++){this.box(environment,.12,4,.12,0x475569,side*6.4,2,-i*8);this.box(environment,1.2,.12,.3,0xf6d89d,side*6,4,-i*8);} }

      for (let i = 0; i < 25; i++) { const group = new THREE.Group(); for (const x of [-1.5, 1.5]) this.box(group, .08, .02, 1.5, 0xe2e8f0, x); group.position.z = -i * 4; this.scene.add(group); this.scenery.push(group); }
      for (let i = 0; i < 20; i++) for (const side of [-1, 1]) { const height = 5 + i % 6 * 2; this.box(environment, 5, height, 5, 0x263449 + i % 3 * 0x070707, side * (10 + i % 3), height / 2, -i * 6); for (let floor = 1; floor < height; floor += 2) this.box(environment, 3, .2, .05, 0x84a8bd, side * (10 + i % 3), floor, -i * 6 + 2.55); }
      this.player = this.model(this.id === "race" ? "car" : "person"); this.scene.add(this.player);
      this.camera.position.set(0, 5, 13); this.camera.lookAt(0, 1, -8);
    } else if (this.id === "football") {
      this.box(environment, 35, .15, 65, 0x287c47, 0, -.15, -14);
      for (let i = 0; i < 12; i++) this.box(environment, 30, .01, 2.5, i % 2 ? 0x31864c : 0x2b7d45, 0, -.06, -i * 4);
      for (const x of [-5, 5]) this.box(environment, .15, 3.5, .15, 0xffffff, x, 1.75, -12);
      this.box(environment, 10.2, .15, .15, 0xffffff, 0, 3.5, -12);
      for (let x = -5; x <= 5; x += .4) this.box(environment, .025, 3.5, .025, 0xc9d9dc, x, 1.75, -13.5);
      for (let y = .2; y < 3.5; y += .4) this.box(environment, 10, .025, .025, 0xc9d9dc, 0, y, -13.5);
      for (let side = -1; side <= 1; side += 2) for (let row = 0; row < 5; row++) this.box(environment, 5, .7, 60, 0x445361, side * (20 + row), row * .7, -15);
      this.ball = this.model("ball"); this.keeper = this.model("person", 0xef5b65); this.scene.add(this.ball, this.keeper);
      this.camera.position.set(0, 5, 15); this.camera.lookAt(0, 1, -9);
    } else if (this.id === "fps") {
      this.box(environment, 40, .15, 65, 0x293342, 0, -.15, -14); this.box(environment, 40, 10, .3, 0x354052, 0, 5, -35);
      for (const side of [-1, 1]) { this.box(environment, .3, 10, 65, 0x263446, side * 20, 5, -14); for (let i = 0; i < 8; i++) this.box(environment, .1, .15, 4, 0x60bfff, side * 19.7, 3, -i * 7); }
      for (let i = 0; i < 8; i++) this.box(environment, 2, 2 + i % 2, 2, 0x546477, (i % 2 ? 1 : -1) * 9, 1, -5 - i * 4);
      this.camera.position.set(0, 2.8, 10); this.camera.lookAt(0, 2.8, -15);
      this.player = new THREE.Group(); this.box(this.player, .25, .25, 1.4, 0x303b48, .65, -.5, -1); this.box(this.player, .1, .1, .65, 0x93a3b3, .65, -.45, -1.7); this.camera.add(this.player); this.scene.add(this.camera);
    } else if (this.id === "plane") {
      this.box(environment, 130, .2, 130, 0x356a50, 0, -4, -25);
      for (let i = 0; i < 25; i++) { const mountain = this.mesh(environment, new THREE.ConeGeometry(3 + i % 5, 4 + i % 7, 6), 0x537b69, Math.sin(i * 2.4) * 40, -1, -i * 4); mountain.rotation.y = i; }
      for (let i = 0; i < 12; i++) { const cloud = new THREE.Group(); for (let j = 0; j < 4; j++) this.sphere(cloud, 1.5, 0xe4edf2, j * .9, Math.sin(j), 0); cloud.position.set(Math.sin(i * 3) * 25, 12 + i % 3, -i * 9); this.scene.add(cloud); this.scenery.push(cloud); }
      this.player = this.model("plane", 0xd8e3e9); this.scene.add(this.player); this.camera.position.set(0, 16, 20); this.camera.lookAt(0, 5, -10);
    } else {
      this.camera.position.set(0, 14, 20); this.camera.lookAt(0, 0, 0);
      this.box(environment, 24, .4, 16, 0x16273a, 0, -.5); this.box(environment, 25, .2, .25, 0x527894, 0, -.3, -8);
      this.player = this.model(this.id === "flappy" ? "bird" : this.id === "asteroids" ? "plane" : this.id === "egg" ? "egg" : this.id === "catch" ? "basket" : this.id === "invaders" || this.id === "dodge" ? "plane" : "cube", 0xa78bfa); this.scene.add(this.player);
      if (this.id === "reaction") this.reactionPanel = this.box(environment, 15, .2, 8, 0xbe123c);
    }
  }
  private boardPoint(x: number, y: number) { return new THREE.Vector3((x - 360) / 30, .25, (y - 220) / 28); }
  private place(group: THREE.Group, x: number, y: number) {
    if (this.id === "fps") group.position.set((x - 360) / 22, (440 - y) / 50, -8 - (y % 40) / 5);
    else if (this.id === "race" || this.id === "runner") group.position.set((x - 360) / 50, .2, y / 12 - 25);
    else if (this.id === "plane") group.position.set((x - 360) / 35, (440 - y) / 50 + 1.5, (y - 370) / 16);
    else group.position.copy(this.boardPoint(x, y));
  }
  update(world: ArcadeWorld, pointer: { x: number; y: number } | null) {
    const chase = this.id === "race" || this.id === "runner";
    if (chase) {
      const target = (world.lane - 1) * 3; this.player.position.x += (target - this.player.position.x) * .18; this.player.position.z = 355 / 12 - 25;
      this.player.position.y = this.id === "runner" ? Math.sin(world.jump / .8 * Math.PI) * 2 : .05;
      this.player.scale.y = world.duck > 0 ? .6 : 1; this.player.rotation.z = this.id === "race" ? (target - this.player.position.x) * -.035 : 0;
      if (this.id === "runner") { this.player.children.slice(2).forEach((limb, i) => { limb.rotation.x = Math.sin(world.time * 12 + i * Math.PI) * .45; }); }
      this.scenery.forEach((item, i) => { item.position.z = ((world.time * (13 + world.time * .2) + i * 4) % 100) - 80; });
      this.camera.position.x = this.player.position.x * .35; this.camera.lookAt(this.player.position.x * .3, 1, -8);
    } else if (this.id === "plane") {
      this.place(this.player, world.x, world.y); this.player.rotation.z = Math.sin(world.time) * .03;
      this.scenery.forEach((item, i) => { item.position.z = (world.time * 6 + i * 9) % 120 - 100; });
    } else if (this.id === "football") {
      this.keeper.position.set(Math.sin(world.time * 2) * 4.72, 0, -11.8);
      if (world.round !== this.lastScore) { this.lastScore = world.round; this.shotTime = world.time; this.shotX = (world.x - 360) / 34; }
      const flight = Math.min(1, (world.time - this.shotTime) / .65);
      this.ball.position.set(flight < 1 ? this.shotX : (world.x - 360) / 34, flight < 1 ? .35 + Math.sin(flight * Math.PI) * 2 : .35, flight < 1 ? 5 - flight * 18 : 5); this.ball.rotation.x = world.time * 2;
    } else if (this.id === "fps") {
      this.camera.position.x = (world.x - 360) / 100 + (pointer ? (pointer.x - 360) / 600 : 0);
      this.camera.lookAt(this.camera.position.x, 2.8, -15); this.player.position.z = Math.exp(-Math.max(0, world.time - this.shotTime) * 15) * .2;
    } else if (this.id === "pong" || this.id === "snake") { this.player.visible = false; }
    else if (this.id === "breakout") { this.player.position.copy(this.boardPoint(world.angle, 405)); this.player.scale.set(3.4, .45, .4); }
    else if (this.id === "egg") { this.player.position.copy(this.boardPoint(360, 400)); this.player.scale.set(1, 1, 1); this.player.traverse(child => { if (child instanceof THREE.Mesh) child.material = this.material(palette[world.egg]); }); }
    else if (this.id === "reaction") { this.player.visible = false; if (this.reactionPanel) this.reactionPanel.material = this.material(world.ready ? 0x059669 : 0xbe123c); }
    else { this.place(this.player, world.x, world.y); if (this.id === "asteroids") this.player.rotation.y = -world.angle - Math.PI / 2; if (this.id === "catch") this.player.scale.set(1.2, 1, 1); }
    const seen = new Set<object>();
    for (const object of world.objects) {
      seen.add(object); let mesh = this.objects.get(object);
      if (!mesh) {
        mesh = this.model(this.id === "race" ? "car" : this.id === "aim" ? "target" : this.id === "plane" ? "plane" : this.id === "fps" || this.id === "invaders" ? "drone" : this.id === "asteroids" ? "rock" : (this.id === "runner" && object.kind === 2) || (this.id === "catch" && object.kind === 0) ? "coin" : "cube", 0xf56c62);
        this.scene.add(mesh); this.objects.set(object, mesh);
      }
      this.place(mesh, object.x, object.y); mesh.userData.point = { x: object.x, y: object.y };
      if (this.id === "aim") { mesh.scale.set(1.2, 1.2, 1.2); mesh.rotation.y = world.time; }
      if (this.id === "asteroids") { mesh.scale.setScalar(object.r / 24); mesh.rotation.y += .005; }
      if (this.id === "runner") { if (object.kind === 2) mesh.rotation.y = world.time * 2; else { mesh.scale.set(2.2, object.kind === 1 ? .35 : .9, .5); mesh.position.y = object.kind === 1 ? 2 : .5; } }
      if (this.id === "flappy") {
        mesh.scale.set(1.3, 2, 1); mesh.visible = false;
        this.tile(1000 + world.objects.indexOf(object) * 2, true, () => this.model("cube", 0x3e9d72)).position.copy(this.boardPoint(object.x, object.y - 160));
        this.tile(1001 + world.objects.indexOf(object) * 2, true, () => this.model("cube", 0x3e9d72)).position.copy(this.boardPoint(object.x, object.y + 160));
      }
    }
    for (const shot of world.shots) { seen.add(shot); let mesh = this.objects.get(shot); if (!mesh) { mesh = this.model(this.id === "egg" ? "egg" : "cube", this.id === "egg" ? palette[shot.kind!] : shot.kind === 1 ? 0xef4444 : 0xffdd72); if (this.id !== "egg") mesh.scale.set(.18, .18, .5); this.scene.add(mesh); this.objects.set(shot, mesh); } this.place(mesh, shot.x, shot.y); }
    for (const [key, mesh] of this.objects) if (!seen.has(key)) { this.scene.remove(mesh); this.objects.delete(key); this.releaseGroup(mesh); }
    if (this.id === "snake") {
      world.snake.forEach((cell, i) => { const mesh = this.tile(i, true, () => this.model("cube", i ? 0x34d399 : 0xa7f3d0)); mesh.position.copy(this.boardPoint(cell[0] * 24 + 12, cell[1] * 24 + 12)); mesh.scale.set(.7, .5, .7); });
      this.tile(999, true, () => this.model("egg", 0xfb7185)).position.copy(this.boardPoint(world.food[0] * 24 + 12, world.food[1] * 24 + 12));
    }
    if (this.id === "egg" || this.id === "breakout") world.grid.forEach((value, i) => {
      const valid = this.id === "egg" ? value >= 0 : !!value; const mesh = this.tile(i, valid, () => this.model(this.id === "egg" ? "egg" : "cube", palette[this.id === "egg" ? Math.max(0, value) : Math.floor(i / 10)]));
      if (this.id === "egg") { mesh.position.copy(this.boardPoint(225 + i % 10 * 30, 35 + Math.floor(i / 10) * 30)); mesh.traverse(child => { if (child instanceof THREE.Mesh) child.material = this.material(palette[Math.max(0, value)]); }); }
      else { mesh.position.copy(this.boardPoint(47 + i % 10 * 69, 45 + Math.floor(i / 10) * 27)); mesh.scale.set(2, .5, .8); }
    });
    if (this.id === "pong") { this.tile(0, true, () => this.model("ball")).position.copy(this.boardPoint(world.x, world.y)); for (const [i, x, y] of [[1, 24, world.angle], [2, 696, world.wait]]) { const mesh = this.tile(i, true, () => this.model("cube", i === 1 ? 0xa78bfa : 0xfb7185)); mesh.position.copy(this.boardPoint(x, y)); mesh.scale.set(.35, .7, 3.3); } }
    if (this.id === "breakout") this.tile(999, true, () => this.model("ball")).position.copy(this.boardPoint(world.x, world.y));
    if (this.id === "flappy") for (const [key, mesh] of this.tiles) { const object = world.objects[Math.floor((key - 1000) / 2)]; mesh.visible = !!object; if (object) { const top = key % 2 === 0, edge = top ? object.y - 75 : object.y + 75, center = top ? edge / 2 : (edge + 440) / 2; mesh.position.copy(this.boardPoint(object.x, center)); mesh.scale.set(1.5, 1.2, Math.max(.1, (top ? edge : 440 - edge) / 28)); } }
    this.renderer.render(this.scene, this.camera);
  }
  private tile(key: number, visible: boolean, create: () => THREE.Group) { let mesh = this.tiles.get(key); if (!mesh) { mesh = create(); this.scene.add(mesh); this.tiles.set(key, mesh); } mesh.visible = visible; return mesh; }
  click(world: ArcadeWorld, x: number, y: number) {
    this.shotTime = world.time;
    this.raycaster.setFromCamera(new THREE.Vector2(x / 720 * 2 - 1, 1 - y / 440 * 2), this.camera);
    if (this.id === "fps" || this.id === "aim") { const hit = this.raycaster.intersectObjects([...this.objects.values()], true)[0]; let target: THREE.Object3D | null = hit?.object ?? null; while (target && !target.userData.point) target = target.parent; if (target?.userData.point) world.click(target.userData.point.x, target.userData.point.y); else world.score = Math.max(0, world.score - 1); }
    else if (this.id === "egg") { const point = new THREE.Vector3(); if (this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -.25), point)) world.click(point.x * 30 + 360, point.z * 28 + 220); }
    else if (this.id === "football") { const point = new THREE.Vector3(); if (this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 12), point)) world.click(point.x * 34 + 360, y); }
    else world.click(x, y);
  }
  private releaseGroup(group: THREE.Group) { group.traverse(child => { if (child instanceof THREE.Mesh) { child.geometry.dispose(); this.geometries.delete(child.geometry); } }); }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.observer?.disconnect();
    this.scene.traverse(object => {
      if (object instanceof THREE.Light && "shadow" in object) (object as THREE.DirectionalLight).shadow?.dispose();
      if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
      }
    });
    this.geometries.forEach(geometry => geometry.dispose()); this.geometries.clear();
    this.materials.forEach(material => material.dispose()); this.materials.clear();
    this.objects.clear(); this.tiles.clear(); this.scenery.length = 0;
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.scene.clear();
  }
}
