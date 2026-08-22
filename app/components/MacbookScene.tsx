'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const CONFIG = {
  rotationSpeed: 0.64,
  rotationDamping: 4.4,
  hoverLift: 0.035,
  hoverScale: 1.03,
  hoverDamping: 5.8,
  rimIdleIntensity: 0.55,
  rimHoverIntensity: 2.4,
  cameraFov: 31,
  cameraDirection: new THREE.Vector3(1.55, 1.75, 4.9).normalize(),
  desktopWidthOccupancy: 0.47,
  desktopHeightOccupancy: 0.59,
  mobileWidthOccupancy: 0.78,
  mobileHeightOccupancy: 0.43,
};

type Props = {
  onLoad: () => void;
  onProgress: (progress: number) => void;
  onError: () => void;
  onHoverChange: (hovered: boolean) => void;
};

export default function MacbookScene({ onLoad, onProgress, onError, onHoverChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, 1, 0.01, 100);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.78;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.035);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.52;
    room.dispose();
    pmrem.dispose();

    scene.add(new THREE.HemisphereLight(0xdce8ff, 0x071233, 0.86));

    const key = new THREE.DirectionalLight(0xffffff, 2.25);
    key.position.set(4.6, 7.2, 4.2);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 20;
    key.shadow.camera.left = -3.5;
    key.shadow.camera.right = 3.5;
    key.shadow.camera.top = 3.5;
    key.shadow.camera.bottom = -3.5;
    key.shadow.bias = -0.00035;
    key.shadow.normalBias = 0.025;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xb9caff, 0.68);
    fill.position.set(-4.5, 1.2, 3.2);
    scene.add(fill);

    const rim = new THREE.PointLight(0x4ca6ff, CONFIG.rimIdleIntensity, 12, 1.7);
    rim.position.set(-2.4, 2.3, -2.2);
    scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.ShadowMaterial({ color: 0x061c67, opacity: 0.34 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.009;
    ground.receiveShadow = true;
    scene.add(ground);

    const pivot = new THREE.Group();
    scene.add(pivot);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(2, 2);
    const interactiveMeshes: THREE.Object3D[] = [];
    const targetScale = new THREE.Vector3(1, 1, 1);
    let hovered = false;
    let currentAngularSpeed = 0;
    let modelSize = new THREE.Vector3(1, 1, 1);
    let frame = 0;
    let disposed = false;
    let lastFrameTime = performance.now();

    const setHovered = (next: boolean) => {
      if (hovered === next) return;
      hovered = next;
      host.style.cursor = hovered ? 'grab' : 'default';
      onHoverChange(hovered);
    };

    const fitCamera = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.fov = CONFIG.cameraFov;
      camera.updateProjectionMatrix();

      const portrait = camera.aspect < 0.8;
      const widthOccupancy = portrait ? CONFIG.mobileWidthOccupancy : CONFIG.desktopWidthOccupancy;
      const heightOccupancy = portrait ? CONFIG.mobileHeightOccupancy : CONFIG.desktopHeightOccupancy;
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const distanceForHeight = modelSize.y / (2 * Math.tan(vFov / 2) * heightOccupancy);
      const distanceForWidth = modelSize.x / (2 * Math.tan(hFov / 2) * widthOccupancy);
      const distance = Math.max(distanceForHeight, distanceForWidth, 1.65) * (portrait ? 1.08 : 0.65);
      const target = new THREE.Vector3(0, modelSize.y * (portrait ? 0.42 : 0.44), 0);
      camera.position.copy(target).addScaledVector(CONFIG.cameraDirection, distance);
      camera.lookAt(target);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
    };

    new GLTFLoader().load(
      '/models/macbook-pro-m5.glb',
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;

        // This GLB already contains paired X-axis conversion matrices in its
        // hierarchy, so keep that authored orientation and only correct pivot.
        model.rotation.x = 0;
        model.updateMatrixWorld(true);
        const orientedBounds = new THREE.Box3().setFromObject(model);
        const center = orientedBounds.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -orientedBounds.min.y, -center.z);
        pivot.add(model);
        pivot.updateMatrixWorld(true);

        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow = true;
          child.receiveShadow = true;
          interactiveMeshes.push(child);
        });

        modelSize = new THREE.Box3().setFromObject(pivot).getSize(new THREE.Vector3());
        pivot.rotation.y = -0.2;
        pivot.updateMatrixWorld(true);
        fitCamera();
        onProgress(100);
        onLoad();
      },
      (event) => {
        if (event.total > 0) onProgress(Math.min(99, (event.loaded / event.total) * 100));
      },
      () => { if (!disposed) onError(); },
    );

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      setHovered(interactiveMeshes.length > 0 && raycaster.intersectObjects(interactiveMeshes, false).length > 0);
    };
    const onPointerLeave = () => { pointer.set(2, 2); setHovered(false); };
    const onResize = () => fitCamera();
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', onResize);

    const animate = () => {
      const now = performance.now();
      const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
      lastFrameTime = now;
      const targetAngularSpeed = hovered && !reducedMotion ? CONFIG.rotationSpeed : 0;
      currentAngularSpeed = THREE.MathUtils.damp(currentAngularSpeed, targetAngularSpeed, CONFIG.rotationDamping, dt);
      if (Math.abs(currentAngularSpeed) < 0.0001) currentAngularSpeed = 0;
      pivot.rotation.y += currentAngularSpeed * dt;

      pivot.position.y = THREE.MathUtils.damp(
        pivot.position.y,
        hovered && !reducedMotion ? CONFIG.hoverLift : 0,
        CONFIG.hoverDamping,
        dt,
      );
      targetScale.setScalar(hovered && !reducedMotion ? CONFIG.hoverScale : 1);
      pivot.scale.lerp(targetScale, 1 - Math.exp(-CONFIG.hoverDamping * dt));
      rim.intensity = THREE.MathUtils.damp(
        rim.intensity,
        hovered ? CONFIG.rimHoverIntensity : CONFIG.rimIdleIntensity,
        CONFIG.hoverDamping,
        dt,
      );

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };

    fitCamera();
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      environment.texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      onHoverChange(false);
    };
  }, [onError, onHoverChange, onLoad, onProgress]);

  return <div className="three-host" ref={hostRef} />;
}
