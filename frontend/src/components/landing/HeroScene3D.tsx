import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { StaticHeroCrest } from './StaticHeroCrest';

export interface HeroScene3DProps {
  className?: string;
}

/**
 * HeroScene3D component
 *
 * WebGL Three.js 3D luxury gold crest scene with cursor-tracking gyroscope and fallback detection.
 */
export const HeroScene3D: React.FC<HeroScene3DProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ownedImageBitmapsRef = useRef<Set<ImageBitmap>>(new Set());
  const [useFallback, setUseFallback] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return true;
    }
    return false;
  });

  useEffect(() => {
    if (useFallback) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Direct WebGL2 Initialization Check (Three.js >= r163 is WebGL2-only)
    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: true
      });
    } catch {
      setUseFallback(true);
      return;
    }

    if (!gl) {
      setUseFallback(true);
      return;
    }

    // 2. Three.js Renderer Setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: gl,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(canvas.clientWidth || 320, canvas.clientHeight || 320, false);
      rendererRef.current = renderer;
    } catch {
      setUseFallback(true);
      return;
    }

    // 3. WebGL Context Loss Listener (Permanent session fallback)
    const handleContextLost = () => {
      if (rendererRef.current) {
        rendererRef.current.setAnimationLoop(null);
      }
      setUseFallback(true);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, { passive: true });

    // 4. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      (canvas.clientWidth || 320) / (canvas.clientHeight || 320),
      0.1,
      100
    );
    camera.position.z = 5.8;

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const goldKeyLight = new THREE.DirectionalLight(0xc5a059, 2.8);
    goldKeyLight.position.set(3, 4, 5);
    scene.add(goldKeyLight);

    const coolFillLight = new THREE.DirectionalLight(0x1b3b6f, 1.2);
    coolFillLight.position.set(-3, -2, 3);
    scene.add(coolFillLight);

    const specularShine = new THREE.PointLight(0xfff5db, 2.5, 12);
    specularShine.position.set(0, 0, 4);
    scene.add(specularShine);

    // 6. Royal Crest 3D Object Hierarchy
    const crestGroup = new THREE.Group();
    scene.add(crestGroup);

    // Load High-Resolution Official Royal Knot Crest Texture
    const textureLoader = new THREE.TextureLoader();
    const logoTexture = textureLoader.load('/royal-knot-logo.png');
    logoTexture.colorSpace = THREE.SRGBColorSpace;
    logoTexture.minFilter = THREE.LinearMipmapLinearFilter;
    logoTexture.magFilter = THREE.LinearFilter;
    logoTexture.generateMipmaps = true;

    // Gold Materials
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xc5a059,
      metalness: 0.88,
      roughness: 0.18
    });

    const darkGoldMaterial = new THREE.MeshStandardMaterial({
      color: 0x9d7c36,
      metalness: 0.9,
      roughness: 0.28
    });

    // Outer Torus Ring (Champagne Gold Filigree)
    const outerRingGeo = new THREE.TorusGeometry(2.1, 0.025, 16, 80);
    const outerRing = new THREE.Mesh(outerRingGeo, goldMaterial);
    crestGroup.add(outerRing);

    // Secondary Dotted Gyro Ring
    const innerRingGeo = new THREE.TorusGeometry(1.85, 0.018, 16, 64);
    const innerRing = new THREE.Mesh(innerRingGeo, darkGoldMaterial);
    crestGroup.add(innerRing);

    // Central Imperial Medallion Coin / Cylinder Body
    const discGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.08, 64);
    const navyRimMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d1b2a,
      metalness: 0.6,
      roughness: 0.3
    });
    const medallionBody = new THREE.Mesh(discGeo, [goldMaterial, navyRimMaterial, navyRimMaterial]);
    medallionBody.rotation.x = Math.PI / 2;
    crestGroup.add(medallionBody);

    // Front Face (Direct Embossed Official Logo)
    const faceGeo = new THREE.CircleGeometry(1.48, 64);
    const faceMaterial = new THREE.MeshStandardMaterial({
      map: logoTexture,
      roughness: 0.22,
      metalness: 0.15,
      transparent: true
    });
    const frontFace = new THREE.Mesh(faceGeo, faceMaterial);
    frontFace.position.z = 0.042;
    crestGroup.add(frontFace);

    // Back Face (For full 3D consistency)
    const backFace = new THREE.Mesh(faceGeo, faceMaterial);
    backFace.position.z = -0.042;
    backFace.rotation.y = Math.PI;
    crestGroup.add(backFace);

    // Outer Gold Bevel Trim Rings
    const trimGeo = new THREE.TorusGeometry(1.49, 0.03, 20, 64);
    const frontTrim = new THREE.Mesh(trimGeo, goldMaterial);
    frontTrim.position.z = 0.042;
    crestGroup.add(frontTrim);

    const backTrim = new THREE.Mesh(trimGeo, goldMaterial);
    backTrim.position.z = -0.042;
    crestGroup.add(backTrim);

    // 7. Interactive Parallax Handling
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetTiltX = Math.max(-0.25, Math.min(0.25, y * 0.22));
      targetTiltY = Math.max(-0.35, Math.min(0.35, x * 0.3));
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // 8. Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        }
      }
    });
    resizeObserver.observe(canvas);

    // 9. Standard Lifecycle-Safe Animation Loop
    const clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
      const elapsed = clock.getElapsedTime();

      // Outer gold filigree rings orbit around the medallion on Z
      outerRing.rotation.z = elapsed * 0.05;
      innerRing.rotation.z = -elapsed * 0.08;

      // Smooth Parallax Lerp to cursor
      currentTiltX += (targetTiltX - currentTiltX) * 0.06;
      currentTiltY += (targetTiltY - currentTiltY) * 0.06;

      // Majestic Floating & Breathing (ALWAYS Front-Facing)
      crestGroup.position.y = Math.sin(elapsed * 1.3) * 0.06;
      crestGroup.rotation.x = currentTiltX + Math.cos(elapsed * 0.8) * 0.03;
      crestGroup.rotation.y = currentTiltY + Math.sin(elapsed * 0.6) * 0.04;

      renderer.render(scene, camera);
    });

    // 10. Comprehensive Teardown / Cleanup
    return () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('webglcontextlost', handleContextLost);

      // Deduplicated GPU Resource Disposal
      const disposedGeometries = new Set<THREE.BufferGeometry>();
      const disposedMaterials = new Set<THREE.Material>();
      const disposedTextures = new Set<THREE.Texture>();

      scene.traverse(object => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;

          if (mesh.geometry && !disposedGeometries.has(mesh.geometry)) {
            mesh.geometry.dispose();
            disposedGeometries.add(mesh.geometry);
          }

          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const mat of materials) {
              if (!disposedMaterials.has(mat)) {
                for (const key of Object.keys(mat)) {
                  const val = (mat as any)[key];
                  if (val && (val as THREE.Texture).isTexture && !disposedTextures.has(val)) {
                    val.dispose();
                    disposedTextures.add(val);
                  }
                }

                mat.dispose();
                disposedMaterials.add(mat);
              }
            }
          }
        }
      });

      for (const bitmap of ownedImageBitmapsRef.current) {
        if (typeof bitmap.close === 'function') {
          bitmap.close();
        }
      }
      ownedImageBitmapsRef.current.clear();

      renderer.dispose();
      rendererRef.current = null;
    };
  }, [useFallback]);

  if (useFallback) {
    return <StaticHeroCrest className={className} />;
  }

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Outer Ambient Radiance */}
      <div className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full bg-radial from-[#C5A059]/25 via-[#C5A059]/5 to-transparent blur-2xl pointer-events-none -z-10 animate-pulse duration-10000" />

      {/* Interactive 3D WebGL2 Canvas with Royal Knot Seal */}
      <canvas
        ref={canvasRef}
        className="w-64 h-64 sm:w-80 sm:h-80 select-none touch-none cursor-grab active:cursor-grabbing drop-shadow-[0_16px_30px_rgba(13,27,42,0.35)]"
        style={{ display: 'block' }}
        aria-label="Interactive 3D Royal Knot Imperial Seal"
      />
    </div>
  );
};

export default HeroScene3D;
