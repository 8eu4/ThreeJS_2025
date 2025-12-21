// tempat alur jalan cinematicnya
// mengatur load model dan animasi
// pergerakan kamera per detiknya
// pencahayaan

// js/StoryManager.js
import * as THREE from 'three';

export class StoryManager {
    constructor(world, cameraManager, lightingManager, stateManager) {
        this.world = world;
        this.scene = world.scene;
        this.cameraManager = cameraManager;
        this.lightingManager = lightingManager;
        this.stateManager = stateManager; // Untuk akses objek hantu via 'state'

        // Status Cerita
        this.isStoryPlaying = false;
        this.currentOpenness = 1.0;
        this._currentEyeHeight = 150;

        // untuk debug
        this.currentViewMode = 'ORBIT';
        this.allLights = this.lightingManager.lights;

        // --- [UPDATE] FOOTSTEP TRACKING VARS ---
        this._accumulatedDistance = 0; 
        
        // UBAH: Perbesar angka ini (misal 2.5) agar langkah tidak terlalu rapat saat kamera ngebut
        this._strideLength = 2.5;      
        
        // BARU: Jeda minimal antar langkah (0.35 detik = kecepatan lari manusia normal)
        this._stepCooldown = 0.35; 
        
        // BARU: Penanda waktu langkah terakhir
        this._lastStepTime = 0;

        this._raycaster = new THREE.Raycaster(); 
        this._raycaster.firstHitOnly = true;

        // --- [UPDATE] FOOTSTEP TRACKING VARS ---
        this._accumulatedDistance = 0;
        
        // Config Langkah
        this._baseStride = 2.0;       // Jarak langkah standar (saat jalan santai)
        this._baseSpeed = 2.5;        // Kecepatan jalan "normal" (unit/detik). Di atas ini, stride akan melar.
        this._stepCooldown = 0.4;     // Jeda minimum (detik) agar tidak "blender"

        // State Tracking
        this._lastStepTime = 0;       // Waktu bunyi terakhir
        this._lastFrameTime = 0;      // Waktu frame sebelumnya (untuk hitung speed)
        this._currentFootstepSound = null; 

        this._raycaster = new THREE.Raycaster();
        this._raycaster.firstHitOnly = true;

        // Set kondisi awal Buka (Tanpa animasi)
        this._preloadAllScenes().then(() => {
                console.log("👁️ Loading Selesai. Membuka Mata...");
            this.setEyeOpenness(1.0, 0);
        }, 100);
    }

    async _preloadAllScenes() {
        console.groupCollapsed("🚀 Pre-loading All Scenes (Instant Mode)...");
        const start = performance.now();

        this.isSetupMode = true; // AKTIFKAN MODE KILAT (Skip semua durasi)

        // 1. Ambil semua nama fungsi di class ini
        const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

        // 2. Filter yang namanya diawali "scene" (contoh: scene01, sceneBoss, sceneEnding)
        const sceneMethods = allMethods.filter(m => m.startsWith('scene') && typeof this[m] === 'function');

        // 3. Jalankan satu per satu secara instan
        for (const methodName of sceneMethods) {
            // console.log(`   Scanning: ${methodName}...`);
            await this[methodName](); // Eksekusi (Tapi karena SetupMode, dia lari secepat kilat)
        }

        this.isSetupMode = false; // MATIKAN MODE KILAT. Siap untuk Play beneran.

        const duration = (performance.now() - start).toFixed(2);
        console.log(`✅ Done! ${sceneMethods.length} scenes loaded in ${duration}ms.`);
        console.groupEnd();
    }

    // ==========================================
    //               SCENE 01
    // ==========================================
    
    async scene01_WakeUp() {
        if (!this.isSetupMode) console.log("--- Scene 1 ---");
        if (this.currentViewMode === 'FPS') this._setGuiVisibility(false);

        // --- 1 LINE SETUP ---
        this._instantSetPosition(this.defineWaypoint("Scene01_ceilling", { x: -65.25, y: 7.79, z: -40.55 }, { x: 90, y: 180 }));
        
        this.setEyeOpenness(0, 0);
        await this._wait(2.0);

        if(!this.isSetupMode) console.log("Mata terbuka...");
        this.setEyeOpenness(0.3, 2.0); await this._wait(2.5);
        this.setEyeOpenness(0.1, 0.5); await this._wait(1.0);
        await this._blinkSequence();
        this.setEyeOpenness(1.0, 1.5); await this._wait(1.0);

        if(!this.isSetupMode) console.log("Bangun...");

        // --- 1 LINE ACTION ---
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_getup", { x: -65.25, y: 9.24, z: -38.57 }, { y: 180 }), 3.0, "power2.inOut", false, false);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_lookleft", { x: -65.25, y: 9.24, z: -38.57 }, { y: 210 }), 1.0, "power2.inOut", false, false);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_lookright", { x: -65.25, y: 9.24, z: -38.57 }, { y: 150 }), 2.0, false, false);
        await this.playerMoveToWaypoint("Scene01_getup", 1.0);
        
        this._blinkSequence();

        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_looksidedown", { x: -70.45, y: 8.54, z: -40.44 }, { x: -90, y: 90}), 3.0, "power2.inOut", false, false);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_looksideup", { x: -71.17, y: 10.91, z: -40.59 }, { y: 150 }), 2.0, "power2.inOut", false, false);
        
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_gotodoor_1", { x: -84.53, y: 10.91, z: -22.77 }, { y: 150 }), 6.0, "none");
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene01_gotodoor_2", { x: -86, y: 10.91, z: -21 }, { y: 89 }), 1.0, "none");

        await this.animateDoor("Door_Bedroom", 90, 2.0);
        if(!this.isSetupMode) console.log("Scene 1 Done.");
    }

    // ==========================================
    //               SCENE 02
    // ==========================================
    async scene02_BedroomCorridor() {
        if (!this.isSetupMode) console.log("--- Scene 2 ---");
        if (this.currentViewMode === 'FPS') this._setGuiVisibility(false);

        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene02_walkoutside", { x: -94.75, y: 10.91, z: -21 }, { y: 0 }), 3),
            this.moveMonsterTo("Ghost_Corridor", this.defineWaypoint("Scene02_monsterwalk_m", { x: -82.96, y: 3.53, z: -54.34 }, { y: -90 }), 6),
            this._waitAndRun(3, () => this._blinkSequence()),
        ]);

        await this.setMonsterVisibility("Ghost_Corridor", false);

        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene02_walktocurve", { x: -94.75, y: 10.91, z: -51.52 }, { y: 0 }), 10, "none"),
            this._waitAndRun(3, () => this.blink(1)),
        ]);

        await this.playerMoveToWaypoint(this.defineWaypoint("Scene02_turn", { x: -89.28, y: 10.91, z: -54.90 }, { y: -90 }), 2, "power2.in");

        //debug
        // this._instantSetPosition(this.defineWaypoint("Scene02_turn", { x: -89.28, y: 10.91, z: -54.90 }, { y: -90 }));

        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene02_walktokitchen", { x: -47.06, y: 10.91, z: -54.90 }, { y: -90 }), 10, "none"),
            this._waitAndRun(3, () => this._blinkSequence()),
        ]);

        await this.animateDoor("Door_ToKitchen", 90, 2.0);
    }

    // ==========================================
    //               SCENE 03
    // ==========================================
    turnOffLamps(){
        if (this.isSetupMode) return Promise.resolve();
        return new Promise(resolve => {
            const lightIds = [
                'light_Bedroom_1', 'light_Bedroom_2', 'light_Bedroom_3', 
                'light_Bedroom_4', 'light_Bedroom_5', 'light_Bedroom_6', 'light_Bedroom_7'
            ];

            const objectsToAnimate = [];
            lightIds.forEach(id => {
                const lightObj = this.allLights[id]; // Mengambil dari LightingManager
                if (lightObj) {
                    objectsToAnimate.push(lightObj);
                }
            });

            if (objectsToAnimate.length > 0) {
                // Gunakan GSAP untuk mematikan intensitas dan sembunyikan saat selesai
                gsap.to(objectsToAnimate, { 
                    intensity: 0, 
                    duration: 0.5,
                    onComplete: () => {
                        resolve(); 
                    }
                });
            } else {
                resolve();
            }
        });
    }
    
    async scene03_Kitchen() {
        if (!this.isSetupMode) {
            console.log("--- Scene 3 ---");
        }

        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_enterkitchen", { x:-37.11, y:10.91, z:-53.99 }, { y: -90 }), 4, "none");
        
        await this.runParallel([
            this.animateDoor("Door_ToKitchen", 0, 1),
            this.playerMoveToWaypoint(this.defineWaypoint("Scene03_turntobottle", { x:-33.17, y:10.91, z:-53.99 }, { x:-21.00, y:-31.00 }), 4, "power2.in"),
        ]);
        
        await this._wait(1);
        if (!this.isSetupMode) { 
            await this.turnOffLamps();
        }
        await this.turnOffLamps()
        await this._wait(1);


        await this.runParallel([
            this._setLightFlicker('light_kitchen_1', true, 0.3, 1),
            this._setLightFlicker('light_kitchen_2', true, 0.2, 1),
        ]);

        await this._wait(1);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_confuseright", { x:-33.17, y:10.91, z:-53.99 }, { y: -123.6 }), 0.5, "power2.in");
        await this._wait(1);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_confuseright2", { x:-33.17, y:10.91, z:-53.99 }, { y:150 }), 0.3, "none");
        await this._waitAndRun(0, () => this.setMonsterVisibility("Ghost_Kitchen_Window", true)), // Hantu Muncul
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_confuseleft", { x:-33.17, y:10.91, z:-53.99 }, { y:30 }), 3, "power2.in", true);
        // await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_lookforward", { x:-33.17, y:10.91, z:-53.99 }, { y: 0 }), 0.5);
        
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_backaway", { x: -31.02, y: 10.91, z: -49 }, { y: 30 }), 2, "power2.inOut");
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_felldown1", { x:-30.71, y:10.30, z:-48.65 }, { x:18.70, y:30.00, z:-20.40 }), 0.4, "none");
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_felldown2", { x:-30.41, y:9.39, z:-47.94 }, { x:48.00, y:30.00, z:-54.60 }), 0.3, "none");
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_felldown3", { x:-29.49, y:7.90, z:-47.89 }, { x:-5.70, y:-10.60, z:-88.80 }), 0.4, "none");
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_felldown4", { x:-28.37, y:4.15, z:-47.67 }, { x:-5.70, y:-10.60, z:-88.80 }), 0.3, "none");
        
        await this._wait(1);

        await this.runParallel([
            this.setMonsterVisibility("Ghost_Kitchen_Window", false),
            this.setMonsterVisibility("Ghost_Kitchen", true),
            // this.setEyeOpenness(1, 2),
            this._waitAndRun(2.5, () => this.playerMoveToWaypoint(
                this.defineWaypoint("Scene03_scared_2", { x: -30.41, y: 10.91, z: -48.18 }, { x: 20, y: 54 }), 3, "power2.in"
            )),
        ]);

        await this.runParallel([
            this.playMonsterAnimation("Ghost_Kitchen", "Creature_armature|bite", 1),
            this.playerMoveToWaypoint(this.defineWaypoint("Scene03_scared_3", { x: -29.19, y: 8.81, z: -48.18 }, { x: 33, y: 63 }), 0.5, "power2.out"),
            this._waitAndRun(0.5, () => this.playMonsterAnimation("Ghost_Kitchen", "Creature_armature|attack_2", 1)),
            this._waitAndRun(0.7, () => this.playerMoveToWaypoint(
                this.defineWaypoint("Scene03_scared_4", { x: -28.89, y: 5.31, z: -48.18 }, { x: -45, y: 57}), 1.5, "power2.in"
            )),
            this._waitAndRun(1.3, () => this.setEyeOpenness(0, 1))
        ]);
        await this._wait(5);
        await this.setMonsterVisibility("Ghost_Kitchen", false);
        await this.setEyeOpenness(1.0, 2.5);
        await this._wait(1);
        await this.runParallel([
            this._setLightFlicker('light_kitchen_1', true, 0, 0),
            this._setLightFlicker('light_kitchen_2', true, 0, 0),
        ]);
        await this._wait(1);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_relief_1", { x: -28.89, y: 5.31, z: -48.18 }, { x: -40, y: 80 }), 2, "power2.out");
        await this._wait(1);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_relief_2", { x: -28.89, y: 5.31, z: -48.18 }, { x: -40, y: 50 }), 2, "power2.out");


        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene03_standup_1", { x: -29, y: 7, z: -48 }, { x: -50, y: 77.3, z: 10 }), 2, "none"),
            this._waitAndRun(1, () => this._blinkSequence()),
        ]);

        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_standup_2", { x: -29.5, y: 10.91, z: -48.6 }, { x: 0, y: 69.3 }), 2, "power2.out")

        await this._wait(2);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_getFlash_1", { x: -29.5, y: 10.91, z: -48.6 }, { x: 0, y: -47.77 }), 2, "none");
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_getFlash_2", { x: -27, y: 10.91, z: -53 }, { x: -23.7, y: -47.77 }), 1.5, "power2.out");

        await this.hideFlashlight();
    
        await this._wait(0.5);

        await this.setFlashlightState(true);
        await this._wait(1.5);
        await this._wait(1.5);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene03_walkout_1", { x: -28, y: 10.91, z: -47 }, { x: 0, y: -96.4 }), 2, "none");
        await this.animateDoor("Door_ToCorridor", 90, 2)
    }

    async hideFlashlight() {
        if (!this.isSetupMode) console.log("🔦 Menjalankan hideFlashlight...");
        
        // Cari Prop di Scene
        const prop = this.scene.getObjectByName('Prop_Flashlight');
        if (prop) {
            prop.visible = false;
            console.log("✅ Prop_Flashlight berhasil di-hide.");
        } else {
            console.warn("⚠️ Prop_Flashlight tidak ditemukan di scene.");
        }
    }

    // ==========================================
    //               SCENE 04
    // ==========================================
    async scene04_LongCorridor(){
        if (!this.isSetupMode) console.log("--- Scene 3 ---");
        if (this.currentViewMode === 'FPS') this._setGuiVisibility(false);

        // jalan menyusuri lorong
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_1", { x: -20, y: 10.91, z: -47 }, { x: 0, y: -180 }), 2, "power2.in");
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_2", { x: -20, y: 10.91, z: -34 }, { x: 0, y: -180 }), 4, "none");
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_3", { x: -20, y: 10.91, z: -29 }, { x: 0, y: -90 }), 1, "none"),
            this._waitAndRun(0.5, () => this._blinkSequence()),

        ]);

        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_4", { x: 27, y: 10.91, z: -27 }, { x: 0, y: -90 }), 8, "none"),
            this._waitAndRun(4, () => this._blinkSequence()),

        ])

        // tikungan 1
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_5", { x: 29, y: 10.91, z: -27 }, { x: 0, y: -13 }), 1, "none"),
        ])

        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_6", { x: 33, y: 10.91, z: -39 }, { x: 0, y: -13 }), 3, "none"),
        ])

        // tikungan 2
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_7", { x: 33, y: 10.91, z: -41 }, { x: 0, y: -86 }), 1, "none"),
        ])

        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_8", { x: 54, y: 10.91, z: -41 }, { x: 0, y: -86 }), 4, "none"),
        ])

        // tikungan 3
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_9", { x: 55, y: 10.91, z: -41 }, { x: 0, y: -169.4 }), 2, "none"),
        ])

        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_10", { x: 58, y: 10.91, z: -27 }, { x: 0, y: -169.4 }), 4, "none"),
            this._waitAndRun(1.5, () => this._blinkSequence()),

        ])

        // tikungan 4
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_11", { x: 58, y: 10.91, z: -26 }, { x: 0, y: -96 }), 1, "none"),
        ])

        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_12", { x: 72, y: 10.91, z: -26 }, { x: 0, y: -96 }), 4, "none"),

        ])

        // tikungan 5
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_13", { x: 75, y: 10.91, z: -25 }, { x: 0, y: -164 }), 1, "none"),
        ])

        //tikungan 6
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_14", { x: 80, y: 10.91, z: -14 }, { x: 0, y: -180 }), 5, "none"),       
        ])

        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_15", { x: 80, y: 10.91, z: -1 }, { x: 0, y: -180 }), 5, "none"),
        ])

        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_walk_15", { x: 80, y: 10.91, z: 2 }, { x: 0, y: -180 }), 5, "power2.out"),
            this._waitAndRun(4, () => this._blinkSequence()),
            this._waitAndRun(3, () => this.setMonsterVisibility("Ghost_Long_Corridor", true)),
        ])

        //mulai melihat monster
        await this._wait(2);
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_turn_around", { x: 80, y: 10.91, z: 2 }, { x: 0, y: 0 }), 5, "power2.inOut"),
            this._waitAndRun(4, () => this.playMonsterAnimation("Ghost_Long_Corridor", "Creature_armature|bite", 1)),

        ]);
        await this.playerMoveToWaypoint(this.defineWaypoint("Scene04_turn_around_back", { x: 80, y: 10.91, z: 2 }, { x: 0, y: -180 }), 0.5, "power2.inOut");
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_run_1", { x: 80, y: 10.91, z: 49 }, { x: 0, y: -180 }), 4, "none"),
            this.playMonsterAnimation("Ghost_Long_Corridor", "Creature_armature|Run", 1),
            this.moveMonsterTo("Ghost_Long_Corridor", this.defineWaypoint("Scene04_move_monster_1", { x: 79, y: 3, z: 20 }, { x: 0, y: -180 }), 3.9),
        ]);
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_look_back_1", { x: 80, y: 10.91, z: 50 }, { x: 0, y: 0 }), 0.5, "none"),

        ]);
        await this.runParallel([
            this._wait(0.7),
            this._waitAndRun(0, () => this.moveMonsterTo("Ghost_Long_Corridor", this.defineWaypoint("Scene04_move_monster_2", { x: 79, y: 3, z: 32 }, { x: 0, y: -180 }), 0.7)),
            this._waitAndRun(0.6, () => this.playerMoveToWaypoint(this.defineWaypoint("Scene04_run_2", { x: 80, y: 10.91, z: 51 }, { x: 0, y: 90 }), 0.4, "none")),

        ]);
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_run_3", { x: 60, y: 10.91, z: 51 }, { x: 0, y: 90 }), 2, "none"),
        ]);

        //Klimaks --> terjatuh dan diterkam monster
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_run_4", { x: 49, y: 10.91, z: 53 }, { x: 0, y: 90 }), 1, "none"),
        ]);
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_fell_1", { x: 48, y: 10.91, z: 53 }, { x: -20.5, y: 59.6, z: 25.5}), 0.2, "none"),
            this._waitAndRun(0.2, () =>this.playerMoveToWaypoint(this.defineWaypoint("Scene04_fell_2", { x: 47, y: 6.91, z: 53 }, { x: -38.5, y: 59.6, z: 49.5}), 0.2, "none")),
            this._waitAndRun(0.4, () =>this.playerMoveToWaypoint(this.defineWaypoint("Scene04_fell_3", { x: 46, y: 4, z: 53 }, { x: -18.5, y: 25.3, z: 39.5}), 0.2, "none")),
            this._waitAndRun(0.1, () => this.blink(0.3))
        ]);
        await this._wait(0.5);
        await this.runParallel([
            this.playerMoveToWaypoint(this.defineWaypoint("Scene04_fell_4", { x: 46, y: 4, z: 53 }, { x: -15.5, y: -57.3, z: 15.5}), 0.5, "none"),
            this._waitAndRun(0, () => this.moveMonsterTo("Ghost_Long_Corridor",this.defineWaypoint("Scene04_move_monster_2", { x: 79, y: 3, z: 50 }, { x: 0, y: -180 }), 0.6)),
            this._waitAndRun(0.3, () => this.playMonsterAnimation("Ghost_Long_Corridor", "Creature_armature|walk", 0.1)),
            this._waitAndRun(0.4, () => this.moveMonsterTo("Ghost_Long_Corridor",this.defineWaypoint("Scene04_move_monster_3", { x: 79, y: 3, z: 53 }, { x: 0, y: 90 }), 0.6)),
            
            this._waitAndRun(0.6, () => this.playMonsterAnimation("Ghost_Long_Corridor", "Creature_armature|state_to_crawl", 1)),
            this._waitAndRun(1.5, () => this.playMonsterAnimation("Ghost_Long_Corridor", "Creature_armature|crawl", 0.1)),

            this._waitAndRun(1.5, () => this.moveMonsterTo("Ghost_Long_Corridor",this.defineWaypoint("Scene04_move_monster_4", { x: 41, y: 3, z: 53 }, { x: 0, y: 90 }), 6)),

            
            this._waitAndRun(0.5, () => this.playerMoveToWaypoint(this.defineWaypoint("Scene04_fell_5", { x: 46, y: 5.5, z: 53 }, { x: -18.5, y: -88.3, z: 0}), 0.5, "none")),
            this._waitAndRun(1.9, () => this.playerMoveToWaypoint(this.defineWaypoint("Scene04_fell_6", { x: 36, y: 5.5, z: 53 }, { x: 10.5, y: -96.3, z: 0}), 4.5, "none")),
            this._waitAndRun(6.4, () => this.playerMoveToWaypoint(this.defineWaypoint("Scene04_fell_7", { x: 35, y: 5.5, z: 53 }, { x: 10.5, y: 93.3, z: 0}), 0.5, "none")),
            this._waitAndRun(6.9, () => this.playerMoveToWaypoint(this.defineWaypoint("Scene04_fell_7", { x: 35, y: 5.5, z: 53 }, { x: 10.5, y: -93.3, z: 0}), 0.5, "none")),
        
            this._waitAndRun(6.8, () => this.playMonsterAnimation("Ghost_Long_Corridor", "Creature_armature|crawl_idol", 0.1)),
            this._waitAndRun(8, () => this.playMonsterAnimation("Ghost_Long_Corridor", "Creature_armature|crawl_bite", 0.5)),
            this._waitAndRun(8.2, () => this.setEyeOpenness(0, 0.5)),

        ]);
        await this._wait(1);

    }
    // ==========================================
    //           CORE SYSTEM
    // ==========================================


    async playFullMovie(startInFPS = true) {
        console.log(`🎬 FILM DIMULAI (Start Mode: ${startInFPS ? 'FPS' : 'ORBIT'})...`);

        // [FIX] Reset Cancel Flag agar bisa dimainkan lagi setelah stop
        this.isCancelled = false; 
        
        this.currentViewMode = startInFPS ? 'FPS' : 'ORBIT';
        this.isStoryPlaying = true;

        if (startInFPS) {
            this._setGuiVisibility(false);
            this.world.setHelpersVisibility(false);
        } else {
            this._setGuiVisibility(true); 
            this.world.setHelpersVisibility(true); 
        }

        if (this.world.ui) {
            this.world.ui.setCinematicButtonVisible(!startInFPS);
        }

        this._setCinematicMode(true, this.currentViewMode);

        try {
            // --- MULAI SEQUENCE ---
            await this.scene01_WakeUp();
            await this.scene02_BedroomCorridor();
            await this.scene03_Kitchen();
            await this.scene04_LongCorridor();
            // --- SELESAI ---
            
            console.log("🎬 FILM SELESAI.");
        } catch (err) {
            if (err.message === "SCENE_CANCELLED") {
                console.log("⚠️ Scene stopped by user.");
            } else {
                console.error("❌ Scene Error:", err);
            }
        } finally {
            // [FIX] CLEANUP SELALU DIJALANKAN (Meskipun error/cancel)
            if (this.isStoryPlaying) { 
                // Jika distop paksa lewat stopScene(), isStoryPlaying sudah false duluan, jadi skip block ini.
                // Tapi kalau finish normal atau error lain, ini jalan.
                // Reset
                this.world.setHelpersVisibility(true);
                this._setCinematicMode(false);
                this._setGuiVisibility(true);
                if (this.world.ui) this.world.ui.setCinematicButtonVisible(false);
            }
            // Pastikan flag mati
            this.isStoryPlaying = false; 
        }
    }

    async playSingleScene(sceneName) {
        if (typeof this[sceneName] !== 'function') {
            console.error(`❌ Scene '${sceneName}' not found!`);
            return;
        }

        console.log(`🎬 PLAYING SINGLE SCENE: ${sceneName}...`);
        
        // Setup State
        this.isCancelled = false; 
        this.isStoryPlaying = true;
        this.currentViewMode = 'FPS';

        // Setup UI & Mode
        this._setGuiVisibility(false);
        this.world.setHelpersVisibility(false);
        if (this.world.ui) this.world.ui.setCinematicButtonVisible(true);
        this._setCinematicMode(true, 'FPS');

        try {
            // Run Scene
            await this[sceneName]();
            console.log("✅ Scene Finished.");
        } catch (err) {
            if (err.message === "SCENE_CANCELLED") {
                console.log("⚠️ Scene stopped by user.");
            } else {
                console.error("❌ Scene Error:", err);
            }
        } finally {
            // Cleanup
            if (this.isStoryPlaying) {
                this.world.setHelpersVisibility(true);
                this._setCinematicMode(false);
                this._setGuiVisibility(true);
                if (this.world.ui) this.world.ui.setCinematicButtonVisible(false);
            }
            this.isStoryPlaying = false;
        }
    }

    defineWaypoint(name, pos = {}, rot = {}) {
        let waypoint = this.scene.getObjectByName(name);
        
        if (!waypoint) {
            if (!this._waypointGeometry) {
                this._waypointGeometry = new THREE.BoxGeometry(1, 1.5, 1);
                this._waypointMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffff00, wireframe: true, transparent: true, opacity: 0.5
                });
            }
            waypoint = new THREE.Mesh(this._waypointGeometry, this._waypointMaterial);
            waypoint.name = name;
            waypoint.userData.isWaypoint = true;
            waypoint.rotation.order = 'YXZ'; // Penting agar selaras dengan CameraManager
            
            const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 0), 3, 0x00ffff);
            waypoint.add(arrow);
            
            this.world.add(waypoint);
            if (this.stateManager) {
                this.stateManager.addObject(waypoint, { isSelectable: true, isDraggable: true });
            }
        }

        waypoint.position.set(pos.x ?? 0, pos.y ?? 0, pos.z ?? 0);

        // Hanya gunakan rotasi angka (x, y, z) dari Gizmo
        waypoint.rotation.set(
            THREE.MathUtils.degToRad(rot.x ?? 0),
            THREE.MathUtils.degToRad(rot.y ?? 0),
            THREE.MathUtils.degToRad(rot.z ?? 0)
        );

        waypoint.visible = (this.currentViewMode !== 'FPS');
        return name;
    }

    _instantSetPosition(waypointName) {
        if (this.isSetupMode) return;
        const waypoint = this.scene.getObjectByName(waypointName);
        if (!waypoint) return;

        const rig = this.cameraManager.cameraRig;
        const cam = this.cameraManager.camera;

        // Ambil orientasi dari Waypoint (Gizmo)
        const e = new THREE.Euler().setFromQuaternion(waypoint.quaternion, 'YXZ');

        // A. LOGIKA UNTUK MODE FPS / RIG
        rig.position.copy(waypoint.position);
        rig.rotation.set(0, e.y, 0, 'YXZ');
        cam.rotation.set(e.x, 0, e.z, 'YXZ');

        this._lastStepTime = 0;

        // B. LOGIKA UNTUK MODE ORBIT (PENTING!)
        if (this.currentViewMode === 'ORBIT') {
            // Pindahkan kamera tepat ke posisi waypoint
            cam.position.copy(waypoint.position);
            cam.quaternion.copy(waypoint.quaternion);

            // Mundurkan sedikit agar kita tidak berada di dalam "box" waypoint
            cam.translateZ(0.5); 

            // Update Pivot OrbitControls agar berputar di titik waypoint tersebut
            if (this.cameraManager.orbitControls) {
                this.cameraManager.orbitControls.target.copy(waypoint.position);
                this.cameraManager.orbitControls.update();
            }
        }

        this._accumulatedDistance = 0;
    }

    _triggerFootstep() {
        if (!window.soundManager) return;

        // 1. Raycast Cek Lantai
        const rigPos = this.cameraManager.cameraRig.position;
        this._raycaster.set(rigPos, new THREE.Vector3(0, -1, 0));
        this._raycaster.far = 5.0;

        const intersects = this._raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            if (hit.object.userData && hit.object.userData.isWaypoint) return;

            const objName = (hit.object.name || "").toLowerCase();
            const matName = (hit.object.material && hit.object.material.name || "").toLowerCase();

            // 2. Pilih Suara (Sama seperti FPS)
            let soundName = 'walking_wood'; 

            // Deteksi Karpet
            if (objName.includes('carpet') || objName === 'frontside_37') {
                soundName = 'footsteps_carpet';
            }
            // Deteksi Keramik/Lantai Keras
            else if (objName.includes('tile') || objName.includes('ceramic') || objName.includes('kitchen') || 
                matName.includes('tile') || matName.includes('ceramic') || objName.includes('stone') || 
                objName.includes('concrete') || objName.includes('floor')) {
                
                const randIdx = Math.random() > 0.5 ? 1 : 2;
                soundName = `footsteps_tile_${randIdx}`;
            }

            // --- [PERBAIKAN UTAMA: STOP SUARA SEBELUMNYA] ---
            if (this._currentFootstepSound && this._currentFootstepSound.isPlaying) {
                this._currentFootstepSound.stop();
            }
            // -------------------------------------------------

            // 3. Play Suara Baru
            // Volume disesuaikan agar menyatu (blend)
            this._currentFootstepSound = window.soundManager.playSound(soundName, { 
                volume: 0.5, 
                loop: false 
            });
            
            // Variasi Pitch (0.95 - 1.05) agar tidak terdengar seperti robot, tapi tetap halus
            if (this._currentFootstepSound) {
                this._currentFootstepSound.setPlaybackRate(0.95 + Math.random() * 0.1);
            }
        }
    }

    // --- STOP / CANCEL MECHANISM ---
    stopScene() {
        if (!this.isStoryPlaying) return;

        console.warn("🛑 FORCE STOPPING SCENE...");
        this.isCancelled = true;
        this.isStoryPlaying = false;
        
        // 1. Kill All GSAP Animations
        if (window.gsap) {
            gsap.globalTimeline.clear(); 
        }

        // 2. Kill Timeouts
        if (this.activeTimeouts) {
            this.activeTimeouts.forEach(id => clearTimeout(id));
            this.activeTimeouts = [];
        }

        // 3. Reset UI & Mode directly here (in case the promise chain hangs)
        this._setCinematicMode(false);
        this._setGuiVisibility(true);
        if (this.world.ui) this.world.ui.setCinematicButtonVisible(false);

        // 4. Force Eye Open
        this.setEyeOpenness(1.0, 0);
    }

    _checkCancellation() {
        if (this.isCancelled) {
            throw new Error("SCENE_CANCELLED");
        }
    }

    // Wrapper untuk menjalankan Scene agar aman dari error Cancellation
    async _runSceneSafe(sceneMethodName) {
        this.isCancelled = false; 
        this.activeTimeouts = [];

        try {
            await this[sceneMethodName]();
        } catch (err) {
            if (err.message === "SCENE_CANCELLED") {
                console.log("✅ Scene successfully aborted.");
            } else {
                console.error("❌ Scene Error:", err);
            }
        }
    }

    async _wait(duration) {
        this._checkCancellation();
        return new Promise(resolve => {
            const id = setTimeout(() => {
                if (!this.isCancelled) resolve();
            }, duration * 1000);
            if (!this.activeTimeouts) this.activeTimeouts = [];
            this.activeTimeouts.push(id);
        });
    }

    // Update parameter: tambahkan 'playSteps' (default true)
    playerMoveToWaypoint(waypointName, duration, easeType = "power2.inOut", useLongestPath = false, playSteps = true) {
        if (this.isSetupMode) return Promise.resolve();
        this._checkCancellation();

        return new Promise((resolve, reject) => {
            const waypoint = this.scene.getObjectByName(waypointName);
            if (!waypoint) { resolve(); return; }

            // Kill Switch Awal
            if (!playSteps && this._currentFootstepSound && this._currentFootstepSound.isPlaying) {
                this._currentFootstepSound.stop();
            }

            const rig = this.cameraManager.cameraRig;
            const cam = this.cameraManager.camera;
            
            const startRigY = rig.rotation.y;
            const startCamX = cam.rotation.x;
            const startCamZ = cam.rotation.z;
            const startPos = rig.position.clone();
            const prevPos = rig.position.clone(); 
            
            // Reset timer
            this._lastFrameTime = performance.now() / 1000;
            // [PENTING] Reset lastStepTime ke masa lalu agar langkah pertama bisa langsung bunyi
            // this._lastStepTime = 0; 

            const targetEuler = new THREE.Euler().setFromQuaternion(waypoint.quaternion, 'YXZ');

            const calculateDiff = (target, start, longest) => {
                let diff = target - start;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                if (longest) diff = diff > 0 ? diff - Math.PI * 2 : diff + Math.PI * 2;
                return diff;
            };

            const diffY = calculateDiff(targetEuler.y, startRigY, useLongestPath);
            const diffX = calculateDiff(targetEuler.x, startCamX, false);
            const diffZ = calculateDiff(targetEuler.z, startCamZ, false);

            const proxy = { t: 0 };
            gsap.to(proxy, {
                t: 1,
                duration: duration,
                ease: easeType,
                onUpdate: () => {
                    if (this.isCancelled) {
                        gsap.killTweensOf(proxy);
                        return; 
                    }
                    
                    const now = performance.now() / 1000;
                    const dt = now - this._lastFrameTime;
                    this._lastFrameTime = now;

                    const alpha = proxy.t;
                    rig.position.lerpVectors(startPos, waypoint.position, alpha);

                    // --- [LOGIKA BARU: VELOCITY-BASED TIMER] ---
                    if (playSteps && dt > 0) {
                        const dist = rig.position.distanceTo(prevPos);
                        const currentSpeed = dist / dt; // Unit per detik

                        // 1. THRESHOLD KECEPATAN (Anti Langkah Hantu)
                        // Hanya bunyi jika speed > 0.5. 
                        // Ini akan otomatis membungkam suara saat easing melambat di akhir.
                        if (currentSpeed > 0.3) { 
                            
                            // 2. HITUNG INTERVAL BERDASARKAN SPEED (Anti Suara Kuda)
                            // Semakin cepat, interval makin kecil (tapi dibatasi min 0.3s)
                            // Rumus: Base 0.5s. Jika speed 2x lipat, interval jadi 0.25s.
                            let targetInterval = 0.9 / (currentSpeed / 2.5); // 2.5 adalah asumsi speed normal
                            
                            // Clamp interval: Jangan pernah lebih cepat dari 0.3 detik!
                            targetInterval = Math.max(0.3, targetInterval);
                            // Cap max interval: Jangan terlalu lambat juga
                            targetInterval = Math.min(0.8, targetInterval);

                            // 3. TRIGGER CHECK
                            if (now - this._lastStepTime > targetInterval) {
                                this._triggerFootstep();
                                this._lastStepTime = now;
                            }
                        }
                    }
                    prevPos.copy(rig.position);
                    // -------------------------------------------

                    rig.rotation.y = startRigY + diffY * alpha;
                    cam.rotation.x = startCamX + diffX * alpha;
                    cam.rotation.z = startCamZ + diffZ * alpha;
                },
                onComplete: () => {
                    if (!this.isCancelled) {
                        // Kill Switch Akhir (Safety Net)
                        if (this._currentFootstepSound && this._currentFootstepSound.isPlaying) {
                            this._currentFootstepSound.stop();
                        }
                        resolve();
                    }
                }
            });
        });
    }

    animateDoor(doorName, targetAngleDeg, duration) {
        if (this.isSetupMode) return Promise.resolve();
        this._checkCancellation();

        return new Promise(resolve => {
            const door = this.scene.getObjectByName(doorName);
            if (!door) { resolve(); return; }
            if (this.isCancelled) return;

            const targetRad = THREE.MathUtils.degToRad(targetAngleDeg);
            gsap.to(door.rotation, {
                y: targetRad,
                duration: duration,
                ease: "power2.inOut", 
                onUpdate: () => { if(this.isCancelled) gsap.killTweensOf(door.rotation); },
                onComplete: () => { if(!this.isCancelled) resolve(); }
            });
        });
    }

    _waitAndRun(delay, callback) {
        this._checkCancellation();
        return this._wait(delay).then(() => {
            this._checkCancellation();
            return callback();
        });
    }

    async runParallel(promises) {
        this._checkCancellation();
        try {
            await Promise.all(promises);
        } catch (e) {
            if (e.message === "SCENE_CANCELLED") return; 
            throw e;
        }
    }   

    switchViewMode() {
        // Toggle Mode
        const newMode = (this.currentViewMode === 'FPS') ? 'ORBIT' : 'FPS';
        this.currentViewMode = newMode;

        console.log(`🔄 SWITCHING VIEW TO: ${newMode}`);

        // 1. Eksekusi perpindahan mode kamera
        this._setCinematicMode(true, newMode);

        // 2. Atur Efek Mata (PENTING: Matikan efek jika Orbit)
        if (newMode === 'ORBIT') {
            // Paksa mata terbuka/transparan di CSS
            const eyelidEl = document.getElementById('cinematic-eyelids');
            if (eyelidEl) eyelidEl.style.opacity = '0';

            // Nyalakan Helper di mode debug
            this.world.setHelpersVisibility(true);
        } else {
            // Balikin efek mata
            const eyelidEl = document.getElementById('cinematic-eyelids');
            if (eyelidEl) eyelidEl.style.opacity = '1';

            // Force update visual mata sesuai state terakhir
            this.setEyeOpenness(this.currentOpenness, 0);

            // Matikan helper biar bersih
            this.world.setHelpersVisibility(false);
        }

        // 3. Pastikan Tombol Tetap Nyala (Karena kita sudah berinteraksi)
        if (this.world.ui) {
            this.world.ui.setCinematicButtonVisible(true);
        }
    }

    _setCinematicMode(active, viewMode) {
        const rig = this.cameraManager.cameraRig;
        const cam = this.cameraManager.camera;
        const shakeGroup = this.cameraManager.cameraShakeGroup;
        const debugBody = this.cameraManager.debugMesh;

        if (active) {
            this.cameraManager.fpsControls.unlock();

            // Stop Physics Movement
            this.cameraManager.velocity.set(0, 0, 0);
            this.cameraManager.currentMoveVelocity.set(0, 0, 0);

            if (viewMode === 'FPS') {
                // --- MODE 1: FPS (NONTON FILM) ---
                // Di sini kita pakai mode 'CINEMATIC' agar mouse user MATI
                this.cameraManager.activeMode = 'CINEMATIC';
                this.cameraManager.orbitControls.enabled = false;

                shakeGroup.add(cam);
                cam.position.set(0, 0, 0);
                cam.rotation.set(0, 0, 0);
                shakeGroup.rotation.z = 0;

                if (debugBody) debugBody.visible = false;

            } else {
                // --- MODE 2: ORBIT (DEBUG / FREE ROAM) ---

                // [PERBAIKAN 3] PENTING!!
                // Set activeMode ke 'ORBIT'.
                // Kalau diset 'CINEMATIC', CameraManager.update() bakal skip update orbitControls.
                // Makanya kemarin Anda teleport tapi ga bisa gerak.
                this.cameraManager.activeMode = 'ORBIT';

                this.world.scene.add(cam);

                // TELEPORT KAMERA KE POSISI PLAYER SAAT INI
                const worldPos = new THREE.Vector3();
                rig.getWorldPosition(worldPos);

                cam.position.set(worldPos.x + 5, worldPos.y + 5, worldPos.z + 5);
                cam.lookAt(worldPos);

                this.cameraManager.orbitControls.target.copy(worldPos);
                this.cameraManager.orbitControls.enabled = true;
                this.cameraManager.orbitControls.update();

                if (debugBody) {
                    debugBody.visible = true;
                    debugBody.material.opacity = 0.5;
                    debugBody.material.wireframe = true;
                }
            }
        } else {
            // Keluar Mode Total -> Balik ke FPS Gameplay
            if (debugBody) debugBody.visible = false;
            this.cameraManager.setMode('FPS');
        }
    }

    setFlashlightState(isOn) {
        // Cek SetupMode agar tidak dijalankan saat pre-loading scene
        if (this.isSetupMode) return;

        if (this.lightingManager) {
            console.log(`[Story] Mengatur Senter ke: ${isOn ? 'NYALA' : 'MATI'}`);
            this.lightingManager.toggleFlashlight(isOn);
        } else {
            console.warn("⚠️ LightingManager belum terhubung ke StoryManager.");
        }
    }


    _tweenCameraRotation(x, y, z, duration) {
        return new Promise(resolve => {
            // Cek Mode: Kalau Orbit, Skip animasi kamera biar mouse user tidak "lawan arus"
            if (this.currentViewMode === 'ORBIT') {
                resolve();
                return;
            }

            gsap.to(this.cameraManager.camera.rotation, {
                x: x, // Pitch (Atas Bawah)
                y: y, // Yaw (Kiri Kanan)
                z: z, // Roll (Miring)
                duration: duration,
                ease: "power2.inOut",
                onComplete: resolve
            });
        });
    }

    animateDoor(doorName, targetAngleDeg, duration) {
        if (this.isSetupMode) return Promise.resolve();
        return new Promise(resolve => {
            // 1. Cari objek pintu di dalam scene (Recursive search)
            const door = this.scene.getObjectByName(doorName);

            if (!door) {
                console.warn(`⚠️ Pintu dengan nama '${doorName}' tidak ditemukan! Cek nama di Blender/Scene Graph.`);
                resolve(); // Tetap resolve biar urutan cerita tidak macet
                return;
            }

            console.log(`🚪 Menggerakkan pintu: ${doorName} ke ${targetAngleDeg} derajat`);

            // 2. Konversi Derajat ke Radian (Three.js pakai Radian)
            const targetRad = THREE.MathUtils.degToRad(targetAngleDeg);

            // 3. Animasi Rotasi Sumbu Y (Engsel biasanya sumbu Y)
            gsap.to(door.rotation, {
                y: targetRad,
                duration: duration,
                ease: "power2.inOut", // Gerakan pintu yang natural (lambat-cepat-lambat)
                onComplete: resolve
            });
        });
    }

    setEyeOpenness(targetRatio, duration = 1.0) {
        // Clamp 0-1
        if (this.isSetupMode) return;

        // if (this.currentViewMode === 'ORBIT') return;
        const eyelidEl = document.getElementById('cinematic-eyelids');
        if (!eyelidEl || !window.gsap) return;

        const val = Math.max(0, Math.min(1, targetRatio));
        this.currentOpenness = val;

        // --- STRATEGI BARU: RADIAL GRADIENT ---

        // Kita butuh objek sementara untuk di-animasikan angkanya oleh GSAP
        // Karena kita tidak bisa meng-animasikan string "radial-gradient" secara langsung


        if (!eyelidEl || !window.gsap) return;

        // Tentukan tinggi bukaan mata (Vertical Aperture)
        // 0.0 -> 0% (Tutup total, hitam semua)
        // 1.0 -> 150% (Buka lebar sampai keluar layar)
        const targetHeight = val * 150;

        // Kita buat objek proxy untuk menyimpan nilai saat ini
        // (GSAP akan mengubah nilai 'h' di objek ini setiap frame)
        // Kita perlu tahu start value-nya agar smooth. 
        // Idealnya kita simpan 'currentHeight' di class, tapi untuk simpel kita ambil dari variabel global/state
        if (this._currentEyeHeight === undefined) this._currentEyeHeight = 0; // Default awal tutup/buka sesuai CSS

        const proxy = { h: this._currentEyeHeight };

        gsap.to(proxy, {
            h: targetHeight,
            duration: duration,
            ease: "power2.inOut",
            onUpdate: () => {
                // Update CSS setiap frame berdasarkan nilai 'h' yang sedang jalan
                // Rumus: Ellipse Melebar (150% width) tapi Tinggi berubah (h%)
                // Transparent mulai 30% dari pusat, Hitam mulai 60% dari pusat (Soft Edge)

                eyelidEl.style.backgroundImage = `radial-gradient(ellipse 150% ${proxy.h}% at center, transparent 30%, black 60%)`;

                // Simpan nilai terakhir agar kalau di-interrupt (toggle C) transisinya nyambung
                this._currentEyeHeight = proxy.h;
            }
        });
    }

    // --- FUNGSI TOGGLE (UNTUK TOMBOL C) ---
    toggleEyes(duration = 0.8) {
        // Cek kondisi terakhir:
        // Jika mata sedang > 50% terbuka, maka TUTUP.
        // Jika mata sedang < 50% terbuka, maka BUKA.
        if (this.currentOpenness > 0.5) {
            this.setEyeOpenness(0, duration); // Tutup
            console.log("[Story] Mata Terpejam");
        } else {
            this.setEyeOpenness(1, duration); // Buka
            console.log("[Story] Mata Terbuka");
        }
    }

    async blink(duration = 0.1) {
        this.setEyeOpenness(0, duration); // Tutup
        await new Promise(r => setTimeout(r, duration * 1000));
        this.setEyeOpenness(1, duration); // Buka
    }

    async _blinkSequence() {
        this.setEyeOpenness(0, 0.1); // Tutup cepat
        await this._wait(0.15);
        this.setEyeOpenness(0.6, 0.2); // Buka dikit
        await this._wait(0.3);
        this.setEyeOpenness(0, 0.1); // Tutup lagi
        await this._wait(0.15);
        this.setEyeOpenness(1.0, 0.4); // Buka lebar
    }

    // --- A. KAMERA & GERAKAN ---
    // _setCinematicMode(active) {
    //     if (active) {
    //         console.log("[Story] Masuk Mode Cinematic");

    //         // 1. Matikan Kontrol Player
    //         this.cameraManager.activeMode = 'CINEMATIC';
    //         this.cameraManager.orbitControls.enabled = false;
    //         this.cameraManager.fpsControls.unlock();
    //         this.cameraManager.velocity.set(0, 0, 0);
    //         this.cameraManager.currentMoveVelocity.set(0, 0, 0);

    //         // 2. ATTACH CAMERA KE RIG (PENTING!)
    //         // Kita paksa kamera masuk ke dalam struktur Rig agar bisa digerakkan oleh StoryManager
    //         this.cameraManager.cameraShakeGroup.add(this.cameraManager.camera);

    //         // 3. RESET TRANSFORM LOKAL KAMERA
    //         // Agar kamera duduk pas di titik pusat Rig (tidak ada offset aneh dari mode Orbit sebelumnya)
    //         this.cameraManager.camera.position.set(0, 0, 0);
    //         this.cameraManager.camera.rotation.set(0, 0, 0);

    //     } else {
    //         console.log("[Story] Keluar Mode Cinematic");
    //         // Saat keluar, kita tidak perlu detach manual di sini.
    //         // Biarkan setMode('FPS') atau setMode('ORBIT') yang mengurusnya nanti.
    //     }
    // }

    // Fungsi Jalan (Move Rig)
    // Gunakan 'null' jika tidak ingin mengubah sumbu tertentu (misal hanya geser X)
    _tweenRigPosition(x, y, z, duration) {
        return new Promise(resolve => {
            const target = {};
            if (x !== null) target.x = x;
            if (y !== null) target.y = y;
            if (z !== null) target.z = z;

            gsap.to(this.cameraManager.cameraRig.position, {
                ...target,
                duration: duration,
                ease: "power2.inOut", // Gerakan mulus (lambat-cepat-lambat)
                onComplete: resolve // Kabari kalau sudah sampai
            });
        });
    }

    // Fungsi Noleh (Rotate Camera/Rig)
    // Rotasi Rig (Badan) atau Camera (Kepala) tergantung kebutuhan
    _tweenCameraRotation(x, y, z, duration) {
        return new Promise(resolve => {
            // Kita putar kameranya langsung untuk head look
            gsap.to(this.cameraManager.camera.rotation, {
                x: x, // Pitch (Atas Bawah)
                y: y, // Yaw (Kiri Kanan)
                z: z, // Roll (Miring)
                duration: duration,
                ease: "power2.inOut",
                onComplete: resolve
            });
        });
    }

    // Helper untuk memutar CameraRig (Badan)
    _tweenRigRotation(x, y, z, duration) {
        return new Promise(resolve => {
            const target = {};
            if (x !== null) target.x = x;
            if (y !== null) target.y = y;
            if (z !== null) target.z = z;

            gsap.to(this.cameraManager.cameraRig.rotation, {
                ...target,
                duration: duration,
                ease: "power2.inOut",
                onComplete: resolve
            });
        });
    }

    _tweenShakeRoll(angle, duration) {
        return new Promise(resolve => {
            gsap.to(this.cameraManager.cameraShakeGroup.rotation, {
                z: angle,
                duration: duration,
                ease: "power1.out",
                onComplete: resolve
            });
        });
    }


    _setLightFlicker(lightId, active, speed, chance) {
        if (this.isSetupMode) return;
        this.lightingManager.setFlicker(lightId, active, speed, chance);
    }

    _setLightState(lightId, isOn) {
        if (!this.lightingManager) return;

        const light = this.lightingManager.lights[lightId];
        if (light) {
            light.visible = isOn;
            // console.log(`[Story] Lampu ${lightId} set to ${isOn ? 'ON' : 'OFF'}`);
        } else {
            console.warn(`[Story] Lampu '${lightId}' tidak ditemukan.`);
        }
    }

    _tweenLightIntensity(lightId, targetIntensity, duration) {
        return new Promise(resolve => {
            if (!this.lightingManager) {
                resolve();
                return;
            }

            const light = this.lightingManager.lights[lightId];
            if (light) {
                gsap.to(light, {
                    intensity: targetIntensity,
                    duration: duration,
                    ease: "power2.inOut",
                    onComplete: resolve
                });
            } else {
                console.warn(`[Story] Lampu '${lightId}' tidak ditemukan untuk ditween.`);
                resolve();
            }
        });
    }

    _fadeScreen(type, duration) {
        return new Promise(resolve => {
            const overlay = document.getElementById('overlay');
            if (!overlay) {
                console.warn("Overlay div not found in HTML");
                resolve();
                return;
            }

            const targetOpacity = type === "OUT" ? 1 : 0; // 1 = Hitam, 0 = Transparan

            gsap.to(overlay.style, {
                opacity: targetOpacity,
                duration: duration,
                onComplete: resolve
            });
        });
    }

    setMonsterVisibility(monsterName, isVisible) {
        if (this.isSetupMode) return;
        const monster = this.scene.getObjectByName(monsterName);
        if (monster) {

            // Pastikan kita punya data scale asli (backup)
            if (!monster.userData.originalScale) {
                // Default fallback kalau lupa set di SceneSetup
                monster.userData.originalScale = new THREE.Vector3(5, 5, 5);
            }

            if (isVisible) {
                // MUNCUL:
                // Kembalikan ke ukuran asli (POP UP)
                monster.scale.copy(monster.userData.originalScale);

                // Pastikan visible TRUE
                monster.visible = true;

                console.log(`👻 Monster '${monsterName}' MUNCUL (Scale Restored)`);
            } else {
                // SEMBUNYI:
                // JANGAN visible = false. TAPI KECILKAN.
                monster.scale.set(0.0001, 0.0001, 0.0001);

                // Biarkan visible TETAP TRUE agar GPU tidak membuang memorinya
                monster.visible = true;

                console.log(`👻 Monster '${monsterName}' NGUMPET (Scale 0.0001)`);
            }

        } else {
            console.warn(`⚠️ Monster '${monsterName}' tidak ditemukan!`);
        }
    }

    moveMonsterTo(monsterName, targetData, duration) {
        if (this.isSetupMode) return Promise.resolve();
        return new Promise(resolve => {
            const monster = this.scene.getObjectByName(monsterName);
            if (!monster) {
                console.warn(`⚠️ Monster '${monsterName}' tidak ditemukan!`);
                resolve();
                return;
            }

            // 1. Siapkan Variable Awal
            const startPos = monster.position.clone();
            const startRot = monster.rotation.clone();

            let targetPosition = new THREE.Vector3();
            let targetEuler = new THREE.Euler();
            let useRotation = false;

            // 2. Ambil Data dari Waypoint
            if (typeof targetData === 'string') {
                const waypoint = this.scene.getObjectByName(targetData);
                if (waypoint) {
                    targetPosition.copy(waypoint.position);
                    
                    // Ambil rotasi Waypoint
                    targetEuler.setFromQuaternion(waypoint.quaternion, 'YXZ');

                    // [PERBAIKAN] Tambahkan Offset 180 Derajat (PI) di sumbu Y
                    // Agar monster berputar balik menghadap sesuai arah panah Waypoint
                    targetEuler.y += Math.PI;

                    useRotation = true;
                } else {
                    console.error(`❌ Waypoint Monster '${targetData}' tidak ditemukan!`);
                    resolve();
                    return;
                }
            } else if (targetData.isVector3 || (targetData.x !== undefined)) {
                targetPosition.copy(targetData);
            }

            // 3. Hitung Selisih Rotasi (Shortest Path Logic)
            const calculateDiff = (target, start) => {
                let diff = target - start;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                return diff;
            };

            const diffX = useRotation ? calculateDiff(targetEuler.x, startRot.x) : 0;
            const diffY = useRotation ? calculateDiff(targetEuler.y, startRot.y) : 0;
            const diffZ = useRotation ? calculateDiff(targetEuler.z, startRot.z) : 0;

            console.log(`🧟 Monster '${monsterName}' bergerak...`);

            // 4. Eksekusi Animasi
            const proxy = { t: 0 };
            gsap.to(proxy, {
                t: 1,
                duration: duration,
                ease: "linear",
                onUpdate: () => {
                    const alpha = proxy.t;

                    // A. Update Posisi
                    monster.position.lerpVectors(startPos, targetPosition, alpha);

                    // B. Update Rotasi
                    if (useRotation) {
                        monster.rotation.x = startRot.x + diffX * alpha;
                        monster.rotation.y = startRot.y + diffY * alpha;
                        monster.rotation.z = startRot.z + diffZ * alpha;
                    }
                },
                onComplete: resolve
            });
        });
    }

    playMonsterAnimation(monsterName, animName, transitionDuration = 0.5) {
        if (this.isSetupMode) return;
        const monster = this.scene.getObjectByName(monsterName);

        if (!monster || !monster.mixer || !monster.animations) {
            console.warn(`⚠️ Monster '${monsterName}' tidak memiliki mixer/animasi.`);
            return;
        }

        const newClip = monster.animations.find(a => a.name === animName);
        if (!newClip) {
            console.warn(`⚠️ Animasi '${animName}' tidak ditemukan pada ${monsterName}.`);
            // List animasi yang tersedia untuk debugging
            console.log("Daftar Animasi:", monster.animations.map(a => a.name));
            return;
        }

        const newAction = monster.mixer.clipAction(newClip);
        const oldAction = monster.currentAction;

        if (oldAction === newAction) return; // Animasi yang sama sedang jalan

        console.log(`🎬 Monster ${monsterName} switch anim: ${animName}`);

        // Setup Animasi Baru
        newAction.reset();
        newAction.play();

        // Transisi Halus (Crossfade)
        if (oldAction) {
            oldAction.crossFadeTo(newAction, transitionDuration, true);
        }

        // Simpan referensi action sekarang
        monster.currentAction = newAction;
    }

    // --- C. UTILITIES ---

    // Fungsi Menunggu (Penting untuk timing cerita)
    _wait(seconds) {
        if (this.isSetupMode) return Promise.resolve();
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    _setGuiVisibility(visible) {
        const displayStyle = visible ? 'block' : 'none';

        // 1. Panel Kanan (Lil-GUI)
        const rightPanel = document.querySelector('.lil-gui');
        if (rightPanel) {
            rightPanel.style.display = displayStyle;
        }

        // 2. Panel Kiri (Hierarchy)
        const leftPanel = document.getElementById('hierarchy-panel');
        if (leftPanel) {
            leftPanel.style.display = displayStyle;
        }
    }

    async runParallel(actions) {
        if (this.isSetupMode) return Promise.all(actions);

        console.log(`⚡ Menjalankan ${actions.length} aksi secara paralel...`);

        await Promise.all(actions);

        console.log("✅ Semua aksi paralel selesai.");
    }

    async _waitAndRun(delay, taskFunction) {
        if (this.isSetupMode) return taskFunction();

        if (delay > 0) {
            // console.log(`⏳ Delay ${delay}s...`); // Uncomment jika ingin log
            await this._wait(delay);
        }

        // Jalankan tugasnya sekarang
        await taskFunction();
    }

}


    // async playFullMovie() {
    //     console.log("🎬 FILM DIMULAI...");
    //     this.world.setHelpersVisibility(false);

    //     // Scene 1: Bangun Tidur
    //     await this.scene01_WakeUp();

    //     //Scene 2 : Lorong Kamar Menuju Dapur
    //     await this.scene02_BedroomCorridor();

    //     //Scene 3 : Dapur
    //     await this.scene03_Kitchen();

    //     this.world.setHelpersVisibility(true);
    //     console.log("🎬 FILM SELESAI.");
    // }

    // --- FUNGSI UTAMA: ANIMASI MATA ---
    // targetRatio: 0.0 (Tutup) sampai 1.0 (Buka)
    // duration: Kecepatan transisi dalam detik
    // setEyeOpenness(targetRatio, duration = 1.0) {
    //     // Clamp 0-1
    //     const val = Math.max(0, Math.min(1, targetRatio));
    //     this.currentOpenness = val;

    //     // --- STRATEGI BARU: RADIAL GRADIENT ---

    //     // Kita butuh objek sementara untuk di-animasikan angkanya oleh GSAP
    //     // Karena kita tidak bisa meng-animasikan string "radial-gradient" secara langsung

    //     const eyelidEl = document.getElementById('cinematic-eyelids');

    //     if (!eyelidEl || !window.gsap) return;

    //     // Tentukan tinggi bukaan mata (Vertical Aperture)
    //     // 0.0 -> 0% (Tutup total, hitam semua)
    //     // 1.0 -> 150% (Buka lebar sampai keluar layar)
    //     const targetHeight = val * 150;

    //     // Kita buat objek proxy untuk menyimpan nilai saat ini
    //     // (GSAP akan mengubah nilai 'h' di objek ini setiap frame)
    //     // Kita perlu tahu start value-nya agar smooth. 
    //     // Idealnya kita simpan 'currentHeight' di class, tapi untuk simpel kita ambil dari variabel global/state
    //     if (this._currentEyeHeight === undefined) this._currentEyeHeight = 0; // Default awal tutup/buka sesuai CSS

    //     const proxy = { h: this._currentEyeHeight };

    //     gsap.to(proxy, {
    //         h: targetHeight,
    //         duration: duration,
    //         ease: "power2.inOut",
    //         onUpdate: () => {
    //             // Update CSS setiap frame berdasarkan nilai 'h' yang sedang jalan
    //             // Rumus: Ellipse Melebar (150% width) tapi Tinggi berubah (h%)
    //             // Transparent mulai 30% dari pusat, Hitam mulai 60% dari pusat (Soft Edge)

    //             eyelidEl.style.backgroundImage = `radial-gradient(ellipse 150% ${proxy.h}% at center, transparent 30%, black 60%)`;

    //             // Simpan nilai terakhir agar kalau di-interrupt (toggle C) transisinya nyambung
    //             this._currentEyeHeight = proxy.h;
    //         }
    //     });
    // }
