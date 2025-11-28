// js/CameraManager.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class CameraManager {
    constructor(world, state) {
        this.world = world;
        this.state = state;
        this.camera = world.camera;
        this.scene = world.scene;
        this.domElement = world.renderer.domElement;

        // --- 1. SETUP HIERARKI RIG (WADAH KAMERA) ---
        // Scene -> CameraRig (Posisi Player) -> CameraShake (Efek Gempa) -> Camera (Mata/Tilt)
        
        this.cameraRig = new THREE.Group();
        this.cameraRig.name = "CameraRig_PlayerBody";
        this.cameraRig.position.copy(this.camera.position); // Samakan posisi awal
        
        this.cameraShakeGroup = new THREE.Group();
        this.cameraShakeGroup.name = "CameraShakeGroup";
        
        // Susun Hierarki
        this.scene.add(this.cameraRig);
        this.cameraRig.add(this.cameraShakeGroup);
        this.cameraShakeGroup.add(this.camera);
        
        // Reset posisi lokal kamera karena sudah masuk grup
        this.camera.position.set(0, 0, 0);
        this.camera.rotation.set(0, 0, 0);

        // --- 2. INITIALIZE CONTROLS ---
        this.activeMode = 'ORBIT'; // Default: 'ORBIT' atau 'FPS'

        // A. ORBIT (Free Roam) - Targetnya adalah Rig, bukan kamera langsung
        this.orbitControls = new OrbitControls(this.camera, this.domElement);
        this.orbitControls.enabled = true;
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;

        // B. POINTER LOCK (FPS)
        this.fpsControls = new PointerLockControls(this.camera, this.domElement);
        
        // Event Listener untuk FPS Lock
        this.fpsControls.addEventListener('lock', () => {
            console.log("FPS Mode: LOCKED");
        });
        this.fpsControls.addEventListener('unlock', () => {
            console.log("FPS Mode: UNLOCKED");
            // Jika user tekan ESC, mungkin kita mau balik ke menu atau tetap di mode FPS tapi pause
        });

        // --- 3. PHYSICS VARIABLES (FPS ONLY) ---
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        
        // Gravitasi & Kecepatan
        this.speed = 100.0; // Kecepatan jalan
        this.gravity = 300.0; // Kekuatan jatuh

        // Collision Raycaster
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 2; // Jarak deteksi tembok (2 unit)

        // Setup Input Keyboard
        this._setupInputs();
    }

    _setupInputs() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': this.moveForward = true; break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = true; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = true; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = true; break;
                case 'Space': 
                    if (this.canJump === true && this.activeMode === 'FPS') {
                        this.velocity.y += 100; // Kekuatan lompat
                        this.canJump = false;
                    }
                    break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': this.moveForward = false; break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = false; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = false; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = false; break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    // --- FUNGSI GANTI MODE ---
    setMode(mode) {
        if (mode === 'FPS') {
            this.activeMode = 'FPS';
            this.orbitControls.enabled = false;
            this.fpsControls.lock(); // Kunci kursor
            
            // Pindah posisi ke Bedroom (Titik Start)
            // Asumsi Bedroom di 0,0,0, tinggi mata 2 unit
            this.cameraRig.position.set(0, 2, 0); 
            this.cameraRig.rotation.set(0, 0, 0);
            
            console.log("Switched to FPS Mode");

        } else if (mode === 'ORBIT') {
            this.activeMode = 'ORBIT';
            this.fpsControls.unlock(); // Lepas kursor
            this.orbitControls.enabled = true;
            this.orbitControls.target.copy(this.cameraRig.position);
            
            console.log("Switched to Free Roam (Orbit) Mode");
        }
    }

    // --- FUNGSI CEK COLLISION (INTI) ---
    _checkCollision(positionToCheck) {
        // Arahkan Raycaster dari pusat badan ke arah gerakan (sederhana dulu)
        // Untuk tahap awal, kita hanya cek "apakah ada sesuatu di depan mata"
        // Nanti kita akan kembangkan jadi 4 sisi (WASD)
        
        // Kita pakai posisi rig saat ini sebagai asal
        this.raycaster.ray.origin.copy(positionToCheck);
        
        // Cek ke arah depan kamera
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir); 
        this.raycaster.ray.direction.copy(dir);

        // Ambil semua objek yang bisa tabrakan (Dinding + Monster)
        // Kita perlu array gabungan, tapi sementara kita cek semua 'selectable'
        // atau nanti kita filter khusus.
        const intersects = this.raycaster.intersectObjects(this.state.allSelectableObjects, true);

        for (const hit of intersects) {
            // Ambil objek induk (karena hit sering kena Mesh pecahannya)
            let obj = hit.object;
            while(obj.parent && obj.parent.type !== 'Scene' && !obj.userData.isMonster && !obj.userData.checkCollision) {
                obj = obj.parent;
            }

            // --- LOGIKA HANTU (SESUAI REQUEST) ---
            if (obj.userData.isMonster) {
                if (obj.visible === true) {
                    return true; // TABRAKAN (Hantu Padat)
                } else {
                    continue; // TEMBUS (Hantu Invisible -> Skip loop ini, cari objek lain di belakangnya)
                }
            }

            // --- LOGIKA TEMBOK BIASA ---
            // Asumsi semua yang bukan monster dan jaraknya dekat adalah tembok
            if (hit.distance < 1.5) { 
                return true; 
            }
        }
        return false;
    }

    // --- LOOP UTAMA (UPDATE) ---
    update(delta) {
        // 1. UPDATE ORBIT (Jika aktif)
        if (this.activeMode === 'ORBIT') {
            this.orbitControls.update();
            // Sinkronisasi posisi Rig agar pas switch ke FPS tidak lompat jauh
            // (Opsional, tergantung selera)
        }

        // 2. UPDATE FPS (Jika aktif)
        if (this.activeMode === 'FPS') {
            
            // Logika Fisika FPS (Movement & Gravity)
            this.velocity.x -= this.velocity.x * 10.0 * delta; // Gesekan (berhenti pelan2)
            this.velocity.z -= this.velocity.z * 10.0 * delta;
            this.velocity.y -= 9.8 * 100.0 * delta; // Gravitasi

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize(); // Agar jalan miring tidak lebih cepat

            if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * this.speed * delta;
            if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * this.speed * delta;

            // Hitung pergerakan frame ini
            const forwardMove = -this.velocity.z * delta;
            const sideMove = -this.velocity.x * delta;

            // Terapkan gerakan ke Control Object (FPS Controls menggerakkan kamera secara internal)
            this.fpsControls.moveForward(forwardMove);
            this.fpsControls.moveRight(sideMove);

            // --- SIMPLE FLOOR COLLISION (Lantai Sederhana) ---
            // Kita kunci Y minimal di 2.0 (tinggi mata) agar tidak jatuh ke jurang
            // Nanti bisa diganti Raycaster ke bawah jika lantai tidak rata
            if (this.cameraRig.position.y < 2.0) {
                this.velocity.y = 0;
                this.cameraRig.position.y = 2.0;
                this.canJump = true;
            }
            
            // Update posisi Rig mengikuti Kamera (Karena PointerLock menggerakkan kamera)
            // Hack: PointerLockControls Three.js menggerakkan .camera, tapi kita butuh Rig yang gerak
            // Jadi kita harus sinkronisasi manual atau attach controls ke Rig.
            // (Untuk saat ini kita biarkan standar dulu, nanti kita perbaiki logic Rig-nya di tahap selanjutnya)
        }
    }
}