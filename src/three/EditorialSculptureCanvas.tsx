import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  createAfterDrawPacer,
  createStudioEnvironment,
  createWeaveBumpTexture,
  detectSoftwareGl,
  disposeSceneResources,
  prefersReducedMotion,
} from './threeUtils';

export type MaterialPresetId = 'champagne-silk' | 'obsidian-satin' | 'raw-travertine';
export type StudyModeId = 'drape' | 'clasp' | 'eyewear';

interface MaterialPreset {
  id: MaterialPresetId;
  label: string;
  primaryColor: number;
  roughness: number;
  metalness: number;
  sheenColor: number;
  ringColor: number;
}

const PRESETS: Record<MaterialPresetId, MaterialPreset> = {
  'champagne-silk': {
    id: 'champagne-silk',
    label: 'Champagne Silk',
    primaryColor: 0xc2b197,
    roughness: 0.48,
    metalness: 0.1,
    sheenColor: 0xf3efe7,
    ringColor: 0xbda076,
  },
  'obsidian-satin': {
    id: 'obsidian-satin',
    label: 'Obsidian Titanium',
    primaryColor: 0x1b1b1b,
    roughness: 0.22,
    metalness: 0.48,
    sheenColor: 0xb8a58c,
    ringColor: 0xd8d0c5,
  },
  'raw-travertine': {
    id: 'raw-travertine',
    label: 'Warm Travertine',
    primaryColor: 0xb8a58c,
    roughness: 0.68,
    metalness: 0.06,
    sheenColor: 0xf3efe7,
    ringColor: 0x171717,
  },
};

const STUDIES: { id: StudyModeId; label: string }[] = [
  { id: 'drape', label: '01 · Silk Drape' },
  { id: 'clasp', label: '02 · Bag & Clasp' },
  { id: 'eyewear', label: '03 · Eyewear' },
];

interface EditorialSculptureCanvasProps {
  scrollProgressRef?: React.MutableRefObject<number>;
  studyMode?: StudyModeId;
  onStudyChange?: (study: StudyModeId) => void;
}

function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function buildDrapedFormGroup(
  mainSilkMat: THREE.MeshPhysicalMaterial,
  accentMetalMat: THREE.MeshPhysicalMaterial,
  translucentGlassMat: THREE.MeshPhysicalMaterial
) {
  const group = new THREE.Group();

  // Part 1: Flowing draped lathe column
  const profilePoints: THREE.Vector2[] = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    const y = (t - 0.5) * 3.1;
    const r = 0.56 + Math.sin(t * Math.PI * 2.2) * 0.26 + Math.cos(t * Math.PI) * 0.14;
    profilePoints.push(new THREE.Vector2(r, y));
  }
  const coreGeo = new THREE.LatheGeometry(profilePoints, 56);
  const coreMesh = new THREE.Mesh(coreGeo, mainSilkMat);
  group.add(coreMesh);

  // Part 2 & 3: Twin sweeping bias-drape ribbon loops
  const ribbonPoints1: THREE.Vector3[] = [];
  const ribbonPoints2: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    ribbonPoints1.push(
      new THREE.Vector3(
        Math.cos(a) * (1.28 + Math.sin(a * 2) * 0.18),
        Math.sin(a * 2) * 0.92,
        Math.sin(a) * (1.28 + Math.cos(a * 2) * 0.18)
      )
    );
    ribbonPoints2.push(
      new THREE.Vector3(
        Math.cos(a + 0.8) * 1.55,
        Math.cos(a * 2) * 0.68,
        Math.sin(a + 0.8) * 1.15
      )
    );
  }
  const tubeGeo1 = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ribbonPoints1, true), 96, 0.075, 16, true);
  const tubeGeo2 = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ribbonPoints2, true), 96, 0.032, 14, true);

  group.add(new THREE.Mesh(tubeGeo1, mainSilkMat));
  group.add(new THREE.Mesh(tubeGeo2, accentMetalMat));

  // Part 4 & 5: Architectural brass/taupe clasp collars
  const collarGeo = new THREE.TorusGeometry(0.95, 0.025, 16, 72);
  const collarTop = new THREE.Mesh(collarGeo, accentMetalMat);
  collarTop.rotation.set(Math.PI / 2.2, 0.2, 0);
  collarTop.position.y = 0.72;
  group.add(collarTop);

  const collarBottom = new THREE.Mesh(collarGeo, accentMetalMat);
  collarBottom.rotation.set(Math.PI / 1.85, -0.25, 0);
  collarBottom.position.y = -0.68;
  group.add(collarBottom);

  // Part 6 & 7: Translucent architectural halo blades
  const bladeGeo = new THREE.TorusGeometry(1.78, 0.042, 18, 84, Math.PI * 1.25);
  const blade1 = new THREE.Mesh(bladeGeo, translucentGlassMat);
  blade1.rotation.set(0.45, 0.3, 0.8);
  group.add(blade1);

  const blade2 = new THREE.Mesh(bladeGeo, translucentGlassMat);
  blade2.rotation.set(-0.55, -0.4, -0.9);
  group.add(blade2);

  return { group, coreMesh, blade1, blade2 };
}

function buildAtelierBagClaspGroup(
  mainLeatherMat: THREE.MeshPhysicalMaterial,
  accentMetalMat: THREE.MeshPhysicalMaterial,
  translucentGlassMat: THREE.MeshPhysicalMaterial
) {
  const group = new THREE.Group();

  // Part 1: Structured architectural bag silhouette (rounded trapezoid extrusion)
  const bagShape = new THREE.Shape();
  bagShape.moveTo(-1.18, -0.82);
  bagShape.lineTo(1.18, -0.82);
  bagShape.quadraticCurveTo(1.28, -0.82, 1.24, -0.68);
  bagShape.lineTo(1.06, 0.62);
  bagShape.quadraticCurveTo(1.02, 0.78, 0.86, 0.78);
  bagShape.lineTo(-0.86, 0.78);
  bagShape.quadraticCurveTo(-1.02, 0.78, -1.06, 0.62);
  bagShape.lineTo(-1.24, -0.68);
  bagShape.quadraticCurveTo(-1.28, -0.82, -1.18, -0.82);

  const bodyGeo = new THREE.ExtrudeGeometry(bagShape, {
    depth: 0.74,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 5,
  });
  bodyGeo.center();
  const bodyMesh = new THREE.Mesh(bodyGeo, mainLeatherMat);
  bodyMesh.position.y = -0.2;
  group.add(bodyMesh);

  // Part 2: Fold-over front architectural flap
  const flapGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(2.14, 0.94, 0.14), {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 4,
  });
  flapGeo.center();
  const flapMesh = new THREE.Mesh(flapGeo, mainLeatherMat);
  flapMesh.position.set(0, 0.16, 0.44);
  flapMesh.rotation.x = -0.04;
  group.add(flapMesh);

  // Part 3: Sculpted arched top leather/metal handle
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.68, 0.62, 0),
    new THREE.Vector3(-0.62, 1.38, 0),
    new THREE.Vector3(0, 1.62, 0),
    new THREE.Vector3(0.62, 1.38, 0),
    new THREE.Vector3(0.68, 0.62, 0),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 56, 0.065, 16, false);
  const handleMesh = new THREE.Mesh(handleGeo, mainLeatherMat);
  group.add(handleMesh);

  // Part 4 & 5: Interlocking brushed metal handle anchor rings
  const anchorRingGeo = new THREE.TorusGeometry(0.11, 0.025, 14, 36);
  const leftAnchor = new THREE.Mesh(anchorRingGeo, accentMetalMat);
  leftAnchor.position.set(-0.68, 0.66, 0);
  leftAnchor.rotation.y = Math.PI / 2;
  group.add(leftAnchor);

  const rightAnchor = new THREE.Mesh(anchorRingGeo, accentMetalMat);
  rightAnchor.position.set(0.68, 0.66, 0);
  rightAnchor.rotation.y = Math.PI / 2;
  group.add(rightAnchor);

  // Part 6 & 7: Center futuristic-minimalist turn-lock clasp + glass bar inlay
  const claspPlateGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(0.46, 0.24, 0.06), {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 3,
  });
  claspPlateGeo.center();
  const claspPlate = new THREE.Mesh(claspPlateGeo, accentMetalMat);
  claspPlate.position.set(0, -0.22, 0.51);
  group.add(claspPlate);

  const turnLockGeo = new THREE.BoxGeometry(0.24, 0.075, 0.1);
  const turnLock = new THREE.Mesh(turnLockGeo, accentMetalMat);
  turnLock.position.set(0, -0.22, 0.56);
  group.add(turnLock);

  const glassInlayGeo = new THREE.BoxGeometry(0.32, 0.045, 0.04);
  const glassInlay = new THREE.Mesh(glassInlayGeo, translucentGlassMat);
  glassInlay.position.set(0, -0.22, 0.59);
  group.add(glassInlay);

  // Side D-ring strap anchors
  const sideRingLeft = new THREE.Mesh(anchorRingGeo, accentMetalMat);
  sideRingLeft.position.set(-1.18, 0.24, 0);
  group.add(sideRingLeft);

  const sideRingRight = new THREE.Mesh(anchorRingGeo, accentMetalMat);
  sideRingRight.position.set(1.18, 0.24, 0);
  group.add(sideRingRight);

  return { group, turnLock };
}

function buildEyewearGroup(
  frameMat: THREE.MeshPhysicalMaterial,
  accentMetalMat: THREE.MeshPhysicalMaterial,
  lensMat: THREE.MeshPhysicalMaterial
) {
  const group = new THREE.Group();

  // Helper to create beveled frame rim with cutout lens aperture
  const rimOuter = createRoundedRectShape(1.12, 0.86, 0.22);
  const lensHole = createRoundedRectShape(0.92, 0.66, 0.16);
  rimOuter.holes.push(lensHole);

  const rimGeo = new THREE.ExtrudeGeometry(rimOuter, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.022,
    bevelSegments: 4,
  });
  rimGeo.center();

  const lensGeo = new THREE.ExtrudeGeometry(lensHole, {
    depth: 0.025,
    bevelEnabled: false,
  });
  lensGeo.center();

  // Left & Right front rims + tinted optical lenses
  const leftRim = new THREE.Mesh(rimGeo, frameMat);
  leftRim.position.set(-0.74, 0.08, 0.42);
  leftRim.rotation.y = 0.09;
  group.add(leftRim);

  const rightRim = new THREE.Mesh(rimGeo, frameMat);
  rightRim.position.set(0.74, 0.08, 0.42);
  rightRim.rotation.y = -0.09;
  group.add(rightRim);

  const leftLens = new THREE.Mesh(lensGeo, lensMat);
  leftLens.position.set(-0.74, 0.08, 0.42);
  leftLens.rotation.y = 0.09;
  group.add(leftLens);

  const rightLens = new THREE.Mesh(lensGeo, lensMat);
  rightLens.position.set(0.74, 0.08, 0.42);
  rightLens.rotation.y = -0.09;
  group.add(rightLens);

  // Architectural double titanium bridge
  const topBridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34, 0.42, 0.46),
    new THREE.Vector3(0, 0.47, 0.5),
    new THREE.Vector3(0.34, 0.42, 0.46),
  ]);
  const topBridge = new THREE.Mesh(
    new THREE.TubeGeometry(topBridgeCurve, 28, 0.024, 12, false),
    accentMetalMat
  );
  group.add(topBridge);

  const lowerBridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.26, 0.16, 0.46),
    new THREE.Vector3(0, 0.21, 0.49),
    new THREE.Vector3(0.26, 0.16, 0.46),
  ]);
  const lowerBridge = new THREE.Mesh(
    new THREE.TubeGeometry(lowerBridgeCurve, 24, 0.02, 12, false),
    accentMetalMat
  );
  group.add(lowerBridge);

  // Sculpted hinged temple arms extending backward
  const buildTemple = (side: -1 | 1) => {
    const hingeGeo = new THREE.BoxGeometry(0.1, 0.09, 0.08);
    const hinge = new THREE.Mesh(hingeGeo, accentMetalMat);
    hinge.position.set(side * 1.28, 0.22, 0.36);
    group.add(hinge);

    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 1.28, 0.22, 0.36),
      new THREE.Vector3(side * 1.32, 0.2, -0.55),
      new THREE.Vector3(side * 1.24, 0.14, -1.25),
      new THREE.Vector3(side * 1.15, -0.18, -1.62),
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 40, 0.032, 12, false);
    const arm = new THREE.Mesh(armGeo, frameMat);
    group.add(arm);
  };

  buildTemple(-1);
  buildTemple(1);

  // Scale slightly up to fill gallery viewport harmoniously
  group.scale.setScalar(1.08);

  return { group };
}

export function EditorialSculptureCanvas({
  scrollProgressRef,
  studyMode: controlledStudy,
  onStudyChange,
}: EditorialSculptureCanvasProps = {}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const presetRef = useRef<MaterialPresetId>('champagne-silk');
  const [preset, setPreset] = useState<MaterialPresetId>('champagne-silk');
  const [internalStudy, setInternalStudy] = useState<StudyModeId>('drape');
  const activeStudy = controlledStudy ?? internalStudy;
  const studyRef = useRef<StudyModeId>(activeStudy);
  const [dockOpen, setDockOpen] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState<'calm' | 'paused'>('calm');
  const speedRef = useRef<'calm' | 'paused'>('calm');
  const [fallbackActive, setFallbackActive] = useState(false);

  useEffect(() => {
    studyRef.current = activeStudy;
  }, [activeStudy]);

  const selectStudy = (next: StudyModeId) => {
    studyRef.current = next;
    setInternalStudy(next);
    onStudyChange?.(next);
  };

  const applyPreset = (next: MaterialPresetId) => {
    presetRef.current = next;
    setPreset(next);
  };

  const toggleMotion = () => {
    const next = rotationSpeed === 'calm' ? 'paused' : 'calm';
    speedRef.current = next;
    setRotationSpeed(next);
  };

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

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 520;

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

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 0.38, 6.8);

    const hemi = new THREE.HemisphereLight(0xf3efe7, 0x111111, 0.46);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff1de, 1.6);
    keyLight.position.set(5, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xb8a58c, 1.25);
    rimLight.position.set(-5, 2, -4);
    scene.add(rimLight);

    // Grounded gallery plinth shadow disc
    const shadowGeo = new THREE.CircleGeometry(2.1, 48);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050505,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = -2.05;
    scene.add(shadowDisc);

    const stage = new THREE.Group();
    const weaveBump = createWeaveBumpTexture();

    const mainSilkMat = new THREE.MeshPhysicalMaterial({
      color: PRESETS['champagne-silk'].primaryColor,
      roughness: PRESETS['champagne-silk'].roughness,
      metalness: PRESETS['champagne-silk'].metalness,
      sheen: 0.85,
      sheenColor: new THREE.Color(PRESETS['champagne-silk'].sheenColor),
      sheenRoughness: 0.42,
      clearcoat: 0.14,
      clearcoatRoughness: 0.32,
      envMapIntensity: 0.68,
      bumpMap: weaveBump,
      bumpScale: 0.014,
      side: THREE.DoubleSide,
    });

    const accentMetalMat = new THREE.MeshPhysicalMaterial({
      color: PRESETS['champagne-silk'].ringColor,
      roughness: 0.2,
      metalness: 0.92,
      anisotropy: 0.85,
    });

    const translucentGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5f1ea,
      roughness: 0.14,
      metalness: 0.05,
      transmission: isSoftwareGl ? 0 : 0.72,
      transparent: true,
      opacity: isSoftwareGl ? 0.42 : 0.95,
      ior: 1.5,
      thickness: 0.8,
      clearcoat: 1.0,
    });

    const smokeLensMat = new THREE.MeshPhysicalMaterial({
      color: 0x22201d,
      roughness: 0.08,
      metalness: 0.12,
      transmission: isSoftwareGl ? 0 : 0.55,
      transparent: true,
      opacity: isSoftwareGl ? 0.68 : 0.88,
      ior: 1.52,
      thickness: 0.2,
      clearcoat: 1.0,
    });

    const drapeBuild = buildDrapedFormGroup(mainSilkMat, accentMetalMat, translucentGlassMat);
    const claspBuild = buildAtelierBagClaspGroup(mainSilkMat, accentMetalMat, translucentGlassMat);
    claspBuild.group.rotation.y = -0.34;
    const eyewearBuild = buildEyewearGroup(mainSilkMat, accentMetalMat, smokeLensMat);
    eyewearBuild.group.rotation.y = 0.36;

    stage.add(drapeBuild.group);
    stage.add(claspBuild.group);
    stage.add(eyewearBuild.group);
    scene.add(stage);

    // Drag rotation interaction
    let isDragging = false;
    let lastX = 0;
    let dragRotationOffset = 0;
    let targetDragOffset = 0;

    const canvasEl = renderer.domElement;
    canvasEl.style.cursor = 'grab';

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      canvasEl.style.cursor = 'grabbing';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      targetDragOffset += dx * 0.008;
    };
    const onPointerUp = () => {
      isDragging = false;
      canvasEl.style.cursor = 'grab';
    };

    canvasEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const targetColor = new THREE.Color(PRESETS['champagne-silk'].primaryColor);
    const targetSheen = new THREE.Color(PRESETS['champagne-silk'].sheenColor);
    const targetRing = new THREE.Color(PRESETS['champagne-silk'].ringColor);

    let rafId = 0;
    let disposed = false;
    const pacer = createAfterDrawPacer(renderer);
    const startMs = performance.now();
    let prevMs = startMs;
    let baseYaw = 0;
    let studyStartMs = startMs;
    let lastStudy: StudyModeId = studyRef.current;

    const tick = () => {
      if (disposed) return;
      const nowMs = performance.now();
      const dt = Math.min((nowMs - prevMs) / 1000, 0.05);
      const elapsed = (nowMs - startMs) / 1000;
      prevMs = nowMs;

      const currentStudy = studyRef.current;
      if (currentStudy !== lastStudy) {
        lastStudy = currentStudy;
        studyStartMs = nowMs;
        baseYaw = 0;
        targetDragOffset = 0;
        dragRotationOffset = 0;
      }
      const studyElapsed = (nowMs - studyStartMs) / 1000;

      drapeBuild.group.visible = currentStudy === 'drape';
      claspBuild.group.visible = currentStudy === 'clasp';
      eyewearBuild.group.visible = currentStudy === 'eyewear';

      const activePreset = PRESETS[presetRef.current];
      targetColor.setHex(activePreset.primaryColor);
      targetSheen.setHex(activePreset.sheenColor);
      targetRing.setHex(activePreset.ringColor);

      mainSilkMat.color.lerp(targetColor, Math.min(1, dt * 4));
      mainSilkMat.sheenColor.lerp(targetSheen, Math.min(1, dt * 4));
      mainSilkMat.roughness = THREE.MathUtils.damp(mainSilkMat.roughness, activePreset.roughness, 4, dt);
      mainSilkMat.metalness = THREE.MathUtils.damp(mainSilkMat.metalness, activePreset.metalness, 4, dt);
      accentMetalMat.color.lerp(targetRing, Math.min(1, dt * 4));

      if (!reducedMotion && speedRef.current === 'calm') {
        stage.position.y = Math.sin(elapsed * 0.65) * 0.08;
        if (currentStudy === 'drape') {
          baseYaw += dt * 0.22;
        } else {
          baseYaw = Math.sin(studyElapsed * 0.55) * 0.22;
        }
      }

      dragRotationOffset = THREE.MathUtils.damp(dragRotationOffset, targetDragOffset, 6, dt);
      const scrollProgress = scrollProgressRef?.current ?? 0.5;
      const scrollYaw =
        currentStudy === 'drape'
          ? scrollProgress * Math.PI * 0.7
          : (scrollProgress - 0.5) * 0.32;
      stage.rotation.y = baseYaw + scrollYaw + dragRotationOffset;

      if (!reducedMotion && speedRef.current === 'calm') {
        drapeBuild.blade1.rotation.z += dt * 0.08;
        drapeBuild.blade2.rotation.z -= dt * 0.08;
        claspBuild.turnLock.rotation.z = Math.sin(elapsed * 0.9) * 0.28;
        eyewearBuild.group.rotation.x = Math.sin(elapsed * 0.6) * 0.06 + 0.14;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        pacer.afterDraw(tick);
      } else {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      pacer.cancel();
      canvasEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      envTexture.dispose();
      disposeSceneResources(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full h-[390px] md:h-[460px] flex items-center justify-center">
        {fallbackActive ? (
          <div className="w-72 h-72 rounded-full border border-[#B8A58C]/40 flex items-center justify-center text-sm text-[#B8A58C]">
            Sculptural Study
          </div>
        ) : (
          <div
            ref={mountRef}
            data-testid="editorial-3d-canvas"
            aria-label="Interactive Ali & Ferhad 3D fashion & accessory studio"
            className="w-full h-full"
          />
        )}
      </div>

      {/* Dedicated Architectural Study & Material Control Bar (Zero Mesh Overlap) */}
      <div className="border-t border-[#D6B88C]/20 bg-[#240D14] px-4 py-3 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="3D Object Studies">
            {STUDIES.map((s) => {
              const active = activeStudy === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectStudy(s.id)}
                  className={`px-3 min-h-[40px] rounded-[10px] text-xs transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#D6B88C] text-[#35151F] font-semibold'
                      : 'text-[#F5EEE5]/85 hover:text-[#F5EEE5] border border-[#D6B88C]/25'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {dockOpen && (
              <button
                type="button"
                onClick={toggleMotion}
                className="px-3 min-h-[40px] rounded-[10px] text-xs text-[#D6B88C] hover:text-[#F5EEE5] border border-[#D6B88C]/25 transition-colors whitespace-nowrap shrink-0"
              >
                {rotationSpeed === 'calm' ? 'Pause Motion' : 'Resume Motion'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDockOpen((v) => !v)}
              className="px-3 min-h-[40px] rounded-[10px] text-[11px] tracking-wider text-[#F5EEE5]/80 hover:text-[#F5EEE5] border border-[#D6B88C]/25 transition-colors whitespace-nowrap shrink-0"
            >
              {dockOpen ? 'Hide Finishes' : 'Material Finishes'}
            </button>
          </div>
        </div>

        {dockOpen && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#D6B88C]/15">
            <span className="text-[11px] uppercase tracking-[0.1em] text-[#D6B88C]/75 mr-1">
              Finish:
            </span>
            {(Object.values(PRESETS) as MaterialPreset[]).map((item) => {
              const active = preset === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyPreset(item.id)}
                  className={`px-3 min-h-[38px] rounded-[10px] text-xs transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#F5EEE5] text-[#35151F] font-semibold'
                      : 'text-[#F5EEE5]/80 hover:text-[#F5EEE5] border border-[#D6B88C]/25'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
