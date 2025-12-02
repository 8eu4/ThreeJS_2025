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

    // =========================================================
    // 🎬 BAGIAN 1: SCRIPT CERITA (SKENARIO)
    // Di sinilah Anda menulis urutan kejadian filmnya
    // =========================================================

    async startOpeningScene() {
        console.log("--- ACTION! Opening Scene Started ---");
        this.isStoryPlaying = true;

        // 1. Setup Awal (Layar Gelap, Mode Cinematic)
        this._setCinematicMode(true);
        this._fadeScreen("OUT", 0); // Layar hitam total

        // 2. Set Posisi Awal (Di Kasur)
        // Koordinat: Misal X=0, Y=50 (Tidur), Z=0
        this.cameraManager.cameraRig.position.set(0, 50, 0);
        this.cameraManager.cameraRig.rotation.set(0, 0, 0); // Lurus
        this.cameraManager.camera.rotation.set(-Math.PI / 2, 0, 0); // Menghadap Atap (Tidur)

        // 3. Mulai Cerita: Buka Mata
        await this._wait(2); // Tunggu 2 detik dalam gelap

        console.log("Mata Membuka...");
        await this._fadeScreen("IN", 4); // Fade in pelan (4 detik) - Efek bangun tidur

        // 4. Bangun dari kasur (Rotasi kamera dari atas ke depan)
        await this._tweenCameraRotation(0, 0, 0, 3); // 3 detik bangun duduk

        // 5. Berdiri (Naikkan Y dari 50 ke 160)
        await this._tweenRigPosition(null, 160, null, 2); // null artinya axis itu jangan diubah

        // 6. Jalan ke Pintu (Pindah Posisi Rig)
        console.log("Jalan ke pintu...");
        // Misal pintu ada di Z = -500
        await this._tweenRigPosition(0, 160, -500, 5); // Jalan 5 detik

        // 7. Kembalikan kendali ke Pemain
        console.log("Player Control Active");
        this._setCinematicMode(false); // Masuk mode FPS
        this.cameraManager.setMode('FPS');
    }

    // =========================================================
    // 🛠️ BAGIAN 2: DIRECTOR TOOLS (ALAT BANTU)
    // Fungsi-fungsi teknis untuk menggerakkan aktor/kamera
    // =========================================================

    setEyeOpenness(openness, duration = 1.0) {
        // Clamp nilai agar tidak lebih dari 0-1
        const val = Math.max(0, Math.min(1, openness));

        // Hitung posisi Translate Y
        // Jika Buka (1.0) -> Top ke -100%, Bottom ke 100%
        // Jika Tutup (0.0) -> Top ke 0%, Bottom ke 0%

        const topY = -100 * val;
        const bottomY = 100 * val;

        // Animasikan Kelopak Atas
        gsap.to("#eyelid-top", {
            yPercent: topY,
            duration: duration,
            ease: "power2.inOut" // Gerakan natural (lambat-cepat-lambat)
        });

        // Animasikan Kelopak Bawah
        gsap.to("#eyelid-bottom", {
            yPercent: bottomY,
            duration: duration,
            ease: "power2.inOut"
        });
    }

    // Helper Cepat: Kedip (Blink)
    async blink(duration = 0.1) {
        this.setEyeOpenness(0, duration); // Tutup
        await new Promise(r => setTimeout(r, duration * 1000));
        this.setEyeOpenness(1, duration); // Buka
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

    // --- A. KAMERA & GERAKAN ---

    _setCinematicMode(active) {
        if (active) {
            // Matikan input player, sembunyikan UI, matikan fisika jatuh
            this.cameraManager.activeMode = 'CINEMATIC';
            this.cameraManager.orbitControls.enabled = false;
            this.cameraManager.fpsControls.unlock(); // Lepas mouse
            // Reset velocity agar tidak meluncur sisa gerakan sebelumnya
            this.cameraManager.velocity.set(0, 0, 0);
        } else {
            // Mode FPS akan diaktifkan manual lewat setMode('FPS')
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