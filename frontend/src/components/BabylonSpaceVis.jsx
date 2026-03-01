import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  GlowLayer,
  HemisphericLight,
  MeshBuilder,
  PhotoDome,
  PointLight,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
  VertexData
} from '@babylonjs/core';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';

export default function BabylonSpaceVis({ neos = [], onSelectNeo, selectedNeo }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const asteroidsRef = useRef([]);
  const earthRef = useRef(null);
  const selectionRingRef = useRef(null);
  const [error, setError] = useState(null);
  const neoSignature = useMemo(() => (neos || []).map((n) => n.neoId || n.id || n.name || '').join('|'), [neos]);

  // Initialize Babylon scene once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    try {
      const engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        alpha: true
      });
      engineRef.current = engine;

      const scene = new Scene(engine);
      scene.clearColor = new Color4(0, 0, 0, 1);
      sceneRef.current = scene;

      // Realistic Galaxy Background
      const skybox = new PhotoDome(
        'spaceSkybox',
        'https://cdn.eso.org/images/publicationjpg/eso0932a.jpg',
        {
          resolution: 64,
          size: 1000,
          useDirectMapping: false
        },
        scene
      );
      // Adjust texture coordinates to align the milky way band nicely
      skybox.imageMode = PhotoDome.MODE_MONOSCOPIC;
      skybox.mesh.rotation.y = Math.PI / 1.5;

      // Camera
      const camera = new ArcRotateCamera('camera', -Math.PI / 1.8, Math.PI / 2.3, 38, Vector3.Zero(), scene);
      camera.lowerRadiusLimit = 20;
      camera.upperRadiusLimit = 90;
      camera.wheelDeltaPercentage = 0.01;
      camera.panningSensibility = 1200;
      camera.attachControl(canvas, true);
      camera.setTarget(Vector3.Zero());

      // Lights
      const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
      hemi.intensity = 0.35;
      // Sun from upper right to match reference lighting (illuminating Africa)
      const sun = new PointLight('sun', new Vector3(50, 45, 30), scene);
      sun.intensity = 1.4;
      sun.diffuse = new Color3(1, 0.98, 0.94);
      
      // Subtle fill light for the shadowed side
      const fill = new PointLight('fill', new Vector3(-40, -25, -30), scene);
      fill.intensity = 0.12;
      fill.diffuse = new Color3(0.25, 0.35, 0.6);

      // Earth — simple sphere with Earth texture matching reference image
      const earth = MeshBuilder.CreateSphere('earth', { diameter: 12, segments: 64 }, scene);
      const earthMat = new StandardMaterial('earthMat', scene);
      
      // Simple Earth texture from reference
      earthMat.diffuseTexture = new Texture(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg', scene
      );
      earthMat.diffuseTexture.vScale = -1;
      
      earth.material = earthMat;
      earth.isPickable = true;
      earth.rotation.y = Math.PI * 0.8; 
      earthRef.current = earth;

      // Simple glow around earth
      const glow = new GlowLayer('glow', scene, { blurKernelSize: 32 });
      glow.intensity = 0.5;
      glow.addIncludedOnlyMesh(earth);

      // Selection ring — cyan circle that appears under the selected asteroid
      const selRing = MeshBuilder.CreateTorus('selectionRing', {
        diameter: 4,
        thickness: 0.08,
        tessellation: 64
      }, scene);
      const selRingMat = new StandardMaterial('selRingMat', scene);
      selRingMat.emissiveColor = new Color3(0, 0.85, 1); // Cyan blue
      selRingMat.diffuseColor = new Color3(0, 0.85, 1);
      selRingMat.specularColor = new Color3(0, 0, 0);
      selRingMat.alpha = 0.9;
      selRing.material = selRingMat;
      selRing.isPickable = false;
      selRing.setEnabled(false); // hidden by default
      glow.addIncludedOnlyMesh(selRing);
      selectionRingRef.current = selRing;

      // (Stars and comets removed for a cleaner space)

      // Pointer pick for asteroids
      scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === PointerEventTypes.POINTERPICK) {
          const mesh = pointerInfo.pickInfo?.pickedMesh;
          if (mesh?.name === 'earth') {
            if (onSelectNeo) {
              onSelectNeo({
                name: "Planet Earth",
                neoId: "EARTH",
                riskLevel: "SAFE",
                estimatedDiameter: { max: 12742000 },
                absoluteMagnitudeH: "-27", // Approximate apparent magnitude of the Sun seen from Earth, but let's use something indicative or just N/A. Earth's H is not standard.
                isPotentiallyHazardous: false,
                isEarth: true
              });
            }
            return;
          }
          if (mesh?.metadata?.neo && onSelectNeo) {
            onSelectNeo(mesh.metadata.neo);
          }
        }
      });

      // Animation loop
      scene.onBeforeRenderObservable.add(() => {
        const delta = scene.getEngine().getDeltaTime() * 0.001;
        if (earthRef.current) {
          earthRef.current.rotation.y += delta * 0.05;
        }
        asteroidsRef.current.forEach((asteroid) => {
          asteroid.angle += asteroid.speed * delta * 60;
          const r = asteroid.radius;
          asteroid.mesh.position.set(
            Math.cos(asteroid.angle) * r,
            asteroid.y,
            Math.sin(asteroid.angle) * r
          );
          asteroid.mesh.rotation.x += delta * 0.8;
          asteroid.mesh.rotation.y += delta * 1.1;
        });

        // Update selection ring position
        if (selectionRingRef.current) {
          const ring = selectionRingRef.current;
          const selNeo = ring._trackedNeo;
          if (selNeo) {
            const found = asteroidsRef.current.find(a => {
              const neo = a.neo;
              return (neo?.neoId || neo?.id || neo?.name) === (selNeo?.neoId || selNeo?.id || selNeo?.name);
            });
            if (found) {
              const pos = found.mesh.position;
              ring.position.set(pos.x, pos.y - found.mesh.getBoundingInfo().boundingBox.extendSizeWorld.y - 0.3, pos.z);
              // Scale ring to match asteroid size
              const extent = found.mesh.getBoundingInfo().boundingBox.extendSizeWorld;
              const maxR = Math.max(extent.x, extent.z) * 2.5;
              ring.scaling.set(maxR / 4, 1, maxR / 4);
              ring.setEnabled(true);
            } else {
              ring.setEnabled(false);
            }
          }
        }
      });

      engine.runRenderLoop(() => {
        if (scene.activeCamera) {
          scene.render();
        }
      });

      const handleResize = () => {
        engine.resize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        scene.dispose();
        engine.dispose();
      };
    } catch (err) {
      console.error('Babylon visualization error', err);
      setError(err.message);
    }

    return undefined;
  }, [onSelectNeo]);

  // Sync selection ring with selectedNeo
  useEffect(() => {
    const ring = selectionRingRef.current;
    if (!ring) return;
    if (selectedNeo && !selectedNeo.isEarth) {
      ring._trackedNeo = selectedNeo;
      ring.setEnabled(true);
    } else {
      ring._trackedNeo = null;
      ring.setEnabled(false);
    }
  }, [selectedNeo]);

  // Rebuild asteroids when NEOs change meaningfully
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Cleanup existing
    asteroidsRef.current.forEach(({ mesh }) => mesh.dispose());
    asteroidsRef.current = [];

    // Seeded pseudo-random for deterministic but unique per-asteroid values
    function seededRandom(s) {
      let x = Math.sin(s * 9301 + 49297) * 49297;
      return x - Math.floor(x);
    }

    // HD stone/rock texture - higher resolution rocky surface
    const stoneTextureUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/2048px-FullMoon2010.jpg';

    neos.slice(0, 60).forEach((neo, index) => {
      const size = Math.max(0.35, Math.min(1.6, (neo?.estimatedDiameter?.max || 100) / 600));
      const seed = index * 137.5 + 73.1; // unique seed per asteroid
      const r = (offset) => seededRandom(seed + offset); // shorthand

      // Every asteroid gets a unique gray/brown stone color
      const baseVal = 0.45 + r(1) * 0.35;
      const warmth = r(2) * 0.12; // slight warm/cool shift
      const stoneColor = new Color3(
        baseVal + warmth + r(3) * 0.08,
        baseVal + r(4) * 0.06,
        baseVal - warmth + r(5) * 0.04
      );

      // Subtle risk tint overlay
      let tintMul;
      if (neo?.riskLevel === 'CRITICAL') {
        tintMul = new Color3(1.2, 0.85, 0.8);
      } else if (neo?.riskLevel === 'HIGH') {
        tintMul = new Color3(1.1, 0.95, 0.85);
      } else if (neo?.isPotentiallyHazardous) {
        tintMul = new Color3(1.05, 1.0, 0.9);
      } else {
        tintMul = new Color3(1, 1, 1);
      }

      const material = new StandardMaterial(`asteroidMat-${index}`, scene);
      material.diffuseTexture = new Texture(stoneTextureUrl, scene);
      // Random UV offset & scale so each asteroid's texture looks different
      material.diffuseTexture.uOffset = r(10) * 2;
      material.diffuseTexture.vOffset = r(11) * 2;
      material.diffuseTexture.uScale = 1.5 + r(12) * 2;
      material.diffuseTexture.vScale = 1.5 + r(13) * 2;
      material.diffuseColor = new Color3(
        stoneColor.r * tintMul.r,
        stoneColor.g * tintMul.g,
        stoneColor.b * tintMul.b
      );
      material.specularColor = new Color3(0.06, 0.06, 0.06); // matte stone
      material.specularPower = 4; // very rough surface
      material.ambientColor = new Color3(0.1, 0.1, 0.1);
      material.emissiveColor = new Color3(0.015, 0.015, 0.015);
      
      // Strong bump mapping for stone texture
      material.bumpTexture = new Texture(stoneTextureUrl, scene);
      material.bumpTexture.level = 2.0;
      material.bumpTexture.uOffset = material.diffuseTexture.uOffset;
      material.bumpTexture.vOffset = material.diffuseTexture.vOffset;
      material.bumpTexture.uScale = material.diffuseTexture.uScale;
      material.bumpTexture.vScale = material.diffuseTexture.vScale;

      // --- Unique shape per asteroid using random continuous parameters ---
      // Random diameters along 3 axes (no repeating patterns)
      const dX = size * (1.0 + r(20) * 2.0);  // 1x to 3x
      const dY = size * (0.5 + r(21) * 2.0);  // 0.5x to 2.5x
      const dZ = size * (0.7 + r(22) * 2.2);  // 0.7x to 2.9x
      const segs = 16;
      
      const mesh = MeshBuilder.CreateSphere(`asteroid-${index}`, {
        diameterX: dX, diameterY: dY, diameterZ: dZ, segments: segs
      }, scene);
      
      // --- Aggressive vertex displacement for rough stone surface ---
      const positions = mesh.getVerticesData('position');
      if (positions) {
        // Per-asteroid random frequencies and phases (every asteroid is unique)
        const f1 = 2.5 + r(30) * 3;
        const f2 = 6 + r(31) * 5;
        const f3 = 12 + r(32) * 8;
        const f4 = 20 + r(33) * 15;
        const f5 = 35 + r(34) * 20;
        const f6 = 55 + r(35) * 30;
        
        const p1 = r(40) * 100;
        const p2 = r(41) * 100;
        const p3 = r(42) * 100;
        const p4 = r(43) * 100;
        const p5 = r(44) * 100;
        const p6 = r(45) * 100;
        
        // Random amplitudes (each asteroid has different roughness)
        const a1 = 0.3 + r(50) * 0.3;   // large-scale: 0.3–0.6
        const a2 = 0.15 + r(51) * 0.2;  // medium: 0.15–0.35
        const a3 = 0.08 + r(52) * 0.15; // bumps: 0.08–0.23
        const a4 = 0.05 + r(53) * 0.1;  // jagged: 0.05–0.15
        const a5 = 0.03 + r(54) * 0.06; // fine: 0.03–0.09
        const a6 = 0.01 + r(55) * 0.04; // grit: 0.01–0.05
        
        // Random number of craters (0–4)
        const numCraters = Math.floor(r(60) * 5);
        const craters = [];
        for (let c = 0; c < numCraters; c++) {
          // Random crater center direction (spherical coords)
          const theta = r(70 + c * 3) * Math.PI * 2;
          const phi = r(71 + c * 3) * Math.PI;
          craters.push({
            cx: Math.sin(phi) * Math.cos(theta),
            cy: Math.cos(phi),
            cz: Math.sin(phi) * Math.sin(theta),
            radius: 0.25 + r(72 + c * 3) * 0.5,  // crater angular radius
            depth: 0.15 + r(73 + c * 3) * 0.25     // crater depth
          });
        }
        
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i];
          const y = positions[i + 1];
          const z = positions[i + 2];
          
          const len = Math.sqrt(x * x + y * y + z * z) || 1;
          const nx = x / len;
          const ny = y / len;
          const nz = z / len;
          
          // 6 unique noise octaves with per-asteroid frequencies & phases
          const n1 = Math.sin(nx * f1 + p1) * Math.cos(ny * f1 * 0.9 + p1) * Math.sin(nz * f1 * 1.1 + p1);
          const n2 = Math.sin(nx * f2 + p2) * Math.cos(ny * f2 + p2) * Math.sin(nz * f2 * 0.8 + p2);
          const n3 = Math.cos(nx * f3 + ny * f3 * 0.7 + nz * f3 + p3);
          const n4 = Math.sin(nx * f4 + p4) * Math.sin(nz * f4 + p4);
          const n5 = Math.cos(nx * f5 + ny * f5 + p5) * Math.sin(nz * f5 + p5);
          const n6 = Math.sin(nx * f6 + ny * f6 + nz * f6 + p6);
          
          let disp = 1.0 + n1 * a1 + n2 * a2 + n3 * a3 + n4 * a4 + n5 * a5 + n6 * a6;
          
          // Apply craters — smooth bowl-shaped dents
          for (const cr of craters) {
            const dot = nx * cr.cx + ny * cr.cy + nz * cr.cz;
            const angDist = Math.acos(Math.min(1, Math.max(-1, dot)));
            if (angDist < cr.radius) {
              const t = angDist / cr.radius; // 0 at center, 1 at edge
              const craterProfile = cr.depth * (1 - t * t); // parabolic bowl
              disp -= craterProfile;
            }
          }
          
          // Random sharp ridges (per-asteroid)
          const ridgeFreq = 8 + r(80) * 6;
          const ridgePhase = r(81) * 100;
          const ridgeVal = Math.sin(nx * ridgeFreq + ny * ridgeFreq * 0.6 + ridgePhase);
          if (ridgeVal > 0.8) {
            disp += (ridgeVal - 0.8) * 0.6; // sharp protruding ridge
          }
          
          positions[i] = x * disp;
          positions[i + 1] = y * disp;
          positions[i + 2] = z * disp;
        }
        mesh.updateVerticesData('position', positions);
        
        // Recompute normals for proper lighting
        const normals = mesh.getVerticesData('normal');
        const indices = mesh.getIndices();
        if (normals && indices) {
          VertexData.ComputeNormals(positions, indices, normals);
          mesh.updateVerticesData('normal', normals);
        }
      }
      
      mesh.material = material;
      mesh.metadata = { neo };
      
      // Random rotation so each asteroid faces a unique direction
      mesh.rotation.x = Math.random() * Math.PI * 2;
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.rotation.z = Math.random() * Math.PI * 2;

      const radius = 18 + (index % 12) * 3;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 8;
      const speed = 0.0015 + Math.random() * 0.0035;

      mesh.position = new Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);

      asteroidsRef.current.push({ mesh, neo, radius, angle, speed, y });
    });
  }, [neoSignature]);

  if (error) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff7777' }}>
        Babylon error: {error}
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
