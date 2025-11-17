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

        // 1. Hapus highlight/GUI dari objek lama
        if (oldSelection) {
            if (oldSelection.material && oldSelection.material.emissive) {
                oldSelection.material.emissive.setHex(0x000000);
            }
        }
        // Beri tahu UI untuk menyembunyikan GUI lama
        if (this.ui) {
            this.ui.hideActiveGUIs();
        }

        // 2. Set objek baru
        this.selectedObject = obj;

        // 3. Tambah highlight/GUI ke objek baru
        if (this.selectedObject) {
            // Highlight
            if (this.selectedObject.material && this.selectedObject.material.emissive) {
                this.selectedObject.material.emissive.setHex(0x555555);
            }
            // Beri tahu UI untuk menampilkan GUI yang relevan
            if (this.ui) {
                this.ui.showGUIFor(this.selectedObject);
            }
        }

        // 4. Update sorotan hierarki & gizmo
        if (this.ui) {
            this.ui.updateHierarchyHighlight();
            this.ui.updateTransformControls(this.selectedObject, this.draggableObjects);
        }
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
