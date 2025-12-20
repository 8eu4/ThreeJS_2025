// tempat alur jalan cinematicnya
// mengatur load model dan animasi
// pergerakan kamera per detiknya
// pencahayaan

// js/StoryManager.js
import * as THREE from 'three';

export class StoryManager {
    constructor(world, cameraManager, lightingManager, stateManager) {
        this.world = world;
        this.scene = world.scene;
        this.cameraManager = cameraManager;
        this.lightingManager = lightingManager;
        this.stateManager = stateManager; // Untuk akses objek hantu via 'state'

        // Status Cerita
        this.isStoryPlaying = false;
        this.currentOpenness = 1.0;
        this._currentEyeHeight = 150;

        // untuk debug
        this.currentViewMode = 'ORBIT';


        // Set kondisi awal Buka (Tanpa animasi)
        this._preloadAllScenes().then(() => {
                console.log("👁️ Loading Selesai. Membuka Mata...");
            this.setEyeOpenness(1.0, 0);
        }, 100);
    }

    async _preloadAllScenes() {
        console.groupCollapsed("🚀 Pre-loading All Scenes (Instant Mode)...");
        const start = performance.now();

        this.isSetupMode = true; // AKTIFKAN MODE KILAT (Skip semua durasi)

        // 1. Ambil semua nama fungsi di class ini
        const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

        // 2. Filter yang namanya diawali "scene" (contoh: scene01, sceneBoss, sceneEnding)
        const sceneMethods = allMethods.filter(m => m.startsWith('scene') && typeof this[m] === 'function');

        // 3. Jalankan satu per satu secara instan
        for (const methodName of sceneMethods) {
            // console.log(`   Scanning: ${methodName}...`);
            await this[methodName](); // Eksekusi (Tapi karena SetupMode, dia lari secepat kilat)
        }

        this.isSetupMode = false; // MATIKAN MODE KILAT. Siap untuk Play beneran.

        const duration = (performance.now() - start).toFixed(2);
        console.log(`✅ Done! ${sceneMethods.length} scenes loaded in ${duration}ms.`);
        console.groupEnd();
    }

// ==========================================
    //               SCENE 01
    // ==========================================
    async scene01_WakeUp() {
        if (!this.isSetupMode) console.log("--- Scene 1 ---");
        if (this.currentViewMode === 'FPS') this._setGuiVisibility(false);

        // --- 1 LINE SETUP ---
        this._instantSetPosition(this.defineWaypoint("Scene01_ceilling", { x: -65.25, y: 7.79, z: -40.55 }, { x: 90, y: 180 }));
        
        this.setEyeOpenness(0, 0);
        await this._wait(2.0);

        if(!this.isSetupMode) console.log("Mata terbuka...");
        this.setEyeOpenness(0.3, 2.0); await this._wait(2.5);
        this.setEyeOpenness(0.1, 0.5); await this._wait(1.0);
        await this._blinkSequence();
        this.setEyeOpenness(1.0, 1.5); await this._wait(1.0);

        if(!this.isSetupMode) console.log("Bangun...");

        // --- 1 LINE ACTION ---
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_getup", { x: -65.25, y: 9.24, z: -38.57 }, { y: 180 }), 3.0);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_lookleft", { x: -65.25, y: 9.24, z: -38.57 }, { y: 210 }), 1.0);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_lookright", { x: -65.25, y: 9.24, z: -38.57 }, { y: 150 }), 2.0);
        await this.playerMoveToWaypoint("Scene01_getup", 1.0);
        
        this._blinkSequence();

        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_looksidedown", { x: -70.45, y: 8.54, z: -40.44 }, { x: -90, y: 90}), 3.0);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_looksideup", { x: -71.17, y: 10.91, z: -40.59 }, { y: 150 }), 2.0);
        
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_gotodoor_1", { x: -84.53, y: 10.91, z: -22.77 }, { y: 150 }), 6.0, "none");
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_gotodoor_2", { x: -86, y: 10.91, z: -21 }, { y: 89 }), 1.0, "none");

        await this.animateDoor("Door_Bedroom", 90, 2.0);
        if(!this.isSetupMode) console.log("Scene 1 Done.");
    }

    // ==========================================
    //               SCENE 02
    // ==========================================
    async scene02_BedroomCorridor() {
        if (!this.isSetupMode) console.log("--- Scene 2 ---");
        if (this.currentViewMode === 'FPS') this._setGuiVisibility(false);

        // await this.runParallel([
        //     this.playerMoveToWaypoint(this.defineWaypoint("Scene02_walkoutside", { x: -94.75, y: 10.91, z: -21 }, { y: 0 }), 3),
        //     this.moveMonsterTo("Ghost_Corridor", this.defineWaypoint("Scene02_monsterwalk_m", { x: -82.96, y: 3.53, z: -54.34 }, { y: -90 }), 6),
        //     this._waitAndRun(3, () => this._blinkSequence()),
        // ]);

        // await this.setMonsterVisibility("Ghost_Corridor", false);

        // await this.runParallel([
        //     this.playerMoveToWaypoint(this.defineWaypoint("Scene02_walktocurve", { x: -94.75, y: 10.91, z: -51.52 }, { y: 0 }), 10, "none"),
        //     this._waitAndRun(3, () => this.blink(1)),
        // ]);

        // await this.playerMoveToWaypoint(this.defineWaypoint("Scene02_turn", { x: -89.28, y: 10.91, z: -54.90 }, { y: -90 }), 2, "none");

        //debug
        this._instantSetPosition(this.defineWaypoint("Scene02_turn", { x: -89.28, y: 10.91, z: -54.90 }, { y: -90 }));

        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene02_walktokitchen", { x: -47.06, y: 10.91, z: -54.90 }, { y: -90 }), 10, "none"),
            this._waitAndRun(3, () => this._blinkSequence()),
        ]);

        await this.animateDoor("Door_ToKitchen", 90, 2.0);
    }

    // ==========================================
    //               SCENE 03
    // ==========================================
    async scene03_Kitchen() {
        if (!this.isSetupMode) console.log("--- Scene 3 ---");
        if (this.currentViewMode === 'FPS') this._setGuiVisibility(false);

        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_enterkitchen", { x:-37.11, y:10.91, z:-53.99 }, { y: -90 }), 4, "none");
        
        await this.runParallel([
            this.animateDoor("Door_ToKitchen", 0, 1),
            this.playerMoveToWaypoint(this.defineWaypoint("Scene03_turntobottle", { x:-33.17, y:10.91, z:-53.99 }, { x:-21.00, y:-31.00 }), 4, "power2.in")
        ]);

        await this.runParallel([
            this._setLightFlicker('light_kitchen_1', true, 0.3, 1),
            this._setLightFlicker('light_kitchen_2', true, 0.2, 1),
        ]);

        await this._wait(1);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_confuseright", { x:-33.17, y:10.91, z:-53.99 }, { y: -123.6 }), 0.5, "power2.in");
        await this._wait(1);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_confuseright2", { x:-33.17, y:10.91, z:-53.99 }, { y:150 }), 0.3, "none");
        await this._waitAndRun(0, () => this.setMonsterVisibility("Ghost_Kitchen_Window", true)), // Hantu Muncul
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_confuseleft", { x:-33.17, y:10.91, z:-53.99 }, { y:30 }), 3, "power2.in", true);
        // await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_lookforward", { x:-33.17, y:10.91, z:-53.99 }, { y: 0 }), 0.5);
        
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_backaway", { x: -31.02, y: 10.91, z: -49 }, { y: 30 }), 2, "power2.inOut");
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_felldown1", { x:-30.71, y:10.30, z:-48.65 }, { x:18.70, y:30.00, z:-20.40 }), 0.4, "none");
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_felldown2", { x:-30.41, y:9.39, z:-47.94 }, { x:48.00, y:30.00, z:-54.60 }), 0.3, "none");
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_felldown3", { x:-29.49, y:7.90, z:-47.89 }, { x:-5.70, y:-10.60, z:-88.80 }), 0.4, "none");
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_felldown4", { x:-28.37, y:4.15, z:-47.67 }, { x:-5.70, y:-10.60, z:-88.80 }), 0.3, "none");
        
        // await this._wait(1);
        // await this._waitAndRun(0.5, () => this.playerMoveToWaypoint(
        //     this.defineWaypoint("Scene03_confuseright_2", { x: -31.02, y: 10.91, z: -50.41 }, { y: -70 }), 0.5, "none"
        // ));
        // this.playerMoveToWaypoint(this.defineWaypoint("Scene03_confuseleft_2", { x: -31.02, y: 10.91, z: -50.41 }, { y: 70 }), 0.5, "none"),
        // this._waitAndRun(0.5, () => this.playerMoveToWaypoint("Scene03_confuseleft_2", 1.5, "none")),
        // this._waitAndRun(1.5, () => this.playerMoveToWaypoint("Scene03_backaway", 0.5, "none")),

        // await this.runParallel([
        //     this._waitAndRun(3, () => this.playerMoveToWaypoint(
        //         this.defineWaypoint("Scene03_scared_1", { x: -33.47, y: 10.91, z: -48.18 }, { x: -59, y: -59 }), 0.5, "power2.out"
        //     )),
        //     this._waitAndRun(3.2, () => this.setEyeOpenness(0, 0.5)),
        // ]);

        await this._wait(2);

        await this.runParallel([
            this.setMonsterVisibility("Ghost_Kitchen_Window", false),
            this.setMonsterVisibility("Ghost_Kitchen", true),
            // this.setEyeOpenness(1, 2),
            this._waitAndRun(2.5, () => this.playerMoveToWaypoint(
                this.defineWaypoint("Scene03_scared_2", { x: -30.41, y: 10.91, z: -48.18 }, { x: 20, y: 54 }), 3, "power2.in"
            )),
        ]);

        await this.runParallel([
            this.playMonsterAnimation("Ghost_Kitchen", "Creature_armature|bite", 1),
            this.playerMoveToWaypoint(this.defineWaypoint("Scene03_scared_3", { x: -29.19, y: 8.81, z: -48.18 }, { x: 33, y: 63 }), 0.5, "power2.out"),
            this._waitAndRun(0.5, () => this.playMonsterAnimation("Ghost_Kitchen", "Creature_armature|attack_2", 1)),
            this._waitAndRun(0.7, () => this.playerMoveToWaypoint(
                this.defineWaypoint("Scene03_scared_4", { x: -28.89, y: 5.31, z: -48.18 }, { x: -23, y: 57 }), 1.5, "power2.in"
            )),
        ]);
    }

    // ==========================================
    //           CORE SYSTEM
    // ==========================================


    async playFullMovie(startInFPS = true) {
        console.log(`🎬 FILM DIMULAI (Start Mode: ${startInFPS ? 'FPS' : 'ORBIT'})...`);

        this.currentViewMode = startInFPS ? 'FPS' : 'ORBIT';
        this.isStoryPlaying = true;

        // [PERBAIKAN 1] HANYA matikan UI jika mode FPS (Cinematic Asli). 
        // Kalau False (Debug), UI TETAP NYALA.
        if (startInFPS) {
            this._setGuiVisibility(false);
            this.world.setHelpersVisibility(false);
        } else {
            this._setGuiVisibility(true); // Pastikan nyala
            this.world.setHelpersVisibility(true); // Helper nyala buat debug
        }

        // Atur Tombol Switch View
        if (this.world.ui) {
            this.world.ui.setCinematicButtonVisible(!startInFPS);
        }

        // Masuk Mode
        this._setCinematicMode(true, this.currentViewMode);

        // --- MULAI SEQUENCE ---
        // await this.scene01_WakeUp();
        // await this.scene02_BedroomCorridor();
        await this.scene03_Kitchen();
        // --- SELESAI ---

        // Reset
        this.world.setHelpersVisibility(true);
        this._setCinematicMode(false);
        this._setGuiVisibility(true);

        if (this.world.ui) this.world.ui.setCinematicButtonVisible(false);
        console.log("🎬 FILM SELESAI.");
    }

    defineWaypoint(name, pos = {}, rot = {}) {
        let waypoint = this.scene.getObjectByName(name);
        
        if (!waypoint) {
            if (!this._waypointGeometry) {
                this._waypointGeometry = new THREE.BoxGeometry(1, 1.5, 1);
                this._waypointMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffff00, wireframe: true, transparent: true, opacity: 0.5
                });
            }
            waypoint = new THREE.Mesh(this._waypointGeometry, this._waypointMaterial);
            waypoint.name = name;
            waypoint.userData.isWaypoint = true;
            waypoint.rotation.order = 'YXZ'; // Penting agar selaras dengan CameraManager
            
            const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 0), 3, 0x00ffff);
            waypoint.add(arrow);
            
            this.world.add(waypoint);
            if (this.stateManager) {
                this.stateManager.addObject(waypoint, { isSelectable: true, isDraggable: true });
            }
        }

        waypoint.position.set(pos.x ?? 0, pos.y ?? 0, pos.z ?? 0);

        // Hanya gunakan rotasi angka (x, y, z) dari Gizmo
        waypoint.rotation.set(
            THREE.MathUtils.degToRad(rot.x ?? 0),
            THREE.MathUtils.degToRad(rot.y ?? 0),
            THREE.MathUtils.degToRad(rot.z ?? 0)
        );

        waypoint.visible = (this.currentViewMode !== 'FPS');
        return name;
    }

    _instantSetPosition(waypointName) {
        if (this.isSetupMode) return;
        const waypoint = this.scene.getObjectByName(waypointName);
        if (!waypoint) return;

        const rig = this.cameraManager.cameraRig;
        const cam = this.cameraManager.camera;

        // Ambil orientasi dari Waypoint (Gizmo)
        const e = new THREE.Euler().setFromQuaternion(waypoint.quaternion, 'YXZ');

        // A. LOGIKA UNTUK MODE FPS / RIG
        rig.position.copy(waypoint.position);
        rig.rotation.set(0, e.y, 0, 'YXZ');
        cam.rotation.set(e.x, 0, e.z, 'YXZ');

        // B. LOGIKA UNTUK MODE ORBIT (PENTING!)
        if (this.currentViewMode === 'ORBIT') {
            // Pindahkan kamera tepat ke posisi waypoint
            cam.position.copy(waypoint.position);
            cam.quaternion.copy(waypoint.quaternion);

            // Mundurkan sedikit agar kita tidak berada di dalam "box" waypoint
            cam.translateZ(0.5); 

            // Update Pivot OrbitControls agar berputar di titik waypoint tersebut
            if (this.cameraManager.orbitControls) {
                this.cameraManager.orbitControls.target.copy(waypoint.position);
                this.cameraManager.orbitControls.update();
            }
        }
    }

    playerMoveToWaypoint(waypointName, duration, easeType = "power2.inOut", useLongestPath = false) {
        if (this.isSetupMode) return Promise.resolve();

        return new Promise(resolve => {
            const waypoint = this.scene.getObjectByName(waypointName);
            if (!waypoint) { resolve(); return; }

            const rig = this.cameraManager.cameraRig;
            const cam = this.cameraManager.camera;

            // 1. Ambil State Awal
            const startRigY = rig.rotation.y;
            const startCamX = cam.rotation.x;
            const startPos = rig.position.clone();

            // 2. Ambil Target dari Waypoint
            const targetEuler = new THREE.Euler().setFromQuaternion(waypoint.quaternion, 'YXZ');

            // --- LOGIKA DINAMIS: TERDEKAT VS TERJAUH ---
            const calculateDiff = (target, start, longest) => {
                let diff = target - start;
                // Normalisasi ke range -PI sampai PI (Shortest Path)
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                if (longest) {
                    // Jika ingin jalur terjauh, putar balik arah selisihnya
                    diff = diff > 0 ? diff - Math.PI * 2 : diff + Math.PI * 2;
                }
                return diff;
            };

            const diffY = calculateDiff(targetEuler.y, startRigY, useLongestPath);
            const diffX = calculateDiff(targetEuler.x, startCamX, false); // Biasanya X tidak perlu terjauh

            // 3. Eksekusi Animasi
            const proxy = { t: 0 };
            gsap.to(proxy, {
                t: 1,
                duration: duration,
                ease: easeType,
                onUpdate: () => {
                    const alpha = proxy.t;
                    rig.position.lerpVectors(startPos, waypoint.position, alpha);

                    // Terapkan rotasi berdasarkan selisih yang sudah dihitung
                    rig.rotation.y = startRigY + diffY * alpha;
                    cam.rotation.x = startCamX + diffX * alpha;
                },
                onComplete: resolve
            });
        });
    }   

    switchViewMode() {
        // Toggle Mode
        const newMode = (this.currentViewMode === 'FPS') ? 'ORBIT' : 'FPS';
        this.currentViewMode = newMode;

        console.log(`🔄 SWITCHING VIEW TO: ${newMode}`);

        // 1. Eksekusi perpindahan mode kamera
        this._setCinematicMode(true, newMode);

        // 2. Atur Efek Mata (PENTING: Matikan efek jika Orbit)
        if (newMode === 'ORBIT') {
            // Paksa mata terbuka/transparan di CSS
            const eyelidEl = document.getElementById('cinematic-eyelids');
            if (eyelidEl) eyelidEl.style.opacity = '0';

            // Nyalakan Helper di mode debug
            this.world.setHelpersVisibility(true);
        } else {
            // Balikin efek mata
            const eyelidEl = document.getElementById('cinematic-eyelids');
            if (eyelidEl) eyelidEl.style.opacity = '1';

            // Force update visual mata sesuai state terakhir
            this.setEyeOpenness(this.currentOpenness, 0);

            // Matikan helper biar bersih
            this.world.setHelpersVisibility(false);
        }

        // 3. Pastikan Tombol Tetap Nyala (Karena kita sudah berinteraksi)
        if (this.world.ui) {
            this.world.ui.setCinematicButtonVisible(true);
        }
    }

    _setCinematicMode(active, viewMode) {
        const rig = this.cameraManager.cameraRig;
        const cam = this.cameraManager.camera;
        const shakeGroup = this.cameraManager.cameraShakeGroup;
        const debugBody = this.cameraManager.debugMesh;

        if (active) {
            this.cameraManager.fpsControls.unlock();

            // Stop Physics Movement
            this.cameraManager.velocity.set(0, 0, 0);
            this.cameraManager.currentMoveVelocity.set(0, 0, 0);

            if (viewMode === 'FPS') {
                // --- MODE 1: FPS (NONTON FILM) ---
                // Di sini kita pakai mode 'CINEMATIC' agar mouse user MATI
                this.cameraManager.activeMode = 'CINEMATIC';
                this.cameraManager.orbitControls.enabled = false;

                shakeGroup.add(cam);
                cam.position.set(0, 0, 0);
                cam.rotation.set(0, 0, 0);
                shakeGroup.rotation.z = 0;

                if (debugBody) debugBody.visible = false;

            } else {
                // --- MODE 2: ORBIT (DEBUG / FREE ROAM) ---

                // [PERBAIKAN 3] PENTING!!
                // Set activeMode ke 'ORBIT'.
                // Kalau diset 'CINEMATIC', CameraManager.update() bakal skip update orbitControls.
                // Makanya kemarin Anda teleport tapi ga bisa gerak.
                this.cameraManager.activeMode = 'ORBIT';

                this.world.scene.add(cam);

                // TELEPORT KAMERA KE POSISI PLAYER SAAT INI
                const worldPos = new THREE.Vector3();
                rig.getWorldPosition(worldPos);

                cam.position.set(worldPos.x + 5, worldPos.y + 5, worldPos.z + 5);
                cam.lookAt(worldPos);

                this.cameraManager.orbitControls.target.copy(worldPos);
                this.cameraManager.orbitControls.enabled = true;
                this.cameraManager.orbitControls.update();

                if (debugBody) {
                    debugBody.visible = true;
                    debugBody.material.opacity = 0.5;
                    debugBody.material.wireframe = true;
                }
            }
        } else {
            // Keluar Mode Total -> Balik ke FPS Gameplay
            if (debugBody) debugBody.visible = false;
            this.cameraManager.setMode('FPS');
        }
    }





    _tweenCameraRotation(x, y, z, duration) {
        return new Promise(resolve => {
            // Cek Mode: Kalau Orbit, Skip animasi kamera biar mouse user tidak "lawan arus"
            if (this.currentViewMode === 'ORBIT') {
                resolve();
                return;
            }

            gsap.to(this.cameraManager.camera.rotation, {
                x: x, // Pitch (Atas Bawah)
                y: y, // Yaw (Kiri Kanan)
                z: z, // Roll (Miring)
                duration: duration,
                ease: "power2.inOut",
                onComplete: resolve
            });
        });
    }

    animateDoor(doorName, targetAngleDeg, duration) {
        if (this.isSetupMode) return Promise.resolve();
        return new Promise(resolve => {
            // 1. Cari objek pintu di dalam scene (Recursive search)
            const door = this.scene.getObjectByName(doorName);

            if (!door) {
                console.warn(`⚠️ Pintu dengan nama '${doorName}' tidak ditemukan! Cek nama di Blender/Scene Graph.`);
                resolve(); // Tetap resolve biar urutan cerita tidak macet
                return;
            }

            console.log(`🚪 Menggerakkan pintu: ${doorName} ke ${targetAngleDeg} derajat`);

            // 2. Konversi Derajat ke Radian (Three.js pakai Radian)
            const targetRad = THREE.MathUtils.degToRad(targetAngleDeg);

            // 3. Animasi Rotasi Sumbu Y (Engsel biasanya sumbu Y)
            gsap.to(door.rotation, {
                y: targetRad,
                duration: duration,
                ease: "power2.inOut", // Gerakan pintu yang natural (lambat-cepat-lambat)
                onComplete: resolve
            });
        });
    }

    setEyeOpenness(targetRatio, duration = 1.0) {
        // Clamp 0-1
        if (this.isSetupMode) return;

        // if (this.currentViewMode === 'ORBIT') return;
        const eyelidEl = document.getElementById('cinematic-eyelids');
        if (!eyelidEl || !window.gsap) return;

        const val = Math.max(0, Math.min(1, targetRatio));
        this.currentOpenness = val;

        // --- STRATEGI BARU: RADIAL GRADIENT ---

        // Kita butuh objek sementara untuk di-animasikan angkanya oleh GSAP
        // Karena kita tidak bisa meng-animasikan string "radial-gradient" secara langsung


        if (!eyelidEl || !window.gsap) return;

        // Tentukan tinggi bukaan mata (Vertical Aperture)
        // 0.0 -> 0% (Tutup total, hitam semua)
        // 1.0 -> 150% (Buka lebar sampai keluar layar)
        const targetHeight = val * 150;

        // Kita buat objek proxy untuk menyimpan nilai saat ini
        // (GSAP akan mengubah nilai 'h' di objek ini setiap frame)
        // Kita perlu tahu start value-nya agar smooth. 
        // Idealnya kita simpan 'currentHeight' di class, tapi untuk simpel kita ambil dari variabel global/state
        if (this._currentEyeHeight === undefined) this._currentEyeHeight = 0; // Default awal tutup/buka sesuai CSS

        const proxy = { h: this._currentEyeHeight };

        gsap.to(proxy, {
            h: targetHeight,
            duration: duration,
            ease: "power2.inOut",
            onUpdate: () => {
                // Update CSS setiap frame berdasarkan nilai 'h' yang sedang jalan
                // Rumus: Ellipse Melebar (150% width) tapi Tinggi berubah (h%)
                // Transparent mulai 30% dari pusat, Hitam mulai 60% dari pusat (Soft Edge)

                eyelidEl.style.backgroundImage = `radial-gradient(ellipse 150% ${proxy.h}% at center, transparent 30%, black 60%)`;

                // Simpan nilai terakhir agar kalau di-interrupt (toggle C) transisinya nyambung
                this._currentEyeHeight = proxy.h;
            }
        });
    }

    // --- FUNGSI TOGGLE (UNTUK TOMBOL C) ---
    toggleEyes(duration = 0.8) {
        // Cek kondisi terakhir:
        // Jika mata sedang > 50% terbuka, maka TUTUP.
        // Jika mata sedang < 50% terbuka, maka BUKA.
        if (this.currentOpenness > 0.5) {
            this.setEyeOpenness(0, duration); // Tutup
            console.log("[Story] Mata Terpejam");
        } else {
            this.setEyeOpenness(1, duration); // Buka
            console.log("[Story] Mata Terbuka");
        }
    }

    async blink(duration = 0.1) {
        this.setEyeOpenness(0, duration); // Tutup
        await new Promise(r => setTimeout(r, duration * 1000));
        this.setEyeOpenness(1, duration); // Buka
    }

    async _blinkSequence() {
        this.setEyeOpenness(0, 0.1); // Tutup cepat
        await this._wait(0.15);
        this.setEyeOpenness(0.6, 0.2); // Buka dikit
        await this._wait(0.3);
        this.setEyeOpenness(0, 0.1); // Tutup lagi
        await this._wait(0.15);
        this.setEyeOpenness(1.0, 0.4); // Buka lebar
    }

    // --- A. KAMERA & GERAKAN ---
    // _setCinematicMode(active) {
    //     if (active) {
    //         console.log("[Story] Masuk Mode Cinematic");

    //         // 1. Matikan Kontrol Player
    //         this.cameraManager.activeMode = 'CINEMATIC';
    //         this.cameraManager.orbitControls.enabled = false;
    //         this.cameraManager.fpsControls.unlock();
    //         this.cameraManager.velocity.set(0, 0, 0);
    //         this.cameraManager.currentMoveVelocity.set(0, 0, 0);

    //         // 2. ATTACH CAMERA KE RIG (PENTING!)
    //         // Kita paksa kamera masuk ke dalam struktur Rig agar bisa digerakkan oleh StoryManager
    //         this.cameraManager.cameraShakeGroup.add(this.cameraManager.camera);

    //         // 3. RESET TRANSFORM LOKAL KAMERA
    //         // Agar kamera duduk pas di titik pusat Rig (tidak ada offset aneh dari mode Orbit sebelumnya)
    //         this.cameraManager.camera.position.set(0, 0, 0);
    //         this.cameraManager.camera.rotation.set(0, 0, 0);

    //     } else {
    //         console.log("[Story] Keluar Mode Cinematic");
    //         // Saat keluar, kita tidak perlu detach manual di sini.
    //         // Biarkan setMode('FPS') atau setMode('ORBIT') yang mengurusnya nanti.
    //     }
    // }

    // Fungsi Jalan (Move Rig)
    // Gunakan 'null' jika tidak ingin mengubah sumbu tertentu (misal hanya geser X)
    _tweenRigPosition(x, y, z, duration) {
        return new Promise(resolve => {
            const target = {};
            if (x !== null) target.x = x;
            if (y !== null) target.y = y;
            if (z !== null) target.z = z;

            gsap.to(this.cameraManager.cameraRig.position, {
                ...target,
                duration: duration,
                ease: "power2.inOut", // Gerakan mulus (lambat-cepat-lambat)
                onComplete: resolve // Kabari kalau sudah sampai
            });
        });
    }

    // Fungsi Noleh (Rotate Camera/Rig)
    // Rotasi Rig (Badan) atau Camera (Kepala) tergantung kebutuhan
    _tweenCameraRotation(x, y, z, duration) {
        return new Promise(resolve => {
            // Kita putar kameranya langsung untuk head look
            gsap.to(this.cameraManager.camera.rotation, {
                x: x, // Pitch (Atas Bawah)
                y: y, // Yaw (Kiri Kanan)
                z: z, // Roll (Miring)
                duration: duration,
                ease: "power2.inOut",
                onComplete: resolve
            });
        });
    }

    // Helper untuk memutar CameraRig (Badan)
    _tweenRigRotation(x, y, z, duration) {
        return new Promise(resolve => {
            const target = {};
            if (x !== null) target.x = x;
            if (y !== null) target.y = y;
            if (z !== null) target.z = z;

            gsap.to(this.cameraManager.cameraRig.rotation, {
                ...target,
                duration: duration,
                ease: "power2.inOut",
                onComplete: resolve
            });
        });
    }

    _tweenShakeRoll(angle, duration) {
        return new Promise(resolve => {
            gsap.to(this.cameraManager.cameraShakeGroup.rotation, {
                z: angle,
                duration: duration,
                ease: "power1.out",
                onComplete: resolve
            });
        });
    }


    _setLightFlicker(lightId, active, speed, chance) {
        if (this.isSetupMode) return;
        this.lightingManager.setFlicker(lightId, active, speed, chance);
    }

    _setLightState(lightId, isOn) {
        if (!this.lightingManager) return;

        const light = this.lightingManager.lights[lightId];
        if (light) {
            light.visible = isOn;
            // console.log(`[Story] Lampu ${lightId} set to ${isOn ? 'ON' : 'OFF'}`);
        } else {
            console.warn(`[Story] Lampu '${lightId}' tidak ditemukan.`);
        }
    }

    _tweenLightIntensity(lightId, targetIntensity, duration) {
        return new Promise(resolve => {
            if (!this.lightingManager) {
                resolve();
                return;
            }

            const light = this.lightingManager.lights[lightId];
            if (light) {
                gsap.to(light, {
                    intensity: targetIntensity,
                    duration: duration,
                    ease: "power2.inOut",
                    onComplete: resolve
                });
            } else {
                console.warn(`[Story] Lampu '${lightId}' tidak ditemukan untuk ditween.`);
                resolve();
            }
        });
    }

    _fadeScreen(type, duration) {
        return new Promise(resolve => {
            const overlay = document.getElementById('overlay');
            if (!overlay) {
                console.warn("Overlay div not found in HTML");
                resolve();
                return;
            }

            const targetOpacity = type === "OUT" ? 1 : 0; // 1 = Hitam, 0 = Transparan

            gsap.to(overlay.style, {
                opacity: targetOpacity,
                duration: duration,
                onComplete: resolve
            });
        });
    }

    setMonsterVisibility(monsterName, isVisible) {
        if (this.isSetupMode) return;
        const monster = this.scene.getObjectByName(monsterName);
        if (monster) {

            // Pastikan kita punya data scale asli (backup)
            if (!monster.userData.originalScale) {
                // Default fallback kalau lupa set di SceneSetup
                monster.userData.originalScale = new THREE.Vector3(5, 5, 5);
            }

            if (isVisible) {
                // MUNCUL:
                // Kembalikan ke ukuran asli (POP UP)
                monster.scale.copy(monster.userData.originalScale);

                // Pastikan visible TRUE
                monster.visible = true;

                console.log(`👻 Monster '${monsterName}' MUNCUL (Scale Restored)`);
            } else {
                // SEMBUNYI:
                // JANGAN visible = false. TAPI KECILKAN.
                monster.scale.set(0.0001, 0.0001, 0.0001);

                // Biarkan visible TETAP TRUE agar GPU tidak membuang memorinya
                monster.visible = true;

                console.log(`👻 Monster '${monsterName}' NGUMPET (Scale 0.0001)`);
            }

        } else {
            console.warn(`⚠️ Monster '${monsterName}' tidak ditemukan!`);
        }
    }

    moveMonsterTo(monsterName, targetData, duration) {
        if (this.isSetupMode) return Promise.resolve();
        return new Promise(resolve => {
            const monster = this.scene.getObjectByName(monsterName);
            if (!monster) {
                console.warn(`⚠️ Monster '${monsterName}' tidak ditemukan!`);
                resolve();
                return;
            }

            // --- LOGIKA BARU: DETEKSI TIPE TARGET ---
            let targetPosition = new THREE.Vector3();

            if (typeof targetData === 'string') {
                // Jika inputnya String, cari objek Waypoint-nya dulu
                const waypoint = this.scene.getObjectByName(targetData);
                if (waypoint) {
                    targetPosition.copy(waypoint.position);
                } else {
                    console.error(`❌ Waypoint Monster '${targetData}' tidak ditemukan!`);
                    resolve();
                    return;
                }
            } else if (targetData.isVector3 || (targetData.x !== undefined)) {
                // Jika inputnya sudah Vector3 atau object {x,y,z}
                targetPosition.copy(targetData);
            } else {
                console.error("❌ Format target posisi salah. Gunakan Nama Waypoint (String) atau Vector3.");
                resolve();
                return;
            }

            console.log(`🧟 Monster '${monsterName}' berjalan ke:`, targetPosition);

            // Animasi Posisi
            gsap.to(monster.position, {
                x: targetPosition.x,
                y: targetPosition.y,
                z: targetPosition.z,
                duration: duration,
                ease: "linear",
                onUpdate: () => {
                    // Opsional: Agar monster selalu menghadap ke tujuan selagi jalan
                    // monster.lookAt(targetPosition); 
                },
                onComplete: resolve
            });

            // Putar badan menghadap tujuan (Instan di awal jalan)
            monster.lookAt(targetPosition.x, monster.position.y, targetPosition.z);
        });
    }

    playMonsterAnimation(monsterName, animName, transitionDuration = 0.5) {
        if (this.isSetupMode) return;
        const monster = this.scene.getObjectByName(monsterName);

        if (!monster || !monster.mixer || !monster.animations) {
            console.warn(`⚠️ Monster '${monsterName}' tidak memiliki mixer/animasi.`);
            return;
        }

        const newClip = monster.animations.find(a => a.name === animName);
        if (!newClip) {
            console.warn(`⚠️ Animasi '${animName}' tidak ditemukan pada ${monsterName}.`);
            // List animasi yang tersedia untuk debugging
            console.log("Daftar Animasi:", monster.animations.map(a => a.name));
            return;
        }

        const newAction = monster.mixer.clipAction(newClip);
        const oldAction = monster.currentAction;

        if (oldAction === newAction) return; // Animasi yang sama sedang jalan

        console.log(`🎬 Monster ${monsterName} switch anim: ${animName}`);

        // Setup Animasi Baru
        newAction.reset();
        newAction.play();

        // Transisi Halus (Crossfade)
        if (oldAction) {
            oldAction.crossFadeTo(newAction, transitionDuration, true);
        }

        // Simpan referensi action sekarang
        monster.currentAction = newAction;
    }

    // --- C. UTILITIES ---

    // Fungsi Menunggu (Penting untuk timing cerita)
    _wait(seconds) {
        if (this.isSetupMode) return Promise.resolve();
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    _setGuiVisibility(visible) {
        const displayStyle = visible ? 'block' : 'none';

        // 1. Panel Kanan (Lil-GUI)
        const rightPanel = document.querySelector('.lil-gui');
        if (rightPanel) {
            rightPanel.style.display = displayStyle;
        }

        // 2. Panel Kiri (Hierarchy)
        const leftPanel = document.getElementById('hierarchy-panel');
        if (leftPanel) {
            leftPanel.style.display = displayStyle;
        }
    }

    async runParallel(actions) {
        if (this.isSetupMode) return Promise.all(actions);

        console.log(`⚡ Menjalankan ${actions.length} aksi secara paralel...`);

        await Promise.all(actions);

        console.log("✅ Semua aksi paralel selesai.");
    }

    async _waitAndRun(delay, taskFunction) {
        if (this.isSetupMode) return taskFunction();

        if (delay > 0) {
            // console.log(`⏳ Delay ${delay}s...`); // Uncomment jika ingin log
            await this._wait(delay);
        }

        // Jalankan tugasnya sekarang
        await taskFunction();
    }

}


    // async playFullMovie() {
    //     console.log("🎬 FILM DIMULAI...");
    //     this.world.setHelpersVisibility(false);

    //     // Scene 1: Bangun Tidur
    //     await this.scene01_WakeUp();

    //     //Scene 2 : Lorong Kamar Menuju Dapur
    //     await this.scene02_BedroomCorridor();

    //     //Scene 3 : Dapur
    //     await this.scene03_Kitchen();

    //     this.world.setHelpersVisibility(true);
    //     console.log("🎬 FILM SELESAI.");
    // }

    // --- FUNGSI UTAMA: ANIMASI MATA ---
    // targetRatio: 0.0 (Tutup) sampai 1.0 (Buka)
    // duration: Kecepatan transisi dalam detik
    // setEyeOpenness(targetRatio, duration = 1.0) {
    //     // Clamp 0-1
    //     const val = Math.max(0, Math.min(1, targetRatio));
    //     this.currentOpenness = val;

    //     // --- STRATEGI BARU: RADIAL GRADIENT ---

    //     // Kita butuh objek sementara untuk di-animasikan angkanya oleh GSAP
    //     // Karena kita tidak bisa meng-animasikan string "radial-gradient" secara langsung

    //     const eyelidEl = document.getElementById('cinematic-eyelids');

    //     if (!eyelidEl || !window.gsap) return;

    //     // Tentukan tinggi bukaan mata (Vertical Aperture)
    //     // 0.0 -> 0% (Tutup total, hitam semua)
    //     // 1.0 -> 150% (Buka lebar sampai keluar layar)
    //     const targetHeight = val * 150;

    //     // Kita buat objek proxy untuk menyimpan nilai saat ini
    //     // (GSAP akan mengubah nilai 'h' di objek ini setiap frame)
    //     // Kita perlu tahu start value-nya agar smooth. 
    //     // Idealnya kita simpan 'currentHeight' di class, tapi untuk simpel kita ambil dari variabel global/state
    //     if (this._currentEyeHeight === undefined) this._currentEyeHeight = 0; // Default awal tutup/buka sesuai CSS

    //     const proxy = { h: this._currentEyeHeight };

    //     gsap.to(proxy, {
    //         h: targetHeight,
    //         duration: duration,
    //         ease: "power2.inOut",
    //         onUpdate: () => {
    //             // Update CSS setiap frame berdasarkan nilai 'h' yang sedang jalan
    //             // Rumus: Ellipse Melebar (150% width) tapi Tinggi berubah (h%)
    //             // Transparent mulai 30% dari pusat, Hitam mulai 60% dari pusat (Soft Edge)

    //             eyelidEl.style.backgroundImage = `radial-gradient(ellipse 150% ${proxy.h}% at center, transparent 30%, black 60%)`;

    //             // Simpan nilai terakhir agar kalau di-interrupt (toggle C) transisinya nyambung
    //             this._currentEyeHeight = proxy.h;
    //         }
    //     });
    // }
