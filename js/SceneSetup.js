// js/SceneSetup.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function loadInitialScene(world, state) {
    _createGround(world);


    // --- OPTIMIZED CUBES ---
    // Gunakan 1 Geometri untuk kedua kubus (Hemat Memori)
    const boxGeo = new THREE.BoxGeometry(10, 10, 10);
    
    // Gunakan BackSide untuk shadow agar tidak ada 'Shadow Acne' (Garis-garis aneh)
    // FrontSide untuk visual agar solid.
    const boxMat = new THREE.MeshPhongMaterial({ 
        color: 0xff0000, 
        side: THREE.FrontSide, 
        shadowSide: THREE.BackSide, // <--- OPTIMASI: Shadow dari belakang tidak menutupi wajah depan
        depthWrite: true
    });

    const cubeMesh = new THREE.Mesh(boxGeo, boxMat);
    cubeMesh.position.set(1, 10, 0);
    cubeMesh.castShadow = true; 
    cubeMesh.receiveShadow = true; 
    world.add(cubeMesh);
    state.addObject(cubeMesh, { isSelectable: true, isDraggable: true });

    const cubeMesh2 = new THREE.Mesh(boxGeo, boxMat);
    // [MERGE] Use Aileen's position (8.64) instead of HEAD's (2.00)
    cubeMesh2.position.set(8.64, 5.83, 10.88);
    cubeMesh2.castShadow = true; 
    cubeMesh2.receiveShadow = true; 
    world.add(cubeMesh2);
    state.addObject(cubeMesh2, { isSelectable: true, isDraggable: true });

    _loadModels(world, state);
}


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

            animName: 'Creature_armature|battle_idle',
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
        {
            url: './Models/nightmare_creature_1.glb',
            name: 'Ghost_Long_Corridor',
            position: new THREE.Vector3(80, 3, -19),
            scale: new THREE.Vector3(5, 5, 5),
            rotation: new THREE.Euler(0, 0, 0),

            animName: 'Creature_armature|roar',
            visible: false,     // Sembunyi
            fixOrigin: false,
            isMonster: true     // <--- TANDA MONSTER
        },
        {
            url: './Models/flashlight.glb',
            name: 'Prop_Flashlight',
            position: new THREE.Vector3(-25, 8.53, -56), 
            scale: new THREE.Vector3(0.1, 0.1, 0.1), 
            rotation: new THREE.Euler(THREE.MathUtils.degToRad(-54.6), THREE.MathUtils.degToRad(-25.3), THREE.MathUtils.degToRad(-79.0)),
            visible: true,
            isMonster: false
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
        },

        {
            url: './Models/Hand_Flashlight.glb',
            name: 'Rig_Hand_Held',
            position: new THREE.Vector3(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1),  
            rotation: new THREE.Euler(0, 0, 0),
            visible: false, // Sembunyi dulu
            fixOrigin: true, 
            isMonster: false 
        },
        {
            url: './Models/hand.glb',
            name: 'Rig_Hand_Empty',
            position: new THREE.Vector3(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1),  
            rotation: new THREE.Euler(0, 0, 0),
            visible: false, // Sembunyi dulu
            fixOrigin: true, 
            isMonster: false 
        }

    ];

    modelsToLoad.forEach(cfg => {
        gltfLoader.load(
            cfg.url,
            (gltf) => {
                const model = gltf.scene;
                const pivotGroup = new THREE.Group();

                pivotGroup.name = cfg.name || cfg.url.split('/').pop().replace('.glb', '');
                pivotGroup.add(model);

                // --- 1. SET POSISI, ROTASI & ORIGIN ---
                pivotGroup.position.copy(cfg.position);
                pivotGroup.rotation.copy(cfg.rotation);
                pivotGroup.scale.copy(cfg.scale); // [NEW] Juga terapkan scale di sini
                pivotGroup.visible = (cfg.visible !== undefined) ? cfg.visible : true; // [FIX] Terapkan visibility

                if (cfg.fixOrigin) {
                    model.updateMatrixWorld(true);
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.x = -center.x;
                    model.position.z = -center.z;
                    model.position.y = -box.min.y;
                }

                // --- 2. SETUP ANIMASI (DULUAN AGAR BISA DIPRE-WARM) ---
                if (gltf.animations && gltf.animations.length > 0) {
                    pivotGroup.animations = gltf.animations;
                    pivotGroup.mixer = new THREE.AnimationMixer(model);

                    const targetAnim = cfg.animName || gltf.animations[0].name;
                    const clip = gltf.animations.find(a => a.name === targetAnim);

                    if (clip) {
                        const action = pivotGroup.mixer.clipAction(clip);
                        action.play();
                        pivotGroup.currentAction = action;
                    }
                }

                // --- 3. ADD KE WORLD ---
                world.add(pivotGroup);
                state.addObject(pivotGroup, { isSelectable: true, isDraggable: true });

                // --- 4. LOGIKA SPLIT (MONSTER vs BIASA) ---
                if (cfg.isMonster) {
                    // === [OPTIMIZED] KASUS MONSTER (AGGRESSIVE WARMUP) ===
                    pivotGroup.userData.isMonster = true;
                    pivotGroup.userData.checkCollision = true;

                    const originalScale = cfg.scale.clone();

                    // A. Jangan pakai scale 0.0001 (terlalu kecil), pakai agak "berisi" sedikit
                    //    Tapi sembunyikan di bawah tanah atau di dalam objek lain kalau mau aman.
                    //    Untuk sekarang kita pakai scale kecil tapi MATIKAN CULLING.
                    pivotGroup.scale.set(0.01, 0.01, 0.01);

                    // B. FORCE VISIBLE TRUE
                    pivotGroup.visible = true;

                    // C. [PENTING] MATIKAN FRUSTUM CULLING SEMENTARA
                    // Ini memaksa GPU merender objek walau dianggap "tidak terlihat" oleh kamera
                    model.traverse(node => {
                        if (node.isMesh) node.frustumCulled = false;
                    });

                    // D. [PENTING] FORCE UPDATE ANIMASI 1 FRAME
                    // Agar shader tulang (Skinning) terupload ke GPU
                    if (pivotGroup.mixer) {
                        pivotGroup.mixer.update(0.016);
                    }

                    // E. PAKSA COMPILE
                    world.renderer.compile(pivotGroup, world.camera);

                    // F. KEMBALIKAN KONDISI SETELAH SELESAI
                    // Gunakan delay sedikit lebih lama (misal 200ms) untuk memastikan frame ter-render
                    setTimeout(() => {
                        // LOGIKA BARU: JANGAN UBAH VISIBLE! MAIN SCALE SAJA!

                        // Simpan scale asli di userData biar aman
                        if (!pivotGroup.userData.originalScale) {
                            pivotGroup.userData.originalScale = originalScale.clone();
                        }

                        if (cfg.visible === false) {
                            // Kalau config bilang sembunyi -> KECILKAN JADI DEBU
                            // JANGAN visible = false !!!
                            pivotGroup.scale.set(0.0001, 0.0001, 0.0001);
                            pivotGroup.visible = true; // PASTIIN TETAP TRUE
                        } else {
                            // Kalau config bilang muncul -> BALIKIN UKURAN ASLI
                            pivotGroup.scale.copy(originalScale);
                            pivotGroup.visible = true;
                        }

                        // 3. Nyalakan lagi Frustum Culling
                        // TAPI KHUSUS MONSTER, BIARKAN FALSE.
                        // Kalau dinyalakan (true), saat monster jadi kecil (0.0001), 
                        // Three.js bakal berhenti merender animasinya karena dianggap "hilang".
                        // Biarkan false supaya animasinya tetap jalan di background walau sekecil kuman.

                        // model.traverse(node => {
                        //    if (node.isMesh) node.frustumCulled = true; 
                        // });  <-- HAPUS ATAU COMMENT BAGIAN INI KHUSUS BLOK MONSTER

                    }, 200);

                } else {
                    // === KASUS OBJEK BIASA ===
                    pivotGroup.userData.isMonster = false;
                    pivotGroup.userData.checkCollision = true;
                    pivotGroup.scale.copy(cfg.scale);

                    if (cfg.visible === false) {
                        pivotGroup.visible = false;
                    } else {
                        pivotGroup.visible = true;
                    }
                }

                // --- 5. SETUP MATERIAL (TEXTURE & SHADER) ---
                const manualGlassList = [];
                model.traverse((node) => {
                    if (node.isMesh) {
                        // Pastikan Monster di-render depan belakang agar tidak bolong saat animasi
                        if (cfg.isMonster) {
                            node.material.side = THREE.DoubleSide;
                            node.material.shadowSide = THREE.DoubleSide;
                        }

                        node.frustumCulled = true; // Default nyala (nanti dimatikan sebentar di blok monster)

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
                            while (parentCheck) {
                                if (parentCheck.name && parentCheck.name.toLowerCase().includes('kitchen')) {
                                    isInsideKitchen = true;
                                    break;
                                }
                                parentCheck = parentCheck.parent;
                            }

                            if (!cfg.isMonster) { // Monster jangan kena logic tembok
                                if (isInsideKitchen) {
                                    node.material.side = THREE.FrontSide;
                                    node.material.shadowSide = THREE.FrontSide;
                                } else {
                                    node.material.side = THREE.DoubleSide;
                                    node.material.shadowSide = THREE.DoubleSide;
                                }
                                node.material.polygonOffset = true;
                                node.material.polygonOffsetFactor = 1;
                                node.material.polygonOffsetUnits = 1;
                            }
                        }

                        if (node.material.shininess) node.material.shininess = 0;
                        if (node.material.roughness) node.material.roughness = 1;

                        if (!cfg.isMonster && node.geometry) {
                            node.geometry.computeBoundsTree();
                        }
                    }

                    // --- 2. LOGIC SELEKSI (MESH & GROUP) ---
                    // Kita jalankan logic ini jika node adalah Mesh ATAU Group yang punya anak

                    if (true) { // NOTE (ENABLE_CHILD_SELECTION)

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