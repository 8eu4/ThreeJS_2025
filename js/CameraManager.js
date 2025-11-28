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

        // --- KONFIGURASI SKALA ---
        this.playerHeight = 160.0; 
        this.orbitMoveSpeed = 400.0; 
        this.fpsMoveSpeed = 400.0;  
        this.runMultiplier = 2.0;  
        this.gravity = 4000.0;     
        this.jumpForce = 1500.0;   

        // --- SETUP RIG ---
        // Wadah untuk FPS. Kamera TIDAK dimasukkan di sini saat awal (Default: Orbit)
        this.cameraRig = new THREE.Group();
        this.cameraRig.name = "CameraRig_PlayerBody";
        
        this.cameraShakeGroup = new THREE.Group();
        this.cameraShakeGroup.name = "CameraShakeGroup";
        
        this.scene.add(this.cameraRig);
        this.cameraRig.add(this.cameraShakeGroup);
        
        // --- CONTROLS ---
        this.activeMode = 'ORBIT'; 

        // A. ORBIT
        this.orbitControls = new OrbitControls(this.camera, this.domElement);
        this.orbitControls.enabled = true;
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.1; 
        this.orbitControls.screenSpacePanning = true;

        // B. FPS
        this.fpsControls = new PointerLockControls(this.camera, this.domElement);
        
        // --- PHYSICS VARS ---
        this.velocity = new THREE.Vector3();
        
        // Input Flags
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;   
        this.moveDown = false; 
        this.isRunning = false;
        this.canJump = false;
        
        // Helper Vectors (Untuk Orbit)
        this.vecDir = new THREE.Vector3();
        this.vecRight = new THREE.Vector3();

        this._setupInputs();
    }

    _setupInputs() {
        
        const onKeyDown = (event) => {

            console.log("Tombol Ditekan:", event.code);
            if (event.key === 'Shift') this.isRunning = true;
            
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': this.moveForward = true; break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = true; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = true; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = true; break;
                
                case 'KeyE': this.moveUp = true; break;
                case 'KeyQ': this.moveDown = true; break;

                case 'Space': 
                    if (this.canJump && this.activeMode === 'FPS') {
                        this.velocity.y += this.jumpForce;
                        this.canJump = false;
                    }
                    break;
            }
        };

        const onKeyUp = (event) => {
            if (event.key === 'Shift') this.isRunning = false;
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': this.moveForward = false; break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = false; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = false; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = false; break;
                case 'KeyE': this.moveUp = false; break;
                case 'KeyQ': this.moveDown = false; break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    _resetInputs() {
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        this.velocity.set(0, 0, 0);
    }

    setMode(mode) {
        this._resetInputs();

        if (mode === 'FPS') {
            // --- MASUK MODE FPS (ATTACH) ---
            this.activeMode = 'FPS';
            this.orbitControls.enabled = false;

            if (document.activeElement) {
                document.activeElement.blur();
            }
            // Fokuskan kembali ke body/canvas
            document.body.focus();

            // 1. Ambil posisi kamera saat ini
            const currentCamPos = new THREE.Vector3();
            this.camera.getWorldPosition(currentCamPos);

            // 2. Pindahkan Rig ke sana
            this.cameraRig.position.copy(currentCamPos);
            
            // 3. Masukkan Kamera ke dalam Rig
            this.cameraShakeGroup.add(this.camera);
            
            // 4. Reset Posisi Lokal Kamera (Nempel Kepala Rig)
            this.camera.position.set(0, 0, 0);
            this.camera.rotation.set(0, 0, 0); 
            
            // 5. Kunci Mouse
            this.fpsControls.lock();

        } else if (mode === 'ORBIT') {
            // --- MASUK MODE ORBIT (DETACH) ---
            this.activeMode = 'ORBIT';
            this.fpsControls.unlock();

            // 1. Ambil posisi global sebelum dicopot
            const globalPos = new THREE.Vector3();
            const globalQuat = new THREE.Quaternion();
            this.camera.getWorldPosition(globalPos);
            this.camera.getWorldQuaternion(globalQuat);

            // 2. Keluarkan Kamera ke World
            this.scene.add(this.camera);

            // 3. Terapkan posisi global
            this.camera.position.copy(globalPos);
            this.camera.quaternion.copy(globalQuat);

            // 4. Update Target Orbit (Depan Kamera)
            const forward = new THREE.Vector3(0, 0, -100).applyQuaternion(this.camera.quaternion);
            this.orbitControls.target.copy(this.camera.position).add(forward);
            
            this.orbitControls.enabled = true;
            this.orbitControls.update();
        }
    }

    update(delta) {
        if (!delta || delta > 0.1) delta = 0.016;

        if (this.activeMode === 'ORBIT') {
            this.orbitControls.update();

            // --- ORBIT MOVEMENT (TETAP SAMA SEPERTI YANG SUDAH BERHASIL) ---
            if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight || this.moveUp || this.moveDown) {
                
                this.camera.getWorldDirection(this.vecDir);
                this.vecDir.y = 0; 
                this.vecDir.normalize();

                this.vecRight.crossVectors(this.vecDir, new THREE.Vector3(0, 1, 0)).normalize();

                const moveVec = new THREE.Vector3();
                const speed = this.orbitMoveSpeed * delta * (this.isRunning ? 2.0 : 1.0);

                if (this.moveForward) moveVec.addScaledVector(this.vecDir, speed);
                if (this.moveBackward) moveVec.addScaledVector(this.vecDir, -speed);
                if (this.moveRight) moveVec.addScaledVector(this.vecRight, speed);
                if (this.moveLeft) moveVec.addScaledVector(this.vecRight, -speed);
                if (this.moveUp) moveVec.y += speed;
                if (this.moveDown) moveVec.y -= speed;

                this.camera.position.add(moveVec);
                this.orbitControls.target.add(moveVec);
            }

        } else if (this.activeMode === 'FPS') {

            // --- FPS MOVEMENT FIX (VECTOR BASED) ---
            const speed = this.fpsMoveSpeed * delta * (this.isRunning ? this.runMultiplier : 1.0);

            // 1. AMBIL ARAH PANDANG DUNIA (WORLD DIRECTION)
            // Ini mengambil arah mata kamera yang sebenarnya, tidak peduli rotasi parent/rig.
            this.camera.getWorldDirection(this.vecDir);
            
            // 2. RATAKAN KE TANAH (FLATTEN)
            // Kita buang sumbu Y (atas/bawah) agar karakter tidak terbang atau masuk tanah saat mendongak.
            this.vecDir.y = 0; 
            this.vecDir.normalize();

            // 3. HITUNG VEKTOR KANAN (CROSS PRODUCT)
            // Vektor tegak lurus dari arah pandang untuk gerakan samping.
            this.vecRight.crossVectors(this.vecDir, new THREE.Vector3(0, 1, 0)).normalize();

            // 4. TERAPKAN GERAKAN KE RIG
            // Gunakan addScaledVector untuk performa terbaik
            
            // Maju (W) & Mundur (S)
            if (this.moveForward) this.cameraRig.position.addScaledVector(this.vecDir, speed);
            if (this.moveBackward) this.cameraRig.position.addScaledVector(this.vecDir, -speed);
            
            // Kanan (D) & Kiri (A)
            if (this.moveRight) this.cameraRig.position.addScaledVector(this.vecRight, speed);
            if (this.moveLeft) this.cameraRig.position.addScaledVector(this.vecRight, -speed);

            // 5. GRAVITASI (Y-AXIS)
            this.velocity.y -= this.gravity * delta;
            this.cameraRig.position.y += this.velocity.y * delta;

            // 6. LANTAI SEDERHANA
            if (this.cameraRig.position.y < this.playerHeight) {
                this.velocity.y = 0;
                this.cameraRig.position.y = this.playerHeight;
                this.canJump = true;
            }
        }
    }
}