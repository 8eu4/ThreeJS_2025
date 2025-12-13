// js/SceneSetup.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function loadInitialScene(world, state) {
    _createGround(world);
    // _createPrimitives(world, state);
    // _createLights(world, state);
    _loadModels(world, state);

    _createCinematicWaypoint(world, state, "Point_A_Kasur",
        new THREE.Vector3(-72, 4, -37),
        new THREE.Euler(0, 143, 0));

    _createCinematicWaypoint(world, state, "Point_B_Pintu",
        new THREE.Vector3(-86, 4, -21),
        new THREE.Euler(0, 89, 0));

    // SCENE 01
    _createCinematicWaypoint(world, state, "Scene01_ceilling",
        new THREE.Vector3(-65.25, 7.79, -40.55),
        new THREE.Euler(90, 180, 0));
    _createCinematicWaypoint(world, state, "Scene01_getup",
        new THREE.Vector3(-65.25, 9.24, -38.57),
        new THREE.Euler(0, 180, 0));
    _createCinematicWaypoint(world, state, "Scene01_lookleft",
        new THREE.Vector3(-65.25, 9.24, -38.57),
        new THREE.Euler(0, 210, 0));
    _createCinematicWaypoint(world, state, "Scene01_lookright",
        new THREE.Vector3(-65.25, 9.24, -38.57),
        new THREE.Euler(0, 150, 0));
    _createCinematicWaypoint(world, state, "Scene01_looksidedown",
        new THREE.Vector3(-70.45, 8.54, -40.44),
        new THREE.Euler(-90, 90, 0));
    _createCinematicWaypoint(world, state, "Scene01_looksideup",
        new THREE.Vector3(-71.17, 10.91, -40.59),
        new THREE.Euler(0, 150, 0));
    _createCinematicWaypoint(world, state, "Scene01_gotodoor_1",
        new THREE.Vector3(-84.53, 10.91, -22.77),
        new THREE.Euler(0, 150, 0));
    _createCinematicWaypoint(world, state, "Scene01_gotodoor_2",
        new THREE.Vector3(-86, 10.91, -21),
        new THREE.Euler(0, 89, 0));

    // SCENE02
    _createCinematicWaypoint(world, state, "Scene02_walkoutside",
        new THREE.Vector3(-94.75, 10.91, -21),
        new THREE.Euler(0, 0, 0));
    _createCinematicWaypoint(world, state, "Scene02_headslightrotate",
        new THREE.Vector3(-94.75, 10.91, -21),
        new THREE.Euler(0, 0, -20));
    _createCinematicWaypoint(world, state, "Scene02_monsterwalk_m",
        new THREE.Vector3(-82.96, 3.53, -54.34),
        new THREE.Euler(0, -90, 0));
    _createCinematicWaypoint(world, state, "Scene02_walktocurve",
        new THREE.Vector3(-94.75, 10.91, -51.52),
        new THREE.Euler(0, 0, 0));
    _createCinematicWaypoint(world, state, "Scene02_turn",
        new THREE.Vector3(-89.28, 10.91, -54.90),
        new THREE.Euler(0, -90, 0));
    _createCinematicWaypoint(world, state, "Scene02_walktokitchen",
        new THREE.Vector3(-47.06, 10.91, -54.90),
        new THREE.Euler(0, -90, 0));

    //SCENE03
    _createCinematicWaypoint(world, state, "Scene03_enterkitchen",
        new THREE.Vector3(-34.65, 10.91, -54.49),
        new THREE.Euler(0, -90, 0));
    _createCinematicWaypoint(world, state, "Scene03_turntobottle",
        new THREE.Vector3(-31.02, 10.91, -54.49),
        new THREE.Euler(-16, 0, 0));
    _createCinematicWaypoint(world, state, "Scene03_confuseright",
        new THREE.Vector3(-31.02, 10.91, -54.49),
        new THREE.Euler(0, -55, 0));
    _createCinematicWaypoint(world, state, "Scene03_confuseleft",
        new THREE.Vector3(-31.02, 10.91, -54.49),
        new THREE.Euler(0, 72, 0));
    _createCinematicWaypoint(world, state, "Scene03_backaway",
        new THREE.Vector3(-35.97, 10.91, -50.41),
        new THREE.Euler(0, 0, 0));
    _createCinematicWaypoint(world, state, "Scene03_confuseright_2",
        new THREE.Vector3(-35.97, 10.91, -48.18),
        new THREE.Euler(82, -20, 0));
    _createCinematicWaypoint(world, state, "Scene03_confuse_3",
        new THREE.Vector3(-35.97, 10.91, -48.18),
        new THREE.Euler(0, 90, 0));
    _createCinematicWaypoint(world, state, "Scene03_scared_1",
        new THREE.Vector3(-33.47, 10.91, -48.18),
        new THREE.Euler(-59, -59, 0));
    _createCinematicWaypoint(world, state, "Scene03_scared_2",
        new THREE.Vector3(-30.41, 10.91, -48.18),
        new THREE.Euler(20, 54, 0));
    _createCinematicWaypoint(world, state, "Scene03_scared_3",
        new THREE.Vector3(-29.19, 8.81, -48.18),
        new THREE.Euler(33, 63, 0));
    _createCinematicWaypoint(world, state, "Scene03_scared_4",
        new THREE.Vector3(-28.89, 5.31, -48.18),
        new THREE.Euler(-23, 57, 0));


}

function _createCinematicWaypoint(world, state, name, position, rotationDeg) {
    // Default rotasi 0,0,0 jika tidak diisi
    if (!rotationDeg) rotationDeg = new THREE.Vector3(0, 0, 0);

    const geometry = new THREE.BoxGeometry(2, 2, 4); // Kotak memanjang ke depan biar kelihatan arahnya
    const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });

    const waypoint = new THREE.Mesh(geometry, material);
    waypoint.name = name;
    waypoint.position.copy(position);

    // KONVERSI Vektor Derajat -> Euler Radians
    waypoint.rotation.set(
        THREE.MathUtils.degToRad(rotationDeg.x),
        THREE.MathUtils.degToRad(rotationDeg.y),
        THREE.MathUtils.degToRad(rotationDeg.z)
    );

    waypoint.userData.isWaypoint = true;

    // VISUALISASI ARAH (Panah)
    // Kita tempel panah yang menunjuk ke arah "Depan" lokal kotak ini (-Z)
    const dir = new THREE.Vector3(0, 0, -1); // Arah depan karakter (-Z)
    const length = 5;
    const hex = 0x00ffff; // Cyan
    const arrowHelper = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), length, hex);

    waypoint.add(arrowHelper);

    world.add(waypoint);
    state.addObject(waypoint, { isSelectable: true, isDraggable: true });
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

// --- AKHIR Primitif & Lampu ---


// js/SceneSetup.js

// js/SceneSetup.js

// js/SceneSetup.js

export function _loadModels(world, state) {
    const gltfLoader = new GLTFLoader();

    const modelsToLoad = [
        {
            url: './Models/FullEnvironment.glb',
            position: new THREE.Vector3(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1),
            rotation: new THREE.Euler(0, 0, 0),
            fixOrigin: true, // Bangunan = Fix Origin
            isMonster: false // Bukan Monster
        },

        // {
        //     url: './Models/FullEnvironment (1).glb',
        //     position: new THREE.Vector3(0, 0, 0),
        //     scale: new THREE.Vector3(1, 1, 1),
        //     rotation: new THREE.Euler(0, 0, 0),
        //     fixOrigin: true, // Bangunan = Fix Origin
        //     isMonster: false // Bukan Monster
        // },

        // // --- 4. HANTU (ANIMASI) ---
        {
            url: './Models/nightmare_creature_1.glb',
            name: 'Ghost_Corridor',
            position: new THREE.Vector3(-91.31, 3.53, -54.50),
            scale: new THREE.Vector3(5, 5, 5),
            rotation: new THREE.Euler(0, Math.PI / 2, 0),

            animName: 'Creature_armature|walk',
            visible: true,
            fixOrigin: false,   // Hantu = Jangan Fix Origin
            isMonster: true     // <--- PENTING: TANDA BAHWA INI MONSTER
        },
        {
            url: './Models/nightmare_creature_1.glb',
            name: 'Ghost_Kitchen_Window',
            position: new THREE.Vector3(-37.41, 3.53, -67.93),
            scale: new THREE.Vector3(5, 5, 5),
            rotation: new THREE.Euler(0, 0, 0),

            animName: 'Creature_armature|roar',
            visible: false,     // Sembunyi
            fixOrigin: false,
            isMonster: true     // <--- TANDA MONSTER
        },
        {
            url: './Models/nightmare_creature_1.glb',
            name: 'Ghost_Kitchen',
            position: new THREE.Vector3(-40.51, 3.53, -52.89),
            scale: new THREE.Vector3(5, 5, 5),
            rotation: new THREE.Euler(0, 64, 0),

            animName: 'Creature_armature|roar',
            visible: false,     // Sembunyi
            fixOrigin: false,
            isMonster: true     // <--- TANDA MONSTER
        },
        // {
        //     url: './Models/nightmare_creature_1.glb',
        //     name: 'Ghost_Corridor_Chasing', 
        //     position: new THREE.Vector3(2480, 20, 20),
        //     scale: new THREE.Vector3(80, 80, 80),
        //     rotation: new THREE.Euler(0, 0, 0),

        //     animName: 'Creature_armature|crawl', 
        //     visible: false,     // Sembunyi
        //     fixOrigin: false,
        //     isMonster: true     // <--- TANDA MONSTER
        // },

        {
            url: './Models/water_bottle.glb',
            position: new THREE.Vector3(-31.48, 8.50, -56.66),
            scale: new THREE.Vector3(0.4, 0.4, 0.4),
            rotation: new THREE.Euler(0, 0, 0),
            fixOrigin: true, // Bangunan = Fix Origin
            isMonster: false // Bukan Monster
        }

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

                // --- 1. SET POSISI, ROTASI & ORIGIN ---
                pivotGroup.position.copy(cfg.position);
                pivotGroup.rotation.copy(cfg.rotation);

                // Fix Origin (Khusus Bangunan)
                if (cfg.fixOrigin) {
                    model.updateMatrixWorld(true);
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.x = -center.x;
                    model.position.z = -center.z;
                    model.position.y = -box.min.y;
                }

                // --- 2. ADD KE WORLD DULUAN (PENTING) ---
                // Objek harus masuk scene dulu sebelum kita mainkan shader-nya
                world.add(pivotGroup);

                state.addObject(pivotGroup, {
                    isSelectable: true,
                    isDraggable: true
                });

                // --- 3. LOGIKA SPLIT (MONSTER vs BIASA) ---
                // Hapus semua logika visible/tagging lama, ganti dengan blok ini:

                if (cfg.isMonster) {
                    // === KASUS MONSTER (PRE-WARM SHADER) ===
                    pivotGroup.userData.isMonster = true;
                    pivotGroup.userData.checkCollision = true;

                    // 1. Simpan Scale Asli
                    const originalScale = cfg.scale.clone();

                    // 2. Kecilkan jadi debu (biar tak terlihat mata)
                    pivotGroup.scale.set(0.0001, 0.0001, 0.0001);

                    // 3. PAKSA VISIBLE = TRUE (Supaya GPU mau memproses shader)
                    pivotGroup.visible = true;

                    // 4. PAKSA COMPILE (Trik Anti Lag)
                    world.renderer.compile(pivotGroup, world.camera);

                    // 5. KEMBALIKAN KONDISI SETELAH 100ms
                    setTimeout(() => {
                        // Balikin ukuran asli
                        pivotGroup.scale.copy(originalScale);

                        // Balikin status visibility sesuai Config (misal: false/sembunyi)
                        if (cfg.visible === false) {
                            pivotGroup.visible = false;
                        }
                        // Jika cfg.visible true, biarkan tetap true
                    }, 100);

                } else {
                    // === KASUS OBJEK BIASA ===
                    pivotGroup.userData.isMonster = false;
                    pivotGroup.userData.checkCollision = true;

                    // Scale Normal
                    pivotGroup.scale.copy(cfg.scale);

                    // Visibility Normal (Tanpa Trik)
                    if (cfg.visible === false) {
                        pivotGroup.visible = false;
                    } else {
                        pivotGroup.visible = true;
                    }
                }

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
                        }
                    }
                }

                const manualGlassList = [];

                model.traverse((node) => {
                    // --- 1. SETUP VISUAL (KHUSUS MESH) ---
                    // Group tidak punya material/geometry, jadi jangan diproses disini
                    if (node.isMesh) {
                        // NOTE Hanya render depan mata
                        node.frustumCulled = true;

                        if (node.geometry) {
                            node.geometry.computeBoundingSphere();
                            node.geometry.computeBoundingBox();
                        }

                        const isManualGlass = manualGlassList.includes(node.name);
                        const isPhysicalGlass = (node.material.opacity < 1.0) ||
                            (node.material.transmission && node.material.transmission > 0) ||
                            (node.material.transparent === true);
                        const isNameGlass = node.name.toLowerCase().includes('glass') ||
                            node.name.toLowerCase().includes('window');

                        if (isManualGlass || isPhysicalGlass || isNameGlass) {
                            node.castShadow = false;
                            node.receiveShadow = true;
                            node.material.transparent = true;
                            node.material.side = THREE.DoubleSide;
                            node.material.depthWrite = false;
                        } else {
                            node.castShadow = true;
                            node.receiveShadow = true;


                            let isInsideKitchen = false;
                            let parentCheck = node.parent;

                            // Loop naik ke atas sampai ketemu root scene atau ketemu nama "Kitchen"
                            while (parentCheck) {
                                if (parentCheck.name && parentCheck.name.toLowerCase().includes('kitchen')) {
                                    isInsideKitchen = true;
                                    break; // Ketemu! Berhenti loop
                                }
                                parentCheck = parentCheck.parent;
                            }

                            if (isInsideKitchen) {
                                node.material.side = THREE.FrontSide;       // Cuma render sisi depan
                                node.material.shadowSide = THREE.FrontSide;
                            } else {
                                node.material.side = THREE.DoubleSide;      // Render bolak-balik
                                node.material.shadowSide = THREE.DoubleSide;
                            }


                            node.material.polygonOffset = true;
                            node.material.polygonOffsetFactor = 1;
                            node.material.polygonOffsetUnits = 1;
                        }

                        if (node.material.shininess) node.material.shininess = 0;
                        if (node.material.roughness) node.material.roughness = 1;

                        if (!cfg.isMonster && node.geometry) {
                            node.geometry.computeBoundsTree();
                        }
                    }

                    // --- 2. LOGIC SELEKSI (MESH & GROUP) ---
                    // Kita jalankan logic ini jika node adalah Mesh ATAU Group yang punya anak

                    if (false) { // NOTE (ENABLE_CHILD_SELECTION)

                        // KASUS A: MESH (Punya Geometri -> Bisa difilter pakai Radius)
                        if (node.isMesh && node.geometry) {
                            if (!node.geometry.boundingSphere) {
                                node.geometry.computeBoundingSphere();
                            }

                            const radius = node.geometry.boundingSphere.radius;
                            const MIN_SIZE_TO_SELECT = 2.0;
                            const isImportant = node.name.toLowerCase().includes('door') ||
                                node.name.toLowerCase().includes('key') ||
                                node.name.toLowerCase().includes('switch');

                            if (radius > MIN_SIZE_TO_SELECT || isImportant) {
                                state.addObject(node, { isSelectable: true, isDraggable: true });
                            }

                            // Matikan auto update matrix untuk mesh statis (Optimasi)
                            // if (!cfg.isMonster && !node.name.includes('Door')) {
                            //    node.matrixAutoUpdate = false;
                            //    node.updateMatrix();
                            // }
                        }

                        // KASUS B: GROUP/CONTAINER (Gak punya Geometri -> Langsung Add)
                        // Ini yang bikin "Object 3D" bisa diklik
                        else if (node.children.length > 0) {
                            state.addObject(node, { isSelectable: true, isDraggable: true });
                        }
                    }
                });
            },
            undefined,
            (error) => { console.error(`ERROR Loading ${cfg.url}:`, error); }
        );
    });
}