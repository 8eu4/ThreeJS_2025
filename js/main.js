// js/main.js
import { World } from './World.js';
import { UIManager } from './UIManager.js';
import { StateManager } from './StateManager.js';
import { loadInitialScene } from './SceneSetup.js';
import { HistoryManager } from './HistoryManager.js';
import { SaveManager } from './SaveManager.js'; // <-- (1) IMPORT BARU

// 1. Inisialisasi komponen inti
const history = new HistoryManager(); 
const state = new StateManager(history); 
const world = new World(document.body, state);
const saveManager = new SaveManager(state, history); // <-- (2) BUAT INSTANCE
const ui = new UIManager(world, state, history, saveManager); // <-- (3) BERIKAN KE UI

// 2. Berikan referensi (Dependency Injection)
state.setUIManager(ui);
world.setStateManager(state);
ui.setStateManager(state);

// 2. Berikan referensi (Dependency Injection)
state.setUIManager(ui);
world.setStateManager(state);
ui.setStateManager(state);

// 3. Muat objek-objek awal ke dalam scene
loadInitialScene(world, state);

// 4. Set up event listener global
window.addEventListener('keydown', (event) => {
    // Cek agar tidak menghapus jika sedang mengetik di input GUI
    const activeEl = document.activeElement;
    if (activeEl && activeEl.tagName.toLowerCase() === 'input') {
        return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
        // Cek flyControls
        if (world.flyControls.enabled) {
            return;
        }

        state.deleteSelectedObject();
    }

    // REDO (CTRL + Y atau CTRL + SHIFT + Z)
    if ((event.ctrlKey && event.key.toLowerCase() === 'y') ||
        (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z')) {
        event.preventDefault(); // Mencegah redo default browser
        history.redo();
        return; // Hentikan eksekusi lebih lanjut
    }

    // UNDO (CTRL + Z)
    else if (event.ctrlKey && event.key.toLowerCase() === 'z') {
        event.preventDefault(); // Mencegah undo default browser
        history.undo();
        
        console.log("--- DEBUG: Ctrl+Z Terdeteksi! ---");
        console.log("Isi Undo Stack:", history.undoStack);

        return; // Hentikan eksekusi lebih lanjut
    }
});

// --- TAMBAHAN BARU: Listener Deseleksi Global ---
window.addEventListener('click', (event) => {
    // Cek apakah klik terjadi PADA canvas
    const isCanvasClick = event.target === world.renderer.domElement;

    // Cek apakah klik terjadi DI DALAM panel lil-gui
    const isGuiClick = event.target.closest('.lil-gui');

    // Cek apakah klik terjadi DI DALAM panel hierarki
    const isHierarchyClick = event.target.closest('#hierarchy-list');

    // Jika klik terjadi di luar ketiga area interaktif tersebut, deselect.
    if (!isCanvasClick && !isGuiClick && !isHierarchyClick) {
        if (state.selectedObject) {
            state.setSelectedObject(null);
        }
    }

    // Jika klik di canvas, biarkan 'onCanvasClick' di World.js yang menangani.
    // Jika klik di GUI atau Hierarki, biarkan listener mereka yang menangani.

}, false); // 'false' (atau capture=false) memastikan ini berjalan setelah listener lain
// --- AKHIR TAMBAHAN ---


// 5. Mulai aplikasi
world.start();