'use client';

import { useEffect, useRef, useState } from 'react';
import type * as THREE_TYPES from 'three';

const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const CONFIG = {
  sceneUrl: `${ASSET_BASE}/fourth-screen/zhulian-brand-journey.glb`,
  dracoPath: `${ASSET_BASE}/fourth-screen/draco/`,
  brandBlueHex: '#1338c8',
  timelineStart: 0.048,
  timelineDamping: 5,
  maxPixelRatio: 1.5,
  horizontalIntensityMin: 0.2,
  horizontalIntensityMax: 1.4,
  verticalIntensity: 0.15,
  rotationIntensity: 0.04,
  pointerSmoothness: 0.06,
} as const;

type LoadState = 'loading' | 'ready' | 'error';
type FourthScreenProps = { onRequestClose: () => void };

function createBrandTagTexture(THREE: typeof import('three')) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = CONFIG.brandBlueHex;
  context.roundRect(18, 340, 1180, 1660, 54);
  context.fill();
  context.fillStyle = '#ffffff';
  context.font = '900 230px Arial, PingFang SC, Microsoft YaHei, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('筑脸文创', 620, 185);
  context.strokeStyle = CONFIG.brandBlueHex;
  context.lineWidth = 86;
  context.beginPath();
  context.moveTo(1280, 380);
  context.lineTo(1840, 1940);
  context.moveTo(1840, 380);
  context.lineTo(1280, 1940);
  context.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

function createCheckoutTexture(THREE: typeof import('three')) {
  const canvas = document.createElement('canvas');
  canvas.width = 1530;
  canvas.height = 494;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = CONFIG.brandBlueHex;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.font = '900 300px Arial Black, PingFang SC, Microsoft YaHei, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('马上有钱', canvas.width / 2, canvas.height / 2 + 8);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

function createShaoxingInscriptionTexture(THREE: typeof import('three')) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(57, 31, 15, .72)';
  context.lineWidth = 18;
  context.beginPath();
  context.arc(512, 512, 442, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.rect(382, 382, 260, 260);
  context.stroke();
  context.fillStyle = '#3d2413';
  context.shadowColor = 'rgba(236, 184, 90, .5)';
  context.shadowBlur = 5;
  context.shadowOffsetX = 5;
  context.shadowOffsetY = 5;
  context.font = '900 190px STSong, Songti SC, SimSun, serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('绍', 512, 225);
  context.fillText('兴', 512, 800);
  context.fillText('通', 790, 512);
  context.fillText('宝', 230, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function replaceWithShaoxingCoin(
  THREE: typeof import('three'),
  coin: THREE_TYPES.Mesh,
  inscriptionTexture: THREE_TYPES.Texture,
) {
  const coinShape = new THREE.Shape();
  coinShape.absarc(0, 0, 1, 0, Math.PI * 2, false);
  const squareHole = new THREE.Path();
  squareHole.moveTo(-0.23, -0.23);
  squareHole.lineTo(0.23, -0.23);
  squareHole.lineTo(0.23, 0.23);
  squareHole.lineTo(-0.23, 0.23);
  squareHole.closePath();
  coinShape.holes.push(squareHole);

  const geometry = new THREE.ExtrudeGeometry(coinShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.035,
    bevelThickness: 0.025,
    curveSegments: 64,
  });
  geometry.center();
  geometry.rotateX(-Math.PI / 2);
  coin.geometry = geometry;
  coin.material = [
    new THREE.MeshStandardMaterial({
      color: 0x94602f,
      roughness: 0.68,
      metalness: 0.42,
      side: THREE.DoubleSide,
    }),
    new THREE.MeshStandardMaterial({
      color: 0x4f351f,
      roughness: 0.82,
      metalness: 0.28,
      side: THREE.DoubleSide,
    }),
  ];

  const faceGeometry = new THREE.PlaneGeometry(2, 2);
  const faceMaterial = new THREE.MeshBasicMaterial({
    map: inscriptionTexture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const front = new THREE.Mesh(faceGeometry, faceMaterial);
  front.rotation.x = -Math.PI / 2;
  front.position.y = 0.111;
  front.renderOrder = 2;
  const back = front.clone();
  back.rotation.x = Math.PI / 2;
  back.position.y = -0.111;
  coin.add(front, back);
}

export default function FourthScreen({ onRequestClose }: FourthScreenProps) {
  const stageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef(onRequestClose);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    closeRef.current = onRequestClose;
  }, [onRequestClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    let cancelled = false;
    let dispose = () => {};

    void Promise.all([
      import('three'),
      import('three/examples/jsm/loaders/DRACOLoader.js'),
      import('three/examples/jsm/loaders/GLTFLoader.js'),
    ]).then(([THREE, { DRACOLoader }, { GLTFLoader }]) => {
      if (cancelled) return;
      let alive = true;
      let frameId = 0;
      let camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      let mixer: THREE_TYPES.AnimationMixer | null = null;
      let duration = 8.333333;
      let scrollTarget = 0;
      let scrollCurrent = 0;
      let upwardExitDistance = 0;
      let pointerTargetX = 0;
      let pointerTargetY = 0;
      let pointerX = 0;
      let pointerY = 0;
      let previousTime = performance.now();
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(CONFIG.brandBlueHex);
      camera.position.set(0, 0, 10);

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.75;

      const brandBlue = new THREE.Color(CONFIG.brandBlueHex);
      const recolorMaterial = (material: THREE_TYPES.Material) => {
        const standard = material as THREE_TYPES.MeshStandardMaterial;
        if (material.name === 'MainBlue' || material.name === 'LightBlue') {
          standard.metalness = 0.08;
          standard.roughness = 0.3;
        }
        material.onBeforeCompile = (shader) => {
          const brandSwap = `
            float strongest = max(max(diffuseColor.r, diffuseColor.g), diffuseColor.b);
            float blueChroma = diffuseColor.b - max(diffuseColor.r, diffuseColor.g);
            float greenChroma = diffuseColor.g - max(diffuseColor.r, diffuseColor.b);
            float blueMask = smoothstep(0.38, 0.68, blueChroma / max(strongest, 0.001));
            float greenMask = smoothstep(0.16, 0.30, greenChroma / max(strongest, 0.001));
            float swapMask = max(blueMask, greenMask);
            diffuseColor.rgb = mix(
              diffuseColor.rgb,
              vec3(${brandBlue.r.toFixed(6)}, ${brandBlue.g.toFixed(6)}, ${brandBlue.b.toFixed(6)}) * max(strongest, 0.72),
              swapMask
            );
          `;
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            `#include <map_fragment>${brandSwap}`,
          );
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
            float emissiveStrongest = max(max(totalEmissiveRadiance.r, totalEmissiveRadiance.g), totalEmissiveRadiance.b);
            float emissiveBlue = totalEmissiveRadiance.b - max(totalEmissiveRadiance.r, totalEmissiveRadiance.g);
            float emissiveGreen = totalEmissiveRadiance.g - max(totalEmissiveRadiance.r, totalEmissiveRadiance.b);
            float emissiveMask = max(
              smoothstep(0.38, 0.68, emissiveBlue / max(emissiveStrongest, 0.001)),
              smoothstep(0.16, 0.30, emissiveGreen / max(emissiveStrongest, 0.001))
            );
            totalEmissiveRadiance = mix(
              totalEmissiveRadiance,
              vec3(${brandBlue.r.toFixed(6)}, ${brandBlue.g.toFixed(6)}, ${brandBlue.b.toFixed(6)}) * max(emissiveStrongest, 0.72),
              emissiveMask
            );`,
          );
        };
        material.customProgramCacheKey = () => 'zhulian-brand-blue-swap-v2';
        material.needsUpdate = true;
      };

      const brandTagTexture = createBrandTagTexture(THREE);
      const checkoutTexture = createCheckoutTexture(THREE);
      const inscriptionTexture = createShaoxingInscriptionTexture(THREE);
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(CONFIG.dracoPath);
      dracoLoader.preload();
      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);

      loader.load(
        CONFIG.sceneUrl,
        (gltf) => {
          if (!alive) return;
          const root = gltf.scene;
          const foundMeshes: {
            checkout?: THREE_TYPES.Mesh;
            coin?: THREE_TYPES.Mesh;
          } = {};
          root.traverse((object) => {
            if (/^Billboard/.test(object.name) || /^Text/.test(object.name)) object.visible = false;
            if (object.name === 'Empty002' || object.name === 'Curve127' || object.name === 'Curve126') object.visible = false;
            if (!(object instanceof THREE.Mesh)) return;
            object.frustumCulled = false;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            const materialNames = new Set(materials.map((material) => material.name));
            if (['Dollar', 'Pound', 'Yen', 'Euro'].some((name) => materialNames.has(name))) object.visible = false;
            if (materialNames.has('GlobalCheckout')) foundMeshes.checkout = object;
            if (materialNames.has('Coin') && materialNames.has('CoinSide')) foundMeshes.coin = object;
            materials.forEach((material) => {
              material.side = THREE.DoubleSide;
              recolorMaterial(material);
              if (material.name === 'BlueTag' && brandTagTexture) {
                const tagMaterial = material as THREE_TYPES.MeshStandardMaterial;
                tagMaterial.map = null;
                tagMaterial.emissiveMap = brandTagTexture;
                tagMaterial.color?.set(0x000000);
                tagMaterial.emissive?.set(0xffffff);
                tagMaterial.needsUpdate = true;
              }
              if (material.name === 'EmissionText.001') {
                material.transparent = true;
                material.opacity = 0;
                material.depthWrite = false;
                material.colorWrite = false;
                material.needsUpdate = true;
              }
            });
          });

          if (foundMeshes.checkout && checkoutTexture) {
            const checkoutMaterial = foundMeshes.checkout.material as THREE_TYPES.MeshStandardMaterial;
            checkoutMaterial.map = checkoutTexture;
            checkoutMaterial.emissiveMap = checkoutTexture;
            checkoutMaterial.color.set(0xffffff);
            checkoutMaterial.emissive.set(0xffffff);
            checkoutMaterial.needsUpdate = true;
          }
          if (foundMeshes.coin && inscriptionTexture) {
            replaceWithShaoxingCoin(THREE, foundMeshes.coin, inscriptionTexture);
          }
          scene.add(root);

          const animatedCamera = root.getObjectByName('DutchCamera.001');
          if (animatedCamera instanceof THREE.PerspectiveCamera) camera = animatedCamera;
          else if (gltf.cameras[0] instanceof THREE.PerspectiveCamera) camera = gltf.cameras[0];
          camera.near = 0.001;
          camera.far = 1000;
          camera.updateProjectionMatrix();

          mixer = new THREE.AnimationMixer(root);
          gltf.animations.forEach((clip) => {
            const action = mixer?.clipAction(clip);
            if (!action) return;
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.play();
          });
          duration = Math.max(...gltf.animations.map((clip) => clip.duration), duration);
          mixer.setTime(CONFIG.timelineStart * duration);
          root.updateMatrixWorld(true);
          setState('ready');
        },
        undefined,
        () => alive && setState('error'),
      );

      const resize = () => {
        const width = Math.max(stage.clientWidth, 1);
        const height = Math.max(stage.clientHeight, 1);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONFIG.maxPixelRatio));
        renderer.setSize(width, height, false);
      };

      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        const delta = THREE.MathUtils.clamp(event.deltaY, -180, 180);
        if (delta < 0 && scrollTarget <= 0.002 && scrollCurrent <= 0.006) {
          upwardExitDistance += Math.abs(delta);
          if (upwardExitDistance >= 90) closeRef.current();
          return;
        }
        upwardExitDistance = delta < 0 ? upwardExitDistance : 0;
        scrollTarget = THREE.MathUtils.clamp(scrollTarget + delta * 0.00052, 0, 1);
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
          event.preventDefault();
          scrollTarget = THREE.MathUtils.clamp(scrollTarget + 0.085, 0, 1);
        }
        if (event.key === 'ArrowUp' || event.key === 'PageUp') {
          event.preventDefault();
          if (scrollTarget <= 0.002 && scrollCurrent <= 0.006) closeRef.current();
          else scrollTarget = THREE.MathUtils.clamp(scrollTarget - 0.085, 0, 1);
        }
      };

      const updatePointer = (event: PointerEvent) => {
        pointerTargetX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
        pointerTargetY = -((event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2);
      };
      const resetPointer = () => {
        pointerTargetX = 0;
        pointerTargetY = 0;
      };

      stage.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', resize, { passive: true });
      window.addEventListener('pointermove', updatePointer, { passive: true });
      document.documentElement.addEventListener('mouseleave', resetPointer);
      resize();

      const savedPosition = new THREE.Vector3();
      const savedRotation = new THREE.Euler();
      const animate = (timestamp: number) => {
        if (!alive) return;
        frameId = requestAnimationFrame(animate);
        const delta = Math.min((timestamp - previousTime) / 1000, 0.05);
        previousTime = timestamp;
        scrollCurrent = reducedMotion
          ? scrollTarget
          : THREE.MathUtils.damp(scrollCurrent, scrollTarget, CONFIG.timelineDamping, delta);
        pointerX += ((reducedMotion ? 0 : pointerTargetX) - pointerX) * CONFIG.pointerSmoothness;
        pointerY += ((reducedMotion ? 0 : pointerTargetY) - pointerY) * CONFIG.pointerSmoothness;

        if (mixer) {
          const timelineProgress = THREE.MathUtils.lerp(CONFIG.timelineStart, 1, scrollCurrent);
          mixer.setTime(Math.min(timelineProgress * duration, duration - 0.01));
        }
        savedPosition.copy(camera.position);
        savedRotation.copy(camera.rotation);
        const intensityProgress = Math.min(scrollCurrent / 0.3, 1);
        const horizontalIntensity = THREE.MathUtils.lerp(
          CONFIG.horizontalIntensityMin,
          CONFIG.horizontalIntensityMax,
          intensityProgress,
        );
        if (!reducedMotion && mixer) {
          camera.position.x += pointerX * horizontalIntensity;
          camera.position.y += pointerY * CONFIG.verticalIntensity;
          camera.position.y = Math.min(camera.position.y, 0.6);
          camera.rotation.y -= pointerX * CONFIG.rotationIntensity;
        }
        renderer.render(scene, camera);
        camera.position.copy(savedPosition);
        camera.rotation.copy(savedRotation);
      };
      frameId = requestAnimationFrame(animate);

      dispose = () => {
        alive = false;
        cancelAnimationFrame(frameId);
        stage.removeEventListener('wheel', handleWheel);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', updatePointer);
        document.documentElement.removeEventListener('mouseleave', resetPointer);
        mixer?.stopAllAction();
        scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        });
        dracoLoader.dispose();
        brandTagTexture?.dispose();
        checkoutTexture?.dispose();
        inscriptionTexture?.dispose();
        renderer.dispose();
      };
    }).catch(() => {
      if (!cancelled) setState('error');
    });

    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  return (
    <section ref={stageRef} className="fourth-screen fourth-journey-stage" aria-label="筑脸文创沉浸式三维穿梭场景">
      <canvas ref={canvasRef} className="fourth-journey-canvas" aria-label="滚轮控制人物行走与镜头穿梭" />
      {state === 'error' && (
        <div className="fourth-scene-error" role="alert">三维场景加载失败，请刷新页面重试。</div>
      )}
    </section>
  );
}
