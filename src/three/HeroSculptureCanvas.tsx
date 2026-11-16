import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  createAfterDrawPacer,
  createStudioEnvironment,
  createWeaveBumpTexture,
  detectSoftwareGl,
  disposeSceneResources,
  prefersReducedMotion,
} from './threeUtils';

interface HeroSculptureCanvasProps {
  scrollProgressRef?: React.MutableRefObject<number>;
}

export function HeroSculptureCanvas({ scrollProgressRef }: HeroSculptureCanvasProps = {}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const reducedMotion = prefersReducedMotion();
    const isSoftwareGl = detectSoftwareGl();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setFallbackActive(true);
      return;
    }

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    renderer.setClearColor(0x000000, 0);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envTexture = createStudioEnvironment(renderer, scene);

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 40);
    camera.position.set(0, 0.25, 6.2);

    const hemi = new THREE.HemisphereLight(0xf3efe7, 0x2b2523, 0.52);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff1de, 1.55);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xb8a58c, 1.25);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    // Composite 7-part futuristic-minimalist fashion silhouette sculpture
    const sculpture = new THREE.Group();
    const weaveBump = createWeaveBumpTexture();

    // Part 1: Undulating woven silk-drape Möbius loop
    const ribbonGeo = new THREE.TorusKnotGeometry(1.06, 0.22, 128, 26, 2, 3);
    const silkMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4c7b4,
      roughness: 0.45,
      metalness: 0.12,
      sheen: 1.0,
      sheenColor: new THREE.Color(0xf3efe7),
      sheenRoughness: 0.38,
      clearcoat: 0.22,
      clearcoatRoughness: 0.32,
      bumpMap: weaveBump,
      bumpScale: 0.012,
    });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, silkMat);
    sculpture.add(ribbonMesh);

    // Part 2: Brushed champagne-titanium structural collar ring
    const ringGeo = new THREE.TorusGeometry(1.56, 0.036, 20, 96);
    const bronzeMat = new THREE.MeshPhysicalMaterial({
      color: 0xa68f72,
      roughness: 0.24,
      metalness: 0.92,
      anisotropy: 0.8,
    });
    const outerRing = new THREE.Mesh(ringGeo, bronzeMat);
    outerRing.rotation.set(Math.PI / 2.6, 0.35, 0);
    sculpture.add(outerRing);

    // Part 3: Secondary fine precision meridian ring
    const meridianGeo = new THREE.TorusGeometry(1.4, 0.015, 16, 84);
    const meridianRing = new THREE.Mesh(meridianGeo, bronzeMat);
    meridianRing.rotation.set(Math.PI / 2.1, -0.5, 0.25);
    sculpture.add(meridianRing);

    // Part 4: Inner obsidian counter-ring (matte/gloss material contrast)
    const innerRingGeo = new THREE.TorusGeometry(0.84, 0.022, 16, 72);
    const obsidianMat = new THREE.MeshPhysicalMaterial({
      color: 0x1b1b1b,
      roughness: 0.16,
      metalness: 0.68,
      clearcoat: 0.82,
      clearcoatRoughness: 0.14,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, obsidianMat);
    innerRing.rotation.set(-Math.PI / 3.2, -0.45, 0.2);
    sculpture.add(innerRing);

    // Part 5: Optical glass blade arc (futuristic minimalist depth)
    const glassArcGeo = new THREE.TorusGeometry(1.7, 0.026, 16, 72, Math.PI * 0.92);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5f1ea,
      roughness: 0.12,
      metalness: 0.04,
      transmission: isSoftwareGl ? 0 : 0.65,
      transparent: true,
      opacity: isSoftwareGl ? 0.36 : 0.92,
      ior: 1.48,
      thickness: 0.45,
      clearcoat: 1.0,
    });
    const glassArc = new THREE.Mesh(glassArcGeo, glassMat);
    glassArc.rotation.set(0.35, 0.25, 0.7);
    sculpture.add(glassArc);

    // Part 6 & 7: Sweeping architectural bias-cut cloth filaments
    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.35, -0.9, 0.4),
      new THREE.Vector3(-0.4, 0.65, 0.85),
      new THREE.Vector3(0.95, 0.9, -0.3),
      new THREE.Vector3(1.3, -0.6, -0.55),
    ]);
    const filamentGeo1 = new THREE.TubeGeometry(curve1, 56, 0.026, 14, false);
    sculpture.add(new THREE.Mesh(filamentGeo1, bronzeMat));

    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.2, 0.8, 0.45),
      new THREE.Vector3(0.2, -0.75, 0.8),
      new THREE.Vector3(-1.1, -0.45, -0.4),
      new THREE.Vector3(-0.9, 1.05, -0.35),
    ]);
    const filamentGeo2 = new THREE.TubeGeometry(curve2, 56, 0.018, 12, false);
    sculpture.add(new THREE.Mesh(filamentGeo2, silkMat));

    scene.add(sculpture);

    const targetTilt = { x: 0, y: 0 };
    const currentTilt = { x: 0, y: 0 };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetTilt.y = THREE.MathUtils.clamp(nx * 0.28, -0.35, 0.35);
      targetTilt.x = THREE.MathUtils.clamp(ny * 0.2, -0.25, 0.25);
    };

    const handlePointerLeave = () => {
      targetTilt.x = 0;
      targetTilt.y = 0;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let disposed = false;
    const pacer = createAfterDrawPacer(renderer);
    const startMs = performance.now();
    let prevMs = startMs;
    let baseYaw = 0;

    const renderFrame = () => {
      if (disposed) return;
      const nowMs = performance.now();
      const dt = Math.min((nowMs - prevMs) / 1000, 0.05);
      const elapsed = (nowMs - startMs) / 1000;
      prevMs = nowMs;

      if (!reducedMotion) {
        sculpture.position.y = Math.sin(elapsed * 0.75) * 0.09;
        baseYaw += dt * 0.18;
        const scrollYaw = (scrollProgressRef?.current ?? 0) * Math.PI * 0.65;
        sculpture.rotation.y = baseYaw + scrollYaw;
        outerRing.rotation.z += dt * 0.12;
        meridianRing.rotation.x -= dt * 0.09;
        innerRing.rotation.z -= dt * 0.16;
        glassArc.rotation.z += dt * 0.07;
      }

      currentTilt.x = THREE.MathUtils.damp(currentTilt.x, targetTilt.x, 4, dt);
      currentTilt.y = THREE.MathUtils.damp(currentTilt.y, targetTilt.y, 4, dt);
      sculpture.rotation.x = 0.18 + currentTilt.x;
      sculpture.rotation.z = currentTilt.y * 0.35;

      renderer.render(scene, camera);

      if (reducedMotion) return;
      if (isSoftwareGl) {
        pacer.afterDraw(renderFrame);
      } else {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      pacer.cancel();
      window.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      envTexture.dispose();
      disposeSceneResources(scene);
      renderer.dispose();
    };
  }, []);

  if (fallbackActive) {
    return (
      <div
        aria-hidden="true"
        className="w-full h-full flex items-center justify-center pointer-events-none"
      >
        <div className="w-48 h-48 rounded-full border border-[#B8A58C]/50 bg-[#E6DDD0]/40" />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      data-testid="hero-3d-canvas"
      aria-label="Interactive sculptural silk and titanium form"
      className="w-full h-full pointer-events-none"
    />
  );
}
