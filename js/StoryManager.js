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

        // Simpan state tinggi mata (150 = Buka Penuh)
        this._currentEyeHeight = 150;

        // Set kondisi awal Buka (Tanpa animasi)
        setTimeout(() => {
            this.setEyeOpenness(1.0, 0);
        }, 100);
    }

    async scene01_WakeUp() {
        console.log("--- Scene 1: Wake Up Started ---");

        // 1. SETUP AWAL
        if (this.currentViewMode === 'FPS') {
            this._setGuiVisibility(false);
        }

        this._instantSetPosition("Scene01_ceilling");

        this.setEyeOpenness(0, 0);

        // 2. ACTION!
        await this._wait(2.0); // Hening 2 detik

        // Fase: Membuka Mata (Perlahan & Berat)
        console.log("Mata mulai terbuka...");
        this.setEyeOpenness(0.3, 2.0); // Buka dikit (2 detik)
        await this._wait(2.5);

        this.setEyeOpenness(0.1, 0.5); // Tutup lagi (ngantuk)
        await this._wait(1.0);

        // Fase: Blink Sequence (Agar terlihat nyata)
        await this._blinkSequence();

        // Buka Penuh
        this.setEyeOpenness(1.0, 1.5);
        await this._wait(1.0);

        console.log("Bangun duduk...");

        await this.playerMoveToWaypoint("Scene01_getup", 3.0);
        await this.playerMoveToWaypoint("Scene01_lookleft", 1.0);
        await this.playerMoveToWaypoint("Scene01_lookright", 2.0);
        await this.playerMoveToWaypoint("Scene01_getup", 1.0);

        this._blinkSequence();

        await this.playerMoveToWaypoint("Scene01_looksidedown", 3.0);
        await this.playerMoveToWaypoint("Scene01_looksideup", 2.0);
        await this.playerMoveToWaypoint("Scene01_gotodoor_1", 6.0, "none");
        await this.playerMoveToWaypoint("Scene01_gotodoor_2", 1.0, "none");

        await this.animateDoor("Door_Bedroom", 90, 2.0);



        console.log("Scene 1 Selesai. Player Control Active.");
    }
    async scene02_BedroomCorridor() {
        console.log("--- Scene 2: Bedroom Corridor ---");

        // 1. SETUP AWAL
        if (this.currentViewMode === 'FPS') {
            this._setGuiVisibility(false);
        }

        await this.runParallel([
            this.playerMoveToWaypoint("Scene02_walkoutside", 3),
            this.moveMonsterTo("Ghost_Corridor", "Scene02_monsterwalk_m", 6),
            this._waitAndRun(3, () => this._blinkSequence()),
        ]);

        // await this.playerMoveToWaypoint("Scene02_headslightrotate", 1);
        // await this.playerMoveToWaypoint("Scene02_walkoutside", 1);
        await this.setMonsterVisibility("Ghost_Corridor", false);

        await this.runParallel([
            this.playerMoveToWaypoint("Scene02_walktocurve", 10, "none"),
            this._waitAndRun(3, () => this.blink(1)),
        ])
        await this.playerMoveToWaypoint("Scene02_turn", 2, "none");

        await this.runParallel([
            this.playerMoveToWaypoint("Scene02_walktokitchen", 10, "none"),
            this._waitAndRun(3, () => this._blinkSequence()),

        ])

        await this.animateDoor("Door_ToKitchen", 90, 2.0)

    }

    async scene03_Kitchen() {
        console.log("--- Scene 3: Kitchen ---");

        // 1. SETUP AWAL
        if (this.currentViewMode === 'FPS') {
            this._setGuiVisibility(false);
        }

        await this.playerMoveToWaypoint("Scene03_enterkitchen", 4);

        await this.runParallel([
            this.animateDoor("Door_ToKitchen", 0, 1),
            this.playerMoveToWaypoint("Scene03_turntobottle", 3),
        ])

        await this.playerMoveToWaypoint("Scene03_confuseright", 1);
        await this.playerMoveToWaypoint("Scene03_confuseleft", 1);
        await this._wait(1.5);
        await this.playerMoveToWaypoint("Scene03_backaway", 5);

        await this.runParallel([
            this._setLightState("light_kitchen_1", false),
            this._setLightState("light_kitchen_2", false),
            this._waitAndRun(0.5, () => this.playerMoveToWaypoint("Scene03_confuseright_2", 1, "none")),
        ]);


        await this.runParallel([
            this.playerMoveToWaypoint("Scene03_confuse_3", 2, "none"),
            // this._setLightState("light_kitchen_window", true),
            this._waitAndRun(1.5, () => this.playerMoveToWaypoint("Scene03_backaway", 0.5, "none")),
            this._waitAndRun(1.6, () => this.setMonsterVisibility("Ghost_Kitchen_Window", true)),
            this._waitAndRun(3, () => this.playerMoveToWaypoint("Scene03_scared_1", 0.5, "power2.out")),
            this._waitAndRun(3.2, () => this.setEyeOpenness(0, 0.5)),
        ]);

        await this._wait(2);

        await this.runParallel([
            this.setMonsterVisibility("Ghost_Kitchen_Window", false),
            this.setMonsterVisibility("Ghost_Kitchen", true),
            this.setEyeOpenness(1, 2),
            this._waitAndRun(2.5, () => this.playerMoveToWaypoint("Scene03_scared_2", 3, "power2.in")),
        ]);

        await this.runParallel([
            this.playMonsterAnimation("Ghost_Kitchen", "Creature_armature|bite", 1),
            this.playerMoveToWaypoint("Scene03_scared_3", 0.5, "power2.out"),
            this._waitAndRun(0.5, () => this.playMonsterAnimation("Ghost_Kitchen", "Creature_armature|attack_2", 1)),
            this._waitAndRun(0.7, () => this.playerMoveToWaypoint("Scene03_scared_4", 1.5, "power2.in")),
            // this._waitAndRun(1, () => this.setEyeOpenness(0, 1)),

        ]);

    }


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
        await this.scene01_WakeUp();
        await this.scene02_BedroomCorridor();
        await this.scene03_Kitchen();
        // --- SELESAI ---

        // Reset
        this.world.setHelpersVisibility(true);
        this._setCinematicMode(false);
        this._setGuiVisibility(true);

        if (this.world.ui) this.world.ui.setCinematicButtonVisible(false);
        console.log("🎬 FILM SELESAI.");
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


    _instantSetPosition(waypointName) {
        const waypoint = this.scene.getObjectByName(waypointName);
        if (waypoint) {
            // 1. Pindahkan Rig (Badan Pemain) - Ini yang menjalankan animasi
            this.cameraManager.cameraRig.position.copy(waypoint.position);
            this.cameraManager.cameraRig.rotation.y = waypoint.rotation.y;
            this.cameraManager.camera.rotation.x = waypoint.rotation.x;
            this.cameraManager.cameraShakeGroup.rotation.z = waypoint.rotation.z;

            // 2. [FIX BARU] Cek jika sedang Free Roam (ORBIT), Kamera harus ikut pindah!
            // Agar tidak ketinggalan saat Player teleport di awal scene.
            if (this.currentViewMode === 'ORBIT') {
                const cam = this.cameraManager.camera;

                // 1. SAMAKAN DULU arah kamera dengan arah Waypoint
                // (Supaya sumbu "Mundur/Maju"-nya sama dengan arah hadap player)
                cam.position.copy(waypoint.position);
                cam.rotation.copy(waypoint.rotation);

                // 2. GESER BERDASARKAN SUMBU DIRI SENDIRI (Local Axis)
                // Ini fungsi bawaan Three.js yang Anda cari.
                cam.translateY(0);  // Naik ke atas (Sumbu Y lokal)
                cam.translateZ(0.1); // Mundur ke belakang (Sumbu Z lokal positif = mundur)

                // 3. Update Pivot Orbit
                if (this.cameraManager.orbitControls) {
                    this.cameraManager.orbitControls.target.copy(waypoint.position);
                    this.cameraManager.orbitControls.update();
                }
            }
        } else {
            console.warn(`⚠️ Waypoint '${waypointName}' tidak ditemukan untuk instant position.`);
        }
    }


    playerMoveToWaypoint(waypointName, duration, easeType = "power2.inOut") {
        return new Promise(resolve => {
            const waypoint = this.scene.getObjectByName(waypointName);

            if (!waypoint) {
                console.error(`❌ Waypoint '${waypointName}' tidak ditemukan!`);
                resolve();
                return;
            }

            const rig = this.cameraManager.cameraRig;
            const cam = this.cameraManager.camera;
            const neck = this.cameraManager.cameraShakeGroup;

            // Target Posisi & Rotasi dari Waypoint
            const targetPos = waypoint.position;
            const targetRotY = waypoint.rotation.y; // Badan (Kiri/Kanan)
            const targetRotX = waypoint.rotation.x; // Kepala (Atas/Bawah)
            const targetRotZ = waypoint.rotation.z; // Leher (Miring)

            // GSAP Timeline untuk sinkronisasi semua gerakan
            const tl = gsap.timeline({
                onComplete: resolve,
                defaults: { ease: easeType }
            });

            // 1. ANIMASI BADAN (RIG) - SELALU JALAN (Supaya cerita tetap maju)
            tl.to(rig.position, {
                x: targetPos.x,
                y: targetPos.y,
                z: targetPos.z,
                duration: duration
            }, 0);

            // Rotasi Badan (Y) juga selalu jalan agar arah jalan benar
            tl.to(rig.rotation, {
                y: targetRotY,
                duration: duration
            }, 0);

            // 2. ANIMASI KAMERA (KEPALA) - HANYA JIKA MODE FPS
            // Jika mode ORBIT (Free Roam), jangan gerakkan kamera user!
            if (this.currentViewMode === 'FPS') {
                tl.to(cam.rotation, {
                    x: targetRotX,
                    duration: duration
                }, 0);

                // Animasi Miring (Z - Roll)
                tl.to(neck.rotation, {
                    z: targetRotZ,
                    duration: duration
                }, 0);
            }

            console.log(`▶️ Moving to ${waypointName} (${duration}s)`);
        });
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


    setEyeOpenness(targetRatio, duration = 1.0) {
        // Clamp 0-1

        if (this.currentViewMode === 'ORBIT') return;
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

    // Fungsi Miringkan Badan (Roll Effect) via ShakeGroup
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

    // --- B. LIGHTING & EFEK ---

    _setLightFlicker(lightId, active, speed, chance) {
        this.lightingManager.setFlicker(lightId, active, speed, chance);
    }

    // Saklar Instan (ON/OFF)
    // Contoh: _setLightState('light_kitchen', false); -> Mati Total
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

    // Animasi Intensitas (Dimming / Brightening)
    // Contoh: _tweenLightIntensity('light_kitchen', 0, 5); -> Meredup jadi 0 dalam 5 detik
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

    // Efek Layar (Blackout / Blink)
    // Membutuhkan elemen HTML <div id="overlay"> di index.html
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
        const monster = this.scene.getObjectByName(monsterName);
        if (monster) {
            monster.visible = isVisible;
            console.log(`👻 Monster '${monsterName}' visibility: ${isVisible}`);
        } else {
            console.warn(`⚠️ Monster '${monsterName}' tidak ditemukan!`);
        }
    }

    // 2. MENGGERAKKAN MONSTER (UPDATED: Support Waypoint Name)
    moveMonsterTo(monsterName, targetData, duration) {
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
        console.log(`⚡ Menjalankan ${actions.length} aksi secara paralel...`);

        await Promise.all(actions);

        console.log("✅ Semua aksi paralel selesai.");
    }

    // --- UTILITIES: DELAYED ACTION ---
    // Menjalankan fungsi aksi setelah menunggu sekian detik
    // delay: Waktu tunggu (detik)
    // taskFunction: Arrow function yang berisi perintah (Contoh: () => this.moveMonsterTo(...))
    async _waitAndRun(delay, taskFunction) {
        if (delay > 0) {
            // console.log(`⏳ Delay ${delay}s...`); // Uncomment jika ingin log
            await this._wait(delay);
        }

        // Jalankan tugasnya sekarang
        await taskFunction();
    }



}