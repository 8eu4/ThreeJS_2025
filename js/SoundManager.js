import * as THREE from 'three';

export class SoundManager {
    constructor(camera) {
        this.camera = camera;
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        this.audioLoader = new THREE.AudioLoader();
        this.sounds = new Map(); // Cache sound buffers: 'name' -> AudioBuffer
        
        // List of files to preload
        this.soundList = [
            { name: 'wood_creak', file: '086133_wood-creak-single-v1-41402.mp3' },
            { name: 'monster_scream', file: 'alien-monster-scream-259962.mp3' },
            { name: 'flashlight', file: 'flashlight-clicking-on-105809.mp3' },
            { name: 'footsteps_wood_1', file: 'footsteps-on-wood-397989.mp3' },
            { name: 'footsteps_wood_2', file: 'footsteps-on-wooden-floor-26822.mp3' },
            { name: 'monster_breath', file: 'robot-breathing-366928.mp3' },
            { name: 'running', file: 'running-on-the-floor-359909.mp3' },
            { name: 'walking_wood', file: 'walking-on-wood-363349.mp3' },
            { name: 'footsteps_tile_1', file: 'Footstep Ceramic.m4a' }, // [NEW] Random 1
            { name: 'footsteps_tile_2', file: 'Footstep Ceramic copy.m4a' }, // [NEW] Random 2
            { name: 'footsteps_carpet', file: 'audio Footstep Carpet.m4a' } // [NEW] Karpet Updated
        ];

        this.globalAudio = new THREE.Audio(this.listener);
    }

    init() {
        console.log("🔊 Initializing SoundManager...");
        this.soundList.forEach(item => {
            this.loadSound(item.name, `./Audio/${item.file}`);
        });
    }

    loadSound(name, path) {
        this.audioLoader.load(
            path,
            (buffer) => {
                console.log(`✅ Loaded sound: ${name}`);
                this.sounds.set(name, buffer);
            },
            (xhr) => {
                // Progress
            },
            (err) => {
                console.error(`❌ Failed to load sound: ${name}`, err);
            }
        );
    }

    playSound(name, options = {}) {
        if (!this.sounds.has(name)) {
            console.warn(`⚠️ Sound '${name}' not loaded yet.`);
            return;
        }

        const buffer = this.sounds.get(name);
        
        // For simple BGM/SFX (Global Sound 2D)
        // If we want multiple concurrent sounds, we create a new Audio instance each time
        // Or reuse a pool. For now, let's create a new source for overlapping SFX.
        
        const sound = new THREE.Audio(this.listener);
        sound.setBuffer(buffer);
        sound.setLoop(options.loop || false);
        sound.setVolume(options.volume !== undefined ? options.volume : 1.0);
        sound.play();

        return sound;
    }

    playPositionalSound(name, mesh, options = {}) {
        if (!this.sounds.has(name)) return;
        
        const buffer = this.sounds.get(name);
        const sound = new THREE.PositionalAudio(this.listener);
        sound.setBuffer(buffer);
        sound.setRefDistance(options.refDistance || 5);
        sound.setLoop(options.loop || false);
        sound.setVolume(options.volume !== undefined ? options.volume : 1.0);
        
        mesh.add(sound);
        sound.play();
        
        // Helper to remove audio object after playing (if not looping)
        if (!options.loop) {
            sound.onEnded = function() {
                mesh.remove(sound);
            };
        }

        return sound;
    }

    setMasterVolume(volume) {
        this.listener.setMasterVolume(volume);
    }

    stopAll() {
        this.listener.setMasterVolume(0);
        setTimeout(() => this.listener.setMasterVolume(1), 100);
        // Bruteforce stop by muting master momentarily or tracking all sources.
        // For strictly stopping:
        // Ideally we track active sounds in an array and .stop() them.
    }
}
