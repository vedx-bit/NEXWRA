import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

interface CinematicIntroProps {
  onComplete: () => void;
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textVisible, setTextVisible] = useState(false);
  const [subTextVisible, setSubTextVisible] = useState(false);
  const [tagVisible, setTagVisible] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [letterClass, setLetterClass] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // ── RENDERER ─────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020010, 0.018);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 0, 28);

    // ── LIGHTING ─────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0a0520, 3));

    const lights = [
      { color: 0x7c3aed, intensity: 200, pos: [-12, 8, 10] },
      { color: 0x06b6d4, intensity: 150, pos: [14, -6, 8] },
      { color: 0xf0abfc, intensity: 80, pos: [0, 15, 5] },
      { color: 0x3b82f6, intensity: 60, pos: [-8, -12, 6] },
    ];
    lights.forEach(({ color, intensity, pos }) => {
      const l = new THREE.PointLight(color, intensity, 80);
      l.position.set(...(pos as [number, number, number]));
      scene.add(l);
    });

    // ── SHADER: AURORA BACKGROUND ─────────────────────────────────────────────
    const auroraMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uResolution;
        varying vec2 vUv;

        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float smoothNoise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(noise(i), noise(i+vec2(1,0)), u.x),
                     mix(noise(i+vec2(0,1)), noise(i+vec2(1,1)), u.x), u.y);
        }
        float fbm(vec2 p) {
          float v = 0.0; float a = 0.5;
          for(int i=0;i<6;i++){v+=a*smoothNoise(p);p*=2.1;a*=0.5;}
          return v;
        }

        void main() {
          vec2 uv = vUv;
          vec2 p = uv * 3.0;
          float t = uTime * 0.15;

          float f1 = fbm(p + vec2(t*0.4, t*0.2));
          float f2 = fbm(p + vec2(-t*0.3, t*0.35) + f1);
          float f3 = fbm(p + f2 * 1.5 + vec2(t*0.2, -t*0.1));

          float aurora = f3 * f3;
          float band = smoothstep(0.2, 0.8, uv.y) * smoothstep(1.0, 0.4, uv.y);
          aurora *= band;

          vec3 col1 = vec3(0.42, 0.18, 0.9);
          vec3 col2 = vec3(0.0, 0.82, 0.98);
          vec3 col3 = vec3(0.9, 0.35, 0.95);
          vec3 col4 = vec3(0.1, 0.45, 0.95);

          vec3 aurora_color = mix(col1, col2, f1);
          aurora_color = mix(aurora_color, col3, f2 * 0.5);
          aurora_color = mix(aurora_color, col4, f3 * 0.3);

          vec3 bg = vec3(0.008, 0.004, 0.055);
          bg += vec3(0.02, 0.0, 0.08) * smoothstep(0.5, 0.0, length(uv - 0.5));

          vec3 final = bg + aurora_color * aurora * 0.55;
          gl_FragColor = vec4(final, 1.0);
        }
      `,
      depthWrite: false,
    });

    const auroraGeo = new THREE.PlaneGeometry(2, 2);
    const auroraMesh = new THREE.Mesh(auroraGeo, auroraMat);
    auroraMesh.renderOrder = -999;
    const bgScene = new THREE.Scene();
    const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    bgScene.add(new THREE.Mesh(auroraGeo, auroraMat));

    // ── PARTICLE GALAXIES ─────────────────────────────────────────────────────
    const makeGalaxy = (count: number, spread: number, colorA: THREE.Color, colorB: THREE.Color, size: number) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      const sz = new Float32Array(count);
      const vel = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const r = Math.pow(Math.random(), 0.5) * spread;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const arms = Math.floor(Math.random() * 3);
        const armAngle = (arms / 3) * Math.PI * 2;
        const spiral = theta + r * 0.4 + armAngle;

        pos[i3] = r * Math.sin(phi) * Math.cos(spiral);
        pos[i3 + 1] = r * Math.sin(phi) * Math.sin(spiral) * 0.3;
        pos[i3 + 2] = r * Math.cos(phi);

        vel[i3] = (Math.random() - 0.5) * 0.003;
        vel[i3 + 1] = (Math.random() - 0.5) * 0.002;
        vel[i3 + 2] = (Math.random() - 0.5) * 0.003;

        const t = Math.random();
        const c = colorA.clone().lerp(colorB, t);
        col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
        sz[i] = Math.random() * size + size * 0.3;
      }

      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));

      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
        vertexShader: `
          attribute float aSize;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vDist;
          uniform float uTime;
          void main() {
            vColor = color;
            vec3 pos = position;
            float angle = uTime * 0.08 * (1.0 / (length(pos.xz) + 1.0));
            float c = cos(angle); float s = sin(angle);
            pos.x = position.x * c - position.z * s;
            pos.z = position.x * s + position.z * c;
            pos.y += sin(uTime * 0.3 + position.x * 0.5) * 0.05;
            vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
            vDist = -mvPos.z;
            gl_PointSize = aSize * (350.0 / vDist);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vDist;
          uniform float uOpacity;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if(d > 0.5) discard;
            float alpha = smoothstep(0.5, 0.0, d);
            alpha *= alpha;
            gl_FragColor = vec4(vColor, alpha * uOpacity * 0.9);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true,
      });

      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      return { pts, mat, geo };
    };

    const galaxy1 = makeGalaxy(6000, 22, new THREE.Color(0x7c3aed), new THREE.Color(0x06b6d4), 0.12);
    const galaxy2 = makeGalaxy(3000, 16, new THREE.Color(0xf0abfc), new THREE.Color(0x3b82f6), 0.08);
    galaxy2.pts.rotation.x = 1.2;

    // ── DNA HELIX TUNNELS ─────────────────────────────────────────────────────
    const helixGroup = new THREE.Group();
    scene.add(helixGroup);

    const helixMat1 = new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0 });
    const helixMat2 = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0 });

    const helixNodes: THREE.Mesh[] = [];
    const helixConnectors: THREE.Mesh[] = [];

    for (let i = 0; i < 40; i++) {
      const t = i / 40;
      const angle1 = t * Math.PI * 8;
      const angle2 = angle1 + Math.PI;
      const y = (t - 0.5) * 28;

      const sphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), helixMat1.clone());
      sphere1.position.set(Math.cos(angle1) * 2.5, y, Math.sin(angle1) * 2.5 - 6);
      helixGroup.add(sphere1);
      helixNodes.push(sphere1);

      const sphere2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), helixMat2.clone());
      sphere2.position.set(Math.cos(angle2) * 2.5, y, Math.sin(angle2) * 2.5 - 6);
      helixGroup.add(sphere2);
      helixNodes.push(sphere2);

      if (i % 4 === 0) {
        const start = sphere1.position.clone();
        const end = sphere2.position.clone();
        const dir = end.clone().sub(start);
        const length = dir.length();
        const connGeo = new THREE.CylinderGeometry(0.02, 0.02, length, 6);
        const conn = new THREE.Mesh(connGeo, new THREE.MeshBasicMaterial({
          color: 0xa78bfa, transparent: true, opacity: 0, blending: THREE.AdditiveBlending
        }));
        conn.position.copy(start.clone().add(end).multiplyScalar(0.5));
        conn.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        helixGroup.add(conn);
        helixConnectors.push(conn);
      }
    }

    // ── CENTRAL CORE: MULTI-LAYERED CRYSTAL ───────────────────────────────────
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Outer shell
    const outerGeo = new THREE.IcosahedronGeometry(3.5, 2);
    const outerMat = new THREE.MeshPhongMaterial({
      color: 0x0d0030,
      emissive: 0x3d0070,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0,
      shininess: 200,
      specular: 0xffffff,
      wireframe: false,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    coreGroup.add(outerMesh);

    // Wireframe
    const wireMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `
        varying vec3 vPos;
        void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform float uTime;
        uniform float uOpacity;
        void main() {
          float pulse = 0.6 + 0.4 * sin(uTime * 2.0 + vPos.y * 1.5);
          vec3 col = mix(vec3(0.48, 0.22, 0.95), vec3(0.0, 0.82, 0.98), pulse);
          gl_FragColor = vec4(col, uOpacity * pulse);
        }
      `,
      transparent: true,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const wireMesh = new THREE.Mesh(outerGeo.clone(), wireMat);
    wireMesh.scale.set(1.01, 1.01, 1.01);
    coreGroup.add(wireMesh);

    // Middle crystal
    const midGeo = new THREE.OctahedronGeometry(2.2, 2);
    const midMat = new THREE.MeshPhongMaterial({
      color: 0x1a0050,
      emissive: 0x5b21b6,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0,
      shininess: 400,
      specular: 0xa78bfa,
    });
    const midMesh = new THREE.Mesh(midGeo, midMat);
    coreGroup.add(midMesh);

    // Inner energy core
    const innerGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const innerMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPos;
        uniform float uTime;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPos = position;
          vec3 pos = position;
          float disp = sin(pos.x * 4.0 + uTime*3.0) * sin(pos.y*4.0+uTime*2.0) * 0.15;
          pos += normal * disp;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uOpacity;
        void main() {
          float rim = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
          rim = pow(rim, 2.0);
          float pulse = 0.5 + 0.5 * sin(uTime * 3.0);
          vec3 col1 = vec3(0.48, 0.18, 0.95);
          vec3 col2 = vec3(0.0, 0.85, 1.0);
          vec3 col = mix(col1, col2, rim + pulse * 0.3);
          float alpha = (rim * 0.8 + 0.3) * uOpacity;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);

    // ── ORBITING RINGS (Animated Shaders) ────────────────────────────────────
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const makeRing = (radius: number, tube: number, color: number, _opacity: number) => {
      const geo = new THREE.TorusGeometry(radius, tube, 24, 200);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(color) } },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPos;
          void main() { vUv = uv; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uColor;
          varying vec2 vUv;
          void main() {
            float dash = step(0.5, fract(vUv.x * 20.0 - uTime * 0.5));
            float glow = 0.6 + 0.4 * sin(uTime * 2.0 + vUv.x * 12.566);
            gl_FragColor = vec4(uColor * glow, dash * uOpacity * glow);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      ringGroup.add(mesh);
      return { mesh, mat };
    };

    const rings = [
      { ...makeRing(5.5, 0.03, 0x7c3aed, 0.7), rotX: 0.2, rotY: 0, speed: 0.3 },
      { ...makeRing(7, 0.02, 0x06b6d4, 0.6), rotX: 1.1, rotY: 0.4, speed: -0.2 },
      { ...makeRing(8.8, 0.015, 0xf0abfc, 0.5), rotX: 1.6, rotY: 0.9, speed: 0.15 },
      { ...makeRing(10.5, 0.01, 0x3b82f6, 0.4), rotX: 0.7, rotY: 1.5, speed: -0.1 },
    ];

    rings.forEach(({ mesh, rotX, rotY }) => {
      mesh.rotation.x = rotX;
      mesh.rotation.y = rotY;
    });

    // ── ENERGY BEAMS ─────────────────────────────────────────────────────────
    const beamGroup = new THREE.Group();
    scene.add(beamGroup);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const beamGeo = new THREE.CylinderGeometry(0.008, 0.04, 18, 6, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x7c3aed : 0x06b6d4,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(Math.cos(angle) * 4, 0, Math.sin(angle) * 4);
      beam.rotation.z = angle + Math.PI / 2;
      beamGroup.add(beam);
    }

    // ── FLOATING ORBS ─────────────────────────────────────────────────────────
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    const orbData: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; yOffset: number }[] = [];
    const orbColors = [0x7c3aed, 0x06b6d4, 0xf0abfc, 0xfbbf24, 0x34d399, 0xf87171, 0xa78bfa, 0x38bdf8];

    for (let i = 0; i < 8; i++) {
      const geo = new THREE.SphereGeometry(0.18 + Math.random() * 0.12, 16, 16);
      const mat = new THREE.MeshPhongMaterial({
        color: orbColors[i],
        emissive: orbColors[i],
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0,
        shininess: 300,
      });
      const orb = new THREE.Mesh(geo, mat);
      const angle = (i / 8) * Math.PI * 2;
      const radius = 12 + Math.random() * 3;
      orb.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 5, Math.sin(angle) * radius);
      orbGroup.add(orb);
      orbData.push({ mesh: orb, angle, radius, speed: 0.15 + Math.random() * 0.1, yOffset: Math.random() * Math.PI * 2 });
    }

    // ── STAR FIELD ───────────────────────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(8000 * 3);
    const starCol = new Float32Array(8000 * 3);
    for (let i = 0; i < 8000; i++) {
      const i3 = i * 3;
      starPos[i3] = (Math.random() - 0.5) * 400;
      starPos[i3 + 1] = (Math.random() - 0.5) * 400;
      starPos[i3 + 2] = (Math.random() - 0.5) * 400;
      const brightness = Math.random();
      starCol[i3] = 0.6 + brightness * 0.4;
      starCol[i3 + 1] = 0.6 + brightness * 0.3;
      starCol[i3 + 2] = 0.8 + brightness * 0.2;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── GRID PLANE (Holographic) ──────────────────────────────────────────────
    const gridMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uOpacity;
        void main() {
          vec2 grid = abs(fract(vUv * 20.0 - 0.5) - 0.5) / fwidth(vUv * 20.0);
          float line = min(grid.x, grid.y);
          float g = 1.0 - min(line, 1.0);
          float pulse = 0.4 + 0.3 * sin(uTime * 0.5 + vUv.x * 6.28 + vUv.y * 3.14);
          float fade = 1.0 - smoothstep(0.0, 1.0, length(vUv - 0.5) * 1.8);
          vec3 col = mix(vec3(0.12,0.0,0.4), vec3(0.0,0.82,0.98), vUv.x);
          gl_FragColor = vec4(col, g * pulse * fade * uOpacity * 0.6);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const gridPlane = new THREE.Mesh(new THREE.PlaneGeometry(60, 60, 1, 1), gridMat);
    gridPlane.rotation.x = -Math.PI / 2;
    gridPlane.position.y = -10;
    scene.add(gridPlane);

    // ── GSAP MASTER TIMELINE ──────────────────────────────────────────────────
    const tl = gsap.timeline({
      onComplete: () => {
        setFadeOut(true);
        setTimeout(onComplete, 1100);
      },
    });

    // 0-1s: Particles + stars fade in
    tl.to(galaxy1.mat.uniforms.uOpacity, { value: 0.85, duration: 1.2, ease: "power2.inOut" }, 0);
    tl.to(galaxy2.mat.uniforms.uOpacity, { value: 0.6, duration: 1.2 }, 0.2);

    // 0.4-1.8s: Core materializes
    tl.to(outerMat, { opacity: 0.9, duration: 1.2, ease: "power3.out" }, 0.4);
    tl.to(wireMat.uniforms.uOpacity, { value: 0.7, duration: 1.2 }, 0.4);
    tl.to(midMat, { opacity: 0.8, duration: 1.0 }, 0.6);
    tl.to(innerMat.uniforms.uOpacity, { value: 1, duration: 1.0 }, 0.7);
    tl.to(coreGroup.scale, { x: 1, y: 1, z: 1, duration: 1.5, ease: "elastic.out(1, 0.5)" }, 0.4);

    // 0.8s: Grid
    tl.to(gridMat.uniforms.uOpacity, { value: 1, duration: 1.0 }, 0.8);

    // 1.0-2.2s: Rings
    rings.forEach(({ mat }, i) => {
      tl.to(mat.uniforms.uOpacity, { value: 0.7, duration: 0.7, ease: "power2.out" }, 1.0 + i * 0.12);
    });

    // 1.2s: Helix + beams
    helixNodes.forEach((n, i) => {
      tl.to((n.material as THREE.MeshBasicMaterial), { opacity: 0.9, duration: 0.4 }, 1.2 + i * 0.02);
    });
    helixConnectors.forEach((c, i) => {
      tl.to((c.material as THREE.MeshBasicMaterial), { opacity: 0.4, duration: 0.3 }, 1.5 + i * 0.05);
    });
    beamGroup.children.forEach((b, i) => {
      tl.to((b as THREE.Mesh).material, { opacity: 0.4, duration: 0.5 }, 1.3 + i * 0.08);
    });

    // 1.5s: Orbs
    orbData.forEach(({ mesh }, i) => {
      tl.to((mesh.material as THREE.MeshPhongMaterial), { opacity: 1, duration: 0.5, ease: "back.out(2)" }, 1.5 + i * 0.1);
    });

    // 1.8s: Text
    tl.call(() => setTextVisible(true), [], 1.6);
    tl.call(() => setLetterClass(true), [], 1.9);
    tl.call(() => setSubTextVisible(true), [], 2.2);
    tl.call(() => setTagVisible(true), [], 2.5);

    // Loading bar
    tl.to({ v: 0 }, {
      v: 100, duration: 2.8, ease: "power1.inOut",
      onUpdate: function () { setLoadPct(Math.round(this.targets()[0].v)); }
    }, 1.6);

    // Camera pull-in
    tl.to(camera.position, { z: 16, duration: 4.5, ease: "power1.inOut" }, 0.3);

    // Hold 5.5s then complete
    tl.to({}, { duration: 0.8 }, 5.0);

    // ── ANIMATION LOOP ────────────────────────────────────────────────────────
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Uniforms
      auroraMat.uniforms.uTime.value = t;
      galaxy1.mat.uniforms.uTime.value = t;
      galaxy2.mat.uniforms.uTime.value = t;
      wireMat.uniforms.uTime.value = t;
      innerMat.uniforms.uTime.value = t;
      gridMat.uniforms.uTime.value = t;
      rings.forEach(({ mat }) => { mat.uniforms.uTime.value = t; });

      // Core rotation
      coreGroup.rotation.y = t * 0.25;
      coreGroup.rotation.x = Math.sin(t * 0.15) * 0.2;
      midMesh.rotation.y = -t * 0.4;
      midMesh.rotation.z = t * 0.2;

      // Rings
      rings.forEach(({ mesh, speed }) => { mesh.rotation.z += speed * 0.01; });

      // Galaxies
      galaxy1.pts.rotation.y = t * 0.03;
      galaxy2.pts.rotation.y = -t * 0.025;
      galaxy2.pts.rotation.z = t * 0.01;

      // Helix scroll
      helixGroup.rotation.y = t * 0.2;

      // Orbs
      orbData.forEach(({ mesh, angle, radius, speed, yOffset }) => {
        const a = angle + t * speed;
        mesh.position.x = Math.cos(a) * radius;
        mesh.position.z = Math.sin(a) * radius;
        mesh.position.y = Math.sin(t * 0.5 + yOffset) * 2.5;
        mesh.rotation.y += 0.03;
      });

      // Camera sway
      camera.position.x = Math.sin(t * 0.18) * 2.5;
      camera.position.y = Math.cos(t * 0.13) * 1.2;
      camera.lookAt(0, 0, 0);

      // Light pulse
      lights.forEach((_, i) => {
        const pl = scene.children.find((c, ci) => c instanceof THREE.PointLight && ci === i + 1) as THREE.PointLight;
        if (pl) pl.intensity = lights[i].intensity * (0.8 + 0.3 * Math.sin(t * 1.5 + i));
      });

      renderer.autoClear = false;
      renderer.clear();
      renderer.render(bgScene, bgCam);
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      auroraMat.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      tl.kill();
    };
  }, [onComplete]);

  const letters = "NEXWRA".split("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 1.1s cubic-bezier(0.4,0,0.2,1)",
        background: "#020010",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* CRT scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)",
        zIndex: 2,
      }} />

      {/* Radial vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(2,0,16,0.7) 100%)",
        zIndex: 3,
      }} />

      {/* Corner glow accents */}
      <div className="absolute top-0 left-0 w-96 h-96 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 0% 0%, rgba(124,58,237,0.2) 0%, transparent 70%)",
        zIndex: 4,
      }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 100% 100%, rgba(6,182,212,0.15) 0%, transparent 70%)",
        zIndex: 4,
      }} />

      {/* DEV CREDIT — TOP RIGHT */}
      <div className="absolute top-7 right-8 z-20 flex items-center gap-2" style={{
        opacity: tagVisible ? 1 : 0,
        transform: tagVisible ? "translateX(0)" : "translateX(20px)",
        transition: "all 0.8s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{ width: "1px", height: "20px", background: "linear-gradient(180deg, transparent, rgba(124,58,237,0.6), transparent)" }} />
        <div className="flex flex-col items-end" style={{ gap: "1px" }}>
          <span style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.25em", color: "rgba(167,139,250,0.45)", textTransform: "uppercase" }}>developed by</span>
          <span style={{ fontFamily: "monospace", fontSize: "13px", letterSpacing: "0.3em", color: "rgba(167,139,250,0.85)", textTransform: "uppercase", fontWeight: 700 }}>VedX</span>
        </div>
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#06b6d4", boxShadow: "0 0 8px #06b6d4", animation: "blink 1.5s infinite" }} />
      </div>

      {/* TOP STATUS BAR */}
      <div className="absolute top-7 left-8 z-20 flex items-center gap-4" style={{
        opacity: tagVisible ? 1 : 0,
        transition: "opacity 0.8s ease 0.2s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399", animation: "blink 2s infinite" }} />
          <span style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.2em", color: "rgba(52,211,153,0.7)", textTransform: "uppercase" }}>Systems Online</span>
        </div>
        <div style={{ width: "1px", height: "12px", background: "rgba(124,58,237,0.3)" }} />
        <span style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(124,58,237,0.5)", textTransform: "uppercase" }}>v2.0.0</span>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col items-center justify-center" style={{ userSelect: "none" }}>

        {/* Platform label */}
        <div style={{
          opacity: textVisible ? 1 : 0,
          transform: textVisible ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.8s cubic-bezier(0.4,0,0.2,1)",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <div style={{ height: "1px", width: "40px", background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.6))" }} />
          <span style={{ fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.5em", color: "rgba(6,182,212,0.8)", textTransform: "uppercase" }}>
            AI Workforce Platform
          </span>
          <div style={{ height: "1px", width: "40px", background: "linear-gradient(90deg, rgba(124,58,237,0.6), transparent)" }} />
        </div>

        {/* NEXWRA — letter by letter */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Behind glow bloom */}
          <div aria-hidden style={{
            position: "absolute",
            width: "120%",
            height: "200%",
            background: "radial-gradient(ellipse, rgba(124,58,237,0.25) 0%, rgba(6,182,212,0.1) 40%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", gap: "clamp(2px, 0.5vw, 8px)" }}>
            {letters.map((l, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                  fontSize: "clamp(80px, 14vw, 160px)",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  display: "inline-block",
                  background: `linear-gradient(160deg, #ffffff 0%, #c4b5fd ${20 + i * 10}%, #7c3aed ${50 + i * 5}%, #06b6d4 80%, #e0f2fe 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 30px rgba(124,58,237,0.8)) drop-shadow(0 0 60px rgba(6,182,212,0.4))",
                  opacity: letterClass ? 1 : 0,
                  transform: letterClass ? "translateY(0) scale(1) rotateX(0deg)" : "translateY(60px) scale(0.7) rotateX(30deg)",
                  transition: `all 0.9s cubic-bezier(0.16,1,0.3,1) ${0.05 * i}s`,
                }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Glowing underline */}
        <div style={{
          height: "2px",
          width: letterClass ? "100%" : "0%",
          background: "linear-gradient(90deg, transparent 0%, #7c3aed 20%, #06b6d4 50%, #a78bfa 80%, transparent 100%)",
          transition: "width 1.2s cubic-bezier(0.4,0,0.2,1) 0.5s",
          boxShadow: "0 0 20px rgba(124,58,237,0.6), 0 0 40px rgba(6,182,212,0.3)",
          marginTop: "4px",
        }} />

        {/* Tagline */}
        <div style={{
          marginTop: "24px",
          opacity: subTextVisible ? 1 : 0,
          transform: subTextVisible ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.9s cubic-bezier(0.4,0,0.2,1)",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            fontSize: "clamp(13px, 2vw, 20px)",
            letterSpacing: "0.35em",
            color: "transparent",
            textTransform: "uppercase",
            fontWeight: 300,
            background: "linear-gradient(90deg, rgba(167,139,250,0.7), rgba(6,182,212,0.9), rgba(167,139,250,0.7))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Deploy Your AI Workforce
          </p>
        </div>

        {/* Stats row */}
        <div style={{
          marginTop: "32px",
          display: "flex",
          gap: "32px",
          opacity: tagVisible ? 1 : 0,
          transform: tagVisible ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.8s cubic-bezier(0.4,0,0.2,1) 0.2s",
        }}>
          {[
            { label: "Agents", value: "50+" },
            { label: "Tasks/sec", value: "2.4K" },
            { label: "Uptime", value: "99.9%" },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 700, color: "#06b6d4", letterSpacing: "-0.02em" }}>{value}</div>
              <div style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.2em", color: "rgba(167,139,250,0.4)", textTransform: "uppercase", marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Loading bar */}
        <div style={{
          marginTop: "44px",
          width: "240px",
          opacity: textVisible ? 1 : 0,
          transition: "opacity 0.6s ease 0.3s",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.2em", color: "rgba(124,58,237,0.6)", textTransform: "uppercase" }}>Initializing</span>
            <span style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(6,182,212,0.7)" }}>{loadPct}%</span>
          </div>
          <div style={{ height: "2px", background: "rgba(124,58,237,0.15)", borderRadius: "1px", overflow: "hidden", position: "relative" }}>
            <div style={{
              height: "100%",
              width: `${loadPct}%`,
              background: "linear-gradient(90deg, #7c3aed, #06b6d4, #a78bfa)",
              borderRadius: "1px",
              transition: "width 0.1s linear",
              boxShadow: "0 0 10px rgba(6,182,212,0.8)",
            }} />
          </div>
          {/* Tick marks */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            {[0, 25, 50, 75, 100].map((v) => (
              <div key={v} style={{ width: "1px", height: "4px", background: loadPct >= v ? "rgba(6,182,212,0.6)" : "rgba(124,58,237,0.2)" }} />
            ))}
          </div>
        </div>

        {/* Bottom hint */}
        <div style={{
          marginTop: "20px",
          opacity: tagVisible ? 0.4 : 0,
          transition: "opacity 1s ease 0.5s",
        }}>
          <span style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.3em", color: "rgba(167,139,250,0.5)", textTransform: "uppercase" }}>
            [ Entering System ]
          </span>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%,100% { opacity:1; }
          50% { opacity:0.2; }
        }
      `}</style>
    </div>
  );
}
