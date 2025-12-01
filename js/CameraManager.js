// js/CameraManager.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class CameraManager {
    constructor(world, state) {
        this.tempVec1 = new THREE.Vector3(); // Wadah vektor umum 1
        this.tempVec2 = new THREE.Vector3(); // Wadah vektor umum 2
        this.tempRayOrigin = new THREE.Vector3(); // Wadah titik asal laser

        // Variabel untuk prediksi posisi (Safety Bubble)
        this.tempPredictionStep = new THREE.Vector3();
        this.tempNextPos = new THREE.Vector3();

        this.showDebugArrow = false; // Set 'true' jika ingin melihat panah kuning lagi

        this.world = world;
        this.state = state;
        this.camera = world.camera;
        this.scene = world.scene;
        this.domElement = world.renderer.domElement;

        // --- KONFIGURASI SKALA ---
        this.playerHeight = 160.0;
        this.orbitMoveSpeed = 100.0;
        this.fpsMoveSpeed = 100.0;
        this.runMultiplier = 2.0;
        this.gravity = 4000.0;
        this.jumpForce = 1500.0;

        // Jarak aman tabrakan (0.8 meter * 100 skala)
        this.collisionPadding = 80.0;

        // --- SETUP RIG ---
        this.cameraRig = new THREE.Group();
        this.cameraRig.name = "CameraRig_PlayerBody";

        this.cameraShakeGroup = new THREE.Group();
        this.cameraShakeGroup.name = "CameraShakeGroup";

        this.scene.add(this.cameraRig);
        this.cameraRig.add(this.cameraShakeGroup);
        // Kamera di luar (Orbit Mode Default)

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
        this.currentMoveVelocity = new THREE.Vector3(0, 0, 0); // Velocity Horizontal (X/Z)

        // Input Flags
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;

        // Roll Vars
        this.isLeaningLeft = false;
        this.isLeaningRight = false;
        this.currentRoll = 0;

        this.isRunning = false;
        this.canJump = false;

        // Helper Vectors
        this.vecDir = new THREE.Vector3();
        this.vecRight = new THREE.Vector3();

        // Raycaster Collision
        this.raycaster = new THREE.Raycaster();
        // Kita set 'far' sedikit lebih jauh dari padding agar deteksi akurat
        this.raycaster.far = this.collisionPadding * 1.5;

        this._setupInputs();
    }

    _setupInputs() {
        const onKeyDown = (event) => {
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

                case 'KeyQ':
                    this.moveDown = true;
                    this.isLeaningLeft = true;
                    break;
                case 'KeyE':
                    this.moveUp = true;
                    this.isLeaningRight = true;
                    break;

                case 'Space':
                    if (this.canJump && this.activeMode === 'FPS') {
                        this.velocity.y += this.jumpForce;
                        this.canJump = false;
                    }
                    break;

                case 'KeyF':
                    // Panggil fungsi toggle di LightingManager lewat World
                    if (this.world.lightingManager) {
                        this.world.lightingManager.toggleFlashlight();
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
                case 'KeyQ':
                    this.moveDown = false;
                    this.isLeaningLeft = false;
                    break;
                case 'KeyE':
                    this.moveUp = false;
                    this.isLeaningRight = false;
                    break;
            }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
    }

    _resetInputs() {
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        this.isLeaningLeft = false;
        this.isLeaningRight = false;
        this.velocity.set(0, 0, 0);
    }

    setMode(mode) {
        this._resetInputs();

        if (mode === 'FPS') {
            this.activeMode = 'FPS';
            this.orbitControls.enabled = false;

            if (document.activeElement) document.activeElement.blur();
            document.body.focus();

            const currentCamPos = new THREE.Vector3();
            this.camera.getWorldPosition(currentCamPos);

            this.cameraRig.position.copy(currentCamPos);
            this.cameraShakeGroup.add(this.camera);

            this.camera.position.set(0, 0, 0);
            this.camera.rotation.set(0, 0, 0);

            this.fpsControls.lock();

        } else if (mode === 'ORBIT') {
            this.activeMode = 'ORBIT';
            this.fpsControls.unlock();

            if (document.activeElement) document.activeElement.blur();
            document.body.focus();

            const globalPos = new THREE.Vector3();
            const globalQuat = new THREE.Quaternion();
            this.camera.getWorldPosition(globalPos);
            this.camera.getWorldQuaternion(globalQuat);

            this.scene.add(this.camera);

            this.camera.position.copy(globalPos);
            this.camera.quaternion.copy(globalQuat);

            this.cameraShakeGroup.rotation.z = 0;
            this.camera.rotation.z = 0;

            const forward = new THREE.Vector3(0, 0, -100).applyQuaternion(this.camera.quaternion);
            this.orbitControls.target.copy(this.camera.position).add(forward);

            this.orbitControls.enabled = true;
            this.orbitControls.update();
        }
    }

    _checkWallCollision(directionVec) {
        // --- STEP 0: FILTER DIHAPUS (OPTIMASI) ---
        // Kita tidak lagi memfilter array objek setiap frame.

        // --- TAHAP 1: SAFETY BUBBLE (OPTIMIZED) ---
        // Gunakan 'copy' dan 'add' ke variabel temp, BUKAN clone()

        const monsterRadiusSq = 14400.0; // 120^2 (Hitung manual biar hemat CPU)

        // Hitung posisi masa depan tanpa bikin objek baru (new Vector3)
        this.tempPredictionStep.copy(directionVec).multiplyScalar(10.0);
        this.tempNextPos.copy(this.cameraRig.position).add(this.tempPredictionStep);

        // Kita tidak pakai Set() lagi untuk cek ganda, cukup cek langsung
        // karena jumlah monster biasanya sedikit.

        const allObjects = this.state.allSelectableObjects;

        for (let i = 0; i < allObjects.length; i++) {
            const obj = allObjects[i];

            // Cek cepat apakah ini punya potensi jadi monster (punya parent)
            let parent = obj.parent;
            while (parent && parent.type !== 'Scene') {
                if (parent.userData && parent.userData.isMonster) {

                    // Cek visibilitas (Optimasi: Jangan hitung jarak kalau hantu invisible)
                    if (parent.visible) {
                        const playerPos = this.cameraRig.position;

                        // Hitung Jarak Sekarang (Tanpa objek baru)
                        const dx = playerPos.x - parent.position.x;
                        const dz = playerPos.z - parent.position.z;
                        const currentDistSq = dx * dx + dz * dz;

                        // Hitung Jarak Masa Depan (Tanpa objek baru)
                        const ndx = this.tempNextPos.x - parent.position.x;
                        const ndz = this.tempNextPos.z - parent.position.z;
                        const nextDistSq = ndx * ndx + ndz * ndz;

                        // Logika Jebakan: Hanya blokir jika mendekat ke zona bahaya
                        if (nextDistSq < monsterRadiusSq && nextDistSq < currentDistSq) {
                            return true;
                        }
                    }
                    break; // Sudah ketemu parent monster, lanjut objek berikutnya
                }
                parent = parent.parent;
            }
        }

        // --- TAHAP 2: CEK RAYCASTER (OPTIMIZED) ---
        const rayOffsets = [
            this.playerHeight * 0.2,
            this.playerHeight * 0.6,
            this.playerHeight * 0.9
        ];

        this.raycaster.firstHitOnly = true;

        for (let i = 0; i < rayOffsets.length; i++) {
            const offset = rayOffsets[i];

            // Recycle variabel tempRayOrigin
            this.tempRayOrigin.copy(this.cameraRig.position);
            this.tempRayOrigin.y += offset;

            this.raycaster.set(this.tempRayOrigin, directionVec);

            if (i === 1 && this.showDebugArrow && this.debugArrow) {
                this.debugArrow.position.copy(this.tempRayOrigin);
                this.debugArrow.setDirection(directionVec);
            }

            // Tembak langsung ke array utama
            const intersects = this.raycaster.intersectObjects(this.state.allSelectableObjects, true);
            
            for (const hit of intersects) {
                if (hit.distance > this.collisionPadding) continue;

                let obj = hit.object;

                // Safety Loop Traversal (Tanpa alokasi memori)
                let depth = 0;
                const maxDepth = 50;
                let isMonsterFound = false;
                let isMonsterVisible = false;
                let isObjectVisible = true;

                let checkObj = obj;
                while (checkObj) {
                    depth++;
                    if (depth > maxDepth) break;

                    if (checkObj.visible === false) {
                        isObjectVisible = false;
                        break;
                    }

                    if (checkObj.userData?.isMonster) {
                        isMonsterFound = true;
                        isMonsterVisible = checkObj.visible;
                    }

                    if (checkObj.type === 'Scene') break;
                    checkObj = checkObj.parent;
                }

                if (!isObjectVisible) continue;

                if (isMonsterFound) {
                    if (isMonsterVisible) return true;
                    else continue;
                }

                // Default Tembok
                return true;
            }
        }

        this.raycaster.firstHitOnly = false;
        return false;
    }

    update(delta) {
        if (!delta || delta > 0.1) delta = 0.016;

        if (this.activeMode === 'ORBIT') {
            this.orbitControls.update();

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

            // --- ROLL / MIRING CONTINUOUS (TETAP SAMA) ---
            const spinSpeed = 2.0;
            if (this.isLeaningLeft) {
                this.currentRoll += spinSpeed * delta;
            }
            else if (this.isLeaningRight) {
                this.currentRoll -= spinSpeed * delta;
            }
            this.cameraShakeGroup.rotation.z = this.currentRoll;

            // --- FPS MOVEMENT + SMOOTH DAMPING + COLLISION ---

            // 1. Hitung Kecepatan Maksimum
            const maxSpeed = this.fpsMoveSpeed * (this.isRunning ? this.runMultiplier : 1.0);

            // 2. Ambil Arah (Pakai Temp Variable biar Hemat Memori/Tidak Stutter)
            this.camera.getWorldDirection(this.tempVec1);
            this.tempVec1.y = 0;
            this.tempVec1.normalize();

            // Hitung Kanan (Cross Product)
            this.tempVec2.crossVectors(this.tempVec1, new THREE.Vector3(0, 1, 0)).normalize();

            // 3. Hitung Target Velocity (Keinginan Player)
            const targetVelocity = new THREE.Vector3(0, 0, 0); // Vector lokal sementara

            // Akumulasi Input
            if (this.moveForward) targetVelocity.add(this.tempVec1);
            if (this.moveBackward) targetVelocity.sub(this.tempVec1);
            if (this.moveRight) targetVelocity.add(this.tempVec2);
            if (this.moveLeft) targetVelocity.sub(this.tempVec2);

            // Normalize & Apply Speed
            if (targetVelocity.lengthSq() > 0) {
                targetVelocity.normalize().multiplyScalar(maxSpeed);
            }

            // 4. TIME-CORRECTED DAMPING (Inilah Kunci Gerakan Halus)
            // Menggantikan Direct Translation. 
            // currentMoveVelocity akan mengejar targetVelocity secara eksponensial.
            const dampFactor = 15.0; // Ubah angka ini: 10.0 (Licin) - 25.0 (Responsif)
            const alpha = 1 - Math.exp(-dampFactor * delta);

            this.currentMoveVelocity.x += (targetVelocity.x - this.currentMoveVelocity.x) * alpha;
            this.currentMoveVelocity.z += (targetVelocity.z - this.currentMoveVelocity.z) * alpha;

            // 5. Aplikasikan Gerakan (Dengan Cek Collision)
            // Kita gunakan hasil damping (currentMoveVelocity) untuk menggerakkan rig
            const frameMove = this.currentMoveVelocity.clone().multiplyScalar(delta);

            // Cek Collision hanya jika ada pergerakan signifikan
            if (frameMove.lengthSq() > 0.000001) {
                const moveDir = frameMove.clone().normalize();

                // Gunakan fungsi collision yang sudah dioptimasi
                if (!this._checkWallCollision(moveDir)) {
                    this.cameraRig.position.add(frameMove);
                } else {
                    // Jika nabrak, hentikan momentum agar tidak 'tembus' atau 'lengket'
                    this.currentMoveVelocity.set(0, 0, 0);
                }
            }

            // 6. GRAVITASI (TETAP SAMA)
            this.velocity.y -= this.gravity * delta;
            this.cameraRig.position.y += this.velocity.y * delta;

            if (this.cameraRig.position.y < this.playerHeight) {
                this.velocity.y = 0;
                this.cameraRig.position.y = this.playerHeight;
                this.canJump = true;
            }
        }
    }
}