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


export function _loadModels(world, state) {
    const gltfLoader = new GLTFLoader();

    const modelsToLoad = [
        {
            url: './Models/kitchen.glb',
            position: new THREE.Vector3(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1),
            rotation: new THREE.Euler(0, 0, 0),
        },
        {
            url: './Models/bedroom.glb',
            position: new THREE.Vector3(0, 0, 0),
            scale: new THREE.Vector3(100, 100, 100),
            rotation: new THREE.Euler(0, 0, 0),
        }
    ];

    modelsToLoad.forEach(cfg => {
        gltfLoader.load(
            cfg.url,
            (gltf) => {
                const model = gltf.scene;

                // 1. Collapse hierarki (sesuai request)
                collapseHierarchy(model);

                // --- PERBAIKAN BUG SKALA ---
                // 2. Terapkan skala config (misal 100x) ke 'model' DULU
                model.scale.copy(cfg.scale);
                // ---

                const pivotGroup = new THREE.Group();
                pivotGroup.name = cfg.url.split('/').pop().replace('.glb', '');

                // 3. Hitung box & center dari model yang SUDAH DISKALA
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());

                pivotGroup.add(model);

                // 4. Offset 'model' dengan center yang sudah diskala
                model.position.sub(center); // <-- Tetap, agar model terpusat di pivotnya

                // 5. Set posisi 'pivotGroup' dengan center yang sudah diskala
                pivotGroup.position.set(0, 0, 0);   // <-- PAKSA POSISI KE (0, 0, 0)

                world.add(pivotGroup);
                state.addObject(pivotGroup, {
                    isSelectable: true,
                    isDraggable: true
                });

                if (gltf.animations && gltf.animations.length > 0) {
                    pivotGroup.animations = gltf.animations;
                }

                model.traverse((node) => {
                    if (!node.name) {
                        if (node.isMesh) {
                            node.name = `${pivotGroup.name}_mesh_${node.uuid.substring(0, 4)}`;
                        } else if (node.isGroup) {
                            node.name = `${pivotGroup.name}_group_${node.uuid.substring(0, 4)}`;
                        } else {
                            node.name = `${pivotGroup.name}_node_${node.uuid.substring(0, 4)}`;
                        }
                    }

                    state.addObject(node, {
                        isSelectable: true,
                        isDraggable: true
                    });

                    // Jangan recenter 'model' (gltf.scene) itu sendiri
                    if (node === model) {
                        return;
                    }

                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        recenterMeshOrigin(node);
                    } else if (node.isGroup) {
                        recenterOrigin(node);
                    }
                });
            }
        );
    });
}