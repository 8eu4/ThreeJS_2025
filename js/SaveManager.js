// js/SaveManager.js

export class SaveManager {
    constructor(state, history) {
        this.state = state;
        this.history = history;
    }

    /**
     * Mengumpulkan data transform dari semua objek yang bisa dipilih.
     */
    _collectSceneData() {
        const sceneData = [];
        const objectsToSave = this.state.allSelectableObjects;

        objectsToSave.forEach(obj => {
            // Kita hanya menyimpan objek yang punya parent (ada di scene)
            if (obj.parent) { 
                sceneData.push({
                    uuid: obj.uuid,
                    name: obj.name, // Simpan nama untuk debugging
                    position: obj.position.clone(),
                    rotation: obj.rotation.clone(),
                    scale: obj.scale.clone()
                });
            }
        });
        return sceneData;
    }

    /**
     * Memicu download file JSON
     */
    saveScene() {
        const data = this._collectSceneData();
        const jsonString = JSON.stringify(data, null, 2); // 'null, 2' untuk format cantik
        
        this._download(jsonString, 'scene_save.json', 'application/json');
        console.log("Scene saved!", data);
    }

    /**
     * Menerapkan data dari file JSON ke scene yang ada.
     */
    loadScene(jsonString) {
        try {
            const sceneData = JSON.parse(jsonString);

            // Buat Peta (Map) untuk pencarian objek cepat berdasarkan UUID
            const objectMap = new Map();
            this.state.allSelectableObjects.forEach(obj => {
                objectMap.set(obj.uuid, obj);
            });

            // Terapkan transform
            sceneData.forEach(data => {
                const obj = objectMap.get(data.uuid);
                if (obj) {
                    obj.position.copy(data.position);
                    obj.rotation.copy(data.rotation);
                    obj.scale.copy(data.scale);
                    obj.updateMatrixWorld(); // Penting untuk update
                } else {
                    console.warn(`Object not found during load (UUID: ${data.uuid}, Name: ${data.name})`);
                }
            });

            // Setelah load, bersihkan history undo/redo
            if (this.history) {
                this.history.clear();
            }

            // Update UI (jika ada objek yang terpilih)
            if (this.state.ui && this.state.selectedObject) {
                this.state.ui.showGUIFor(this.state.selectedObject);
            }
            
            console.log("Scene loaded successfully.");

        } catch (error) {
            console.error("Failed to load scene:", error);
            alert("Error: Gagal membaca atau mem-parsing file scene.");
        }
    }

    /**
     * Helper internal untuk membuat dan mengklik link download.
     */
    _download(content, fileName, contentType) {
        const a = document.createElement('a');
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }
}