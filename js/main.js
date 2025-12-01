// js/main.js
import { World } from './World.js';
import { UIManager } from './UIManager.js';
import { StateManager } from './StateManager.js';
import { loadInitialScene } from './SceneSetup.js';
import { HistoryManager } from './HistoryManager.js';
import { SaveManager } from './SaveManager.js';
import { CameraManager } from './CameraManager.js'; // <--- IMPORT PENTING
import { LightingManager } from './LightingManager.js'; // <--- 1. IMPORT BARU
import { StoryManager } from './StoryManager.js'; // Import
import * as THREE from 'three'; // Pastikan import THREE ada
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';


THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// 1. Inisialisasi komponen inti
const history = new HistoryManager(); 
const state = new StateManager(history); 
const world = new World(document.body, state);
const saveManager = new SaveManager(state, history);
const cameraManager = new CameraManager(world, state);
// Setup Lighting SETELAH Camera (karena senter butuh kamera)
const lightingManager = new LightingManager(world, cameraManager); // <--- 2. INISIALISASI
const ui = new UIManager(world, state, history, saveManager, cameraManager);
const storyManager = new StoryManager(world, cameraManager, lightingManager, state);

// 3. Berikan referensi (Dependency Injection)
state.setUIManager(ui);
world.setStateManager(state);
ui.setStateManager(state);

// --- SAMBUNGKAN CAMERA MANAGER KE WORLD ---
// Ini penting agar fungsi update() di CameraManager dipanggil setiap frame
world.setCameraManager(cameraManager); 
// ------------------------------------------
world.setLightingManager(lightingManager);

// 4. Muat objek-objek awal ke dalam scene
loadInitialScene(world, state);

// 5. Set up event listener global
window.addEventListener('keydown', (event) => {
    // Cek agar tidak menghapus jika sedang mengetik di input GUI
    const activeEl = document.activeElement;
    if (activeEl && activeEl.tagName.toLowerCase() === 'input') {
        return;
    }

    // DELETE OBJECT
    if (event.key === 'Delete' || event.key === 'Backspace') {
        // PERBAIKAN: Cek mode CameraManager, bukan flyControls (karena sudah dihapus)
        if (cameraManager.activeMode === 'FPS') {
            return; // Jangan hapus objek saat sedang main (FPS Mode)
        }

        state.deleteSelectedObject();
    }

    // REDO (CTRL + Y atau CTRL + SHIFT + Z)
    if ((event.ctrlKey && event.key.toLowerCase() === 'y') ||
        (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z')) {
        event.preventDefault(); 
        history.redo();
        return;
    }

    // UNDO (CTRL + Z)
    else if (event.ctrlKey && event.key.toLowerCase() === 'z') {
        event.preventDefault(); 
        history.undo();
        return; 
    }
});

// Listener Deseleksi Global
window.addEventListener('click', (event) => {
    const isCanvasClick = event.target === world.renderer.domElement;
    const isGuiClick = event.target.closest('.lil-gui');
    const isHierarchyClick = event.target.closest('#hierarchy-list');

    // Jika klik terjadi di luar ketiga area interaktif tersebut, deselect.
    if (!isCanvasClick && !isGuiClick && !isHierarchyClick) {
        if (state.selectedObject) {
            state.setSelectedObject(null);
        }
    }
}, false); 

window.storyManager = storyManager; 
console.log("Ketik 'storyManager.startOpeningScene()' di console untuk mulai cerita.");

// 6. Mulai aplikasi
world.start();