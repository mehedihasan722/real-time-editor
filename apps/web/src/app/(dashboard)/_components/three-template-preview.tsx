"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeTemplatePreview() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 8);
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 0.12);
    const colors = [0xffd659, 0xb9a8ff, 0x91d5ca];
    const cards = colors.map((color, index) => {
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color }));
      mesh.position.set((index - 1) * 0.85, (index - 1) * -0.25, index * 0.4);
      mesh.rotation.z = (index - 1) * -0.2;
      scene.add(mesh);
      return mesh;
    });
    const resize = () => { const { width, height } = element.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); };
    resize();
    const observer = new ResizeObserver(resize); observer.observe(element);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const animate = (time: number) => { cards.forEach((card, i) => { card.rotation.y = Math.sin(time * 0.0006 + i) * 0.15; }); renderer.render(scene, camera); if (!reduceMotion) frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); geometry.dispose(); cards.forEach(card => (card.material as THREE.Material).dispose()); renderer.dispose(); renderer.domElement.remove(); };
  }, []);
  return <div ref={host} className="h-full w-full" aria-hidden="true" />;
}
