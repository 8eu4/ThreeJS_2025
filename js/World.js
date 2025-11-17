// js/World.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';

export class World {
    constructor(container, state) {
        this.container = container;
        this.state = state;
        this.stateManager = null;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        this.orbitControls = null;
        this.transformControls = null;
        this.flyControls = null;
        this.isLookKeyActive = false;
        this.isLookMouseActive = false;
        this.isPanning = false;
        this.lastPanMouse = { x: 0, y: 0 };
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.ignoreNextClick = false; // <-- (1) TAMBAHAN BARU

        this._init();
    }

    setStateManager(manager) {
        this.stateManager = manager;
    }

    _init() {
        this.scene.background = new THREE.Color(0xEEEEEE);
        this.camera.position.set(0, 15, 40);
        this.camera.lookAt(0, 0, 0);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.target.set(0, 5, 0);
        this.orbitControls.update();
        this.orbitControls.enabled = true;
        this.flyControls = new FlyControls(this.camera, this.renderer.domElement);
        this.flyControls.movementSpeed = 15.0;
        this.flyControls.rollSpeed = 0;
        this.flyControls.autoForward = false;
        this.flyControls.dragToLook = false;
        this.flyControls.lookSpeed = 0.0;
        this.flyControls.baseLookSpeed = 0.1;
        this.flyControls.panSpeed = 1.0;
        this.flyControls.enabled = false;
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.scene.add(this.transformControls);

        window.addEventListener('resize', () => this.onWindowResize());
        this.renderer.domElement.addEventListener('click', (e) => this.onCanvasClick(e));

        // --- (2) MODIFIKASI: Hapus listener 'dragging-changed' yang lama
        // this.transformControls.addEventListener('dragging-changed', (event) => {
        //     this.orbitControls.enabled = !event.value;
        // });
        // --- GANTI DENGAN INI ---
        this.transformControls.addEventListener('dragging-changed', (event) => {
            this.orbitControls.enabled = !event.value;
            // 'isGizmoDragging' tidak lagi diperlukan karena kita pakai 'ignoreNextClick'
        });


        this.renderer.domElement.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.renderer.domElement.addEventListener('mouseup', (e) => this._onMouseUp(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.renderer.domElement.addEventListener('contextmenu', (e) => this._onContextMenu(e));
    }

    _onContextMenu(event) {
        if (this.flyControls.enabled) {
            event.preventDefault();
        }
    }

    _onMouseMove(event) {
        if (!this.flyControls.enabled || !this.isPanning) return;

        const deltaX = event.clientX - this.lastPanMouse.x;
        const deltaY = event.clientY - this.lastPanMouse.y;
        const panFactor = (this.flyControls.panSpeed * this.flyControls.movementSpeed) / 1000;
        this.camera.translateX(-deltaX * panFactor);
        this.camera.translateY(deltaY * panFactor);
        this.lastPanMouse.x = event.clientX;
        this.lastPanMouse.y = event.clientY;
    }

    _updateLookControls() {
        if (this.isLookKeyActive || this.isLookMouseActive) {
            this.flyControls.lookSpeed = this.flyControls.baseLookSpeed;
        } else {
            this.flyControls.lookSpeed = 0.0;
        }
    }

    _onMouseDown(event) {
        if (!this.flyControls.enabled) return;

        event.preventDefault();

        if (event.button === 2) {
            event.preventDefault();
            this.isPanning = true;
            this.lastPanMouse.x = event.clientX;
            this.lastPanMouse.y = event.clientY;
        }
    }

    _onMouseUp(event) {
        if (!this.flyControls.enabled) return;
        if (event.button === 2) {
            this.isPanning = false;
        }
    }

    _onKeyDown(event) {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.tagName.toLowerCase() === 'input') return;
        if (event.key === 'Shift' && !event.repeat) {
            this.isLookKeyActive = true;
            if (this.flyControls.enabled) this._updateLookControls();
        }
    }
    _onKeyUp(event) {
        if (event.key === 'Shift') {
            this.isLookKeyActive = false;
            if (this.flyControls.enabled) this._updateLookControls();
        }
    }
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // --- (3) MODIFIKASI: Cek flag 'ignoreNextClick' ---
    onCanvasClick(event) {
        // --- TAMBAHAN ---
        // Jika flag ini true, berarti 'mouseUp' dari gizmo baru saja terjadi.
        // Abaikan 'click' ini dan reset flag-nya.
        if (this.ignoreNextClick) {
            this.ignoreNextClick = false;
            return;
        }
        // --- AKHIR TAMBAHAN ---

        if (this.transformControls.dragging || !this.stateManager || this.flyControls.enabled) {
            return;
        }

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.state.allSelectableObjects, true); 

        if (intersects.length > 0) {
            let objectToSelect = intersects[0].object;
            this.stateManager.setSelectedObject(objectToSelect);
            
        } else {
            this.stateManager.setSelectedObject(null); // Deselect
        }
    }

    start() {
        this.renderer.setAnimationLoop(() => this.animate());
    }

    animate() {
        const delta = this.clock.getDelta();

        if (this.orbitControls.enabled) {
            this.orbitControls.update();
        }
        if (this.flyControls.enabled) {
            this.flyControls.update(delta);
        }

        for (const obj of this.state.allSelectableObjects) {
            if (obj.mixer) {
                obj.mixer.update(delta);
            }
        }
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