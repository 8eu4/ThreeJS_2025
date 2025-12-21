// js/LightingManager.js
import * as THREE from 'three';

export class LightingManager {
    constructor(world, cameraManager, stateManager) {
        this.world = world;
        this.scene = world.scene;
        this.camera = cameraManager.camera;
        this.stateManager = stateManager;

        this.lights = {};
        this.pendingLinkedLights = [];

        this._setupGlobalLights();
        this._setupFlashlight();
        this._setupRoomLights();
    }

    _setupGlobalLights() {
        // 1. Ambient

        // MODE HORROR (Gelap):
        const ambientColor = 0x050510; // Biru Tua Gelap
        const ambientIntensity = 0.6;

        // MODE DEVELOPMENT (Terang Benderang - Pakai ini kalau mau ngedit):
        // const ambientColor = 0xffffff; // Putih
        // const ambientIntensity = 1.0;
        const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
        ambient.name = "Ambient Light";
        this.scene.add(ambient);
        this.lights['global_ambient'] = ambient;

        if (this.stateManager) this.stateManager.addObject(ambient, { isSelectable: true });

        // 2. Moonlight
        const moonLight = new THREE.DirectionalLight(0x4444aa, 0.5);
        moonLight.position.set(100, 200, 100);
        moonLight.castShadow = false;
        moonLight.shadow.camera.left = -100;
        moonLight.shadow.camera.right = 100;
        moonLight.shadow.camera.top = 100;
        moonLight.shadow.camera.bottom = -100;
        moonLight.shadow.mapSize.width = 512;
        moonLight.shadow.mapSize.height = 512;

        moonLight.shadow.bias = -0.0005;
        moonLight.shadow.normalBias = 0.05;

        this.scene.add(moonLight);
        this.lights['global_moon'] = moonLight;

        const dirHelper = new THREE.DirectionalLightHelper(moonLight, 200);
        this.scene.add(dirHelper);
        dirHelper.light = moonLight; // Bind helper ke light

        if (this.stateManager) this.stateManager.addObject(moonLight, { isSelectable: true });
    }

    _setupFlashlight() {
        const flashLight = new THREE.SpotLight(0xfffdd0);
        flashLight.name = "Player Flashlight";
        flashLight.angle = Math.PI / 5;
        flashLight.penumbra = 0.99;
        flashLight.decay = 2;
        flashLight.distance = 100;
        flashLight.castShadow = true;

        flashLight.shadow.mapSize.width = 512;
        flashLight.shadow.mapSize.height = 512;

        flashLight.shadow.bias = -0.0001;
        flashLight.shadow.normalBias = 0.1;

        flashLight.shadow.camera.near = 0.001;
        flashLight.shadow.camera.far = 100;

        flashLight.position.set(0, 0, 0);
        flashLight.target.position.set(0, 0, -15);

        const bounceLight = new THREE.PointLight(0xfffdd0, 0, 15);
        bounceLight.name = "Flashlight_Bounce";

        this.camera.add(flashLight);
        this.camera.add(flashLight.target);
        this.camera.add(bounceLight);

        // this.lights['player_flashlight'] = flashLight;
        // flashLight.visible = false;

        this.lights['player_flashlight'] = flashLight;
        this.lights['flashlight_bounce'] = bounceLight;
        flashLight.visible = true;
        flashLight.intensity = 0; // Mati (Gelap)
    }

    toggleFlashlight() {
        const flashlight = this.lights['player_flashlight'];
        const bounce = this.lights['flashlight_bounce'];
        if (flashlight) {
            if (flashlight.intensity > 0) {
                flashlight.intensity = 0; // OFF
                bounce.intensity = 0;
            } else {
                flashlight.intensity = 100; // ON
                bounce.intensity = 5;
            }
        }
    }
    toggleFlashlight(isOn) {
        const flashlight = this.lights['player_flashlight'];
        const bounce = this.lights['flashlight_bounce'];
        if (isOn) {
            if (flashlight.intensity > 0) {
                flashlight.intensity = 0; // OFF
                bounce.intensity = 0;
            } else {
                flashlight.intensity = 100; // ON
                bounce.intensity = 5;
            }
        }
    }

    _setupRoomLights() {
        this._createSpotLight(
            'default',   // ID
            new THREE.Vector3(0, 20, -20),   // start
            new THREE.Vector3(0, 20, 15), // end
            "#FFFFFF",          // Warna
            2000,              // Intensitas
            50,               // Distance
            Math.PI / 4,       // Angle 
            0.5,                // Penumbra 
            true
        );


        // --- POINT LIGHTS (BOLA) ---
        this._createPointLight('light_Bedroom_1', "BedroomLight1", new THREE.Vector3(0, 0, 0), 0xffaa00, 40);
        this._createPointLight('light_Bedroom_2', "BedroomLight2", new THREE.Vector3(0, 0, 0), 0xffaa00, 40);
        this._createPointLight('light_Bedroom_3', "BedroomLight3", new THREE.Vector3(0, 0, 0), 0xffaa00, 40);
        this._createPointLight('light_Bedroom_4', "BedroomLight4", new THREE.Vector3(0, 0, 0), 0xffaa00, 40);
        this._createPointLight('light_Bedroom_5', "BedroomLight5", new THREE.Vector3(0, 0, 0), 0xffaa00, 40);
        this._createPointLight('light_Bedroom_6', "BedroomLight6", new THREE.Vector3(0, 0, 0), 0xffaa00, 40);
        this._createPointLight('light_Bedroom_7', "BedroomLight7", new THREE.Vector3(0, 0, 0), 0xffaa00, 40);


        this._createPointLight('light_kitchen_1', "KitchenLight1", new THREE.Vector3(0, 0, 0), 0xe6dfd8ff, 80);
        this._createPointLight('light_kitchen_2', "KitchenLight2", new THREE.Vector3(0, 0, 0), 0xe6dfd8ff, 80);

        // --- CORRIDOR LIGHTS ---
        // this._createPointLight('light_corridor_1', "CorridorLight1", new THREE.Vector3(0, 0, 0), 0xffaa00, 20);
        this._createPointLight('light_corridor_2', "CorridorLight2", new THREE.Vector3(0, 0, 0), 0xffaa00, 40);
        // this._createPointLight('light_corridor_3', "CorridorLight3", new THREE.Vector3(0, 0, 0), 0xffaa00, 20);
        // this._createPointLight('light_corridor_4', "CorridorLight4", new THREE.Vector3(0, 0, 0), 0xffaa00, 20);
        // this._createPointLight('light_corridor_5', "CorridorLight5", new THREE.Vector3(0, 0, 0), 0xffaa00, 20);
        // this._createPointLight('light_corridor_6', "CorridorLight6", new THREE.Vector3(0, 0, 0), 0xffaa00, 20);
        // this._createPointLight('light_corridor_7', "CorridorLight7", new THREE.Vector3(0, 0, 0), 0xffaa00, 20);
        // this._createPointLight('light_corridor_8', "CorridorLight8", new THREE.Vector3(0, 0, 0), 0xffaa00, 20);
        // this._createPointLight('light_corridor_9', "CorridorLight9", new THREE.Vector3(0, 0, 0), 0xffaa00, 20);
        // this._createPointLight('light_corridor_10', "CorridorLight10", new THREE.Vector3(0, 0, 0), 0xffaa00, 20);

        // --- LINKED SPOT LIGHT (INI YANG SEBELUMNYA BIKIN ERROR) ---
        // Pastikan fungsi _createLinkedSpotLight ada di bawah!
        this._createSpotLight(
            'light_kitchen_window',   // ID
            new THREE.Vector3(-32, 22, -60),   // start
            new THREE.Vector3(-32, 22, -75), // end
            "#575252",          // Warna
            2200,              // Intensitas
            80,               // Distance
            Math.PI / 2,       // Angle 
            0.1,                // Penumbra 
        );

        this._createSpotLight(
            'light_corridor_window1',   // ID
            new THREE.Vector3(43, 22, -60),   // start
            new THREE.Vector3(43, 22, -85), // end
            "#575252",          // Warna
            3300,              // Intensitas
            120,               // Distance
            Math.PI / 2,       // Angle 
            0.1,                // Penumbra 
        );


        this._createSpotLight(
            'light_corridor_window2',   // ID
            new THREE.Vector3(85, 22, -1),   // start
            new THREE.Vector3(110, 22, -1), // end
            "#575252",          // Warna
            2200,              // Intensitas
            80,               // Distance
            Math.PI / 2,       // Angle 
            0.1,                // Penumbra 
        );

        this._createSpotLight(
            'light_corridor_window3',   // ID
            new THREE.Vector3(85, 22, 29),
            new THREE.Vector3(110, 22, 29),
            "#575252",          // Warna
            2200,              // Intensitas
            120,               // Distance
            Math.PI / 2,       // Angle 
            0.1,                // Penumbra 
        );

        this._createSpotLight(
            'light_corridor_window4',   // ID
            new THREE.Vector3(47, 22, 61),   // start
            new THREE.Vector3(47, 22, 91), // end
            "#575252",          // Warna
            3300,              // Intensitas
            120,               // Distance
            Math.PI / 2,       // Angle 
            0.1,                // Penumbra 
        );



        this.setFlicker('light_corridor_2', true, 0.2, 0.5);
    }

    // =========================================================
    // CREATION FUNCTIONS
    // =========================================================

    // Point Light (Bola nempel Mesh)
    _createPointLight(id, targetMeshName, offsetVector, color, intensity, distance = 25, castShadow = false, helperSize = 1) {
        const light = new THREE.PointLight(color, intensity, distance, 2);
        light.castShadow = castShadow;


        if (castShadow) {
            light.castShadow = true;
            light.shadow.mapSize.width = 128; // Resolusi rendah cukup
            light.shadow.mapSize.height = 128;
            light.shadow.bias = -0.00001;
            light.shadow.normalBias = 0.02;
            light.shadow.camera.near = 0.01;
            light.shadow.camera.far = distance;
        }

        this._setupCommonLightProperties(light, id, intensity);

        // Data khusus linked
        light.userData.targetMeshName = targetMeshName;
        light.userData.offsetVector = offsetVector;
        this.pendingLinkedLights.push(light);

        const helper = new THREE.PointLightHelper(light, helperSize);
        this._setupHelper(light, helper, id, helperSize);
    }

    // Spot Light
    _createSpotLight(id, source, end, color, intensity, distance = 100, angle = Math.PI / 4, penumbra = 0.5, castShadow = false, helperSize = 4) {
        const light = new THREE.SpotLight(color, intensity);
        light.distance = distance;
        light.angle = angle;
        light.penumbra = penumbra;
        light.decay = 2;
        light.castShadow = castShadow || false;

        if (light.castShadow) {
            light.shadow.mapSize.width = 256;
            light.shadow.mapSize.height = 256;

            light.shadow.bias = -0.0001;
            light.shadow.normalBias = 0.02;

            light.shadow.camera.near = 0.5;
            light.shadow.camera.far = distance;
            light.shadow.camera.fov = THREE.MathUtils.radToDeg(angle) * 2;
        }

        // Setup Source (Posisi Lampu)
        if (source instanceof THREE.Vector3) {
            light.position.copy(source);
            this.scene.add(light);
            // Daftarkan Lampu ke UI
            this._setupCommonLightProperties(light, id, intensity);
        }

        // Setup Target (Arah Lampu)
        // [MODIFIED] Membuat Target Fisik agar bisa diklik dan digeser Gizmo
        if (end instanceof THREE.Vector3) {
            // Kita buat dummy mesh untuk target
            const targetGeometry = new THREE.BoxGeometry(2, 2, 2); // Kotak kecil
            const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true, visible: true }); // Wireframe kuning
            const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);

            targetMesh.position.copy(end);
            targetMesh.name = `${id}_Target`;
            this.scene.add(targetMesh);

            // Link Spotlight ke Mesh ini
            light.target = targetMesh;

            // Daftarkan Target ke UI & StateManager
            if (this.stateManager) {
                this.stateManager.addObject(targetMesh, { isSelectable: true, isDraggable: true });
            }
        }

        const helper = new THREE.SpotLightHelper(light);
        light.userData.helper = helper;
        this.scene.add(helper);
    }


    // =========================================================
    // UTILITIES
    // =========================================================

    // Fungsi Internal: Menempelkan Lampu ke Sumber (Source)
    _attachLightToSource(light, source) {
        if (source instanceof THREE.Vector3) {
            // Kasus 1: Source adalah Koordinat (Vektor)
            light.position.copy(source);
            this.scene.add(light); // Masuk ke scene global
        } else if (source.isObject3D) {
            // Kasus 2: Source adalah Objek (Mesh/Group)
            // Lampu menjadi anak dari objek tersebut (ikut gerak/rotasi)
            source.add(light);
            light.position.set(0, 0, 0); // Reset posisi relatif terhadap parent
        }
    }

    // Fungsi Internal: Mengatur Target Lampu (End)
    _setLightTarget(light, targetDef) {
        if (targetDef instanceof THREE.Vector3) {
            // Kasus 1: Target adalah Koordinat Statis
            light.target.position.copy(targetDef);
            this.scene.add(light.target); // Target statis wajib masuk scene
        } else if (targetDef.isObject3D) {
            // Kasus 2: Target adalah Objek Bergerak
            light.target = targetDef; // Three.js otomatis tracking objek ini
        }
        // Update matrix agar perubahan target terbaca
        light.updateMatrixWorld();
    }

    _setupCommonLightProperties(light, id, intensity) {
        light.name = id;
        light.userData.baseIntensity = intensity;
        light.userData.isFlickering = false;
        light.userData.flickerTimer = 0;
        light.userData.flickerInterval = 0.05;
        this.lights[id] = light;

        if (this.stateManager) {
            // isDraggable: true AGAR GIZMO MUNCUL
            this.stateManager.addObject(light, { isSelectable: true, isDraggable: true });
        }
    }

    _setupHelper(light, helper, id, size) {
        helper.name = `${id}_Helper`;
        helper.visible = false;

        // Hitbox agar helper PointLight mudah diklik
        const geom = new THREE.SphereGeometry(size, 4, 4);
        const mat = new THREE.MeshBasicMaterial({ visible: false });
        const hitSphere = new THREE.Mesh(geom, mat);
        hitSphere.name = "Helper_HitBox";
        helper.add(hitSphere); // Masukkan ke dalam helper

        light.userData.helper = helper;
    }

    _addHitSphereToHelper(helper, size) {
        const geom = new THREE.SphereGeometry(size, 3, 3);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        const hitSphere = new THREE.Mesh(geom, mat);
        hitSphere.name = "Helper_HitBox";
        helper.add(hitSphere);
    }

    // =========================================================
    // UPDATE
    // =========================================================

    update(delta) {
        if (this.flashLightHelper) this.flashLightHelper.update();

        // LINKING LOGIC (Dynamic Source & Target Resolution)
        if (this.pendingLinkedLights.length > 0) {
            // Loop mundur agar aman saat splice (hapus array)
            for (let i = this.pendingLinkedLights.length - 1; i >= 0; i--) {
                const light = this.pendingLinkedLights[i];

                // --- KASUS A: DYNAMIC SPOTLIGHT (Punya sourceDef) ---
                if (light.userData.sourceDef !== undefined) {
                    let sourceReady = false;
                    let targetReady = false;
                    let resolvedSource = light.userData.sourceDef;
                    let resolvedTarget = light.userData.targetDef;

                    // 1. RESOLVE SOURCE
                    if (typeof resolvedSource === 'string') {
                        const foundObj = this._findObjectByPrefix(resolvedSource);
                        if (foundObj) {
                            resolvedSource = foundObj;
                            sourceReady = true;
                        }
                    } else {
                        sourceReady = true; // Sudah berupa Vector/Object
                    }

                    // 2. RESOLVE TARGET
                    if (typeof resolvedTarget === 'string') {
                        const foundObj = this._findObjectByPrefix(resolvedTarget);
                        if (foundObj) {
                            resolvedTarget = foundObj;
                            targetReady = true;
                        }
                    } else {
                        targetReady = true; // Sudah berupa Vector/Object atau undefined (jika target tidak wajib)
                    }

                    // 3. JIKA KEDUANYA SIAP -> EKSEKUSI
                    if (sourceReady && targetReady) {
                        console.log(`[Lighting] ✅ Dynamic SpotLight '${light.name}' active!`);

                        // Terapkan Source & Target
                        this._attachLightToSource(light, resolvedSource);
                        this._setLightTarget(light, resolvedTarget);

                        // Aktifkan Helper
                        if (light.userData.helper) {
                            this.scene.add(light.userData.helper);
                            light.userData.helper.update();
                        }

                        // Hapus dari antrian pending
                        this.pendingLinkedLights.splice(i, 1);
                    }
                }

                // --- KASUS B: SIMPLE LINKED POINT LIGHT (Logic Lama - targetMeshName) ---
                else if (light.userData.targetMeshName) {
                    const meshName = light.userData.targetMeshName;
                    const foundMesh = this._findObjectByPrefix(meshName);

                    if (foundMesh) {
                        console.log(`[Lighting] ✅ PointLight '${light.name}' attached to '${foundMesh.name}'`);

                        // Tempelkan lampu ke Mesh
                        foundMesh.add(light);

                        // Set Offset (Posisi relatif terhadap parent mesh)
                        if (light.userData.offsetVector) {
                            light.position.copy(light.userData.offsetVector);
                        } else {
                            light.position.set(0, 0, 0);
                        }

                        // Helper Logic
                        if (light.userData.helper) {
                            // Helper PointLight biasanya perlu update matrix dunia setelah di-attach
                            light.userData.helper.update();
                            // PointLightHelper otomatis ikut scene graph jika parentnya visible,
                            // tapi helpernya sendiri biasanya kita taruh di scene global atau biarkan default threejs behavior.
                            // Di setup Anda sebelumnya, helper sudah di-add di _createPointLight, jadi cukup update.
                        }

                        // Hapus dari antrian pending
                        this.pendingLinkedLights.splice(i, 1);
                    }
                }
            }
        }

        for (const key in this.lights) {
            const light = this.lights[key];

            if (light.target) {
                light.target.updateMatrixWorld(true);

                light.updateMatrixWorld(true);
            }

            if (light.userData.helper) {
                light.userData.helper.update();
            }

            if (light.userData.isStaticSpot && light.userData.staticHelper) {
                light.userData.staticHelper.update();
            }
        }

        // FLICKER LOGIC
        for (const key in this.lights) {
            const light = this.lights[key];
            if (light.userData && light.userData.isFlickering) {
                light.userData.flickerTimer += delta;
                if (light.userData.flickerTimer > light.userData.flickerInterval) {
                    light.userData.flickerTimer -= light.userData.flickerInterval;
                    if (Math.random() > light.userData.glitchChance) {
                        light.intensity = light.userData.baseIntensity * (0.9 + Math.random() * 0.1);
                    } else {
                        light.intensity = light.userData.baseIntensity * (Math.random() * 0.2);
                    }
                }
            }
        }
    }

    setFlicker(lightId, isActive, interval = 0.05, glitchChance = 0.1) {
        if (!isActive) return;

        const light = this.lights[lightId];
        if (light) {
            light.userData.isFlickering = isActive;
            light.userData.flickerInterval = interval;
            light.userData.glitchChance = glitchChance;
            if (!isActive) light.intensity = light.userData.baseIntensity;
        }
    }


    _findObjectByPrefix(nameToFind) {
        let found = undefined;
        this.scene.traverse((child) => {
            if (found) return;
            if (child.name === nameToFind || child.name.startsWith(nameToFind + '.')) {
                found = child;
            }
        });
        return found;
    }
}