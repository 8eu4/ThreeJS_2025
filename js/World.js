// js/World.js
import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export class World {
    constructor(container, state) {
        this.container = container;
        this.state = state;
        this.stateManager = null;

        this.scene = new THREE.Scene();

        // Kamera di-init di sini, tapi nanti "diambil" oleh CameraManager
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 160);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            logarithmicDepthBuffer: false 
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.clock = new THREE.Clock();

        this.fps = 0;           // Angka FPS yang akan dibaca UI
        this.frameCounter = 0;  // Penghitung sementara
        this.lastFpsTime = 0;

        // Kontrol Gizmo (Tetap di sini atau pindah ke UI, tapi biarkan dulu)
        this.transformControls = null;
        this.helpersVisible = true;

        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Line.threshold = 1;

        this.mouse = new THREE.Vector2();
        this.ignoreNextClick = false;

        this._init();
    }

    setStateManager(manager) {
        this.stateManager = manager;
    }
    setCameraManager(manager) {
        this.cameraManager = manager;
    }
    setLightingManager(manager) {
        this.lightingManager = manager;
    }
    setStoryManager(manager) {
        this.storyManager = manager;
    }

    setHelpersVisibility(visible) {
        this.helpersVisible = visible;

        // 1. Matikan Gizmo Utama (Edit Tools)
        if (this.transformControls) {
            this.transformControls.visible = visible;
            this.transformControls.enabled = visible;
        }

        // 2. Scan Scene
        this.scene.traverse((obj) => {
            const n = (obj.name || "").toLowerCase();
            const t = (obj.type || "");
            const ud = obj.userData || {}; // Ambil UserData

            // --- CEK 1: USER DATA (Paling Penting untuk Waypoint Anda) ---
            // Karena nama objeknya "Point_A_Kasur", bukan "Waypoint..."
            if (ud.isWaypoint === true) {
                obj.visible = visible;
                return; // Selesai diproses
            }

            // --- CEK 2: NAMA & TIPE (Untuk Helper bawaan Three.js) ---
            const isJunk = n.includes('gizmo') || n.includes('helper') || n.includes('debug') ||
                n.includes('trace') || n.endsWith('_target') || t.includes('Helper');

            if (isJunk) {
                obj.visible = visible;
                if (obj.update && typeof obj.update === 'function') {
                    obj.update();
                }
            }
        });
    }

        _init() {
            this.scene.background = new THREE.Color(0x000000); // Gelap untuk Horror
            // Posisi awal kamera (sementara)
            this.camera.position.set(0, 15, 40);

            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.container.appendChild(this.renderer.domElement);

            // Gizmo Edit (Transform Controls)
            this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
            this.scene.add(this.transformControls);

            this.transformControls.addEventListener('dragging-changed', (event) => {
                // Nanti kita hubungkan ke CameraManager untuk disable orbit saat drag
                // Untuk sekarang biarkan kosong atau comment dulu
                // if (this.cameraManager) this.cameraManager.orbitControls.enabled = !event.value;
            });

            window.addEventListener('resize', () => this.onWindowResize());
            this.renderer.domElement.addEventListener('click', (e) => this.onCanvasClick(e));


        }

        onWindowResize() {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
        onCanvasClick(event) {
            const seenUUIDs = new Set();

            if (this.ignoreNextClick) { this.ignoreNextClick = false; return; }
            if (this.transformControls.dragging || !this.stateManager) return;

            // WAJIB TAHAN CTRL UNTUK SELEKSI (Safety Lock)
            if (!event.ctrlKey) return;

            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Raycast ke SCENE.CHILDREN agar kena Helper
            const intersects = this.raycaster.intersectObjects(this.scene.children, true);

            if (intersects.length > 0) {
                const candidates = [];

                for (let i = 0; i < intersects.length; i++) {
                    const hit = intersects[i];
                    let target = null;

                    if (hit.object.name === "Helper_HitBox" && hit.object.parent && hit.object.parent.light) {
                        target = hit.object.parent.light;
                    }
                    // 2. Cek Lampu Langsung
                    else if (hit.object.light) {
                        target = hit.object.light;
                    }
                    // 3. Cek Mesh Biasa (termasuk Light Target Box)
                    else {
                        let candidate = hit.object;

                        // Prioritaskan "Anak" yang terdaftar (Mesh individu)
                        if (this.state.allSelectableObjects.includes(candidate)) {
                            target = candidate;
                        }
                        // Jika anak tidak terdaftar, cari bapaknya
                        else {
                            while (candidate && candidate.type !== 'Scene') {
                                if (this.state.allSelectableObjects.includes(candidate)) {
                                    target = candidate;
                                    break;
                                }
                                candidate = candidate.parent;
                            }
                        }
                    }

                    // Masukkan ke kandidat jika valid
                    if (target) {
                        if (!seenUUIDs.has(target.uuid)) {
                            candidates.push(target);
                            seenUUIDs.add(target.uuid);
                        }
                    }
                }

                // [MODIFIED] Cycling Selection
                if (candidates.length > 0) {
                    let objectToSelect = candidates[0];

                    if (this.state.selectedObject) {
                        const currentIndex = candidates.indexOf(this.state.selectedObject);
                        if (currentIndex !== -1) {
                            const nextIndex = (currentIndex + 1) % candidates.length;
                            objectToSelect = candidates[nextIndex];
                        }
                    }

                    this.stateManager.setSelectedObject(objectToSelect);
                    console.log(`[Selected] ${objectToSelect.name}`);

                } else {
                    this.stateManager.setSelectedObject(null);
                }

            } else {
                this.stateManager.setSelectedObject(null);
            }
        }

        start() {
            this.renderer.setAnimationLoop(() => this.animate());
        }

        animate() {
        const now = performance.now();
        this.frameCounter++; // Tambah 1 setiap frame

        // Jika selisih waktu > 1000ms (1 detik)
        if (now - this.lastFpsTime >= 1000) {
            this.fps = this.frameCounter; // Simpan hasil
            this.frameCounter = 0;        // Reset hitungan
            this.lastFpsTime = now;       // Reset waktu
        }

            const delta = this.clock.getDelta();

            if (this.cameraManager) {
                this.cameraManager.update(delta);
            }

            if (this.lightingManager) {
                this.lightingManager.update(delta);
            }

            // ANIMASI (Mixer)
            for (const obj of this.state.allSelectableObjects) {
                if (obj.mixer) {
                    obj.mixer.update(delta);
                }
            }

            // Helper Update
            this.scene.traverse((node) => {
                if (node.isSpotLightHelper || node.isDirectionalLightHelper || node.isPointLightHelper) {
                    node.update();
                }
            });

            this.renderer.render(this.scene, this.camera);
        }

        add(object) { this.scene.add(object); }
        remove(object) { this.scene.remove(object); }
    }