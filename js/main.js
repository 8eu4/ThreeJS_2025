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
import { SoundManager } from './SoundManager.js'; // [NEW] Import
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
const lightingManager = new LightingManager(world, cameraManager, state);
const soundManager = new SoundManager(world.camera); // [NEW] Init (Butuh Kamera)
const storyManager = new StoryManager(world, cameraManager, lightingManager, state);
const ui = new UIManager(world, state, history, saveManager, cameraManager, storyManager);

// 3. Berikan referensi (Dependency Injection)
state.setUIManager(ui);
world.setStateManager(state);
ui.setStateManager(state);
ui.setSoundManager(soundManager); // [NEW] Inject SoundManager ke UI

// --- SAMBUNGKAN CAMERA MANAGER KE WORLD ---
// Ini penting agar fungsi update() di CameraManager dipanggil setiap frame
world.setCameraManager(cameraManager); 
// ------------------------------------------
world.setLightingManager(lightingManager);

world.setStoryManager(storyManager);

lightingManager.setSoundManager(soundManager); // [NEW] Inject ke LightingManager

soundManager.init(); // [NEW] Start loading sounds
window.soundManager = soundManager; // [NEW] Expose to Console

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

    // STOP SCENE (X)
    else if (event.key.toLowerCase() === 'x') {
        // [DEBUG] Always log X press
        const sm = window.storyManager;
        console.log(`🛑 Key 'X' detected. StoryManager: ${!!sm}, IsPlaying: ${sm ? sm.isStoryPlaying : 'N/A'}`);

        if (sm && sm.isStoryPlaying) {
            console.log("🛑 Triggering stopScene()...");
            sm.stopScene();
        } else {
            // Force stop anyway debug
            // console.warn("⚠️ Force Stop Attempted (Debug)");
            // if (sm) sm.stopScene(); 
        }
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
console.log("-- ANIMASI --");
console.log("storyManager.playFullMovie(true)");
console.log("-- DEBUG --");
console.log("storyManager.playFullMovie(false)");

// 6. Mulai aplikasi
world.start();


// [DEBUGGER] Tempel di paling bawah main.js
window.debugMeshUnderMouse = function() {
    console.log("%c[DEBUG MODE] Tahan CTRL + Klik Kiri di Mesh", "background: #222; color: #bada55; font-size: 14px");

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('click', (event) => {
        if (!event.ctrlKey) return; 

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Ambil camera & scene dari variabel global world yang sudah ada di main.js
        // Kita akses via 'world' yang didefinisikan di atas
        const cam = window.storyManager ? window.storyManager.world.camera : null; 
        const scene = window.storyManager ? window.storyManager.world.scene : null;

        if (!cam || !scene) return;

        raycaster.setFromCamera(mouse, cam);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const mesh = hit.object;
            const mat = mesh.material;

            console.group(`🔍 DEBUG: ${mesh.name}`);
            console.log("Cast Shadow:", mesh.castShadow);
            console.log("Material Side:", mat.side === THREE.DoubleSide ? "DoubleSide" : "Front/Back");
            
            // INI YANG PENTING:
            let shadowSideStr = "Auto (Ikut Side)";
            if (mat.shadowSide === THREE.BackSide) shadowSideStr = "✅ BackSide (Correct for Thin Walls)";
            if (mat.shadowSide === THREE.DoubleSide) shadowSideStr = "⚠️ DoubleSide (Causes Flicker on Thin Walls)";
            console.log("Shadow Side:", shadowSideStr);
            
            console.groupEnd();
        }
    });
};

// Jalankan
window.debugMeshUnderMouse();