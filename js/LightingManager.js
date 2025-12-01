// js/LightingManager.js
import * as THREE from 'three';

export class LightingManager {
    constructor(world, cameraManager) {
        this.world = world;
        this.scene = world.scene;
        this.camera = cameraManager.camera;

        this.lights = {};

        this._setupGlobalLights();
        this._setupFlashlight();
        this._setupRoomLights();
    }

    _setupGlobalLights() {
        // 1. Ambient Light (Atmosfer Dasar)
        // MODE HORROR (Gelap):
        // const ambientColor = 0x050510; // Biru Tua Gelap
        // const ambientIntensity = 0.5;

        // MODE DEVELOPMENT (Terang Benderang - Pakai ini kalau mau ngedit):
        const ambientColor = 0xffffff; // Putih
        const ambientIntensity = 1.0;

        const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
        this.scene.add(ambient);
        this.lights['global_ambient'] = ambient;

        // 2. Moonlight (Cahaya Bulan)
        const moonLight = new THREE.DirectionalLight(0x4444aa, 0.5);
        moonLight.position.set(500, 2000, 500);

        // --- KEMBALIKAN SHADOW (Agar interior gelap) ---
        moonLight.castShadow = true;

        // Setup Area Bayangan (Disesuaikan skala 100x)
        moonLight.shadow.camera.left = -3000;
        moonLight.shadow.camera.right = 3000;
        moonLight.shadow.camera.top = 3000;
        moonLight.shadow.camera.bottom = -3000;
        moonLight.shadow.mapSize.width = 2048;
        moonLight.shadow.mapSize.height = 2048;
        moonLight.shadow.bias = -0.0001; // Mengurangi garis-garis kasar pada bayangan

        this.scene.add(moonLight);
        this.lights['global_moon'] = moonLight;
    }

    _setupFlashlight() {
        // --- KONFIGURASI SENTER NATURAL ---

        // 1. Warna: Cream/Kuning Pucat (0xfffdd0) biar gak terlalu steril
        // 2. Intensitas: 80000 (Sangat tinggi karena kita pakai decay 2 di skala map besar)
        const flashLight = new THREE.SpotLight(0xfffdd0, 80000);

        // 3. Angle: Sedikit diperlebar (sekitar 40-45 derajat) agar pandangan tidak terlalu sempit
        flashLight.angle = Math.PI / 4.5;

        // 4. Penumbra: 0.5 artinya 50% dari sinar adalah gradasi halus (Soft Edge)
        flashLight.penumbra = 0.5;

        // 5. Decay: 2 (Fisika Nyata). Cahaya meredup drastis seiring jarak.
        flashLight.decay = 2;

        // 6. Distance: Batas maksimum perhitungan cahaya
        flashLight.distance = 8000;

        flashLight.castShadow = true;
        // Bias: Mencegah 'shadow acne' (garis-garis aneh di permukaan sendiri)
        flashLight.shadow.bias = -0.0001;

        // Meningkatkan kualitas bayangan senter (biar gak kotak-kotak)
        flashLight.shadow.mapSize.width = 1024;
        flashLight.shadow.mapSize.height = 1024;

        // Posisi: Sedikit di kanan bawah kamera
        flashLight.position.set(25, -20, 10);

        // Target: Jauh ke depan
        flashLight.target.position.set(0, 0, -1000);

        this.camera.add(flashLight);
        this.camera.add(flashLight.target);

        this.lights['player_flashlight'] = flashLight;
        flashLight.visible = false;
    }


    _setupRoomLights() {
        // --- SETUP LAMPU RUANGAN ---

        // 1. LAMPU DAPUR (Kitchen)
        // Koordinat: X=700, Z=-400 (Pusat Dapur). Y=250 (Plafon).
        // Warna: Oranye/Kuning Tua (0xffaa00) untuk kesan lampu bohlam tua/kotor.
        // Intensitas: 2.0 (Cukup terang).
        // Jarak: 800 (Agar sudut ruangan tetap gelap/vignette).

        this._createRoomLight(
            'light_kitchen_1',          // lampu dapur depan jendela
            new THREE.Vector3(680, 250, -310),
            0xffaa00,                 // Warna
            4000,                      // Intensitas
            800                       // Jarak Pendar (Distance)
        );
        this._createRoomLight(
            'light_kitchen_2',          // lampu dapur yg sampingnya
            new THREE.Vector3(830, 250, -310),
            0xffaa00,                 // Warna
            4000,                      // Intensitas
            800                       // Jarak Pendar (Distance)
        );
        this._createRoomLight(
            'light_kitchen_window',          // lampu untuk sinari monster nanti
            new THREE.Vector3(620, 300, -550),
            0xffffff,                 // Warna
            8000,                      // Intensitas
            700                       // Jarak Pendar (Distance)
        );
        this._createRoomLight(
            'light_bedroom_bed',          // lampu samping kasur yg di meja
            new THREE.Vector3(-45, 120, -140),
            0xffaa00,                 // Warna
            5000,                      // Intensitas
            1000                       // Jarak Pendar (Distance)
        );
        this._createRoomLight(
            'light_bedroom_door',          // lampu kamar yg dekat pintu
            new THREE.Vector3(-300, 220, 215),
            0xffaa00,                 // Warna
            5000,                      // Intensitas
            1000                       // Jarak Pendar (Distance)
        );
        this._createRoomLight(
            'light_bedroom_wall',          // lampu kamar di tembol dalem
            new THREE.Vector3(490, 220, 50),
            0xffaa00,                 // Warna
            5000,                      // Intensitas
            1000                       // Jarak Pendar (Distance)
        );
        this._createRoomLight(
            'light_bedroom_corridor_1',          //lampu lorong yang depan kamar persis
            new THREE.Vector3(-520, 200, 215),
            0xffaa00,                 // Warna
            5000,                      // Intensitas
            1000                       // Jarak Pendar (Distance)
        );
        this._createRoomLight(
            'light_bedroom_corridor_2',          //lampu lorong yang depan kamar persis
            new THREE.Vector3(-500, 120, -405),
            0xffaa00,                 // Warna
            5000,                      // Intensitas
            1000                       // Jarak Pendar (Distance)
        );
        this._createRoomLight(
            'light_bedroom_corridor_3',          // lampu lorong setelah tikungan 
            new THREE.Vector3(120, 200, -280),
            0xffaa00,                 // Warna
            5000,                      // Intensitas
            1000                       // Jarak Pendar (Distance)
        );
        this._createRoomLight(
            'light_bedroom_corridor_4',          // lampu lorong sebelum pintu dapur
            new THREE.Vector3(455, 200, -280),
            0xffaa00,                 // Warna
            5000,                      // Intensitas
            1000                       // Jarak Pendar (Distance)
        );
        this._createRoomLight(
            'light_corridor_1',          // lampu lorong panjang persis depan pintu keluar dapur
            new THREE.Vector3(955, 190, -305),
            0xffaa00,                 // Warna
            2000,                      // Intensitas
            800                       // Jarak Pendar (Distance)
        );
        this._createRoomLight(
            'light_corridor_2',          // lampu lorong panjang tikungan setelah dapur
            new THREE.Vector3(1025, 180, 120),
            0xffaa00,                 // Warna
            2000,                      // Intensitas
            800                       // Jarak Pendar (Distance)
        );
        this._createRoomLight(
            'light_corridor_3',          // lampu lorong panjang tikungan setelah dapur
            new THREE.Vector3(1280, 180, -25),
            0xffaa00,                 // Warna
            2000,                      // Intensitas
            800                       // Jarak Pendar (Distance)
        );

        this.setFlicker('light_corridor_1', true, 0.05, 0.5)

    }

    // --- FACTORY FUNCTION (PABRIK LAMPU) ---
    _createRoomLight(id, pos, color, intensity, distance) {
        const light = new THREE.PointLight(color, intensity, distance, 2);
        light.position.copy(pos);
        light.castShadow = false;

        // DATA PENTING UNTUK FLICKER:
        // Kita simpan intensitas asli agar bisa 'reset' setelah kedip
        light.userData.baseIntensity = intensity;
        light.userData.isFlickering = false;      // Default mati

        // --- TAMBAHAN BARU (TIMER) ---
        light.userData.flickerTimer = 0;      // Penghitung waktu
        light.userData.flickerInterval = 0.05; // Cek setiap 0.05 detik (20x per detik)
        // -----------------------------

        this.scene.add(light);
        this.lights[id] = light;

        const helper = new THREE.PointLightHelper(light, 20);
        this.scene.add(helper);
        // Kita simpan helpernya juga (opsional, siapa tau mau di-hide via UI)
        if (!this.helpers) this.helpers = [];
        this.helpers.push(helper);
    }

    update(delta) {
        if (this.flashLightHelper) this.flashLightHelper.update();

        for (const key in this.lights) {
            const light = this.lights[key];

            if (light.userData && light.userData.isFlickering) {

                light.userData.flickerTimer += delta;

                // Gunakan interval dinamis milik lampu tersebut
                if (light.userData.flickerTimer > light.userData.flickerInterval) {

                    light.userData.flickerTimer -= light.userData.flickerInterval;

                    // Gunakan glitch chance dinamis
                    // Math.random() menghasilkan 0.0 - 1.0
                    // Jika glitchChance 0.1, maka 90% Normal.
                    // Jika glitchChance 0.5, maka 50% Normal.

                    if (Math.random() > light.userData.glitchChance) {
                        // NORMAL (Variasi dikit)
                        light.intensity = light.userData.baseIntensity * (0.9 + Math.random() * 0.1);
                    } else {
                        // GLITCH (Redup/Mati)
                        light.intensity = light.userData.baseIntensity * (Math.random() * 0.2);
                    }
                }
            }
        }
    }

    // Tambahkan parameter interval (kecepatan) dan glitchChance (peluang mati)
    setFlicker(lightId, isActive, interval = 0.05, glitchChance = 0.1) {
        const light = this.lights[lightId];
        if (light) {
            light.userData.isFlickering = isActive;

            // Simpan profil flicker ke dalam lampu
            light.userData.flickerInterval = interval; // 0.05 = Cepat, 0.5 = Lambat
            light.userData.glitchChance = glitchChance; // 0.1 = Jarang mati, 0.8 = Sering mati

            if (!isActive) {
                // Reset ke normal saat dimatikan
                light.intensity = light.userData.baseIntensity;
            }
            console.log(`[LIGHTING] ${lightId} flicker: ${isActive} (Speed: ${interval})`);
        } else {
            console.warn(`[LIGHTING] Lampu '${lightId}' tidak ditemukan!`);
        }
    }

    toggleFlashlight() {
        const flashlight = this.lights['player_flashlight'];
        if (flashlight) {
            flashlight.visible = !flashlight.visible; // Balik status (Nyala <-> Mati)
            // console.log(`Senter: ${flashlight.visible ? "ON" : "OFF"}`);
        }
    }
}