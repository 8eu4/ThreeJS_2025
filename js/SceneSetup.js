// js/SceneSetup.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function loadInitialScene(world, state) {
    _createGround(world);
    _createPrimitives(world, state);
    _createLights(world, state);
    _loadModels(world, state);
}

// --- FUNGSI RECENTER (TIDAK BERUBAH) ---
function recenterOrigin(object) {
    const box = new THREE.Box3();
    object.updateWorldMatrix(true, false);

    object.traverse((node) => {
        if (node.isMesh) {
            const meshBox = new THREE.Box3().setFromObject(node);
            meshBox.applyMatrix4(object.matrixWorld.clone().invert());
            box.union(meshBox);
        }
    });

    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());

    object.children.forEach(child => {
        child.position.sub(center);
    });
    object.position.add(center);
}

function recenterMeshOrigin(mesh) {
    if (!mesh.geometry.boundingBox) {
        mesh.geometry.computeBoundingBox();
    }
    const center = mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
    mesh.geometry.translate(-center.x, -center.y, -center.z);
    mesh.position.add(center);
}
// --- AKHIR FUNGSI RECENTER ---


// --- FUNGSI HIERARCHY COLLAPSE (TIDAK BERUBAH) ---
function collapseHierarchy(object) {
    [...object.children].forEach(collapseHierarchy);

    if (object.children.length === 1) {
        const child = object.children[0];

        if ((child.isGroup || child.isScene) && child.children.length > 0) {

            const grandchildren = [...child.children];

            grandchildren.forEach(grandchild => {
                grandchild.matrix.premultiply(child.matrix);
                grandchild.matrix.decompose(grandchild.position, grandchild.quaternion, grandchild.scale);
                object.add(grandchild);
            });

            object.remove(child);
        }
    }
}
// --- AKHIR FUNGSI COLLAPSE ---


// --- Primitif & Lampu (Tidak Berubah) ---
export function _createGround(world) {
    let geometry = new THREE.PlaneGeometry(40, 40);
    let material = new THREE.MeshPhongMaterial({ color: 0x888888, side: THREE.DoubleSide });
    let planeMesh = new THREE.Mesh(geometry, material);
    planeMesh.rotation.x = -Math.PI / 2;
    planeMesh.receiveShadow = true;
    planeMesh.name = "Ground Plane";
    world.add(planeMesh);
}
export function _createPrimitives(world, state) {
    let geometry = new THREE.SphereGeometry(7, 32, 16);
    let material = new THREE.MeshPhongMaterial({ color: '#FA8' });
    const sphereMesh = new THREE.Mesh(geometry, material);
    sphereMesh.position.set(-8, 9, 0);
    sphereMesh.castShadow = true;
    sphereMesh.receiveShadow = true;
    sphereMesh.name = "Sphere";
    world.add(sphereMesh);
    state.addObject(sphereMesh, { isSelectable: true, isDraggable: true });
    geometry = new THREE.BoxGeometry(4, 4, 4);
    material = new THREE.MeshPhongMaterial({ color: '#8AC' });
    const boxMesh = new THREE.Mesh(geometry, material);
    boxMesh.position.set(5, 2, 0);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxMesh.name = "Blue Box";
    world.add(boxMesh);
    state.addObject(boxMesh, { isSelectable: true, isDraggable: true });
}
export function _createLights(world, state) {
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.1);
    ambientLight.name = "Ambient Light";
    world.add(ambientLight);
    state.addObject(ambientLight, { isSelectable: true });
    recenterOrigin(ambientLight);
    const hemiLight = new THREE.HemisphereLight(0xB1E1FF, 0xB97A20, 0.2);
    hemiLight.name = "Hemisphere Light";
    world.add(hemiLight);
    state.addObject(hemiLight, { isSelectable: true });
    recenterOrigin(hemiLight);
    world.add(new THREE.HemisphereLightHelper(hemiLight, 5));
    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    dirLight.position.set(0, 20, 10);
    dirLight.castShadow = true;
    dirLight.name = "Directional Light";
    dirLight.target.name = "Directional Target";
    world.add(dirLight);
    world.add(dirLight.target);
    state.addObject(dirLight, { isSelectable: true, isDraggable: true });
    state.addObject(dirLight.target, { isSelectable: true, isDraggable: true });
    recenterOrigin(dirLight);
    world.add(new THREE.DirectionalLightHelper(dirLight, 5));
    const pointLight = new THREE.PointLight(0xFFFF00, 150, 50);
    pointLight.position.set(-10, 10, 10);
    pointLight.castShadow = true;
    pointLight.name = "Point Light";
    world.add(pointLight);
    state.addObject(pointLight, { isSelectable: true, isDraggable: true });
    recenterOrigin(pointLight);
    world.add(new THREE.PointLightHelper(pointLight, 2));
    const spotLight = new THREE.SpotLight(0xFF0000, 150, 80, THREE.MathUtils.degToRad(35), 0.1);
    spotLight.position.set(-20, 20, 0);
    spotLight.castShadow = true;
    spotLight.name = "Spot Light";
    spotLight.target.name = "Spot Light Target";
    world.add(spotLight);
    world.add(spotLight.target);
    state.addObject(spotLight, { isSelectable: true, isDraggable: true });
    state.addObject(spotLight.target, { isSelectable: true, isDraggable: true });
    recenterOrigin(spotLight);
    world.add(new THREE.SpotLightHelper(spotLight));
}
// --- AKHIR Primitif & Lampu ---


// js/SceneSetup.js

// js/SceneSetup.js

// js/SceneSetup.js

export function _loadModels(world, state) {
    const gltfLoader = new GLTFLoader();

    const modelsToLoad = [
        // --- 1. BEDROOM (PUSAT) ---
        {
            url: './Models/bedroom.glb',
            position: new THREE.Vector3(0, 0, 0),
            scale: new THREE.Vector3(100, 100, 100),
            rotation: new THREE.Euler(0, 0, 0),
            fixOrigin: true, // Bangunan = Fix Origin
            isMonster: false // Bukan Monster
        },
        // --- 2. KITCHEN ---
        {
            url: './Models/kitchen.glb',
            position: new THREE.Vector3(700, 0, -400),
            scale: new THREE.Vector3(1, 1, 1),
            rotation: new THREE.Euler(0, 0, 0),
            fixOrigin: true,
            isMonster: false
        },
        // --- 3. CORRIDOR ---
        {
            url: './Models/horror_corridor_4.glb',
            position: new THREE.Vector3(1700, 0, 400),
            scale: new THREE.Vector3(170, 170, 170),
            rotation: new THREE.Euler(0, -Math.PI / 2, 0),
            fixOrigin: true,
            isMonster: false
        },
        // --- 4. HANTU (ANIMASI) ---
        {
            url: './Models/nightmare_creature_1.glb',
            name: 'Ghost_Corridor', 
            position: new THREE.Vector3(-350, 0, -350),
            scale: new THREE.Vector3(90, 90, 90),
            rotation: new THREE.Euler(0, Math.PI / 2, 0),
            
            animName: 'Creature_armature|walk', 
            visible: true,      
            fixOrigin: false,   // Hantu = Jangan Fix Origin
            isMonster: true     // <--- PENTING: TANDA BAHWA INI MONSTER
        },
        {
            url: './Models/nightmare_creature_1.glb',
            name: 'Ghost_Kitchen_Window', 
            position: new THREE.Vector3(650, 0, -580),
            scale: new THREE.Vector3(80, 80, 80),
            rotation: new THREE.Euler(0, 0, 0),

            animName: 'Creature_armature|roar',
            visible: true,     // Sembunyi
            fixOrigin: false,
            isMonster: true     // <--- TANDA MONSTER
        },
        {
            url: './Models/nightmare_creature_1.glb',
            name: 'Ghost_Kitchen', 
            position: new THREE.Vector3(650, 2, -350),
            scale: new THREE.Vector3(80, 80, 80),
            rotation: new THREE.Euler(0, Math.PI / 2, 0),

            animName: 'Creature_armature|roar', 
            visible: false,     // Sembunyi
            fixOrigin: false,
            isMonster: true     // <--- TANDA MONSTER
        },
        {
            url: './Models/nightmare_creature_1.glb',
            name: 'Ghost_Corridor_Chasing', 
            position: new THREE.Vector3(2480, 20, 20),
            scale: new THREE.Vector3(80, 80, 80),
            rotation: new THREE.Euler(0, 0, 0),

            animName: 'Creature_armature|crawl', 
            visible: false,     // Sembunyi
            fixOrigin: false,
            isMonster: true     // <--- TANDA MONSTER
        },
    ];

    modelsToLoad.forEach(cfg => {
        gltfLoader.load(
            cfg.url,
            (gltf) => {
                const model = gltf.scene;
                const pivotGroup = new THREE.Group();
                
                // Gunakan nama khusus dari config jika ada, jika tidak pakai nama file
                pivotGroup.name = cfg.name || cfg.url.split('/').pop().replace('.glb', '');

                pivotGroup.add(model);
                model.scale.copy(cfg.scale);

                // --- 1. LOGIKA FIX ORIGIN (KHUSUS BANGUNAN) ---
                if (cfg.fixOrigin) {
                    model.updateMatrixWorld(true);
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());

                    model.position.x = -center.x;
                    model.position.z = -center.z;
                    model.position.y = -box.min.y;
                }
                
                // --- 2. LOGIKA MONSTER TAGGING (BARU) ---
                // Ini kuncinya agar Collision nanti bisa bedakan Hantu vs Tembok
                if (cfg.isMonster) {
                    pivotGroup.userData.isMonster = true;
                    pivotGroup.userData.checkCollision = true; // Nanti dicek bersyarat (visible/invisible)
                } else {
                    // Kalau bangunan, selalu cek collision
                    pivotGroup.userData.isMonster = false;
                    pivotGroup.userData.checkCollision = true; 
                }

                // Apply Posisi & Rotasi
                pivotGroup.position.copy(cfg.position);
                pivotGroup.rotation.copy(cfg.rotation);

                // Apply Visibilitas
                if (cfg.visible === false) {
                    pivotGroup.visible = false;
                } else {
                    pivotGroup.visible = true;
                }

                world.add(pivotGroup);

                state.addObject(pivotGroup, {
                    isSelectable: true,
                    isDraggable: true
                });

                // Apply Animasi
                if (gltf.animations && gltf.animations.length > 0) {
                    pivotGroup.animations = gltf.animations;

                    if (!pivotGroup.mixer) {
                        pivotGroup.mixer = new THREE.AnimationMixer(model);
                        const targetAnim = cfg.animName || gltf.animations[0].name;
                        const clip = gltf.animations.find(a => a.name === targetAnim);

                        if (clip) {
                            const action = pivotGroup.mixer.clipAction(clip);
                            action.play();
                            pivotGroup.currentAction = action;
                            console.log(`[ANIMATION] ${pivotGroup.name} playing: ${targetAnim}`);
                        } else {
                            console.warn(`Animasi '${targetAnim}' tidak ditemukan pada ${pivotGroup.name}`);
                        }
                    }
                }

                model.traverse((node) => {
                    if (!node.name) {
                        if (node.isMesh) node.name = `${pivotGroup.name}_mesh_${node.uuid.substring(0, 4)}`;
                        else node.name = `${pivotGroup.name}_node_${node.uuid.substring(0, 4)}`;
                    }
                    
                    state.addObject(node, { isSelectable: true, isDraggable: true });
                    
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;

                        // --- (1) AKTIFKAN INI UNTUK HANTU ---
                        // Agar hantu tidak kedip/hilang saat jarak dekat
                        // Sangat penting untuk collision yang konsisten!
                        node.frustumCulled = false; 
                    } 
                });
            },
            undefined,
            (error) => { console.error(`ERROR Loading ${cfg.url}:`, error); }
        );
    });
}