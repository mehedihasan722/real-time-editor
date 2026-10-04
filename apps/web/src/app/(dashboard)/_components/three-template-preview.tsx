"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function ThreeTemplatePreview({ model = "ideas" }: { model?: "ideas" | "tasks" | "roadmap" | "workspace" }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const art = element.closest<HTMLElement>(".home-carousel__art");
    element.style.backgroundImage = `url(/models/${model}.png)`;
    element.style.backgroundSize = "contain";
    element.style.backgroundPosition = "center";
    element.style.backgroundRepeat = "no-repeat";
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); }
    catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.shadowMap.enabled = window.matchMedia("(min-width: 768px)").matches;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.opacity = "0";
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8797ba, 1.0));
    const light = new THREE.DirectionalLight(0xffffff, 2.4); light.position.set(3, 7, 5);
    light.castShadow = true; light.shadow.mapSize.set(512, 512);
    Object.assign(light.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, far: 30 });
    light.shadow.bias = -0.001; scene.add(light);
    const pivot = new THREE.Group(); scene.add(pivot);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, disposed = false, visible = true, radius = 3, loaded = false, previousTime = 0;
    let mixer: THREE.AnimationMixer | undefined;
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    const collect = (object: THREE.Object3D) => object.traverse(child => {
      if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true; geometries.add(child.geometry); for (const material of Array.isArray(child.material) ? child.material : [child.material]) materials.add(material); }
    });
    const disposeModel = () => { geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); };
    const reduced = () => media.matches || document.documentElement.classList.contains("reduce-motion");
    const draw = (time: number) => {
      frame = 0;
      if (disposed || !visible || document.hidden || !loaded) return;
      pivot.rotation.y = reduced() || model === "workspace" ? 0 : Math.sin(time * 0.00035) * 0.12;
      pivot.rotation.z = reduced() || model === "workspace" ? 0 : Math.sin(time * 0.00025) * 0.025;
      if (reduced()) mixer?.setTime(2);
      else mixer?.update(previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0);
      previousTime = time;
      renderer.render(scene, camera);
      if (!reduced()) frame = requestAnimationFrame(draw);
    };
    const resume = () => { cancelAnimationFrame(frame); frame = 0; previousTime = 0; if (!disposed && visible && !document.hidden && loaded) frame = requestAnimationFrame(draw); };
    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      renderer.setSize(Math.max(width, 1), Math.max(height, 1)); camera.aspect = width / Math.max(height, 1);
      camera.position.copy(new THREE.Vector3(5.4, 8.4, 7.3).normalize().multiplyScalar(radius * (model === "workspace" ? 3.3 : 2.4) / Math.min(camera.aspect, 1)));
      camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); resume();
    };
    const controller = new AbortController();
    fetch(`/models/${model}.glb`, { signal: controller.signal }).then(response => { if (!response.ok) throw new Error("Model unavailable"); return response.arrayBuffer(); }).then(buffer => new GLTFLoader().parseAsync(buffer, "/models/")).then(gltf => {
      collect(gltf.scene);
      if (disposed) { disposeModel(); return; }
      const bounds = new THREE.Box3().setFromObject(gltf.scene);
      gltf.scene.position.sub(bounds.getCenter(new THREE.Vector3())); radius = bounds.getBoundingSphere(new THREE.Sphere()).radius;
      pivot.add(gltf.scene); loaded = true; resize(); renderer.domElement.style.opacity = "1";
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(gltf.scene);
        gltf.animations.forEach(clip => mixer!.clipAction(clip).play());
        mixer.setTime(2);
      }
      element.style.backgroundImage = "none";
      if (art) art.dataset.modelLoaded = "true";
    }).catch(() => { /* Rendered Blender posters remain available when WebGL or model loading fails. */ });
    const observer = new ResizeObserver(resize); observer.observe(element);
    const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume(); }); visibility.observe(element);
    const preferences = new MutationObserver(resume); preferences.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    media.addEventListener("change", resume); document.addEventListener("visibilitychange", resume);
    const lost = (event: Event) => { event.preventDefault(); renderer.domElement.style.opacity = "0"; element.style.backgroundImage = `url(/models/${model}.png)`; if (art) delete art.dataset.modelLoaded; loaded = false; resume(); };
    renderer.domElement.addEventListener("webglcontextlost", lost); resize();
    return () => {
      disposed = true; controller.abort(); cancelAnimationFrame(frame); observer.disconnect(); visibility.disconnect(); preferences.disconnect();
      if (art) delete art.dataset.modelLoaded;
      media.removeEventListener("change", resume); document.removeEventListener("visibilitychange", resume); renderer.domElement.removeEventListener("webglcontextlost", lost);
      mixer?.stopAllAction();
      if (mixer) mixer.uncacheRoot(mixer.getRoot());
      disposeModel(); light.shadow.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [model]);
  return <div ref={host} className="h-full w-full" aria-hidden="true" />;
}
