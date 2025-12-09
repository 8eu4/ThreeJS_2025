// js/UIManager.js
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import * as THREE from 'three';
import { MinMaxGUIHelper, ColorGUIHelper } from './helper.js';
import { TransformCommand } from './Commands.js';

export class UIManager {
    constructor(world, state, history, saveManager, cameraManager, storyManager) {
        this.world = world;
        this.state = state;
        this.stateManager = null;
        this.history = history;
        this.saveManager = saveManager;
        this.cameraManager = cameraManager;
        this.storyManager = storyManager;

        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'application/json';
        this.fileInput.style.display = 'none';
        this.fileInput.addEventListener('change', (event) => this._handleFileLoad(event));
        document.body.appendChild(this.fileInput);

        this.gui = new GUI();

        this.hierarchyListEl = document.getElementById('hierarchy-list');
        this.hierarchyPanelEl = document.getElementById('hierarchy-panel');

        this.cameraFolder = this.gui.addFolder('Camera');
        this.gizmoFolder = this.gui.addFolder('Gizmo');
        this.saveLoadFolder = this.gui.addFolder('Save/Load');

        this.debugFolder = this.gui.addFolder('DEBUG');
        this.colliderHelpers = [];

        this.lightGuiCache = new Map();
        this.animationGuiCache = new Map();
        this.transformGuiCache = new Map();

        this.activeLightGUI = null;
        this.activeAnimationGUI = null;
        this.activeTransformGUI = null;

        this._tempOldTransform = null;

        this._setupTransformControlsListeners();

        this._init();
    }

    _init() {
        this._buildCameraProjectionGUI();
        this._buildCameraModeGUI();
        this._buildGizmoGUI();
        this._buildSaveLoadGUI();
        this._buildDebugGUI();
        this._initResizer();

        this.cameraFolder.open();
        this.gizmoFolder.open();
        this.saveLoadFolder.open();
        this.debugFolder.open();

        this.buildHierarchyPanel();
    }

    _buildDebugGUI() {
        const settings = {
            showColliders: false,
            showPlayerBody: true
        };

        this.debugFolder.add(settings, 'showColliders').name('Show ALL Mesh Colliders').onChange((show) => {
            if (show) {
                // Bersihkan dulu kalau ada sisa
                this._clearColliderHelpers();

                console.log("🔍 Scanning Scene for Meshes...");

                // Traverse SELURUH SCENE
                this.world.scene.traverse((node) => {
                    // Kriteria Mesh yang valid untuk ditampilkan collisionnya:
                    // 1. Harus Mesh (Punya geometri)
                    // 2. Bukan Helper (Garis bantu)
                    // 3. Bukan Gizmo (Panah transform)
                    // 4. Bukan Badan Pemain (Merah)
                    // 5. Bukan Hantu Invisible (Opsional, tapi biasanya collision hantu beda)

                    if (node.isMesh) {
                        // Filter Nama/Tipe biar gak menuhin layar sama sampah visual
                        const isHelper = node.name.includes("Helper") || node.type.includes("Helper");
                        const isGizmo = node.name.includes("Gizmo") || node.parent?.type === "TransformControls";
                        const isPlayer = node.name === "Debug_Player_Cylinder";
                        const isSky = node.name.includes("Sky"); // Kalau ada langit

                        if (!isHelper && !isGizmo && !isPlayer && !isSky) {

                            // Buat BoxHelper Kuning
                            const helper = new THREE.BoxHelper(node, 0xffff00);
                            helper.name = "Debug_Auto_Collider";

                            // Masukkan ke Scene
                            this.world.scene.add(helper);
                            this.colliderHelpers.push(helper);
                        }
                    }
                });
                console.log(`✅ Created ${this.colliderHelpers.length} collision visualizers.`);

            } else {
                this._clearColliderHelpers();
            }
        });

        this.debugFolder.add(settings, 'showPlayerBody').name('Show Player Body').onChange((show) => {
            if (this.cameraManager && this.cameraManager.debugMesh) {
                this.cameraManager.debugMesh.visible = show;
            }
        });
    }

    _clearColliderHelpers() {
        this.colliderHelpers.forEach(helper => {
            this.world.scene.remove(helper);
            helper.dispose();
        });
        this.colliderHelpers = [];
    }

    _initResizer() {
        if (!this.hierarchyPanelEl) return;
        const resizer = document.createElement('div');
        resizer.style.width = '10px';
        resizer.style.height = '100%';
        resizer.style.background = 'transparent';
        resizer.style.position = 'absolute';
        resizer.style.top = '0';
        resizer.style.right = '-5px';
        resizer.style.cursor = 'ew-resize';
        resizer.style.zIndex = '100';

        if (getComputedStyle(this.hierarchyPanelEl).position === 'static') {
            this.hierarchyPanelEl.style.position = 'relative';
        }

        this.hierarchyPanelEl.appendChild(resizer);

        let isResizing = false;
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = e.clientX;
            if (newWidth > 150 && newWidth < 800) {
                this.hierarchyPanelEl.style.width = `${newWidth}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
            }
        });
    }

    _setupTransformControlsListeners() {
        this.world.transformControls.addEventListener('mouseDown', () => {
            if (this.cameraManager) this.cameraManager.orbitControls.enabled = false;
            const object = this.world.transformControls.object;
            if (object) {
                this._tempOldTransform = {
                    position: object.position.clone(), rotation: object.rotation.clone(), scale: object.scale.clone()
                };
            }
        });

        // BAGIAN MOUSE UP UNTUK LOGGING FULL
        this.world.transformControls.addEventListener('mouseUp', () => {
            this.world.ignoreNextClick = true;
            if (this.cameraManager && this.cameraManager.activeMode === 'ORBIT') this.cameraManager.orbitControls.enabled = true;

            const object = this.world.transformControls.object;

            if (object) {
                const x = object.position.x.toFixed(2);
                const y = object.position.y.toFixed(2);
                const z = object.position.z.toFixed(2);

                // Konversi Radian -> Derajat
                const rx = THREE.MathUtils.radToDeg(object.rotation.x).toFixed(2);
                const ry = THREE.MathUtils.radToDeg(object.rotation.y).toFixed(2);
                const rz = THREE.MathUtils.radToDeg(object.rotation.z).toFixed(2);

                console.group(`📝 LOG: ${object.name}`);

                if (object.userData.isWaypoint) {
                    console.log(`%c[COPY KODE INI KE SceneSetup.js]`, "color: #00ff00; font-weight: bold;");
                    // Format output yang diminta:
                    console.log(`_createCinematicWaypoint(world, state, "${object.name}", \n    new THREE.Vector3(${x}, ${y}, ${z}), \n    new THREE.Vector3(${rx}, ${ry}, ${rz}) // Rotasi (Deg)\n);`);
                } else {
                    console.log(`Position: new THREE.Vector3(${x}, ${y}, ${z})`);
                    console.log(`Rotation: new THREE.Vector3(${rx}, ${ry}, ${rz})`);
                }

                if (object.isLight && object.userData.targetMeshName) {
                    console.log(`%c💡 INI TARGET LIGHT!`, "color: yellow");
                }
                console.groupEnd();
            }

            // --- 2. LOGIC HISTORY (UNDO/REDO) ---
            if (!this._tempOldTransform || !object) return;

            const newTransform = {
                position: object.position.clone(),
                rotation: object.rotation.clone(),
                scale: object.scale.clone()
            };

            if (!this._tempOldTransform.position.equals(newTransform.position) ||
                !this._tempOldTransform.rotation.equals(newTransform.rotation) ||
                !this._tempOldTransform.scale.equals(newTransform.scale)) {
                const command = new TransformCommand(object, this._tempOldTransform, newTransform);
                this.history.execute(command);
            }
            this._tempOldTransform = null;
        });
    }

    setStateManager(manager) { this.stateManager = manager; }

    _buildSaveLoadGUI() {
        const saveLoadSettings = {
            saveScene: () => { this.saveManager.saveScene(); },
            loadScene: () => { this.fileInput.click(); }
        };
        this.saveLoadFolder.add(saveLoadSettings, 'saveScene').name('Save Scene');
        this.saveLoadFolder.add(saveLoadSettings, 'loadScene').name('Load Scene');
    }

    _handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const jsonString = e.target.result;
            this.saveManager.loadScene(jsonString);
        };
        reader.readAsText(file);
        event.target.value = null;
    }

    _createCollapsibleSection(parentElement, title, startOpen = true) {
        const sectionItem = document.createElement('div');
        sectionItem.className = 'hierarchy-item';
        if (startOpen) sectionItem.classList.add('open');

        const content = document.createElement('div');
        content.className = 'hierarchy-item-content';
        content.style.fontWeight = 'bold';
        content.style.backgroundColor = '#e0e0e0';
        content.style.position = 'sticky';
        content.style.top = '0';
        content.style.zIndex = '1';

        const toggle = document.createElement('span');
        toggle.className = 'hierarchy-toggle';
        toggle.textContent = startOpen ? '▼' : '►';

        const label = document.createElement('span');
        label.className = 'hierarchy-label';
        label.textContent = title;

        content.appendChild(toggle);
        content.appendChild(label);
        sectionItem.appendChild(content);

        const childContainer = document.createElement('div');
        childContainer.className = 'hierarchy-children';

        parentElement.appendChild(sectionItem);
        parentElement.appendChild(childContainer);

        content.addEventListener('click', (e) => {
            e.stopPropagation();
            sectionItem.classList.toggle('open');
            toggle.textContent = sectionItem.classList.contains('open') ? '▼' : '►';
        });
        return childContainer;
    }

    buildHierarchyPanel() {
        this.hierarchyListEl.innerHTML = "";
        const lightsContainer = this._createCollapsibleSection(this.hierarchyListEl, "Lights", true);
        const objectsContainer = this._createCollapsibleSection(this.hierarchyListEl, "Objects", true);

        this.world.scene.children.forEach(child => {
            if (child.name === "CameraRig_PlayerBody") return;
            if (child.type === "TransformControls") return;

            const isLightTarget = child.name.endsWith("_Target");

            if (child.isLight || isLightTarget) {
                this._buildHierarchyNode(child, lightsContainer, 0);
            } else {
                const isHelper = child.type.endsWith('Helper');
                const isGround = child.name === "Ground Plane";

                if (!isHelper && !isGround) {
                    this._buildHierarchyNode(child, objectsContainer, 0);
                }
            }
        });
    }

    _buildHierarchyNode(object, parentElement, depth) {
        if (object.name === "TransformControlsGizmo" || object.parent.type === "TransformControls") return;

        // Render jika selectable ATAU punya anak (Group)
        const isSelectable = this.state.allSelectableObjects.includes(object);
        if (!isSelectable && object.children.length === 0) return;

        const item = document.createElement('div');
        item.className = 'hierarchy-item';

        const content = document.createElement('div');
        content.className = 'hierarchy-item-content';
        content.style.paddingLeft = `${depth * 15}px`;
        content.dataset.objectUuid = object.uuid;

        // [FIX NAMA]
        let displayName = object.name;
        if (!displayName || displayName.trim() === "") {
            if (object.type === 'Group' || object.type === 'Object3D') {
                displayName = `Container (${object.id})`;
            } else {
                displayName = object.type;
            }
        }
        displayName = displayName.replace(/\.\d+$/, '');

        const label = document.createElement('span');
        label.className = 'hierarchy-label';
        label.textContent = displayName;

        const toggle = document.createElement('span');
        toggle.className = 'hierarchy-toggle';
        toggle.textContent = '►';
        toggle.style.visibility = 'hidden';

        content.appendChild(toggle);
        content.appendChild(label);
        item.appendChild(content);
        parentElement.appendChild(item);

        const childContainer = document.createElement('div');
        childContainer.className = 'hierarchy-children';

        let hasVisibleChildren = false;
        if (object.children.length > 0) {
            object.children.forEach(child => {
                const isHelper = child.type.endsWith('Helper');
                const isGizmoChild = child.name === "TransformControlsGizmo" || child.parent.type === "TransformControls";
                if (!isHelper && !isGizmoChild) {
                    this._buildHierarchyNode(child, childContainer, depth + 1);
                    if (childContainer.lastChild) hasVisibleChildren = true;
                }
            });
        }

        if (hasVisibleChildren) {
            parentElement.appendChild(childContainer);
            toggle.style.visibility = 'visible';

            // Klik Toggle: Hanya Expand/Collapse
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                item.classList.toggle('open');
                toggle.textContent = item.classList.contains('open') ? '▼' : '►';
            });
        }

        // [FIX KLIK ROW]
        content.addEventListener('click', (e) => {
            e.stopPropagation();

            // 1. Select Objek (Meski dia Container/Parent)
            if (this.stateManager && isSelectable) {
                this.stateManager.setSelectedObject(object);
            }

            // 2. Toggle Children (Buka/Tutup) jika punya anak
            if (hasVisibleChildren) {
                // Logic Toggle: Kalau sudah open -> close. Kalau belum -> open.
                item.classList.toggle('open');
                toggle.textContent = item.classList.contains('open') ? '▼' : '►';
            }
        });
    }

    updateHierarchyHighlight() {
        const items = this.hierarchyListEl.querySelectorAll('.hierarchy-item-content');
        items.forEach(itemContent => { itemContent.classList.remove('selected'); });

        if (this.state.selectedObject) {
            const selectedUUID = this.state.selectedObject.uuid;
            const itemToSelect = this.hierarchyListEl.querySelector(`[data-object-uuid="${selectedUUID}"]`);

            if (itemToSelect) {
                itemToSelect.classList.add('selected');

                // Pastikan Parent ke atas terbuka semua
                let currentItem = itemToSelect.closest('.hierarchy-item');
                let parentContainer = currentItem.closest('.hierarchy-children');
                while (parentContainer) {
                    let parentItem = parentContainer.previousElementSibling;
                    if (parentItem && parentItem.classList.contains('hierarchy-item')) {
                        if (!parentItem.classList.contains('open')) {
                            parentItem.classList.add('open');
                            const toggle = parentItem.querySelector('.hierarchy-toggle');
                            if (toggle) toggle.textContent = '▼';
                        }
                    }
                    parentContainer = parentItem ? parentItem.closest('.hierarchy-children') : null;
                }
                itemToSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    updateTransformControls(selectedObject, draggableObjects) {
        if (selectedObject && draggableObjects.includes(selectedObject)) {
            this.world.transformControls.attach(selectedObject);
        } else {
            this.world.transformControls.detach();
        }
    }

    hideActiveGUIs() {
        if (this.activeLightGUI) { this.activeLightGUI.destroy(); this.activeLightGUI = null; }
        if (this.activeAnimationGUI) { this.activeAnimationGUI.destroy(); this.activeAnimationGUI = null; }
        if (this.activeTransformGUI) { this.activeTransformGUI.destroy(); this.activeTransformGUI = null; }
    }

    showGUIFor(obj) {
        if (obj.isMesh || obj.isGroup || obj.isLight) {
            const folder = this._buildTransformGUI(obj);
            folder.open();
            this.activeTransformGUI = folder;
        }
        if (obj.isLight) {
            const folder = this._buildLightGUI(obj);
            folder.open();
            this.activeLightGUI = folder;
        }
        else if (obj.animations && obj.animations.length > 0) {
            const folder = this._buildAnimationGUI(obj);
            folder.open();
            this.activeAnimationGUI = folder;
        }
    }

    removeGUIFromCache(obj) {
        this.lightGuiCache.delete(obj);
        this.animationGuiCache.delete(obj);
        this.transformGuiCache.delete(obj);
        this.hideActiveGUIs();
    }

    _buildCameraProjectionGUI() {
        const cam = this.world.camera;
        const updateCamera = () => cam.updateProjectionMatrix();
        this.cameraFolder.add(cam, 'fov', 1, 180).onChange(updateCamera);
        const minMaxGUIHelper = new MinMaxGUIHelper(cam, 'near', 'far', 0.1);
        this.cameraFolder.add(minMaxGUIHelper, 'min', 0.01, 50, 0.01).name('near').onChange(updateCamera);
        this.cameraFolder.add(minMaxGUIHelper, 'max', 0.1, 20000, 0.1).name('far').onChange(updateCamera);
    }

    _buildCameraModeGUI() {
        const cam = this.world.camera;
        const folder = this.cameraFolder.addFolder('Mode Settings');
        const rollFolder = folder.addFolder('Camera Roll');

        const settings = {
            mode: 'Orbit',
            'Eyes Openness': 1.0,
            resetRoll: () => { cam.rotation.z = 0; }
        };

        folder.add(settings, 'mode', ['Orbit', 'First Person'])
            .name('Control Mode')
            .onChange((mode) => {
                if (mode === 'First Person') {
                    this.cameraManager.setMode('FPS');
                    this.world.transformControls.visible = false;
                    this.world.transformControls.enabled = false;
                    if (this.stateManager) this.stateManager.setSelectedObject(null);
                } else {
                    this.cameraManager.setMode('ORBIT');
                    this.world.transformControls.visible = true;
                    this.world.transformControls.enabled = true;
                    settings.resetRoll();
                }
            });

        folder.add(this.cameraManager, 'fpsMoveSpeed', 1, 300).name('FPS Speed');
        folder.add(this.cameraManager, 'orbitMoveSpeed', 1, 2000).name('Orbit Pan Speed');

        rollFolder.add(cam.rotation, 'z', -Math.PI, Math.PI).name('Roll (Z-axis)').listen();
        rollFolder.add(settings, 'resetRoll').name('Reset Roll');

        folder.add(settings, 'Eyes Openness', 0, 1).onChange((val) => {
            if (this.storyManager) {
                this.storyManager.setEyeOpenness(val, 0.5);
            }
        });

        folder.open();
    }

    _buildGizmoGUI() {
        const gizmoModes = { Move: 'translate', Rotate: 'rotate', Scale: 'scale' };
        this.gizmoFolder.add(this.world.transformControls, 'mode', gizmoModes).name('Mode');
        this.gizmoFolder.add(this.world.transformControls, 'showX').name('Show X');
        this.gizmoFolder.add(this.world.transformControls, 'showY').name('Show Y');
        this.gizmoFolder.add(this.world.transformControls, 'showZ').name('Show Z');
    }

    _buildTransformGUI(obj) {
        const title = obj.name ? obj.name : "Transform";
        const folder = this.gui.addFolder(`${title} (Transform)`);

        let oldTransform = {
            position: obj.position.clone(),
            rotation: obj.rotation.clone(),
            scale: obj.scale.clone()
        };

        const onFinishChange = () => {
            const newTransform = {
                position: obj.position.clone(),
                rotation: obj.rotation.clone(),
                scale: obj.scale.clone()
            };
            if (!oldTransform.position.equals(newTransform.position) ||
                !oldTransform.rotation.equals(newTransform.rotation) ||
                !oldTransform.scale.equals(newTransform.scale)) {

                const command = new TransformCommand(obj, oldTransform, newTransform);
                this.history.execute(command);
                oldTransform = newTransform;
            }
        };

        const posFolder = folder.addFolder('Position');
        posFolder.add(obj.position, 'x').step(1).decimals(2).listen().onFinishChange(onFinishChange);
        posFolder.add(obj.position, 'y').step(1).decimals(2).listen().onFinishChange(onFinishChange);
        posFolder.add(obj.position, 'z').step(1).decimals(2).listen().onFinishChange(onFinishChange);
        posFolder.open();

        if (!obj.isPointLight && !obj.isAmbientLight) {
            const rotationInDegrees = {
                get x() { return THREE.MathUtils.radToDeg(obj.rotation.x); },
                set x(v) { obj.rotation.x = THREE.MathUtils.degToRad(v); },
                get y() { return THREE.MathUtils.radToDeg(obj.rotation.y); },
                set y(v) { obj.rotation.y = THREE.MathUtils.degToRad(v); },
                get z() { return THREE.MathUtils.radToDeg(obj.rotation.z); },
                set z(v) { obj.rotation.z = THREE.MathUtils.degToRad(v); }
            };

            const rotFolder = folder.addFolder('Rotation');
            rotFolder.add(rotationInDegrees, 'x', -180, 180).step(1).decimals(2).listen().onFinishChange(onFinishChange);
            rotFolder.add(rotationInDegrees, 'y', -180, 180).step(1).decimals(2).listen().onFinishChange(onFinishChange);
            rotFolder.add(rotationInDegrees, 'z', -180, 180).step(1).decimals(2).listen().onFinishChange(onFinishChange);
        }

        if (!obj.isLight) {
            const scaleFolder = folder.addFolder('Scale');
            scaleFolder.add(obj.scale, 'x', 0.01).step(0.01).decimals(2).listen().onFinishChange(onFinishChange);
            scaleFolder.add(obj.scale, 'y', 0.01).step(0.01).decimals(2).listen().onFinishChange(onFinishChange);
            scaleFolder.add(obj.scale, 'z', 0.01).step(0.01).decimals(2).listen().onFinishChange(onFinishChange);
        }

        return folder;
    }

    _buildLightGUI(lightObject) {
        const folder = this.gui.addFolder(`${lightObject.name} Properties`);
        const isFloatLight = lightObject.isAmbientLight || lightObject.isHemisphereLight;
        const intensityStep = isFloatLight ? 0.01 : 1;
        const intensityDefaultMax = isFloatLight ? 2 : 200;
        const currentIntensity = lightObject.intensity;
        const intensityMax = Math.max(intensityDefaultMax, currentIntensity * 1.5);

        folder.addColor(new ColorGUIHelper(lightObject, 'color'), 'color').name('Color');
        folder.add(lightObject, 'intensity', 0, intensityMax, intensityStep).name('Intensity');

        if (lightObject.distance !== undefined) {
            folder.add(lightObject, 'distance', 0, 2000).name('Range (Distance)');
        }

        if (lightObject.decay !== undefined) {
            folder.add(lightObject, 'decay', 0, 5).step(0.1).name('Decay (Fade)');
        }

        if (lightObject.angle !== undefined) {
            // Angle di Three.js itu Radians (Maksimal Math.PI/2 atau 90 derajat)
            folder.add(lightObject, 'angle', 0, Math.PI / 2)
                .name('Width (Angle)')
                .onChange(() => {
                    // Update Helper garis-garis saat angle berubah
                    if (lightObject.userData.helper) lightObject.userData.helper.update();
                });
        }

        if (lightObject.penumbra !== undefined) {
            folder.add(lightObject, 'penumbra', 0, 1).name('Softness (Penumbra)');
        }

        return folder;
    }

    _buildAnimationGUI(model) {
        const folder = this.gui.addFolder(`${model.name} Animations`);
        let targetObject = model;
        const sceneChild = model.children.find(child => child.isScene);
        if (sceneChild) targetObject = sceneChild;

        if (!model.mixer) model.mixer = new THREE.AnimationMixer(targetObject);

        let lastAction = null;
        const helper = { currentAnimation: 'None' };
        const actions = {};
        const animationNames = ['None'];
        const animations = model.animations || [];

        animations.forEach((clip) => {
            const action = model.mixer.clipAction(clip);
            actions[clip.name] = action;
            animationNames.push(clip.name);
        });

        folder.add(helper, 'currentAnimation', animationNames).name('Animation').onChange((name) => {
            const fadeDuration = 0.3;
            if (lastAction) lastAction.fadeOut(fadeDuration);
            if (name === 'None') {
                lastAction = null;
                return;
            }
            const newAction = actions[name];
            newAction.reset().fadeIn(fadeDuration).play();
            lastAction = newAction;
        });
        return folder;
    }
}