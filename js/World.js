// js/World.js
import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export class World {
    constructor(container, state) {
        this.container = container;
        this.state = state;
        this.stateManager = null;
        
        this.scene = new THREE.Scene();
        
        // Kamera di-init di sini, tapi nanti "diambil" oleh CameraManager
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        
        // Kontrol Gizmo (Tetap di sini atau pindah ke UI, tapi biarkan dulu)
        this.transformControls = null;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.ignoreNextClick = false;

        this._init();
    }

    setStateManager(manager) {
        this.stateManager = manager;
    }

    _init() {
        this.scene.background = new THREE.Color(0x000000); // Gelap untuk Horror
        // Posisi awal kamera (sementara)
        this.camera.position.set(0, 15, 40);
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Gizmo Edit (Transform Controls)
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.scene.add(this.transformControls);

        this.transformControls.addEventListener('dragging-changed', (event) => {
            // Nanti kita hubungkan ke CameraManager untuk disable orbit saat drag
            // Untuk sekarang biarkan kosong atau comment dulu
            // if (this.cameraManager) this.cameraManager.orbitControls.enabled = !event.value;
        });

        window.addEventListener('resize', () => this.onWindowResize());
        this.renderer.domElement.addEventListener('click', (e) => this.onCanvasClick(e));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onCanvasClick(event) {
        if (this.ignoreNextClick) {
            this.ignoreNextClick = false;
            return;
        }

        // Cek dragging gizmo
        if (this.transformControls.dragging || !this.stateManager) {
            return;
        }

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.state.allSelectableObjects, true); 

        if (intersects.length > 0) {
            let objectToSelect = intersects[0].object;
            // Cari parent group
            while (objectToSelect.parent && objectToSelect.parent.type !== 'Scene') {
                objectToSelect = objectToSelect.parent;
            }
            this.stateManager.setSelectedObject(objectToSelect);
        } else {
            this.stateManager.setSelectedObject(null);
        }
    }

    start() {
        this.renderer.setAnimationLoop(() => this.animate());
    }

    setCameraManager(manager) {
        this.cameraManager = manager;
    }
    setLightingManager(manager) {
        this.lightingManager = manager;
    }
    setStoryManager(manager) {
        this.storyManager = manager;
    }

    animate() {
        const delta = this.clock.getDelta();

        if (this.cameraManager) {
            this.cameraManager.update(delta);
        }

        if (this.lightingManager) {
            this.lightingManager.update(delta);
        }

        // ANIMASI (Mixer)
        for (const obj of this.state.allSelectableObjects) {
            if (obj.mixer) {
                obj.mixer.update(delta);
            }
        }
        
        // Helper Update
        this.scene.traverse((node) => {
            if (node.isSpotLightHelper || node.isDirectionalLightHelper) {
                node.update();
            }
        });

        this.renderer.render(this.scene, this.camera);
    }

    add(object) { this.scene.add(object); }
    remove(object) { this.scene.remove(object); }
}