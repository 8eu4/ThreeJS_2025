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
        this.camera.rotation.order = 'YXZ';

        this.scene = world.scene;
        this.domElement = world.renderer.domElement;

        // NOTE --- KONFIGURASI SKALA ---
        this.orbitMoveSpeed = 40.0;

        this.playerHeight = 8.0;
        this.fpsMoveSpeed = 10.0;
        this.runMultiplier = 2.0;
        this.gravity = 15.0;
        this.jumpForce = 20.0;
        this.collisionPadding = 0.5; // NOTE gemuk kurusnya
        this.stepHeight = 0.5;

        // --- SETUP RIG ---
        this.cameraRig = new THREE.Group();
        this.cameraRig.name = "CameraRig_PlayerBody";

        this.cameraShakeGroup = new THREE.Group();
        this.cameraShakeGroup.name = "CameraShakeGroup";

        this.scene.add(this.cameraRig);
        this.cameraRig.add(this.cameraShakeGroup);

        this._createDebugBody();

        // --- CONTROLS ---
        this.activeMode = 'ORBIT';

        this.scene.add(this.camera);

        // A. ORBIT
        this.orbitControls = new OrbitControls(this.camera, this.domElement);
        this.orbitControls.enabled = true;
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.1;
        this.orbitControls.screenSpacePanning = true;

        this.camera.updateMatrixWorld(); // Pastikan posisi kamera terupdate
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        this.orbitControls.target.copy(this.camera.position).add(forward.multiplyScalar(1.0));
        this.orbitControls.update();

        // B. FPS
        this.fpsControls = new PointerLockControls(this.camera, this.domElement);

        document.addEventListener('click', (event) => {
            if (this.activeMode === 'FPS' && !this.fpsControls.isLocked) {
                // Pastikan bukan klik tombol UI
                if (event.target === this.domElement) {
                    this.fpsControls.lock();
                }
            }
        });

        // --- PHYSICS VARS ---
        this.velocity = new THREE.Vector3();
        this.currentMoveVelocity = new THREE.Vector3(0, 0, 0); // Velocity Horizontal (X/Z)

        // Input Flags
        this._resetInputs();

        // Roll Vars
        this.isLeaningLeft = false;
        this.isLeaningRight = false;
        this.currentRoll = 0;

        this.isRunning = false;
        this.canJump = false;
        this.isJumping = false;

        // Helper Vectors
        this.vecDir = new THREE.Vector3();
        this.vecRight = new THREE.Vector3();

        // Raycaster Collision
        this.raycaster = new THREE.Raycaster();
        // Kita set 'far' sedikit lebih jauh dari padding agar deteksi akurat
        this.raycaster.far = this.collisionPadding * 1.5;

        this._setupInputs();
    }
    _createDebugBody() {
        const old = this.cameraRig.getObjectByName("Debug_Player_Cylinder");
        if (old) this.cameraRig.remove(old);

        const geometry = new THREE.CylinderGeometry(
            this.collisionPadding,
            this.collisionPadding,
            this.playerHeight,
            16
        );

        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5,
            depthTest: false // False agar terlihat tembus tembok (X-Ray) biar gampang debug
        });

        this.debugMesh = new THREE.Mesh(geometry, material);
        this.debugMesh.name = "Debug_Player_Cylinder";

        // [PERBAIKAN POSISI]
        // Karena cameraRig ada di KEPALA (Mata), maka badan harus turun ke BAWAH (Negative Y)
        // Pusat cylinder ada di tengah tingginya.
        // Jadi y = - (tinggi / 2)
        this.debugMesh.position.y = -(this.playerHeight / 2);

        this.cameraRig.add(this.debugMesh);
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
                        // 1. Dorong ke atas
                        this.velocity.y = this.jumpForce;

                        // 2. Beritahu sistem kita sedang LOMPAT (Snap dilarang aktif)
                        this.isJumping = true;

                        // 3. Matikan izin lompat double
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
                case 'KeyC':
                    // Panggil fungsi toggle di StoryManager (lewat World)
                    if (this.world.storyManager) {
                        this.world.storyManager.toggleEyes(0.5); // Durasi 0.5 detik
                    }
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

        this.camera.updateMatrixWorld();
        const globalPos = new THREE.Vector3();
        const globalQuat = new THREE.Quaternion();
        this.camera.getWorldPosition(globalPos);
        this.camera.getWorldQuaternion(globalQuat);

        if (mode === 'FPS') {
            this.activeMode = 'FPS';
            this.orbitControls.enabled = false;

            if (this.world.transformControls) {
                this.world.transformControls.detach(); // Lepas dari objek apapun
                this.world.transformControls.visible = true; // Sembunyikan
                this.world.transformControls.enabled = true; // Matikan logicnya
            }


            if (document.activeElement) document.activeElement.blur();
            document.body.focus();

            // 1. Pindahkan Rig ke posisi kamera terakhir
            this.cameraRig.position.copy(globalPos);

            // 2. Attach kamera ke dalam Rig
            this.cameraShakeGroup.add(this.camera);
            this.camera.position.set(0, 0, 0); // Reset posisi lokal (nempel di mata)

            // 3. [FIX 2] Konversi Rotasi agar tidak Reset
            // Kita pisahkan rotasi: Badan (Y) dan Kepala (X)
            const euler = new THREE.Euler(0, 0, 0, 'YXZ');
            euler.setFromQuaternion(globalQuat);

            this.cameraRig.rotation.y = euler.y; // Badan menghadap arah kompas yang sama
            this.camera.rotation.x = euler.x;    // Kepala mendongak/menunduk sesuai sudut terakhir
            this.camera.rotation.y = 0;          // Reset Y kamera lokal (karena sudah di handle Rig)
            this.camera.rotation.z = 0;          // Reset Z (Roll)

            this.fpsControls.lock();

        } else if (mode === 'ORBIT') {
            this.activeMode = 'ORBIT';
            this.fpsControls.unlock();

            if (this.world.transformControls) {
                this.world.transformControls.detach(); // Lepas dari objek apapun
                this.world.transformControls.visible = false; // Sembunyikan
                this.world.transformControls.enabled = false; // Matikan logicnya
            }


            if (document.activeElement) document.activeElement.blur();
            document.body.focus();

            // 1. Detach kamera dari Rig, kembalikan ke Scene global
            this.scene.add(this.camera);

            // 2. Set Posisi & Rotasi Global agar mulus (sama persis sebelum pindah)
            this.camera.position.copy(globalPos);
            this.camera.quaternion.copy(globalQuat);

            // Reset efek miring (Roll)
            this.cameraShakeGroup.rotation.z = 0;
            this.camera.rotation.z = 0;

            // 3. [FIX 3] Atur Target Orbit di depan kamera
            // Agar saat diputar, pivotnya ada di depan mata (seperti FPS view), bukan 0,0,0
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            this.orbitControls.target.copy(this.camera.position).add(forward);

            this.orbitControls.enabled = true;
            this.orbitControls.update();
        }
    }

    _isValidCollider(obj) {
        if (!obj.visible) return false;

        // 1. GIZMO CHECK: Kalau cuma Garis/Titik, pasti Tembus
        if (obj.isLine || obj.isLineSegments || obj.isPoints) return false;

        // 2. PARENT CHECK: Cek silsilah keluarga
        let curr = obj;
        while (curr) {
            if (curr.type === 'Scene') break;

            const name = (curr.name || "").toLowerCase();
            const type = (curr.type || "");

            // DAFTAR BLACKLIST (TEMBUS)
            if (name.includes("gizmo")) return false;
            if (name.includes("helper")) return false;
            if (name.includes("debug")) return false;
            if (name.includes("transformcontrols")) return false;
            if (type.includes("Controls")) return false;
            if (type.includes("Helper")) return false;
            if (curr.userData && curr.userData.isWaypoint) return false;

            curr = curr.parent;
        }

        // 3. MATERIAL CHECK
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                if (obj.material.every(m => !m.visible || m.wireframe)) return false;
            } else {
                if (!obj.material.visible || obj.material.wireframe) return false;
            }
        }

        return true;
    }

    _checkWallCollision(directionVec) {
        // --- 1. CEK MONSTER (Tetap sama) ---
        const monsterRadiusSq = 40.0;
        this.tempPredictionStep.copy(directionVec).multiplyScalar(5.0);
        this.tempNextPos.copy(this.cameraRig.position).add(this.tempPredictionStep);
        const allObjects = this.state.allSelectableObjects;

        for (let i = 0; i < allObjects.length; i++) {
            const obj = allObjects[i];
            let parent = obj;
            let isMonster = false;
            while (parent && parent.type !== 'Scene') {
                if (parent.userData && parent.userData.isMonster) {
                    isMonster = true;
                    if (!parent.visible) isMonster = false;
                    break;
                }
                parent = parent.parent;
            }
            if (isMonster) {
                const dx = this.cameraRig.position.x - parent.position.x;
                const dz = this.cameraRig.position.z - parent.position.z;
                const currentDistSq = dx * dx + dz * dz;
                const ndx = this.tempNextPos.x - parent.position.x;
                const ndz = this.tempNextPos.z - parent.position.z;
                const nextDistSq = ndx * ndx + ndz * ndz;
                if (nextDistSq < monsterRadiusSq && nextDistSq < currentDistSq) return true;
            }
        }

        // --- 2. CEK TEMBOK (5 LASER) ---
        const rayOffsets = [
            -this.playerHeight * 0.1, // Mata
            -this.playerHeight * 0.3, // Leher
            -this.playerHeight * 0.5, // Dada/Pinggang
            -this.playerHeight * 0.7, // Paha
            -this.playerHeight * 0.9  // Lutut
        ];

        this.raycaster.firstHitOnly = true;
        this.raycaster.far = this.collisionPadding * 1.5;

        for (let i = 0; i < rayOffsets.length; i++) {
            const offset = rayOffsets[i];
            this.tempRayOrigin.copy(this.cameraRig.position);
            this.tempRayOrigin.y += offset;

            this.raycaster.set(this.tempRayOrigin, directionVec);

            // Cek ke seluruh anak Scene
            const intersects = this.raycaster.intersectObjects(this.scene.children, true);

            for (const hit of intersects) {
                if (hit.distance > this.collisionPadding) continue;

                if (!this._isValidCollider(hit.object)) continue;

                // Cek Face agar tidak nabrak garis aneh
                if (!hit.face) continue;

                return true; // TABRAK
            }
        }
        return false;
    }

    _checkFloorCollision(delta) {
        this.raycaster.set(this.cameraRig.position, new THREE.Vector3(0, -1, 0));
        const checkDistance = this.playerHeight + 10.0;
        this.raycaster.far = checkDistance;

        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        let groundY = -99999;
        let foundGround = false;
        const currentFootY = this.cameraRig.position.y - this.playerHeight;

        for (const hit of intersects) {
            if (!this._isValidCollider(hit.object)) continue;
            if (!hit.face) continue;
            if (hit.face.normal.y < 0.5) continue; // Abaikan dinding vertikal

            const heightDiff = hit.point.y - currentFootY;
            // Toleransi step (tangga)
            if (heightDiff > this.stepHeight) continue;

            groundY = hit.point.y;
            foundGround = true;
            break;
        }

        // --- UPDATE GRAVITASI ---
        this.velocity.y -= this.gravity * delta;
        this.cameraRig.position.y += this.velocity.y * delta;

        // --- LOGIKA RESET JUMPING ---
        // Jika velocity negatif (sedang jatuh), berarti fase naik sudah selesai.
        // Kita matikan flag jumping agar fitur Snap boleh bekerja lagi saat mendarat nanti.
        if (this.velocity.y < 0) {
            this.isJumping = false;
        }

        // --- SNAP LOGIC ---
        if (foundGround) {
            const feetLevel = this.cameraRig.position.y - this.playerHeight;
            const snapThreshold = 0.5; // Jarak toleransi magnet

            // SYARAT SNAP (MENDARAT):
            // 1. Kaki ada di dalam range toleransi lantai (feetLevel <= groundY + snapThreshold)
            // 2. Kita TIDAK sedang dalam fase lompat naik (!this.isJumping)
            // 3. Kita sedang jatuh atau diam (this.velocity.y <= 0)

            if (feetLevel <= groundY + snapThreshold && !this.isJumping && this.velocity.y <= 0) {
                // Lakukan Snap (Teleport pas ke lantai)
                this.cameraRig.position.y = groundY + this.playerHeight;
                this.velocity.y = 0;
                this.canJump = true;
            }
            // Jika foundGround tapi velocity masih kencang (jatuh dari tinggi) atau sedang lompat,
            // biarkan gravitasi yang menangani, jangan di-snap paksa.
        } else {
            // Void Safety (Jatuh ke jurang)
            if (this.cameraRig.position.y < -500) {
                this.cameraRig.position.y = 50;
                this.velocity.y = 0;
            }
            this.canJump = false;
        }
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

            // 6. GRAVITASI 
            this.velocity.y -= this.gravity * delta;
            this.cameraRig.position.y += this.velocity.y * delta;

            if (this.cameraRig.position.y < this.playerHeight) {
                this.velocity.y = 0;
                this.cameraRig.position.y = this.playerHeight;
                this.canJump = true;
            }

            this._checkFloorCollision(delta);
        }
    }
}