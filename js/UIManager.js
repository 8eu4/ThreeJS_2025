// js/UIManager.js
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import * as THREE from 'three';
import { MinMaxGUIHelper, ColorGUIHelper } from './helper.js';
import { TransformCommand } from './Commands.js';

export class UIManager {
    constructor(world, state, history, saveManager) {
        this.world = world;
        this.state = state;
        this.stateManager = null;
        this.history = history;
        this.saveManager = saveManager;

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
        this._buildCameraModeGUI();
        this._buildGizmoGUI();
        this._buildSaveLoadGUI();

        this.cameraFolder.open();
        this.gizmoFolder.open();
        this.saveLoadFolder.open();
    }

    _setupTransformControlsListeners() {
        // Saat user mulai men-drag (menekan mouse)
        this.world.transformControls.addEventListener('mouseDown', (event) => {
            // Nonaktifkan fly controls agar tidak bentrok
            if (this.world.flyControls) {
                this.world.flyControls.enabled = false;
            }

            // Simpan state LAMA dari objek yang dipilih
            const object = this.world.transformControls.object; // <-- BENAR
            if (object) {
                this._tempOldTransform = {
                    position: object.position.clone(),
                    rotation: object.rotation.clone(),
                    scale: object.scale.clone()
                };
            }
        });

        // Saat user selesai men-drag (melepas mouse)
        this.world.transformControls.addEventListener('mouseUp', (event) => {

            const object = this.world.transformControls.object; // <-- BENAR
            if (!this._tempOldTransform || !object) {
                return;
            }

            // Dapatkan state BARU
            const newTransform = {
                position: object.position.clone(),
                rotation: object.rotation.clone(),
                scale: object.scale.clone()
            };

            // ---- INTI LOGIKA UNDO ----
            // Buat Perintah (Command) baru
            const command = new TransformCommand(object, this._tempOldTransform, newTransform);

            // Jalankan perintah melalui History Manager
            this.history.execute(command);
            // -------------------------

            this._tempOldTransform = null;
        });

    }

    setStateManager(manager) {
        this.stateManager = manager;
    }


    _buildSaveLoadGUI() {
        const saveLoadSettings = {
            saveScene: () => {
                this.saveManager.saveScene();
            },
            loadScene: () => {
                this.fileInput.click(); // Panggil input file tersembunyi
            }
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

        // Reset input agar bisa load file yang sama 2x
        event.target.value = null;
    }

    // --- (1) FUNGSI HELPER BARU (DIPERBAIKI) ---
    _createCollapsibleSection(parentElement, title, startOpen = true) {
        const sectionItem = document.createElement('div');
        sectionItem.className = 'hierarchy-item'; 
        if (startOpen) {
            sectionItem.classList.add('open');
        }

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
        childContainer.className = 'hierarchy-children'; // Kontainer untuk item
        
        // --- PERBAIKAN STRUKTUR HTML ---
        // 'sectionItem' (judul) dan 'childContainer' (isi) harus SIBLING
        parentElement.appendChild(sectionItem);
        parentElement.appendChild(childContainer);
        // --- AKHIR PERBAIKAN ---

        content.addEventListener('click', (e) => {
            e.stopPropagation();
            sectionItem.classList.toggle('open');
            toggle.textContent = sectionItem.classList.contains('open') ? '▼' : '►';
        });

        return childContainer; // Kembalikan kontainer anaknya
    }

    // --- (2) FUNGSI buildHierarchyPanel (TIDAK BERUBAH) ---
    buildHierarchyPanel() {
        this.hierarchyListEl.innerHTML = ""; // Clear

        // 1. Buat judul dan kontainer
        const lightsContainer = this._createCollapsibleSection(this.hierarchyListEl, "Lights", true);
        const objectsContainer = this._createCollapsibleSection(this.hierarchyListEl, "Objects", true);

        // 2. Pilah dan bangun node
        this.world.scene.children.forEach(child => {
            if (child.isLight) {
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

    // --- (3) FUNGSI _buildHierarchyNode (DIPERBAIKI) ---
    _buildHierarchyNode(object, parentElement, depth) {
        // 1. Cek apakah objek ini selectable.
        if (!this.state.allSelectableObjects.includes(object)) {
            // Jika tidak, abaikan objek ini TAPI TETAP proses anak-anaknya.
            object.children.forEach(child => {
                this._buildHierarchyNode(child, parentElement, depth);
            });
            return; // Selesai untuk objek ini
        }

        // 2. Objek ini selectable, mari kita buat item UI-nya.
        const hasChildren = object.children.length > 0;

        // 3. Buat elemen DOM
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
        
        // --- PERBAIKAN STRUKTUR HTML ---
        // Tambahkan 'item' ke parent SEKARANG
        parentElement.appendChild(item);
        // --- AKHIR PERBAIKAN ---

        // 4. Buat kontainer anak HANYA jika ada anak
        let childContainer = null;
        let hasValidChildren = false;

        if (hasChildren) {
            childContainer = document.createElement('div');
            childContainer.className = 'hierarchy-children';

            // Panggil rekursif untuk SEMUA anak
            object.children.forEach(child => {
                this._buildHierarchyNode(child, childContainer, depth + 1);
            });

            // Cek apakah kontainer anak benar-benar punya isi
            if (childContainer.children.length > 0) {
                hasValidChildren = true;
                // --- PERBAIKAN STRUKTUR HTML ---
                // Tambahkan 'childContainer' sebagai SIBLING dari 'item'
                parentElement.appendChild(childContainer);
                // --- AKHIR PERBAIKAN ---
            }
        }

        // 5. Atur toggle berdasarkan apakah ada anak yang VALID
        if (hasValidChildren) {
            toggle.textContent = '►'; // Tutup by default

            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                item.classList.toggle('open');
                toggle.textContent = item.classList.contains('open') ? '▼' : '►';
            });
        } else {
            toggle.style.display = 'none'; // Sembunyikan toggle
        }

        // 6. Event listener untuk seleksi (di 'content')
        content.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.stateManager) {
                this.stateManager.setSelectedObject(object);
            }
        });

        // 7. HAPUS DARI SINI
        // parentElement.appendChild(item);
    }
    // --- AKHIR PERBAIKAN HIERARKI ---

    updateHierarchyHighlight() {
        const items = this.hierarchyListEl.querySelectorAll('.hierarchy-item-content');

        items.forEach(itemContent => {
            itemContent.classList.remove('selected');
        });

        if (this.state.selectedObject) {
            const selectedUUID = this.state.selectedObject.uuid;
            // Temukan 'content' berdasarkan UUID
            const itemToSelect = this.hierarchyListEl.querySelector(`[data-object-uuid="${selectedUUID}"]`);

            if (itemToSelect) {
                itemToSelect.classList.add('selected');

                // Dapatkan .hierarchy-item terdekat
                let currentItem = itemToSelect.closest('.hierarchy-item');
                if (!currentItem) return; // Pengaman jika item tidak ditemukan
                
                // --- PERBAIKAN LOGIKA EXPAND ---
                // Dapatkan .hierarchy-children terdekat (parent container)
                let parentContainer = currentItem.closest('.hierarchy-children');

                while (parentContainer) {
                    // Dapatkan .hierarchy-item dari parent container itu
                    // Ini adalah SIBLING SEBELUMNYA
                    let parentItem = parentContainer.previousElementSibling;

                    if (parentItem && parentItem.classList.contains('hierarchy-item') && !parentItem.classList.contains('open')) {
                        // Buka parent
                        parentItem.classList.add('open');
                        // Update togglenya
                        const toggle = parentItem.querySelector('.hierarchy-item-content .hierarchy-toggle');
                        if (toggle) toggle.textContent = '▼';
                    }
                    // Naik ke atas
                    parentContainer = parentItem ? parentItem.closest('.hierarchy-children') : null;
                }
                // --- AKHIR PERBAIKAN ---
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
        if (this.activeLightGUI) {
            this.activeLightGUI.destroy();
            this.activeLightGUI = null;
        }
        if (this.activeAnimationGUI) {
            this.activeAnimationGUI.destroy();
            this.activeAnimationGUI = null;
        }
        if (this.activeTransformGUI) {
            this.activeTransformGUI.destroy();
            this.activeTransformGUI = null;
        }
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

    // --- Metode Pembuatan GUI Internal (Tidak Berubah) ---

    _buildCameraProjectionGUI() {
        const cam = this.world.camera;
        const updateCamera = () => cam.updateProjectionMatrix();
        this.cameraFolder.add(cam, 'fov', 1, 180).onChange(updateCamera);
        const minMaxGUIHelper = new MinMaxGUIHelper(cam, 'near', 'far', 0.1);
        this.cameraFolder.add(minMaxGUIHelper, 'min', 0.01, 50, 0.01).name('near').onChange(updateCamera);
        this.cameraFolder.add(minMaxGUIHelper, 'max', 0.1, 20000, 0.1).name('far').onChange(updateCamera);
        this.cameraFolder.add(cam, 'zoom', 0.1, 10, 0.1).name('Zoom').onChange(updateCamera);
    }

    _buildCameraModeGUI() {
        const cam = this.world.camera;
        const orbit = this.world.orbitControls;
        const fpc = this.world.flyControls;
        const gizmo = this.world.transformControls;
        const folder = this.cameraFolder.addFolder('Camera Controls');
        const fpSettingsFolder = folder.addFolder('First Person Settings');
        const rollFolder = folder.addFolder('Camera Roll');
        const settings = {
            mode: 'Orbit',
            'Eyes Closed': false,
            resetRoll: () => { cam.rotation.z = 0; }
        };
        folder.add(settings, 'mode', ['Orbit', 'First Person']).name('Mode')
            .onChange((mode) => {
                if (mode === 'First Person') {
                    fpc.enabled = true;
                    orbit.enabled = false;
                    gizmo.enabled = false;
                    fpSettingsFolder.open();
                    rollFolder.open();
                    if (this.stateManager) {
                        this.stateManager.setSelectedObject(null);
                    }
                } else {
                    orbit.enabled = true;
                    gizmo.enabled = true;
                    fpc.enabled = false;
                    fpSettingsFolder.close();
                    settings.resetRoll();
                    rollFolder.close();
                }
            });
        fpSettingsFolder.add(fpc, 'movementSpeed', 1, 50).name('Move Speed');
        fpSettingsFolder.add(fpc, 'baseLookSpeed', 0.01, 0.5).name('Look Sensitivity');
        fpSettingsFolder.add(fpc, 'panSpeed', 0.1, 5.0).name('Pan Speed');
        fpSettingsFolder.close();
        rollFolder.add(cam.rotation, 'z', -Math.PI, Math.PI).name('Roll (Z-axis)').listen();
        rollFolder.add(settings, 'resetRoll').name('Reset Roll');
        rollFolder.close();
        folder.add(settings, 'Eyes Closed').onChange((isClosed) => {
            if (isClosed) {
                document.body.classList.add('eyes-closed');
            } else {
                document.body.classList.remove('eyes-closed');
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
        // Folder sekarang ditambahkan ke root GUI
        const folder = this.gui.addFolder(`${obj.name} (Transform)`);

        // --- (1) Simpan state LAMA saat GUI dibuat ---
        let oldTransform = {
            position: obj.position.clone(),
            rotation: obj.rotation.clone(),
            scale: obj.scale.clone()
        };

        // --- (2) Buat satu fungsi callback untuk semua ---
        const onTransformFinishChange = () => {
            // Dapatkan state BARU setelah diubah oleh GUI
            const newTransform = {
                position: obj.position.clone(),
                rotation: obj.rotation.clone(),
                scale: obj.scale.clone()
            };

            // Buat Perintah (Command) baru
            const command = new TransformCommand(obj, oldTransform, newTransform);
            
            // Jalankan perintah melalui History Manager
            this.history.execute(command);
            
            // PENTING: Update 'oldTransform' 
            oldTransform = newTransform;
        };


        // --- (3) Tambahkan .onFinishChange() ke setiap controller ---
        const posFolder = folder.addFolder('Position');
        posFolder.add(obj.position, 'x').step(0.1).listen()
            .onFinishChange(onTransformFinishChange);
        posFolder.add(obj.position, 'y').step(0.1).listen()
            .onFinishChange(onTransformFinishChange);
        posFolder.add(obj.position, 'z').step(0.1).listen()
            .onFinishChange(onTransformFinishChange);

        const rotFolder = folder.addFolder('Rotation');
        rotFolder.add(obj.rotation, 'x', -Math.PI, Math.PI).step(0.01).listen()
            .onFinishChange(onTransformFinishChange);
        rotFolder.add(obj.rotation, 'y', -Math.PI, Math.PI).step(0.01).listen()
            .onFinishChange(onTransformFinishChange);
        rotFolder.add(obj.rotation, 'z', -Math.PI, Math.PI).step(0.01).listen()
            .onFinishChange(onTransformFinishChange);

        const scaleFolder = folder.addFolder('Scale');
        scaleFolder.add(obj.scale, 'x', 0.01).step(0.01).listen()
            .onFinishChange(onTransformFinishChange);
        scaleFolder.add(obj.scale, 'y', 0.01).step(0.01).listen()
            .onFinishChange(onTransformFinishChange);
        scaleFolder.add(obj.scale, 'z', 0.01).step(0.01).listen()
            .onFinishChange(onTransformFinishChange);

        return folder;
    }

    _buildLightGUI(lightObject) {
        // Folder sekarang ditambahkan ke root GUI
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
        // Folder sekarang ditambahkan ke root GUI
        const folder = this.gui.addFolder(`${model.name} Animations`);

        let targetObject = model;
        const sceneChild = model.children.find(child => child.isScene);
        if (sceneChild) {
            targetObject = sceneChild;
        }

        if (!model.mixer) {
            model.mixer = new THREE.AnimationMixer(targetObject);
        }

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