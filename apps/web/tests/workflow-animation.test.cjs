const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('exported workflow keeps loads attached and closes its twelve-second loop', async () => {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const bytes = fs.readFileSync(path.join(__dirname, '../public/models/workflow.glb'));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  assert.ok(gltf.animations.length > 0);
  for (const clip of gltf.animations) assert.ok(Math.abs(clip.duration - 12) < .001);
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const actions = gltf.animations.map(clip => {
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play();
    return action;
  });
  const workers = [];
  gltf.scene.traverse(object => {
    if (/Worker.*held_carton/.test(object.name)) workers.push(object);
  });
  assert.equal(workers.length, 4, 'all four workers carry a carton');
  for (const carton of workers) assert.match(carton.parent.name, /Worker.*upper_body/);
  const localGrasps = workers.map(object => object.matrix.clone());
  const tracked = [];
  gltf.scene.traverse(object => { if (!object.isMesh && object !== gltf.scene) tracked.push(object); });
  const poses = [];
  for (let frame = 0; frame <= 288; frame++) {
    actions.forEach(action => { action.paused = false; }); mixer.setTime(frame / 24); gltf.scene.updateMatrixWorld(true);
    for (const object of tracked) assert.ok(object.matrixWorld.elements.every(Number.isFinite), `${object.name} at frame ${frame}`);
    workers.forEach((carton, i) => assert.ok(carton.matrix.equals(localGrasps[i]), `load detached at frame ${frame}`));
    if (frame === 0 || frame === 288) poses.push(tracked.map(object => object.matrixWorld.clone()));
  }
  tracked.forEach((object, i) => {
    const delta = Math.max(...poses[0][i].elements.map((value, j) => Math.abs(value - poses[1][i].elements[j])));
    assert.ok(delta < .002, `${object.name} jumps ${delta} at the loop seam`);
  });
  for (const name of ['Orange_dispatch_truck', 'Forklift_lifting_carriage', 'Autonomous_delivery_robot', 'Hovering_parcel_drone']) {
    const object = gltf.scene.getObjectByName(name); assert.ok(object, name);
    const channels = gltf.animations.flatMap(clip => clip.tracks).filter(track => track.name.startsWith(object.name + '.'));
    assert.ok(channels.some(track => new Set(track.values).size > track.getValueSize()), `${name} must move`);
  }
  mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
});
