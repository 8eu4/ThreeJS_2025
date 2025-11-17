// js/Commands.js

/**
 * Perintah untuk mencatat perubahan transform (posisi, rotasi, skala)
 */
export class TransformCommand {
    /**
     * @param {THREE.Object3D} object - Objek yang diubah
     * @param {object} oldTransform - { position, rotation, scale } LAMA
     * @param {object} newTransform - { position, rotation, scale } BARU
     */
    constructor(object, oldTransform, newTransform) {
        this.object = object;
        this.oldTransform = oldTransform;
        this.newTransform = newTransform;
        this.name = `Transform ${object.name}`;
    }

    execute() {
        // Terapkan transform BARU
        this.object.position.copy(this.newTransform.position);
        this.object.rotation.copy(this.newTransform.rotation);
        this.object.scale.copy(this.newTransform.scale);
        this.object.updateMatrixWorld(); // Penting
    }

    undo() {
        // Kembalikan transform LAMA
        this.object.position.copy(this.oldTransform.position);
        this.object.rotation.copy(this.oldTransform.rotation);
        this.object.scale.copy(this.oldTransform.scale);
        this.object.updateMatrixWorld(); // Penting
    }
    
}

/**
 * Perintah untuk menambah atau menghapus objek dari scene
 */
export class AddRemoveObjectCommand {
    constructor(object, state) {
        this.object = object;
        this.parent = object.parent;
        this.state = state;
        this.target = object.target; // Menangani light target
        
        // Simpan status
        this.wasSelectable = state.allSelectableObjects.includes(object);
        this.wasDraggable = state.draggableObjects.includes(object);
        this.wasTargetSelectable = this.target ? state.allSelectableObjects.includes(this.target) : false;

        this.name = `Remove ${object.name}`;
    }

    // Aksi: Menghapus
    execute() {
        if (this.target) this.parent.remove(this.target);
        this.parent.remove(this.object);

        // Hapus dari state
        if (this.target) this.state._removeObjectFromState(this.target);
        this.state._removeObjectFromState(this.object);

        // Update UI
        this.state.setSelectedObject(null);
        if (this.state.ui) {
            this.state.ui.removeGUIFromCache(this.object);
            this.state.ui.buildHierarchyPanel();
        }
    }

    // Undo: Menambahkan kembali
    undo() {
        // Tambahkan kembali ke scene
        if (this.target) this.parent.add(this.target);
        this.parent.add(this.object);

        // Tambahkan kembali ke state
        if (this.wasSelectable) this.state.allSelectableObjects.push(this.object);
        if (this.wasDraggable) this.state.draggableObjects.push(this.object);
        if (this.target && this.wasTargetSelectable) this.state.allSelectableObjects.push(this.target);

        // Update UI
        if (this.state.ui) {
            this.state.ui.buildHierarchyPanel();
        }
        // Pilih objeknya lagi
        this.state.setSelectedObject(this.object);
    }
}