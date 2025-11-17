// Import Three.js
import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// GANTI DragControls DENGAN TransformControls
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// Variabel global baru
let transformControls, raycaster, mouse, selectedObject;
const draggableObjects = []; // Tetap gunakan array ini
const hierarchyListEl = document.getElementById('hierarchy-list');

// Setup canvas renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Setup Scene and Camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xEEEEEE);

// --- TAMBAHKAN FOG ---
// Gunakan warna yang sama dengan background agar menyatu
const fogColor = 0xEEEEEE;
scene.fog = new THREE.Fog(fogColor, 30, 120); // near=30, far=120
// --- AKHIR TAMBAHAN FOG ---

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 40);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.update();


// Plane
let size = 40;
let geometry = new THREE.PlaneGeometry(size, size);
let material = new THREE.MeshPhongMaterial({
    color: 0x888888,
    side: THREE.DoubleSide,
});
let planeMesh = new THREE.Mesh(geometry, material); // Ganti nama variabel
planeMesh.rotation.x = -Math.PI / 2;
planeMesh.receiveShadow = true;
planeMesh.name = "Ground Plane"; // Beri nama untuk hierarki (tapi tidak draggable)
scene.add(planeMesh);

// Sphere
let radius = 7;
let widthSegments = 32;
let heightSegments = 16;
geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
material = new THREE.MeshPhongMaterial({ color: '#FA8' });
const sphereMesh = new THREE.Mesh(geometry, material);
sphereMesh.position.set(-radius - 1, radius + 2, 0);
sphereMesh.castShadow = true;
sphereMesh.receiveShadow = true;
sphereMesh.name = "Sphere"; // 3. BERI NAMA UNTUK HIERARKI
scene.add(sphereMesh);
draggableObjects.push(sphereMesh);

// Box
size = 4;
geometry = new THREE.BoxGeometry(size, size, size);
material = new THREE.MeshPhongMaterial({ color: '#8AC' });
const boxMesh = new THREE.Mesh(geometry, material);
boxMesh.position.set(size + 1, size / 2, 0);
boxMesh.castShadow = true;
boxMesh.receiveShadow = true;
boxMesh.name = "Blue Box"; // 3. BERI NAMA UNTUK HIERARKI
scene.add(boxMesh);
draggableObjects.push(boxMesh);

// Transparent Box
size = 6;
geometry = new THREE.BoxGeometry(size, size, size);
material = new THREE.MeshPhongMaterial({
    color: '#00FF00',
    transparent: true,
    opacity: 0.5
});
const transparentBoxMesh = new THREE.Mesh(geometry, material);
transparentBoxMesh.position.set(size, size / 2 + 1, 10);
transparentBoxMesh.castShadow = true;
transparentBoxMesh.receiveShadow = true;
transparentBoxMesh.name = "Green Transparent Box"; // 3. BERI NAMA UNTUK HIERARKI
scene.add(transparentBoxMesh);
draggableObjects.push(transparentBoxMesh);

// ... (Class MinMaxGUIHelper tetap sama) ...
class MinMaxGUIHelper {
    constructor(obj, minProp, maxProp, minDif) {
        this.obj = obj;
        this.minProp = minProp;
        this.maxProp = maxProp;
        this.minDif = minDif;
    }
    get min() { return this.obj[this.minProp]; }
    set min(v) {
        this.obj[this.minProp] = v;
        this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
    }
    get max() { return this.obj[this.maxProp]; }
    set max(v) {
        this.obj[this.maxProp] = v;
        this.min = this.min;
    }
}
function updateCamera() {
    camera.updateProjectionMatrix();
}

const gui = new GUI();
gui.add(camera, 'fov', 1, 180).onChange(updateCamera);
const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
gui.add(minMaxGUIHelper, 'max', 0.1, 1000, 0.1).name('far').onChange(updateCamera);

// --- TAMBAHKAN GUI UNTUK FOG ---
// Kita bisa pakai ulang MinMaxGUIHelper untuk kabut!
const fogGUIHelper = new MinMaxGUIHelper(scene.fog, 'near', 'far', 0.1);
const fogFolder = gui.addFolder('Fog');
fogFolder.add(fogGUIHelper, 'min', 0.1, 100, 0.1).name('near');
fogFolder.add(fogGUIHelper, 'max', 1, 200, 0.1).name('far');
// --- AKHIR GUI FOG ---

// Lights
var color, intensity, distance, angle, penumbra;

var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.1);
ambientLight.name = "Ambient Light";
scene.add(ambientLight);

var hemiLight = new THREE.HemisphereLight(0xB1E1FF, 0xB97A20, 0.2);
hemiLight.name = "Hemisphere Light";
scene.add(hemiLight);

var hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 5);
scene.add(hemiLightHelper);

var dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
dirLight.position.set(0, 20, 10);
dirLight.target.position.set(0, 0, 0);
dirLight.castShadow = true;
dirLight.shadow.camera.left = -50;    // Diperbesar dari -25
dirLight.shadow.camera.right = 50;   // Diperbesar dari 25
dirLight.shadow.camera.top = 50;      // Diperbesar dari 25
dirLight.shadow.camera.bottom = -50;  // Diperbesar dari -25
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 100;     // Diperbesar dari 50
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.name = "Directional Light"; // 3. BERI NAMA
dirLight.target.name = "Directional Target"; // 3. BERI NAMA
scene.add(dirLight);
scene.add(dirLight.target);
draggableObjects.push(dirLight);
draggableObjects.push(dirLight.target);

var dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 5);
scene.add(dirLightHelper);

var pointLight = new THREE.PointLight(0xFFFF00, 150, 50); // Jarak diperbesar dari 25
pointLight.position.set(-10, 10, 10);
pointLight.castShadow = true;
pointLight.name = "Point Light"; // 3. BERI NAMA
scene.add(pointLight);
draggableObjects.push(pointLight);

var pointLightHelper = new THREE.PointLightHelper(pointLight, 2);
scene.add(pointLightHelper);

var spotLight = new THREE.SpotLight(0xFF0000, 150, 80, THREE.MathUtils.degToRad(35), 0.1); // Jarak diperbesar dari 40
spotLight.position.set(-20, 20, 0);
spotLight.target.position.set(5, 0, 0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.name = "Spot Light"; // 3. BERI NAMA
spotLight.target.name = "Spot Light Target"; // 3. BERI NAMA
scene.add(spotLight);
scene.add(spotLight.target);
draggableObjects.push(spotLight);
draggableObjects.push(spotLight.target);

var spotLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(spotLightHelper);

// 4. INISIALISASI TRANSFORMCONTROLS, RAYCASTER, MOUSE
transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls);

raycaster = new THREE.Raycaster();
mouse = new THREE.Vector2();

// 5. BUAT FUNGSI UNTUK MEMBANGUN HIERARKI
function buildHierarchyPanel() {
    hierarchyListEl.innerHTML = ""; // Kosongkan list
    draggableObjects.forEach(obj => {
        const item = document.createElement('div');
        item.className = 'hierarchy-item';
        item.textContent = obj.name;
        item.dataset.objectName = obj.name; // Simpan nama untuk referensi

        // Event listener untuk klik di panel
        item.addEventListener('click', () => {
            selectObject(obj);
        });
        hierarchyListEl.appendChild(item);
    });
}

// 6. FUNGSI UNTUK MEMILIH OBJEK
function selectObject(obj) {
    // Hapus highlight dari objek sebelumnya
    if (selectedObject && selectedObject.material) {
        selectedObject.material.emissive.setHex(0x000000);
    }

    selectedObject = obj; // Set objek baru

    // --- INI PERBAIKANNYA ---
    if (selectedObject) {
        transformControls.attach(selectedObject); // Tempelkan gizmo
    } else {
        transformControls.detach(); // Lepaskan gizmo jika tidak ada objek yg dipilih
    }
    // --- AKHIR PERBAIKAN ---

    // Tambahkan highlight ke objek baru
    if (selectedObject && selectedObject.material) {
        selectedObject.material.emissive.setHex(0x555555); // Highlight
    }

    updateHierarchyHighlight();
}

// 7. FUNGSI UNTUK UPDATE SOROTAN DI PANEL
function updateHierarchyHighlight() {
    const items = hierarchyListEl.querySelectorAll('.hierarchy-item');
    items.forEach(item => {
        if (selectedObject && item.dataset.objectName === selectedObject.name) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// 8. EVENT LISTENER UNTUK KLIK DI CANVAS
renderer.domElement.addEventListener('click', (event) => {
    // Cek jika klik terjadi di atas gizmo, jangan lakukan raycast
    if (transformControls.dragging) return;

    // Hitung posisi mouse di normalized device coordinates (-1 s/d +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(draggableObjects);

    if (intersects.length > 0) {
        selectObject(intersects[0].object);
    } else {
        selectObject(null); // Klik di ruang kosong = deselect
    }
});

// 9. EVENT LISTENER UNTUK TRANSFORMCONTROLS (GIZMO)
transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value; // Matikan orbit control saat gizmo dipakai
});

// 10. TAMBAHKAN KONTROL GUI UNTUK GIZMO
const gizmoModes = {
    Move: 'translate',
    Rotate: 'rotate',
    Scale: 'scale'
};
const gizmoFolder = gui.addFolder('Gizmo Mode');
gizmoFolder.add(transformControls, 'mode', gizmoModes).name('Mode').onChange(() => {
    // Update visibilitas Sumbu X/Y/Z
    transformControls.showX = true;
    transformControls.showY = true;
    transformControls.showZ = true;
});
// Tombol untuk menyembunyikan/menampilkan sumbu
gizmoFolder.add(transformControls, 'showX').name('Show X');
gizmoFolder.add(transformControls, 'showY').name('Show Y');
gizmoFolder.add(transformControls, 'showZ').name('Show Z');


// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Panggil fungsi untuk membangun panel hierarki saat pertama kali
buildHierarchyPanel();

// Animation Loop
var time_prev = 0;
function animate(time) {
    var dt = time - time_prev;
    dt *= 0.1;

    controls.update();

    // 11. UPDATE SEMUA HELPER
    spotLightHelper.update();
    dirLightHelper.update();
    pointLightHelper.update();

    renderer.render(scene, camera);
    time_prev = time;
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
