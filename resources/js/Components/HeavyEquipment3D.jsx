import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Interpolasi halus untuk siklus gali
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

// Keyframe siklus kerja: [boom, stick, bucket, swing turret]
const DIG_CYCLE = [
    [0, 0, 0, 0], // posisi awal
    [-0.24, 0.26, 0.35, 0], // menjangkau tanah
    [-0.2, -0.26, -0.5, 0], // menggali (bucket menekuk)
    [0.14, -0.3, -0.55, 0], // mengangkat muatan
    [0.14, -0.2, -0.55, 0.7], // berputar ke tumpukan
    [0.14, -0.2, 0.35, 0.7], // menumpahkan muatan
];
const SEGMENT_SECONDS = 1.6;

export default function HeavyEquipment3D({ status = 404, className = '' }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const size = () => ({
            w: Math.max(1, container.clientWidth),
            h: Math.max(1, container.clientHeight),
        });

        // 1. Scene & Camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, size().w / size().h, 0.1, 100);
        camera.position.set(5.6, 3.5, 6.2);

        // 2. Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
        });
        renderer.setSize(size().w, size().h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        container.appendChild(renderer.domElement);

        // 3. Environment reflection
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = envTexture;
        scene.environmentIntensity = 0.75;

        // 4. Controls: auto-rotate berhenti saat disentuh, lanjut setelah 2,5 detik
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.enablePan = false;
        controls.minDistance = 4.2;
        controls.maxDistance = 11;
        controls.maxPolarAngle = Math.PI / 2 - 0.04;
        controls.target.set(0.5, 1.2, -0.2);
        controls.autoRotate = !reduceMotion;
        controls.autoRotateSpeed = 0.8;

        let resumeTimer;
        const onStart = () => {
            clearTimeout(resumeTimer);
            controls.autoRotate = false;
        };
        const onEnd = () => {
            clearTimeout(resumeTimer);
            if (!reduceMotion) resumeTimer = setTimeout(() => (controls.autoRotate = true), 2500);
        };
        controls.addEventListener('start', onStart);
        controls.addEventListener('end', onEnd);

        // 5. Lighting
        scene.add(new THREE.HemisphereLight(0xf8fafc, 0x0f172a, 0.5));

        const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
        keyLight.position.set(6, 10, 6);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.camera.near = 1;
        keyLight.shadow.camera.far = 25;
        const sd = 5.5;
        Object.assign(keyLight.shadow.camera, { left: -sd, right: sd, top: sd, bottom: -sd });
        keyLight.shadow.bias = -0.0004;
        keyLight.shadow.normalBias = 0.02;
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.2);
        rimLight.position.set(-6, 4, -5);
        scene.add(rimLight);

        const alertColor = status === 403 || status === 500 ? 0xef4444 : 0xf59e0b;
        const beaconLight = new THREE.PointLight(alertColor, 3.5, 6);
        scene.add(beaconLight);

        // 6. Texture prosedural
        const createHazardTexture = () => {
            const c = document.createElement('canvas');
            c.width = 256;
            c.height = 64;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#18181b';
            ctx.fillRect(0, 0, 256, 64);
            ctx.fillStyle = '#f59e0b';
            for (let x = -64; x < 320; x += 48) {
                ctx.beginPath();
                ctx.moveTo(x, 64);
                ctx.lineTo(x + 24, 64);
                ctx.lineTo(x + 56, 0);
                ctx.lineTo(x + 32, 0);
                ctx.closePath();
                ctx.fill();
            }
            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(3, 1);
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
            tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
        };

        const createGlowTexture = () => {
            const c = document.createElement('canvas');
            c.width = c.height = 256;
            const ctx = c.getContext('2d');
            const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
            g.addColorStop(0, 'rgba(245,158,11,0.38)');
            g.addColorStop(0.55, 'rgba(245,158,11,0.1)');
            g.addColorStop(1, 'rgba(245,158,11,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 256, 256);
            const tex = new THREE.CanvasTexture(c);
            tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
        };

        // 7. Material PBR
        const catYellow = new THREE.MeshPhysicalMaterial({
            color: 0xf59e0b,
            roughness: 0.3,
            metalness: 0.2,
            clearcoat: 0.8,
            clearcoatRoughness: 0.25,
        });
        const darkGunmetal = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.75 });
        const trackSteel = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.65, metalness: 0.65 });
        const chrome = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.1, metalness: 0.96 });
        const tintedGlass = new THREE.MeshPhysicalMaterial({
            color: 0x0b1220,
            roughness: 0.05,
            metalness: 0.1,
            transparent: true,
            opacity: 0.55,
            clearcoat: 1,
            envMapIntensity: 1.6,
            depthWrite: false,
        });
        const hazardMat = new THREE.MeshStandardMaterial({ map: createHazardTexture(), roughness: 0.4, metalness: 0.2 });
        const beaconMat = new THREE.MeshStandardMaterial({
            color: alertColor,
            emissive: alertColor,
            emissiveIntensity: 2.5,
            roughness: 0.2,
        });
        const ledWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe0f2fe, emissiveIntensity: 2.2 });
        const dirtMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1, flatShading: true });

        const setShadow = (obj) => {
            obj.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            return obj;
        };

        // 8. Lantai: bayangan kontak, grid, platform bercahaya
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.ShadowMaterial({ opacity: 0.5 }));
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        const glow = new THREE.Mesh(
            new THREE.CircleGeometry(6, 48),
            new THREE.MeshBasicMaterial({
                map: createGlowTexture(),
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            })
        );
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.002;
        scene.add(glow);

        const grid = new THREE.GridHelper(10, 20, 0xf59e0b, 0x334155);
        grid.position.y = 0.006;
        grid.material.opacity = 0.28;
        grid.material.transparent = true;
        scene.add(grid);

        // Tumpukan tanah (galian & timbunan)
        const makeMound = (radius, height, x, z, seed) => {
            const geo = new THREE.IcosahedronGeometry(1, 2);
            const p = geo.attributes.position;
            for (let i = 0; i < p.count; i++) {
                const n = Math.sin(i * 12.9898 + seed) * 43758.5453;
                const jitter = 1 + ((n - Math.floor(n)) - 0.5) * 0.22;
                p.setXYZ(i, p.getX(i) * radius * jitter, Math.max(0, p.getY(i)) * height * jitter, p.getZ(i) * radius * jitter);
            }
            geo.computeVertexNormals();
            const m = new THREE.Mesh(geo, dirtMat);
            m.position.set(x, 0, z);
            m.castShadow = m.receiveShadow = true;
            scene.add(m);
        };
        makeMound(0.85, 0.36, 3.4, -0.3, 1);
        makeMound(0.6, 0.5, 1.8, -2.0, 7);

        // ==========================================
        // MODEL EXCAVATOR
        // ==========================================
        const excavator = new THREE.Group();
        scene.add(excavator);

        // A. Crawler: link rantai dibuat InstancedMesh mengikuti lintasan oval
        const TRACK_R = 0.33;
        const TRACK_HALF = 1.32;
        const LINK_COUNT = 44;
        const shoeGeo = new THREE.BoxGeometry(0.19, 0.05, 0.62);
        const straight = TRACK_HALF * 2;
        const arc = Math.PI * TRACK_R;
        const perimeter = (straight + arc) * 2;
        const dummy = new THREE.Object3D();

        const trackPoint = (s) => {
            s = ((s % perimeter) + perimeter) % perimeter;
            if (s < straight) return [-TRACK_HALF + s, -TRACK_R, 0];
            s -= straight;
            if (s < arc) {
                const a = -Math.PI / 2 + s / TRACK_R;
                return [TRACK_HALF + Math.cos(a) * TRACK_R, Math.sin(a) * TRACK_R, a + Math.PI / 2];
            }
            s -= arc;
            if (s < straight) return [TRACK_HALF - s, TRACK_R, Math.PI];
            s -= straight;
            const a = Math.PI / 2 + s / TRACK_R;
            return [-TRACK_HALF + Math.cos(a) * TRACK_R, Math.sin(a) * TRACK_R, a + Math.PI / 2];
        };

        const createCrawlerTrack = (zPos) => {
            const g = new THREE.Group();
            g.position.set(0, 0.34, zPos);

            g.add(new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.34, 0.44), darkGunmetal));

            const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.48, 24);
            wheelGeo.rotateX(Math.PI / 2);
            [TRACK_HALF, -TRACK_HALF].forEach((x) => {
                const w = new THREE.Mesh(wheelGeo, darkGunmetal);
                w.position.x = x;
                g.add(w);
            });

            const rollerGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.5, 14);
            rollerGeo.rotateX(Math.PI / 2);
            for (let i = -2; i <= 2; i++) {
                const r = new THREE.Mesh(rollerGeo, trackSteel);
                r.position.set(i * 0.48, -0.22, 0);
                g.add(r);
            }

            const links = new THREE.InstancedMesh(shoeGeo, trackSteel, LINK_COUNT);
            for (let i = 0; i < LINK_COUNT; i++) {
                const [x, y, rz] = trackPoint((i / LINK_COUNT) * perimeter);
                dummy.position.set(x, y, 0);
                dummy.rotation.set(0, 0, rz);
                dummy.updateMatrix();
                links.setMatrixAt(i, dummy.matrix);
            }
            g.add(links);
            return g;
        };

        excavator.add(createCrawlerTrack(1.02));
        excavator.add(createCrawlerTrack(-1.02));

        const hFrame = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.26, 1.75, 3, 0.04), darkGunmetal);
        hFrame.position.set(0, 0.38, 0);
        excavator.add(hFrame);

        const swingRing = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.78, 0.22, 32), trackSteel);
        swingRing.position.set(0, 0.6, 0);
        excavator.add(swingRing);

        // B. Badan atas (turret)
        const turret = new THREE.Group();
        turret.position.set(0, 0.72, 0);
        excavator.add(turret);

        const deck = new THREE.Mesh(new RoundedBoxGeometry(2.65, 0.22, 1.92, 3, 0.03), darkGunmetal);
        deck.position.set(-0.22, 0.11, 0);
        turret.add(deck);

        const engineHood = new THREE.Mesh(new RoundedBoxGeometry(1.85, 0.85, 1.84, 4, 0.07), catYellow);
        engineHood.position.set(-0.42, 0.62, 0);
        turret.add(engineHood);

        for (let i = 0; i < 4; i++) {
            const vent = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.035, 1.88), darkGunmetal);
            vent.position.set(-0.45, 0.45 + i * 0.13, 0);
            turret.add(vent);
        }

        const counterweight = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.92, 1.88, 4, 0.08), catYellow);
        counterweight.position.set(-1.55, 0.56, 0);
        turret.add(counterweight);

        const hazardBand = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.2, 1.9), hazardMat);
        hazardBand.position.set(-1.55, 0.42, 0);
        turret.add(hazardBand);

        const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 14), trackSteel);
        muffler.position.set(-0.85, 1.25, -0.45);
        turret.add(muffler);

        const railBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.35, 8), darkGunmetal);
        railBar.rotation.z = Math.PI / 2;
        railBar.position.set(-0.45, 1.35, -0.85);
        turret.add(railBar);
        [-1.1, -0.45, 0.2].forEach((rx) => {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), darkGunmetal);
            post.position.set(rx, 1.18, -0.85);
            turret.add(post);
        });

        // C. Kabin operator
        const cabin = new THREE.Group();
        cabin.position.set(0.42, 0.22, 0.48);
        turret.add(cabin);

        const seat = new THREE.Mesh(new RoundedBoxGeometry(0.38, 0.48, 0.42, 2, 0.05), darkGunmetal);
        seat.position.set(-0.1, 0.35, 0);
        cabin.add(seat);

        const glass = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.22, 0.88), tintedGlass);
        glass.position.set(0, 0.65, 0);
        glass.renderOrder = 2;
        cabin.add(glass);

        const pillarGeo = new THREE.BoxGeometry(0.07, 1.25, 0.07);
        [[-0.54, -0.42], [0.54, -0.42], [-0.54, 0.42], [0.54, 0.42]].forEach(([px, pz]) => {
            const pillar = new THREE.Mesh(pillarGeo, darkGunmetal);
            pillar.position.set(px, 0.65, pz);
            cabin.add(pillar);
        });

        const roof = new THREE.Mesh(new RoundedBoxGeometry(1.24, 0.11, 0.98, 3, 0.04), catYellow);
        roof.position.set(0.02, 1.31, 0);
        cabin.add(roof);

        [-0.28, 0.28].forEach((lz) => {
            const wl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.14), ledWhiteMat);
            wl.position.set(0.64, 1.28, lz);
            cabin.add(wl);
        });

        const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.06, 16), darkGunmetal);
        beaconBase.position.set(-0.25, 1.39, 0);
        cabin.add(beaconBase);
        const beaconDome = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.16, 16), beaconMat);
        beaconDome.position.set(-0.25, 1.49, 0);
        cabin.add(beaconDome);

        // D. Boom, stick, bucket
        const extrude = (shape, depth, bevel) => {
            const geo = new THREE.ExtrudeGeometry(shape, {
                depth,
                bevelEnabled: true,
                bevelThickness: bevel,
                bevelSize: bevel,
                bevelSegments: 2,
            });
            geo.translate(0, 0, -depth / 2);
            return geo;
        };

        const boomPivot = new THREE.Group();
        boomPivot.position.set(0.55, 0.65, -0.32);
        turret.add(boomPivot);

        const boomShape = new THREE.Shape();
        boomShape.moveTo(0, -0.18);
        boomShape.lineTo(1.15, 0.55);
        boomShape.lineTo(2.25, 1.45);
        boomShape.lineTo(2.15, 1.68);
        boomShape.lineTo(1.02, 0.92);
        boomShape.lineTo(-0.08, 0.22);
        boomShape.closePath();
        boomPivot.add(new THREE.Mesh(extrude(boomShape, 0.34, 0.02), catYellow));

        const stickPivot = new THREE.Group();
        stickPivot.position.set(2.18, 1.56, 0);
        boomPivot.add(stickPivot);

        const stickShape = new THREE.Shape();
        stickShape.moveTo(-0.12, 0.35);
        stickShape.lineTo(0.14, 0.35);
        stickShape.lineTo(0.45, -1.45);
        stickShape.lineTo(0.28, -1.48);
        stickShape.closePath();
        stickPivot.add(new THREE.Mesh(extrude(stickShape, 0.26, 0.015), catYellow));

        const bucketPivot = new THREE.Group();
        bucketPivot.position.set(0.36, -1.44, 0);
        stickPivot.add(bucketPivot);

        const bucketShape = new THREE.Shape();
        bucketShape.moveTo(0, 0);
        bucketShape.lineTo(0.28, -0.08);
        bucketShape.quadraticCurveTo(0.38, -0.48, -0.18, -0.58);
        bucketShape.lineTo(-0.24, -0.46);
        bucketShape.quadraticCurveTo(0.16, -0.38, 0.12, -0.12);
        bucketShape.closePath();
        bucketPivot.add(new THREE.Mesh(extrude(bucketShape, 0.58, 0.015), darkGunmetal));

        const toothGeo = new THREE.ConeGeometry(0.038, 0.16, 4);
        toothGeo.rotateZ(Math.PI / 2);
        for (let tz = -0.22; tz <= 0.221; tz += 0.11) {
            const tooth = new THREE.Mesh(toothGeo, chrome);
            tooth.position.set(-0.28, -0.52, tz);
            tooth.rotation.z = 0.25;
            bucketPivot.add(tooth);
        }

        // Pin sendi krom di tiap engsel
        const pinGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.5, 16);
        pinGeo.rotateX(Math.PI / 2);
        [boomPivot, stickPivot, bucketPivot].forEach((p) => p.add(new THREE.Mesh(pinGeo, chrome)));

        // Braket dudukan silinder
        const addBracket = (parent, x, y, z, sx, sy, sz) => {
            const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), darkGunmetal);
            b.position.set(x, y, z);
            parent.add(b);
        };
        addBracket(turret, 0.9, 0.28, -0.32, 0.18, 0.3, 0.7);
        addBracket(boomPivot, 0.65, 0.76, 0, 0.16, 0.14, 0.62);
        addBracket(boomPivot, 1.0, 1.03, 0, 0.14, 0.26, 0.18);
        addBracket(stickPivot, -0.02, 0.42, 0, 0.16, 0.16, 0.2);
        [-0.22, 0.22].forEach((z) => addBracket(bucketPivot, -0.05, 0.07, z, 0.1, 0.2, 0.04));

        // E. Silinder hidrolik dinamis: selalu menyambung dua titik angkur,
        //    sehingga ikut bergerak saat boom/stick/bucket beranimasi
        const rams = [];
        const unitY = new THREE.Vector3(0, 1, 0);
        const tA = new THREE.Vector3();
        const tB = new THREE.Vector3();
        const barrelGeo = new THREE.CylinderGeometry(1, 1, 1, 14).translate(0, 0.5, 0);
        const pinBallGeo = new THREE.SphereGeometry(1, 12, 10);

        const makeRam = (pa, la, pb, lb, r = 0.075) => {
            const g = new THREE.Group();
            const barrel = new THREE.Mesh(barrelGeo, darkGunmetal);
            barrel.scale.set(r, 1, r);
            const rod = new THREE.Mesh(barrelGeo, chrome);
            rod.scale.set(r * 0.6, 1, r * 0.6);
            const ballA = new THREE.Mesh(pinBallGeo, chrome);
            const ballB = new THREE.Mesh(pinBallGeo, chrome);
            ballA.scale.setScalar(r * 1.1);
            ballB.scale.setScalar(r * 1.1);
            g.add(barrel, rod, ballA, ballB);
            excavator.add(g);
            rams.push({ g, barrel, rod, ballB, pa, la: new THREE.Vector3(...la), pb, lb: new THREE.Vector3(...lb) });
        };

        [-0.22, 0.22].forEach((z) => makeRam(turret, [0.9, 0.28, -0.32 + z], boomPivot, [0.65, 0.8, z]));
        makeRam(boomPivot, [1.0, 1.17, 0], stickPivot, [-0.05, 0.48, 0], 0.07);
        [-0.2, 0.2].forEach((z) => makeRam(stickPivot, [-0.2, 0.15, z], bucketPivot, [-0.06, 0.15, z], 0.05));

        const updateRams = () => {
            scene.updateMatrixWorld(true);
            rams.forEach((r) => {
                r.pa.localToWorld(tA.copy(r.la));
                r.pb.localToWorld(tB.copy(r.lb));
                excavator.worldToLocal(tA);
                excavator.worldToLocal(tB);
                tB.sub(tA);
                const len = tB.length();
                r.g.position.copy(tA);
                r.g.quaternion.setFromUnitVectors(unitY, tB.normalize());
                r.barrel.scale.y = len * 0.58;
                r.rod.position.y = len * 0.38;
                r.rod.scale.y = len * 0.62;
                r.ballB.position.y = len;
            });
        };

        setShadow(excavator);

        // Partikel debu melayang naik perlahan
        const particleCount = 60;
        const positions = new Float32Array(particleCount * 3);
        const speeds = new Float32Array(particleCount);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 9;
            positions[i * 3 + 1] = Math.random() * 4.5 + 0.2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 9;
            speeds[i] = 0.05 + Math.random() * 0.12;
        }
        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const dust = new THREE.Points(
            particleGeo,
            new THREE.PointsMaterial({
                color: 0xfbbf24,
                size: 0.045,
                transparent: true,
                opacity: 0.45,
                depthWrite: false,
            })
        );
        scene.add(dust);

        // 9. Resize & hemat daya saat tidak terlihat
        const handleResize = () => {
            const { w, h } = size();
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);

        let visible = true;
        const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
        io.observe(container);

        // 10. Animasi
        const clock = new THREE.Clock();
        const beaconPos = new THREE.Vector3();
        let frameId;

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            if (!visible) return;
            const t = clock.getElapsedTime();

            if (!reduceMotion) {
                const total = DIG_CYCLE.length;
                const phase = (t / SEGMENT_SECONDS) % total;
                const i = Math.floor(phase);
                const k = smoother(phase - i);
                const a = DIG_CYCLE[i];
                const b = DIG_CYCLE[(i + 1) % total];
                const v = a.map((val, n) => val + (b[n] - val) * k);
                boomPivot.rotation.z = v[0];
                stickPivot.rotation.z = v[1];
                bucketPivot.rotation.z = v[2];
                turret.rotation.y = v[3];
            }
            updateRams();

            const pulse = (Math.sin(t * 8.5) + 1) * 0.5;
            beaconMat.emissiveIntensity = 0.6 + pulse * 4.2;
            beaconLight.intensity = 1.2 + pulse * 4.5;
            beaconDome.getWorldPosition(beaconPos);
            beaconLight.position.copy(beaconPos);

            for (let n = 0; n < particleCount; n++) {
                positions[n * 3 + 1] += speeds[n] * 0.016;
                if (positions[n * 3 + 1] > 4.8) positions[n * 3 + 1] = 0.2;
            }
            particleGeo.attributes.position.needsUpdate = true;
            dust.rotation.y = t * 0.03;

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(frameId);
            clearTimeout(resumeTimer);
            resizeObserver.disconnect();
            io.disconnect();
            controls.removeEventListener('start', onStart);
            controls.removeEventListener('end', onEnd);
            controls.dispose();
            scene.traverse((o) => {
                o.geometry?.dispose();
                const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
                mats.forEach((m) => {
                    m.map?.dispose();
                    m.dispose();
                });
            });
            pmrem.dispose();
            envTexture.dispose();
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
            renderer.dispose();
        };
    }, [status]);

    return (
        <div
            ref={mountRef}
            role="img"
            aria-label="Model 3D ekskavator yang sedang menggali"
            className={`w-full h-[360px] md:h-[450px] cursor-grab active:cursor-grabbing ${className}`}
        />
    );
}