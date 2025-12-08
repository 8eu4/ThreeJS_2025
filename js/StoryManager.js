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

    // Fungsi ini yang nanti dipanggil untuk mainkan film full
    // async playFullMovie() {
    //     console.log("🎬 FILM DIMULAI...");

    //     // Scene 1: Bangun Tidur
    //     await this.scene01_WakeUp();

    //     await this.scene02_GetDownFromBed();

    //     await this.scene03_WalkOutsideBedroom();

    //     console.log("🎬 FILM SELESAI.");
    // }
    async playFullMovie() {
        console.log("🎬 ACTION! (Smooth Waypoint Animation)");

        this._setCinematicMode(true);
        this._setGuiVisibility(false);

        // 1. POSISI AWAL (Point A)
        // Untuk start game, biasanya memang Teleport (Instant) biar gak aneh
        this._instantSetPosition("Point_A_Kasur");

        // 2. BANGUN TIDUR
        await this.blink(0.5);
        await this._wait(1.0);

        // 3. JALAN KE PINTU (Point B)
        // Bergerak halus selama 4 detik menuju posisi & rotasi Point B
        console.log("🚶 Jalan ke Pintu...");
        await this.playerMoveToWaypoint("Point_B_Pintu", 4.0);

        await this._wait(0.5);

        // 4. JALAN KE KORIDOR (Point C) - Contoh jika ada
        // console.log("🚶 Ke Koridor...");
        // await this.playerMoveToWaypoint("Point_C_Koridor", 3.0);

        console.log("🎬 CUT! Scene Selesai.");
        this._setCinematicMode(false);
        this._setGuiVisibility(true);
        this.cameraManager.setMode('FPS');
    }

    _instantSetPosition(waypointName) {
        const waypoint = this.scene.getObjectByName(waypointName);
        if (waypoint) {
            this.cameraManager.cameraRig.position.copy(waypoint.position);
            this.cameraManager.cameraRig.rotation.y = waypoint.rotation.y;
            this.cameraManager.camera.rotation.x = waypoint.rotation.x;
            this.cameraManager.cameraShakeGroup.rotation.z = waypoint.rotation.z;
        }
    }

    playerMoveToWaypoint(waypointName, duration) {
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
                defaults: { ease: "power2.inOut" } // Gerakan mulus (Lambat-Cepat-Lambat)
            });

            // 1. Animasi Posisi (Badan Jalan)
            tl.to(rig.position, {
                x: targetPos.x,
                y: targetPos.y,
                z: targetPos.z,
                duration: duration
            }, 0);

            // 2. Animasi Rotasi Badan (Y - Kiri/Kanan)
            // Three.js rotasi kadang muter jauh (350 derajat ke 10 derajat).
            // Kita biarkan GSAP menangani interpolasi terpendeknya (biasanya aman).
            tl.to(rig.rotation, {
                y: targetRotY,
                duration: duration
            }, 0);

            // 3. Animasi Rotasi Kepala (X - Dongak/Nunduk)
            tl.to(cam.rotation, {
                x: targetRotX,
                duration: duration
            }, 0);

            // 4. Animasi Miring (Z - Roll)
            tl.to(neck.rotation, {
                z: targetRotZ,
                duration: duration
            }, 0);
            
            console.log(`▶️ Moving to ${waypointName} (${duration}s)`);
        });
    }



    // scene01 --> Bangun dari tidur (sudah aman, bisa dicontoh cara bikinnya)
    async scene01_WakeUp() {
        console.log("--- Scene 1: Wake Up Started ---");

        // 1. SETUP AWAL
        this._setGuiVisibility(false); // Sembunyikan UI
        this._setCinematicMode(true);  // Matikan kontrol player

        // Posisi Tidur (Di atas kasur, tinggi rendah)
        // Asumsi kasur ada di 0,0,0. Tinggi mata saat tidur misal 60 unit.
        this.cameraManager.cameraRig.position.set(150, 0, -20);
        this.cameraManager.cameraRig.rotation.set(0, Math.PI, 0);

        // Rotasi Kamera: Menghadap Langit-langit (X = -90 derajat)
        this.cameraManager.camera.rotation.set(Math.PI / 2, 0, 0);

        // Mata Tertutup
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

        // Fase: Bangun Duduk (Sit Up)
        console.log("Bangun duduk...");

        // Animasi Paralel: Rotasi Kepala (Ke depan) & Badan Naik (Duduk)
        const sitUpDuration = 3.0;

        // 1. Kepala menunduk ke depan (X: 0)
        this._tweenCameraRotation(0, 0, 0, sitUpDuration);

        // 2. Badan naik dari posisi tidur (60) ke posisi duduk/berdiri (130/160)
        // Kita gunakan tween posisi Rig Y
        gsap.to(this.cameraManager.cameraRig.position, {
            y: 145, // Tinggi berdiri (playerHeight)
            duration: sitUpDuration,
            ease: "power2.inOut"
        });

        await this._wait(sitUpDuration + 0.5);

        const lookLeftDuration = 2.0;

        this._tweenCameraRotation(0, Math.PI / 10, 0, lookLeftDuration);

        gsap.to(this.cameraManager.cameraRig.position, {
            y: 145, // Tinggi berdiri (playerHeight)
            duration: lookLeftDuration,
            ease: "power2.inOut"
        });

        await this._wait(lookLeftDuration + 0.5);

        const lookRightDuration = 2.0;

        this._tweenCameraRotation(0, -Math.PI / 10, 0, lookRightDuration);

        gsap.to(this.cameraManager.cameraRig.position, {
            y: 145, // Tinggi berdiri (playerHeight)
            duration: lookRightDuration,
            ease: "power2.inOut"
        });

        await this._wait(lookRightDuration + 0.5);


        const lookFrontDuration = 1.0;

        this._tweenCameraRotation(0, 0, 0, lookFrontDuration);

        gsap.to(this.cameraManager.cameraRig.position, {
            y: 145, // Tinggi berdiri (playerHeight)
            duration: lookFrontDuration,
            ease: "power2.inOut"
        });

        await this._wait(lookFrontDuration + 0.5);


        // Fase: Selesai
        console.log("Scene 1 Selesai. Player Control Active.");
        this._setGuiVisibility(true); // Munculkan UI lagi
        this._setCinematicMode(false); // Matikan mode cinematic

        // PENTING: Pindah ke FPS agar fisika & collision aktif kembali
    }
    // scene02 --> Turun dari kasur dan jalan ke pintu kamar
    // jika posisi kamera menalanjutkan scene sebelumnya, tidak perlu define lagi posisi awal kamera
    async scene02_GetDownFromBed() {
        console.log("--- Scene 2: Get Down From Bed ---");

        // 1. SETUP AWAL
        this._setGuiVisibility(false); // Sembunyikan UI
        this._setCinematicMode(true);  // Matikan kontrol player

        await this._wait(0);

        // --- ACTION 1: GESER KE PINGGIR KASUR (KIRI) ---
        // Badan geser kiri, Kepala noleh kiri + nunduk (lihat lantai)
        console.log("Geser ke pinggir kasur...");

        const shiftDuration = 2.0;

        await Promise.all([
            // A. Badan: Geser X ke kiri (dari 150 ke 90)
            this._tweenRigPosition(100, null, null, shiftDuration),

            // B. Kepala: Kombinasi Noleh Kiri (Y) dan Nunduk (X)
            // Pitch (X): -0.6 (Nunduk lihat bawah)
            // Yaw (Y): 0.8 (Noleh Kiri)
            // Roll (Z): 0 (Netral) atau 0.1 (Miring dikit)
            this._tweenCameraRotation(-Math.PI / 4, -Math.PI / 2, 0, shiftDuration)
        ]);

        await this._wait(0.5); // Pause sebentar di pinggir kasur

        // --- ACTION 2: TURUN & BERDIRI ---
        // Badan naik (berdiri), Kepala tegak (lihat depan)
        console.log("Berdiri...");

        const standDuration = 2.5;

        await Promise.all([
            // A. Badan: Naik ke tinggi berdiri (160) dan maju sedikit menjauhi kasur (Z ke 0)
            this._tweenRigPosition(null, 160, null, standDuration),

            // B. Kepala: Reset pandangan ke depan (0,0,0)
            // Ini akan menciptakan efek "Mendongak" saat badan naik
            this._tweenCameraRotation(0, -Math.PI / 2, 0, standDuration),
        ]);

        // --- SELESAI ---
        console.log("Scene 2 Selesai.");
        // await this._handoverToPlayer();
        // PENTING: Sinkronisasi rotasi Rig sebelum serahkan ke FPS
        // Karena tadi kita memutar KAMERA (Y=0.8), tapi Rig masih lurus (Y=0).
        // Saat masuk FPS, kita ingin arah badan ikut arah kepala terakhir atau reset lurus.
        // Di sini kita sudah reset kamera ke 0,0,0 jadi aman (menghadap depan Rig).

        // this._setCinematicMode(false);
        // this._setGuiVisibility(true);
        // this.cameraManager.setMode('FPS');
    }

    async scene03_WalkOutsideBedroom() {
        console.log("--- Scene 3: Walk Outside Started ---");

        // 1. SETUP (Lanjutan dari Scene 2)
        this._setGuiVisibility(false);

        // --- ACTION 1: STEP OUT (Maju dikit dari kasur) ---
        console.log("Maju & Lirik...");

        const stepOutDuration = 3.0;

        await Promise.all([
            // Badan maju menjauhi kasur (Z: -30 -> 30)
            this._tweenRigPosition(30, null, null, stepOutDuration),

            // Kepala menoleh kiri 45 derajat (mencari pintu)
            this._tweenCameraRotation(0, -Math.PI / 4, 0, stepOutDuration)
        ]);

        // --- ACTION 2: TURN & WALK (Putar Badan ke Arah Pintu + Jalan) ---
        console.log("Belok & Jalan ke Pintu...");

        const walkDuration = 5;

        // Target Lokasi Pintu: (X=350, Z=350)
        // Posisi Awal Badan: (X=0, Z=30)
        // Arah Hadap Badan Saat Ini: Math.PI (180 derajat / Menghadap Belakang Z-)

        // Kita ingin badan menghadap ke titik tujuan.
        // Secara matematika, arah dari (0,30) ke (350,350) adalah sekitar 45 derajat (Serong Kanan Bawah).
        // Tapi dalam rotasi Y Three.js:
        // 0 = -Z (Utara)
        // Math.PI = +Z (Selatan)
        // Math.PI/2 = -X (Timur/Kanan) 
        // -Math.PI/2 = +X (Barat/Kiri)

        // Mari kita coba putar badan menghadap SERONG KIRI BELAKANG (Arah Pintu).
        // Sudut Target: Math.PI + (Math.PI / 4)  = 225 derajat (Serong Kiri Bawah)
        // Atau dalam radian sekitar 3.9 atau -2.3

        const targetBodyRotation = (Math.PI / 2) + (Math.PI / 6);

        await Promise.all([
            // 1. Geser Posisi ke Depan Pintu
            this._tweenRigPosition(-230, null, 350, walkDuration),

            // 2. PUTAR BADAN MENGHADAP TUJUAN
            // Ini kunci agar tidak terlihat strafing (jalan miring)
            this._tweenRigRotation(null, targetBodyRotation, null, walkDuration),

            // 3. RESET KEPALA KE LURUS
            // Karena badan sudah berputar ke arah pintu, kepala harus kembali lurus (0)
            // agar pandangan tetap fokus ke depan.
            this._tweenCameraRotation(0, 0, 0, walkDuration)
        ]);

        // --- ACTION 3: ARRIVAL (Luruskan Badan Tepat Depan Pintu) ---
        console.log("Sampai depan pintu.");

        const alignDuration = 2.0;

        // Misal pintu menghadap sumbu X, kita luruskan badan 90 derajat
        const finalRotation = Math.PI / 2; // Menghadap Kiri (90 derajat) atau sesuaikan

        await Promise.all([
            // Maju dikit lagi (X=400)
            this._tweenRigPosition(-230, null, 350, alignDuration),

            // Luruskan badan tegak lurus pintu
            this._tweenRigRotation(null, finalRotation, null, alignDuration)
        ]);

        console.log("Scene 3 Selesai.");

        // // Stop di sini untuk scene selanjutnya
        // this._setGuiVisibility(true);
        // this._setCinematicMode(false);
        // this.cameraManager.setMode('FPS');
    }

    // =========================================================
    // 🛠️ BAGIAN 2: DIRECTOR TOOLS (ALAT BANTU)
    // Fungsi-fungsi teknis untuk menggerakkan aktor/kamera
    // =========================================================

    // Helper Cepat: Kedip (Blink)

    // _handoverToPlayer() {
    //     console.log("⏳ Menunggu klik pemain untuk mulai...");
    //     return new Promise(resolve => {
    //         // Kita buat listener sekali pakai
    //         const onClick = () => {
    //             window.removeEventListener('click', onClick);

    //             // EKSEKUSI DI SINI (Di dalam event click agar Browser mengizinkan)
    //             this._setGuiVisibility(true); 
    //             this._setCinematicMode(false); 
    //             this.cameraManager.setMode('FPS');

    //             console.log("✅ Kendali diserahkan ke pemain.");
    //             resolve();
    //         };

    //         // Pasang jebakan klik di window
    //         window.addEventListener('click', onClick);
    //     });
    // }

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

    // --- FUNGSI UTAMA: ANIMASI MATA ---
    // targetRatio: 0.0 (Tutup) sampai 1.0 (Buka)
    // duration: Kecepatan transisi dalam detik
    setEyeOpenness(targetRatio, duration = 1.0) {
        // Clamp 0-1
        const val = Math.max(0, Math.min(1, targetRatio));
        this.currentOpenness = val;

        // --- STRATEGI BARU: RADIAL GRADIENT ---

        // Kita butuh objek sementara untuk di-animasikan angkanya oleh GSAP
        // Karena kita tidak bisa meng-animasikan string "radial-gradient" secara langsung

        const eyelidEl = document.getElementById('cinematic-eyelids');

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
    _setCinematicMode(active) {
        if (active) {
            console.log("[Story] Masuk Mode Cinematic");

            // 1. Matikan Kontrol Player
            this.cameraManager.activeMode = 'CINEMATIC';
            this.cameraManager.orbitControls.enabled = false;
            this.cameraManager.fpsControls.unlock();
            this.cameraManager.velocity.set(0, 0, 0);
            this.cameraManager.currentMoveVelocity.set(0, 0, 0);

            // 2. ATTACH CAMERA KE RIG (PENTING!)
            // Kita paksa kamera masuk ke dalam struktur Rig agar bisa digerakkan oleh StoryManager
            this.cameraManager.cameraShakeGroup.add(this.cameraManager.camera);

            // 3. RESET TRANSFORM LOKAL KAMERA
            // Agar kamera duduk pas di titik pusat Rig (tidak ada offset aneh dari mode Orbit sebelumnya)
            this.cameraManager.camera.position.set(0, 0, 0);
            this.cameraManager.camera.rotation.set(0, 0, 0);

        } else {
            console.log("[Story] Keluar Mode Cinematic");
            // Saat keluar, kita tidak perlu detach manual di sini.
            // Biarkan setMode('FPS') atau setMode('ORBIT') yang mengurusnya nanti.
        }
    }

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

    // --- C. UTILITIES ---

    // Fungsi Menunggu (Penting untuk timing cerita)
    _wait(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
}