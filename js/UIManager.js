// js/UIManager.js
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import * as THREE from 'three'; 
import { MinMaxGUIHelper, ColorGUIHelper } from './helper.js';
import { TransformCommand } from './Commands.js';

export class UIManager {
    // TERIMA cameraManager DI SINI (Parameter ke-5)
    constructor(world, state, history, saveManager, cameraManager) {
        this.world = world;
        this.state = state;
        this.stateManager = null;
        this.history = history;
        this.saveManager = saveManager;
        this.cameraManager = cameraManager; // Simpan referensi

        //--- BUAT INPUT FILE UNTUK LOAD ---
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'application/json';
        this.fileInput.style.display = 'none';
        this.fileInput.addEventListener('change', (event) => this._handleFileLoad(event));
        document.body.appendChild(this.fileInput);

        this.gui = new GUI();
        this.hierarchyListEl = document.getElementById('hierarchy-list');

        this.cameraFolder = this.gui.addFolder('Camera');
        this.gizmoFolder = this.gui.addFolder('Gizmo');
        this.saveLoadFolder = this.gui.addFolder('Save/Load');

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
        this._buildCameraModeGUI(); // <-- Ini yang tadi error, sekarang sudah diperbaiki
        this._buildGizmoGUI();
        this._buildSaveLoadGUI();

        this.cameraFolder.open();
        this.gizmoFolder.open();
        this.saveLoadFolder.open();
    }

    // ... (Fungsi _setupTransformControlsListeners, setStateManager, _buildSaveLoadGUI, _handleFileLoad, _createCollapsibleSection, buildHierarchyPanel, _buildHierarchyNode, updateHierarchyHighlight, updateTransformControls, hideActiveGUIs, showGUIFor, removeGUIFromCache SAMA PERSIS SEPERTI SEBELUMNYA. BIARKAN SAJA.) ...
    
    // AGAR TIDAK KEPANJANGAN, SAYA HANYA TULIS FUNGSI YANG BERUBAH DI BAWAH INI.
    // TAPI JIKA ANDA COPY PASTE, PASTIKAN FUNGSI LAINNYA TETAP ADA.
    // SARAN SAYA: TIMPA SAJA FILE LAMA DENGAN KODE LENGKAP DI BAWAH INI AGAR AMAN.
    
    _setupTransformControlsListeners() {
        this.world.transformControls.addEventListener('mouseDown', (event) => {
            // Nonaktifkan orbit controls via manager
            if (this.cameraManager) {
                this.cameraManager.orbitControls.enabled = false;
            }

            const object = this.world.transformControls.object;
            if (object) {
                this._tempOldTransform = {
                    position: object.position.clone(),
                    rotation: object.rotation.clone(),
                    scale: object.scale.clone()
                };
            }
        });

        this.world.transformControls.addEventListener('mouseUp', (event) => {
            this.world.ignoreNextClick = true;
            
            // Aktifkan lagi orbit controls via manager (kalau mode Orbit)
            if (this.cameraManager && this.cameraManager.activeMode === 'ORBIT') {
                this.cameraManager.orbitControls.enabled = true;
            }

            const object = this.world.transformControls.object;
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
            // Skip CameraRig parts from hierarchy
            if (child.name === "CameraRig_PlayerBody") return;

            if (child.isLight) {
                this._buildHierarchyNode(child, lightsContainer, 0);
            } else {
                const isHelper = child.type.endsWith('Helper');
                const isGround = child.name === "Ground Plane";
                // Skip Gizmo Controls
                const isGizmo = child.type === 'TransformControls';
                
                if (!isHelper && !isGround && !isGizmo) {
                    this._buildHierarchyNode(child, objectsContainer, 0);
                }
            }
        });
    }

    _buildHierarchyNode(object, parentElement, depth) {
        if (!this.state.allSelectableObjects.includes(object)) {
            object.children.forEach(child => {
                this._buildHierarchyNode(child, parentElement, depth);
            });
            return;
        }

        const hasChildren = object.children.length > 0;
        const item = document.createElement('div');
        item.className = 'hierarchy-item';

        const content = document.createElement('div');
        content.className = 'hierarchy-item-content';
        content.style.paddingLeft = `${depth * 15}px`;
        content.dataset.objectUuid = object.uuid;

        const label = document.createElement('span');
        label.className = 'hierarchy-label';
        label.textContent = object.name || `[${object.type}]`;

        const toggle = document.createElement('span');
        toggle.className = 'hierarchy-toggle';

        content.appendChild(label);
        content.appendChild(toggle);
        item.appendChild(content);

        parentElement.appendChild(item);

        let childContainer = null;
        let hasValidChildren = false;

        if (hasChildren) {
            childContainer = document.createElement('div');
            childContainer.className = 'hierarchy-children';
            object.children.forEach(child => {
                this._buildHierarchyNode(child, childContainer, depth + 1);
            });
            if (childContainer.children.length > 0) {
                hasValidChildren = true;
                parentElement.appendChild(childContainer);
            }
        }

        if (hasValidChildren) {
            toggle.textContent = '►';
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                item.classList.toggle('open');
                toggle.textContent = item.classList.contains('open') ? '▼' : '►';
            });
        } else {
            toggle.style.display = 'none';
        }

        content.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.stateManager) {
                this.stateManager.setSelectedObject(object);
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
                let currentItem = itemToSelect.closest('.hierarchy-item');
                if (!currentItem) return;
                let parentContainer = currentItem.closest('.hierarchy-children');
                while (parentContainer) {
                    let parentItem = parentContainer.previousElementSibling;
                    if (parentItem && parentItem.classList.contains('hierarchy-item') && !parentItem.classList.contains('open')) {
                        parentItem.classList.add('open');
                        const toggle = parentItem.querySelector('.hierarchy-item-content .hierarchy-toggle');
                        if (toggle) toggle.textContent = '▼';
                    }
                    parentContainer = parentItem ? parentItem.closest('.hierarchy-children') : null;
                }
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
        // this.cameraFolder.add(cam, 'zoom', 0.1, 10, 0.1).name('Zoom').onChange(updateCamera);
    }

    // --- (***) FUNGSI INI YANG DI-REVISI (***) ---

    _buildCameraModeGUI() {
        const cam = this.world.camera;
        const folder = this.cameraFolder.addFolder('Mode Settings');
        const rollFolder = folder.addFolder('Camera Roll');

        const settings = {
            mode: 'Orbit', // Default
            'Eyes Closed': false,
            resetRoll: () => { cam.rotation.z = 0; }
        };

        // Switcher Mode
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

        // --- UPDATE VARIABEL DI SINI ---
        // Hubungkan ke variabel baru di CameraManager.js
        folder.add(this.cameraManager, 'fpsMoveSpeed', 100, 3000).name('FPS Speed');
        folder.add(this.cameraManager, 'orbitMoveSpeed', 100, 2000).name('Orbit Pan Speed');
        // -------------------------------

        rollFolder.add(cam.rotation, 'z', -Math.PI, Math.PI).name('Roll (Z-axis)').listen();
        rollFolder.add(settings, 'resetRoll').name('Reset Roll');
        
        folder.add(settings, 'Eyes Closed').onChange((isClosed) => {
            if (isClosed) {
                document.body.classList.add('eyes-closed');
            } else {
                document.body.classList.remove('eyes-closed');
            }
        });

        folder.open();
    }
    // --- AKHIR REVISI ---

    _buildGizmoGUI() {
        const gizmoModes = { Move: 'translate', Rotate: 'rotate', Scale: 'scale' };
        this.gizmoFolder.add(this.world.transformControls, 'mode', gizmoModes).name('Mode');
        this.gizmoFolder.add(this.world.transformControls, 'showX').name('Show X');
        this.gizmoFolder.add(this.world.transformControls, 'showY').name('Show Y');
        this.gizmoFolder.add(this.world.transformControls, 'showZ').name('Show Z');
    }

    _buildTransformGUI(obj) {
        const folder = this.gui.addFolder(`${obj.name} (Transform)`);

        let oldTransform = {
            position: obj.position.clone(),
            rotation: obj.rotation.clone(),
            scale: obj.scale.clone()
        };

        const onTransformFinishChange = () => {
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

        const rotationInDegrees = {
            get x() { return THREE.MathUtils.radToDeg(obj.rotation.x); },
            set x(v) { obj.rotation.x = THREE.MathUtils.degToRad(v); },
            get y() { return THREE.MathUtils.radToDeg(obj.rotation.y); },
            set y(v) { obj.rotation.y = THREE.MathUtils.degToRad(v); },
            get z() { return THREE.MathUtils.radToDeg(obj.rotation.z); },
            set z(v) { obj.rotation.z = THREE.MathUtils.degToRad(v); }
        };

        const rotFolder = folder.addFolder('Rotation');
        rotFolder.add(rotationInDegrees, 'x', -180, 180).step(1).decimals(2).listen().onFinishChange(onTransformFinishChange);
        rotFolder.add(rotationInDegrees, 'y', -180, 180).step(1).decimals(2).listen().onFinishChange(onTransformFinishChange);
        rotFolder.add(rotationInDegrees, 'z', -180, 180).step(1).decimals(2).listen().onFinishChange(onTransformFinishChange);

        const scaleFolder = folder.addFolder('Scale');
        scaleFolder.add(obj.scale, 'x', 0.01).step(0.01).decimals(2).listen().onFinishChange(onTransformFinishChange);
        scaleFolder.add(obj.scale, 'y', 0.01).step(0.01).decimals(2).listen().onFinishChange(onTransformFinishChange);
        scaleFolder.add(obj.scale, 'z', 0.01).step(0.01).decimals(2).listen().onFinishChange(onTransformFinishChange);

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