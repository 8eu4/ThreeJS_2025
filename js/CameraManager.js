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
        // --- STEP 0: FILTER OBJEK (OPTIMASI PERFORMA) ---
        // Kita hanya ingin menembak laser ke objek yang:
        // 1. VISIBLE (Terlihat)
        // 2. Atau TEMBOK (checkCollision = true)
        // Ini mencegah laser menghitung tabrakan dengan 'hantu invisible' yang bikin berat.

        const activeObstacles = this.state.allSelectableObjects.filter(obj => {
            // Cek visibility diri sendiri
            if (obj.visible === false) return false;

            // Cek visibility bapaknya (karena Mesh hantu terlihat, tapi Group-nya invisible)
            // Kita cek parents sampai ketemu Scene
            let parent = obj.parent;
            while (parent && parent.type !== 'Scene') {
                if (parent.visible === false) return false;
                parent = parent.parent;
            }

            return true;
        });

        // ------------------------------------------------------------------

        // --- TAHAP 1: SAFETY BUBBLE (SAMA SEPERTI SEBELUMNYA) ---
        // ... (Kode Bubble Check TIDAK PERLU DIUBAH, biarkan apa adanya) ...
        const playerPos = this.cameraRig.position;
        const monsterRadius = 120.0;
        const monsterRadiusSq = monsterRadius * monsterRadius;
        const predictionStep = directionVec.clone().multiplyScalar(10.0);
        const nextPos = playerPos.clone().add(predictionStep);
        const checkedMonsters = new Set();
        for (const obj of this.state.allSelectableObjects) { // Tetap cek all objects utk bubble
            // ... (Isi logika bubble biarkan sama) ...
            let parent = obj.parent;
            while (parent && parent.type !== 'Scene') {
                if (parent.userData && parent.userData.isMonster) {
                    if (!checkedMonsters.has(parent.uuid)) {
                        checkedMonsters.add(parent.uuid);
                        if (parent.visible) { // Cek visible penting disini
                            const dx = playerPos.x - parent.position.x;
                            const dz = playerPos.z - parent.position.z;
                            const currentDistSq = dx * dx + dz * dz;
                            const ndx = nextPos.x - parent.position.x;
                            const ndz = nextPos.z - parent.position.z;
                            const nextDistSq = ndx * ndx + ndz * ndz;
                            if (nextDistSq < monsterRadiusSq && nextDistSq < currentDistSq) {
                                return true;
                            }
                        }
                    }
                    break;
                }
                parent = parent.parent;
            }
        }

        // --- TAHAP 2: CEK RAYCASTER (LASER) ---
        const rayOffsets = [
            this.playerHeight * 0.2,
            this.playerHeight * 0.6,
            this.playerHeight * 0.9
        ];

        for (let i = 0; i < rayOffsets.length; i++) {
            const offset = rayOffsets[i];
            const rayOrigin = this.cameraRig.position.clone();
            rayOrigin.y += offset;
            this.raycaster.set(rayOrigin, directionVec);

            if (i === 1 && this.showDebugArrow && this.debugArrow) {
                this.debugArrow.position.copy(rayOrigin);
                this.debugArrow.setDirection(directionVec);
            }

            // PERUBAHAN DI SINI:
            // Gunakan 'activeObstacles' (hasil filter), BUKAN 'allSelectableObjects'
            const intersects = this.raycaster.intersectObjects(activeObstacles, true);

            for (const hit of intersects) {
                if (hit.distance > this.collisionPadding) continue;

                let obj = hit.object;
                let depth = 0;
                const maxDepth = 50;
                let isMonsterFound = false;

                while (obj) {
                    depth++;
                    if (depth > maxDepth) break;

                    if (obj.userData && obj.userData.isMonster) {
                        break;
                    }
                    if (obj.userData && obj.userData.checkCollision) {
                        return true;
                    }
                    if (obj.type === 'Scene') break;
                    obj = obj.parent;
                }

                // Default: Tabrak
                if (!obj || !obj.userData || !obj.userData.isMonster) {
                    return true;
                }
            }
        }
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

            // --- ROLL / MIRING CONTINUOUS ---
            const spinSpeed = 2.0;
            if (this.isLeaningLeft) {
                this.currentRoll += spinSpeed * delta;
            }
            else if (this.isLeaningRight) {
                this.currentRoll -= spinSpeed * delta;
            }
            this.cameraShakeGroup.rotation.z = this.currentRoll;

            // --- FPS MOVEMENT + COLLISION ---
            const speed = this.fpsMoveSpeed * delta * (this.isRunning ? this.runMultiplier : 1.0);

            // 1. Ambil Arah
            this.camera.getWorldDirection(this.vecDir);
            this.vecDir.y = 0;
            this.vecDir.normalize();
            this.vecRight.crossVectors(this.vecDir, new THREE.Vector3(0, 1, 0)).normalize();

            // 2. Cek & Gerak MAJU / MUNDUR
            if (this.moveForward) {
                // Cek tabrakan ke arah depan (vecDir)
                if (!this._checkWallCollision(this.vecDir)) {
                    this.cameraRig.position.addScaledVector(this.vecDir, speed);
                }
            }
            if (this.moveBackward) {
                // Cek tabrakan ke arah belakang (negate vecDir)
                const backDir = this.vecDir.clone().negate();
                if (!this._checkWallCollision(backDir)) {
                    this.cameraRig.position.addScaledVector(this.vecDir, -speed);
                }
            }

            // 3. Cek & Gerak KANAN / KIRI
            if (this.moveRight) {
                // Cek tabrakan ke kanan
                if (!this._checkWallCollision(this.vecRight)) {
                    this.cameraRig.position.addScaledVector(this.vecRight, speed);
                }
            }
            if (this.moveLeft) {
                // Cek tabrakan ke kiri
                const leftDir = this.vecRight.clone().negate();
                if (!this._checkWallCollision(leftDir)) {
                    this.cameraRig.position.addScaledVector(this.vecRight, -speed);
                }
            }

            // 4. GRAVITASI
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