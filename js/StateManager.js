// js/StateManager.js

import { AddRemoveObjectCommand } from './Commands.js';

export class StateManager {
    constructor(history) {
        this.allSelectableObjects = [];
        this.draggableObjects = [];
        this.selectedObject = null;
        this.history = history;

        // Referensi ke UI (untuk dipanggil saat state berubah)
        this.ui = null;
    }

    setUIManager(ui) {
        this.ui = ui;
    }

    // --- Logika Inti ---

    addObject(obj, { isSelectable = false, isDraggable = false } = {}) {
        if (isSelectable) {
            this.allSelectableObjects.push(obj);
        }
        if (isDraggable) {
            this.draggableObjects.push(obj);
        }

        // Beri tahu UI untuk update panel hierarki
        if (this.ui) {
            this.ui.buildHierarchyPanel();
        }
    }

    setSelectedObject(obj) {
        const oldSelection = this.selectedObject;

        // 1. Matikan Highlight Lama (Recursive)
        if (oldSelection) {
            oldSelection.traverse((child) => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.material.emissive.setHex(0x000000);
                }
            });
        }

        if (this.ui) this.ui.hideActiveGUIs();

        // 2. Set Baru
        this.selectedObject = obj;

        // 3. Nyalakan Highlight Baru (Recursive untuk Parent)
        if (this.selectedObject) {
            this.selectedObject.traverse((child) => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.material.emissive.setHex(0x555555); // Abu-abu
                }
            });

            if (this.ui) this.ui.showGUIFor(this.selectedObject);
        }

        if (this.ui) {
            this.ui.updateHierarchyHighlight();
            this.ui.updateTransformControls(this.selectedObject, this.draggableObjects);
        }
        this._handleWaypointIsolation(this.selectedObject);
    }

    _handleWaypointIsolation(target) {
        // Cek apakah target yang dipilih adalah Waypoint Cinematic?
        const isTargetWaypoint = target && target.userData && target.userData.isWaypoint;

        // Loop ke semua objek yang bisa diseleksi (termasuk semua waypoint)
        this.allSelectableObjects.forEach(obj => {
            // Kita hanya ingin memproses sesama Waypoint
            if (obj.userData && obj.userData.isWaypoint) {
                
                if (isTargetWaypoint) {
                    // MODE FOKUS: Ada waypoint dipilih
                    // Jika ini objek yang dipilih -> TAMPILKAN
                    // Jika ini objek lain -> SEMBUNYIKAN
                    obj.visible = (obj === target);
                } else {
                    // MODE RESET: Tidak ada waypoint dipilih (Deselect / Pilih Monster dll)
                    // Tampilkan semua kembali biar gampang dicari lagi
                    obj.visible = true;
                }
            }
        });
    }

    deleteSelectedObject() {
        if (!this.selectedObject) return;

        // Buat perintah baru dan jalankan via history
        const command = new AddRemoveObjectCommand(this.selectedObject, this);
        this.history.execute(command);
    }

    // Fungsi internal helper
    _removeObjectFromState(obj) {
        let index = this.allSelectableObjects.indexOf(obj);
        if (index > -1) this.allSelectableObjects.splice(index, 1);

        index = this.draggableObjects.indexOf(obj);
        if (index > -1) this.draggableObjects.splice(index, 1);
    }
}
