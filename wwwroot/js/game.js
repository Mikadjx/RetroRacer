// ============================================================
// RETRO RACER — Game Engine Professionnel v3.0
// Architecture modulaire avec gestion d'état robuste
// ============================================================

(function () {
    "use strict";

    // ============================================================
    // CONFIGURATION CENTRALISÉE
    // ============================================================
    const CONFIG = {
        // Résolution
        WIDTH: 800,
        HEIGHT: 600,

        // Route
        ROAD_CENTER: 400,
        ROAD_TOP_WIDTH: 120,
        ROAD_BOT_WIDTH: 560,
        HORIZON: 220,

        // Niveaux de difficulté
        LEVELS: {
            easy: {
                name: "FACILE",
                color: "#00ff00",
                objectiveTime: 30,    // 30 secondes
                speedMultiplier: 0.7,
                enemySpawnRate: 80,
                enemySpeed: 0.5,
                starThresholds: [20, 25, 30] // Temps pour 1, 2, 3 étoiles
            },
            medium: {
                name: "INTERMÉDIAIRE",
                color: "#ffaa00",
                objectiveTime: 45,    // 45 secondes
                speedMultiplier: 1.0,
                enemySpawnRate: 60,
                enemySpeed: 0.7,
                starThresholds: [35, 40, 45]
            },
            hard: {
                name: "DIFFICILE",
                color: "#ff0000",
                objectiveTime: 60,    // 60 secondes
                speedMultiplier: 1.3,
                enemySpawnRate: 40,
                enemySpeed: 0.9,
                starThresholds: [50, 55, 60]
            }
        },

        // Joueur
        PLAYER_Y: 520,
        PLAYER_WIDTH: 52,
        PLAYER_HEIGHT: 70,
        PLAYER_SPEED_LATERAL: 5,
        PLAYER_TURBO_BOOST: 2.2,

        // Vitesse
        BASE_SPEED: 4,
        SPEED_INCREMENT: 0.003,
        MAX_SPEED: 14,

        // Ennemis
        ENEMY_COUNT: 6,
        ENEMY_SPAWN_INTERVAL: 60,
        ENEMY_SPEED_RATIO: 0.6,

        // Turbo
        TURBO_MAX: 100,
        TURBO_REGEN: 0.15,
        TURBO_DRAIN: 0.6,

        // Score
        SCORE_PER_FRAME: 1,
        SCORE_DISPLAY_DIGITS: 5,

        // Décor
        TREE_COUNT: 12,
        MOUNTAIN_COUNT: 5,

        // Power-ups
        POWERUP_SPAWN_INTERVAL: 600,
        SHIELD_DURATION: 300,
        SLOWMO_DURATION: 240,

        // Leaderboard
        LEADERBOARD_SIZE: 10
    };

    // ============================================================
    // GESTIONNAIRE D'ÉTAT DU JEU
    // ============================================================
    class GameState {
        constructor() {
            this.reset();
        }

        reset() {
            // État principal
            this.phase = "title"; // title, playing, paused, gameover, win
            this.mode = "classic"; // classic, arcade, challenge
            this.level = "easy";
            this.difficulty = CONFIG.LEVELS.easy;

            // Scores et temps
            this.score = 0;
            this.bestScore = parseInt(localStorage.getItem("retroracer_best") || "0", 10);
            this.gameTime = 0;
            this.objectiveTime = CONFIG.LEVELS.easy.objectiveTime;
            this.stars = 0;

            // Joueur
            this.speed = CONFIG.BASE_SPEED;
            this.playerX = CONFIG.ROAD_CENTER;
            this.turbo = CONFIG.TURBO_MAX;
            this.turboActive = false;
            this.maxSpeed = CONFIG.BASE_SPEED;

            // Entités
            this.enemies = [];
            this.enemyTimer = 0;
            this.powerups = [];
            this.powerupTimer = 0;
            this.enemiesAvoided = 0;
            this.powerupsCollected = 0;

            // Effets
            this.shieldActive = false;
            this.shieldTimer = 0;
            this.slowmoActive = false;
            this.slowmoTimer = 0;

            // Décor
            this.trees = this.generateTrees();
            this.mountains = this.generateMountains();
            this.roadOffset = 0;

            // Contrôles
            this.keys = {
                left: false,
                right: false,
                turbo: false,
                pause: false,
                pausePressed: false
            };

            // Effets visuels
            this.crtEnabled = true;
            this.currentTheme = 0;
            this.themeTransition = 0;

            // Audio
            this.audioEnabled = true;
            this.volume = 0.7;
        }

        generateTrees() {
            const trees = [];
            for (let i = 0; i < CONFIG.TREE_COUNT; i++) {
                trees.push({
                    y: Math.random() * (CONFIG.HEIGHT - CONFIG.HORIZON) + CONFIG.HORIZON,
                    side: Math.random() < 0.5 ? -1 : 1,
                    scale: 0.6 + Math.random() * 0.6
                });
            }
            return trees;
        }

        generateMountains() {
            const mountains = [];
            for (let i = 0; i < CONFIG.MOUNTAIN_COUNT; i++) {
                mountains.push({
                    x: (i / CONFIG.MOUNTAIN_COUNT) * CONFIG.WIDTH - 60,
                    height: 80 + Math.random() * 60,
                    width: 180 + Math.random() * 80
                });
            }
            return mountains;
        }

        setLevel(level) {
            this.level = level;
            this.difficulty = CONFIG.LEVELS[level];
            this.objectiveTime = this.difficulty.objectiveTime;
        }

        setMode(mode) {
            this.mode = mode;
        }

        // Calcule le nombre d'étoiles obtenues
        calculateStars() {
            if (this.mode !== "challenge") return 0;

            const time = this.gameTime;
            const thresholds = this.difficulty.starThresholds;

            if (time >= thresholds[2]) return 3;
            if (time >= thresholds[1]) return 2;
            if (time >= thresholds[0]) return 1;
            return 0;
        }

        // Calcule la progression vers l'objectif (0-1)
        getProgress() {
            if (this.mode !== "challenge") return 0;
            return Math.min(this.gameTime / this.objectiveTime, 1);
        }

        // Formatage du temps
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        // Conversion vitesse en km/h
        getSpeedKmh() {
            return Math.floor(this.speed * 25);
        }
    }

    // ============================================================
    // GESTIONNAIRE D'AUDIO
    // ============================================================
    class AudioManager {
        constructor() {
            this.ctx = null;
            this.initialized = false;
            this.engineOsc = null;
            this.engineGain = null;
            this.masterGain = null;
            this.sounds = new Map();
            this.enabled = true;
            this.volume = 0.7;

            this.init();
        }

        init() {
            if (this.initialized) return;

            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = this.volume;
                this.masterGain.connect(this.ctx.destination);
                this.initialized = true;

                console.log("AudioManager initialisé");
            } catch (e) {
                console.warn("AudioContext non supporté:", e);
                this.enabled = false;
            }
        }

        setVolume(level) {
            this.volume = level;
            if (this.masterGain) {
                this.masterGain.gain.value = level;
            }
        }

        toggleMute() {
            this.enabled = !this.enabled;
            if (this.masterGain) {
                this.masterGain.gain.value = this.enabled ? this.volume : 0;
            }
            return this.enabled;
        }

        // Moteur
        startEngine() {
            if (!this.enabled || !this.initialized) return;

            this.engineOsc = this.ctx.createOscillator();
            this.engineGain = this.ctx.createGain();
            this.engineOsc.type = "square";
            this.engineOsc.frequency.value = 80;
            this.engineGain.gain.value = 0.08;
            this.engineOsc.connect(this.engineGain);
            this.engineGain.connect(this.masterGain);
            this.engineOsc.start();
        }

        updateEngine(speed, turbo) {
            if (!this.engineOsc) return;

            const baseFreq = 60 + speed * 8;
            const freq = turbo ? baseFreq * 1.5 : baseFreq;
            this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
            this.engineGain.gain.setTargetAtTime(turbo ? 0.12 : 0.08, this.ctx.currentTime, 0.05);
        }

        stopEngine() {
            if (this.engineOsc) {
                this.engineOsc.stop();
                this.engineOsc = null;
            }
        }

        // Effets sonores
        playSound(name, params = {}) {
            if (!this.enabled || !this.initialized) return;

            switch (name) {
                case 'turbo':
                    this.playTurbo();
                    break;
                case 'crash':
                    this.playCrash();
                    break;
                case 'powerup':
                    this.playPowerup();
                    break;
                case 'beep':
                    this.playBeep(params.high);
                    break;
                case 'win':
                    this.playWin();
                    break;
            }
        }

        playTurbo() {
            const duration = 0.15;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.value = 150;
            osc.frequency.setTargetAtTime(300, this.ctx.currentTime, 0.05);
            gain.gain.value = 0.1;
            gain.gain.setTargetAtTime(0, this.ctx.currentTime + duration, 0.05);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            osc.stop(this.ctx.currentTime + duration + 0.1);
        }

        playCrash() {
            const duration = 0.5;

            // Bruit blanc
            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.value = 1000;
            filter.frequency.setTargetAtTime(200, this.ctx.currentTime, 0.1);

            const gain = this.ctx.createGain();
            gain.gain.value = 0.4;

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            noise.start();

            // Basse fréquence
            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            bassOsc.type = "sine";
            bassOsc.frequency.value = 100;
            bassOsc.frequency.setTargetAtTime(30, this.ctx.currentTime, 0.1);
            bassGain.gain.value = 0.3;
            bassGain.gain.setTargetAtTime(0, this.ctx.currentTime + 0.3, 0.1);
            bassOsc.connect(bassGain);
            bassGain.connect(this.masterGain);
            bassOsc.start();
            bassOsc.stop(this.ctx.currentTime + duration);
        }

        playPowerup() {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "square";
            osc.frequency.value = 440;

            // Arpège
            const notes = [440, 554, 659, 880];
            notes.forEach((freq, i) => {
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.05);
            });

            gain.gain.value = 0.15;
            gain.gain.setTargetAtTime(0, this.ctx.currentTime + 0.2, 0.05);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        }

        playBeep(high = false) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "square";
            osc.frequency.value = high ? 880 : 440;
            gain.gain.value = 0.2;
            gain.gain.setTargetAtTime(0, this.ctx.currentTime + 0.1, 0.02);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
        }

        playWin() {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = 440;

            // Gamme ascendante
            const notes = [440, 554, 659, 880, 1108];
            notes.forEach((freq, i) => {
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.1);
            });

            gain.gain.value = 0.2;
            gain.gain.setTargetAtTime(0, this.ctx.currentTime + 0.5, 0.1);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.6);
        }
    }

    // ============================================================
    // SYSTÈME DE PARTICULES
    // ============================================================
    class ParticleSystem {
        constructor() {
            this.particles = [];
        }

        emit(x, y, count, config = {}) {
            const defaults = {
                color: "#ff6a00",
                minSpeed: 2,
                maxSpeed: 8,
                minLife: 30,
                maxLife: 60,
                minSize: 3,
                maxSize: 10,
                gravity: 0.15,
                friction: 0.98
            };

            const cfg = { ...defaults, ...config };

            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = cfg.minSpeed + Math.random() * (cfg.maxSpeed - cfg.minSpeed);

                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    life: cfg.minLife + Math.random() * (cfg.maxLife - cfg.minLife),
                    maxLife: cfg.minLife + Math.random() * (cfg.maxLife - cfg.minLife),
                    size: cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize),
                    color: cfg.color,
                    gravity: cfg.gravity,
                    friction: cfg.friction
                });
            }
        }

        explode(x, y) {
            // Débris
            this.emit(x, y, 25, {
                color: "#ff2d95",
                minSpeed: 4,
                maxSpeed: 12,
                minLife: 40,
                maxLife: 80,
                minSize: 4,
                maxSize: 12
            });

            // Étincelles
            this.emit(x, y, 40, {
                color: "#ffe600",
                minSpeed: 6,
                maxSpeed: 15,
                minLife: 20,
                maxLife: 50,
                minSize: 2,
                maxSize: 5,
                gravity: 0.1
            });

            // Fumée
            this.emit(x, y, 15, {
                color: "#333344",
                minSpeed: 1,
                maxSpeed: 3,
                minLife: 60,
                maxLife: 100,
                minSize: 15,
                maxSize: 30,
                gravity: -0.05,
                friction: 0.95
            });
        }

        emitTurbo(x, y) {
            this.emit(x, y, 2, {
                color: Math.random() > 0.5 ? "#ff6a00" : "#ffe600",
                minSpeed: 1,
                maxSpeed: 3,
                minLife: 10,
                maxLife: 20,
                minSize: 3,
                maxSize: 6,
                gravity: 0.3,
                friction: 0.9
            });
        }

        update() {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];

                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= p.friction;
                p.vy *= p.friction;
                p.life--;

                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }

        draw(ctx) {
            this.particles.forEach(p => {
                const alpha = p.life / p.maxLife;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = p.size;
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            });

            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }

        clear() {
            this.particles = [];
        }
    }

    // ============================================================
    // GESTIONNAIRE D'ENTITÉS
    // ============================================================
    class EntityManager {
        constructor() {
            this.enemies = [];
            this.powerups = [];
            this.enemyTimer = 0;
            this.powerupTimer = 0;
        }

        spawnEnemy(state) {
            const y = CONFIG.HORIZON + 5;
            const lane = [0.2, 0.5, 0.8][Math.floor(Math.random() * 3)];

            // Types d'ennemis selon le niveau
            const enemyTypes = this.getEnemyTypes(state);
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const color = type.colors[Math.floor(Math.random() * type.colors.length)];

            this.enemies.push({
                y, lane, color,
                width: type.width,
                height: type.height,
                speedMod: type.speedMod * state.difficulty.enemySpeed,
                type: type.name
            });
        }

        getEnemyTypes(state) {
            const types = [
                {
                    name: "car", width: 44, height: 58, speedMod: 1,
                    colors: ["#e63946", "#457b9d", "#2a9d8f", "#e9c46a", "#f4a261"]
                },
                {
                    name: "truck", width: 56, height: 80, speedMod: 0.7,
                    colors: ["#8b0000", "#2f4f4f", "#4a4a4a", "#8b4513"]
                },
                {
                    name: "sportsCar", width: 40, height: 50, speedMod: 1.4,
                    colors: ["#ff0000", "#ffff00", "#00ff00", "#ff00ff", "#00ffff"]
                },
                {
                    name: "police", width: 48, height: 62, speedMod: 1.2,
                    colors: ["#000080"]
                }
            ];

            // Plus de variété selon le niveau
            if (state.level === "easy") return types.slice(0, 2);
            if (state.level === "medium") return types.slice(0, 3);
            return types; // hard
        }

        spawnPowerup(state) {
            const y = CONFIG.HORIZON + 5;
            const lane = [0.2, 0.5, 0.8][Math.floor(Math.random() * 3)];

            const powerupTypes = [
                { name: "shield", color: "#00f0ff", icon: "S", duration: CONFIG.SHIELD_DURATION },
                { name: "slowmo", color: "#ff2d95", icon: "T", duration: CONFIG.SLOWMO_DURATION },
                { name: "turboRefill", color: "#ffe600", icon: "F" },
                { name: "scoreBonus", color: "#39ff14", icon: "+" }
            ];

            const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];

            this.powerups.push({
                y, lane,
                type: type.name,
                color: type.color,
                icon: type.icon,
                collected: false
            });
        }

        update(state, effectiveSpeed) {
            // Ennemis
            this.enemyTimer++;
            const spawnInterval = Math.max(
                20,
                state.difficulty.enemySpawnRate - state.score / 100
            );

            if (this.enemyTimer >= spawnInterval) {
                this.spawnEnemy(state);
                this.enemyTimer = 0;
            }

            this.updateEnemies(state, effectiveSpeed);

            // Power-ups
            this.powerupTimer++;
            if (this.powerupTimer >= CONFIG.POWERUP_SPAWN_INTERVAL) {
                this.spawnPowerup(state);
                this.powerupTimer = 0;
            }

            this.updatePowerups(state, effectiveSpeed);
        }

        updateEnemies(state, effectiveSpeed) {
            const slowMod = state.slowmoActive ? 0.4 : 1;

            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const e = this.enemies[i];
                const depthFactor = (e.y - CONFIG.HORIZON) / (CONFIG.HEIGHT - CONFIG.HORIZON);
                e.y += effectiveSpeed * (0.3 + depthFactor * 1.2) * e.speedMod * slowMod;

                if (e.y > CONFIG.HEIGHT + 60) {
                    this.enemies.splice(i, 1);
                    state.enemiesAvoided++;
                }
            }
        }

        updatePowerups(state, effectiveSpeed) {
            const slowMod = state.slowmoActive ? 0.4 : 1;

            for (let i = this.powerups.length - 1; i >= 0; i--) {
                const p = this.powerups[i];
                const depthFactor = (p.y - CONFIG.HORIZON) / (CONFIG.HEIGHT - CONFIG.HORIZON);
                p.y += effectiveSpeed * (0.3 + depthFactor * 1.2) * slowMod;

                if (p.y > CONFIG.HEIGHT + 60) {
                    this.powerups.splice(i, 1);
                }
            }
        }

        checkCollisions(state, particleSystem, audioManager) {
            this.checkPowerupCollisions(state, particleSystem, audioManager);
            return this.checkEnemyCollisions(state);
        }

        checkPowerupCollisions(state, particleSystem, audioManager) {
            const pw = CONFIG.PLAYER_WIDTH * 0.8;
            const ph = CONFIG.PLAYER_HEIGHT * 0.6;
            const px = state.playerX - pw / 2;
            const py = CONFIG.PLAYER_Y - ph;

            for (let i = this.powerups.length - 1; i >= 0; i--) {
                const p = this.powerups[i];
                const depthT = Math.max(0, (p.y - CONFIG.HORIZON) / (CONFIG.HEIGHT - CONFIG.HORIZON));
                const size = 20 * (0.4 + depthT * 0.6);
                const ex = this.roadXAt(p.y, p.lane, state) - size / 2;
                const ey = p.y - size;

                if (px < ex + size && px + pw > ex &&
                    py < ey + size && py + ph > ey) {

                    this.collectPowerup(p, state, particleSystem, audioManager);
                    this.powerups.splice(i, 1);
                    state.powerupsCollected++;
                }
            }
        }

        collectPowerup(powerup, state, particleSystem, audioManager) {
            audioManager.playSound('powerup');

            switch (powerup.type) {
                case "shield":
                    state.shieldActive = true;
                    state.shieldTimer = CONFIG.SHIELD_DURATION;
                    break;
                case "slowmo":
                    state.slowmoActive = true;
                    state.slowmoTimer = CONFIG.SLOWMO_DURATION;
                    break;
                case "turboRefill":
                    state.turbo = CONFIG.TURBO_MAX;
                    break;
                case "scoreBonus":
                    state.score += 500;
                    break;
            }

            // Effet visuel
            particleSystem.emit(state.playerX, CONFIG.PLAYER_Y - 30, 20, {
                color: powerup.color,
                minSpeed: 3,
                maxSpeed: 8,
                minLife: 20,
                maxLife: 40
            });
        }

        checkEnemyCollisions(state) {
            if (state.shieldActive) return false;

            const pw = CONFIG.PLAYER_WIDTH * 0.7;
            const ph = CONFIG.PLAYER_HEIGHT * 0.5;
            const px = state.playerX - pw / 2;
            const py = CONFIG.PLAYER_Y - ph;

            for (const e of this.enemies) {
                const depthT = Math.max(0, (e.y - CONFIG.HORIZON) / (CONFIG.HEIGHT - CONFIG.HORIZON));
                const ew = e.width * (0.4 + depthT * 0.6) * 0.75;
                const eh = e.height * (0.4 + depthT * 0.6) * 0.5;
                const ex = this.roadXAt(e.y, e.lane, state) - ew / 2;
                const ey = e.y - eh;

                if (px < ex + ew && px + pw > ex &&
                    py < ey + eh && py + ph > ey) {
                    return true;
                }
            }
            return false;
        }

        roadXAt(y, laneRatio, state) {
            const center = this.roadCenterAt(y, state);
            const width = this.roadWidthAt(y);
            return center + (laneRatio - 0.5) * width;
        }

        roadWidthAt(y) {
            if (y <= CONFIG.HORIZON) return CONFIG.ROAD_TOP_WIDTH;
            const t = (y - CONFIG.HORIZON) / (CONFIG.HEIGHT - CONFIG.HORIZON);
            return this.lerp(CONFIG.ROAD_TOP_WIDTH, CONFIG.ROAD_BOT_WIDTH, t);
        }

        roadCenterAt(y, state) {
            if (y <= CONFIG.HORIZON) return CONFIG.ROAD_CENTER + state.roadOffset * 0.15;
            const t = (y - CONFIG.HORIZON) / (CONFIG.HEIGHT - CONFIG.HORIZON);
            return this.lerp(
                CONFIG.ROAD_CENTER + state.roadOffset * 0.15,
                CONFIG.ROAD_CENTER + state.roadOffset,
                t
            );
        }

        lerp(a, b, t) {
            return a + (b - a) * t;
        }

        clear() {
            this.enemies = [];
            this.powerups = [];
            this.enemyTimer = 0;
            this.powerupTimer = 0;
        }
    }

    // ============================================================
    // MOTEUR DE RENDU
    // ============================================================
    class RenderEngine {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.themes = this.createThemes();
        }

        createThemes() {
            return [
                {
                    name: "SYNTHWAVE",
                    sky: ["#0a0015", "#1a0033", "#2d1b4e", "#ff2d95"],
                    sun: "#ffe600",
                    sunStripes: "#1a0033",
                    mountains: "#1e1040",
                    mountainOutline: "#ff2d9544",
                    road: "#1a1a2e",
                    roadLine: "#ffe60088",
                    roadBorder: "#00f0ff66",
                    grass: "#0d2b00",
                    tree: "#39ff14",
                    gridColor: "#00f0ff18"
                },
                {
                    name: "NUIT NEON",
                    sky: ["#000011", "#000022", "#001133", "#0044aa"],
                    sun: "#4488ff",
                    sunStripes: "#000022",
                    mountains: "#001122",
                    mountainOutline: "#00aaff44",
                    road: "#0a0a15",
                    roadLine: "#00ffff88",
                    roadBorder: "#ff00ff66",
                    grass: "#001100",
                    tree: "#00ffaa",
                    gridColor: "#ff00ff18"
                }
            ];
        }

        resize() {
            const ratio = Math.min(
                window.innerWidth / CONFIG.WIDTH,
                window.innerHeight / CONFIG.HEIGHT
            );

            this.canvas.style.width = (CONFIG.WIDTH * ratio) + "px";
            this.canvas.style.height = (CONFIG.HEIGHT * ratio) + "px";
            this.canvas.style.left = ((window.innerWidth - CONFIG.WIDTH * ratio) / 2) + "px";
            this.canvas.style.top = ((window.innerHeight - CONFIG.HEIGHT * ratio) / 2) + "px";

            this.canvas.width = CONFIG.WIDTH;
            this.canvas.height = CONFIG.HEIGHT;
        }

        draw(state, entityManager, particleSystem) {
            this.clear();
            this.drawSky(state);
            this.drawSun(state);
            this.drawMountains(state);
            this.drawRoad(state);
            this.drawGroundGrid(state);
            this.drawTrees(state);
            this.drawPowerups(state, entityManager);
            this.drawEnemies(state, entityManager);
            particleSystem.draw(this.ctx);
            this.drawPlayer(state);
            this.drawEffects(state);
        }

        clear() {
            this.ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        }

        drawSky(state) {
            const theme = this.themes[state.currentTheme % this.themes.length];
            const grad = this.ctx.createLinearGradient(0, 0, 0, CONFIG.HORIZON);

            theme.sky.forEach((color, i) => {
                grad.addColorStop(i / (theme.sky.length - 1), color);
            });

            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HORIZON);
        }

        drawSun(state) {
            const theme = this.themes[state.currentTheme % this.themes.length];
            const sx = CONFIG.ROAD_CENTER + state.roadOffset * 0.15;
            const sy = CONFIG.HORIZON - 10;
            const radius = 50;

            this.ctx.fillStyle = theme.sun;
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        drawMountains(state) {
            const theme = this.themes[state.currentTheme % this.themes.length];
            this.ctx.fillStyle = theme.mountains;

            state.mountains.forEach(m => {
                this.ctx.beginPath();
                this.ctx.moveTo(m.x, CONFIG.HORIZON);
                this.ctx.lineTo(m.x + m.width / 2, CONFIG.HORIZON - m.height);
                this.ctx.lineTo(m.x + m.width, CONFIG.HORIZON);
                this.ctx.closePath();
                this.ctx.fill();
            });
        }

        drawRoad(state) {
            const theme = this.themes[state.currentTheme % this.themes.length];

            // Fond de la route
            this.ctx.fillStyle = theme.road;
            this.ctx.beginPath();

            const topWidth = CONFIG.ROAD_TOP_WIDTH;
            const bottomWidth = CONFIG.ROAD_BOT_WIDTH;
            const topCenter = CONFIG.ROAD_CENTER + state.roadOffset * 0.15;
            const bottomCenter = CONFIG.ROAD_CENTER + state.roadOffset;

            this.ctx.moveTo(topCenter - topWidth / 2, CONFIG.HORIZON);
            this.ctx.lineTo(topCenter + topWidth / 2, CONFIG.HORIZON);
            this.ctx.lineTo(bottomCenter + bottomWidth / 2, CONFIG.HEIGHT);
            this.ctx.lineTo(bottomCenter - bottomWidth / 2, CONFIG.HEIGHT);
            this.ctx.closePath();
            this.ctx.fill();

            // Lignes de la route
            this.drawRoadLines(state, theme);
        }

        drawRoadLines(state, theme) {
            // Ligne médiane
            this.ctx.strokeStyle = theme.roadLine;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([30, 20]);

            const scroll = (Date.now() * 0.08 * state.speed) % (50 * 6);
            this.ctx.lineDashOffset = -scroll;

            this.ctx.beginPath();
            this.drawRoadCurve(state, (y, center) => {
                if (y === CONFIG.HORIZON) {
                    this.ctx.moveTo(center, y);
                } else {
                    this.ctx.lineTo(center, y);
                }
            });
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        drawRoadCurve(state, callback) {
            for (let y = CONFIG.HORIZON; y <= CONFIG.HEIGHT; y += 4) {
                const t = (y - CONFIG.HORIZON) / (CONFIG.HEIGHT - CONFIG.HORIZON);
                const center = CONFIG.ROAD_CENTER +
                    state.roadOffset * (0.15 + t * 0.85);
                callback(y, center);
            }
        }

        drawGroundGrid(state) {
            const theme = this.themes[state.currentTheme % this.themes.length];
            this.ctx.strokeStyle = theme.gridColor;
            this.ctx.lineWidth = 1;

            const scroll = (Date.now() * 0.05 * state.speed) % 40;

            for (let y = CONFIG.HORIZON; y < CONFIG.HEIGHT; y += 40) {
                const adjustedY = y + scroll;
                if (adjustedY > CONFIG.HEIGHT) continue;

                const t = (adjustedY - CONFIG.HORIZON) / (CONFIG.HEIGHT - CONFIG.HORIZON);
                const center = CONFIG.ROAD_CENTER + state.roadOffset * (0.15 + t * 0.85);
                const width = CONFIG.ROAD_TOP_WIDTH +
                    (CONFIG.ROAD_BOT_WIDTH - CONFIG.ROAD_TOP_WIDTH) * t;

                this.ctx.beginPath();
                this.ctx.moveTo(center - width / 2, adjustedY);
                this.ctx.lineTo(center + width / 2, adjustedY);
                this.ctx.stroke();
            }
        }

        drawTrees(state) {
            const theme = this.themes[state.currentTheme % this.themes.length];
            const sortedTrees = [...state.trees].sort((a, b) => a.y - b.y);

            sortedTrees.forEach(tree => {
                const t = (tree.y - CONFIG.HORIZON) / (CONFIG.HEIGHT - CONFIG.HORIZON);
                const center = CONFIG.ROAD_CENTER + state.roadOffset * (0.15 + t * 0.85);
                const width = CONFIG.ROAD_TOP_WIDTH +
                    (CONFIG.ROAD_BOT_WIDTH - CONFIG.ROAD_TOP_WIDTH) * t;

                const offset = (width / 2 + 25 * tree.scale) * tree.side;
                this.drawTree(center + offset, tree.y, tree.scale, theme);
            });
        }

        drawTree(x, y, scale, theme) {
            const tw = 18 * scale;
            const th = 26 * scale;
            const trunkW = 6 * scale;
            const trunkH = 12 * scale;

            // Tronc
            this.ctx.fillStyle = "#3b2a1a";
            this.ctx.fillRect(x - trunkW / 2, y - trunkH, trunkW, trunkH);

            // Feuillage
            this.ctx.fillStyle = theme.tree;
            this.ctx.shadowColor = theme.tree;
            this.ctx.shadowBlur = 8 * scale;
            this.ctx.beginPath();
            this.ctx.arc(x, y - th, tw, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        drawEnemies(state, entityManager) {
            const sortedEnemies = [...entityManager.enemies]
                .sort((a, b) => a.y - b.y);

            sortedEnemies.forEach(enemy => {
                this.drawEnemy(enemy, state, entityManager);
            });
        }

        drawEnemy(enemy, state, entityManager) {
            const depthT = Math.max(0, (enemy.y - CONFIG.HORIZON) / (CONFIG.HEIGHT - CONFIG.HORIZON));
            const scale = 0.35 + depthT * 0.65;
            const w = enemy.width * scale;
            const h = enemy.height * scale;
            const x = entityManager.roadXAt(enemy.y, enemy.lane, state) - w / 2;
            const y = enemy.y - h;

            // Ombre
            this.ctx.fillStyle = "rgba(0,0,0,0.3)";
            this.ctx.beginPath();
            this.ctx.ellipse(x + w / 2, enemy.y + 2, w * 0.4, h * 0.1, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Corps du véhicule
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(x + w * 0.1, y + h * 0.3, w * 0.8, h * 0.7);

            // Détails selon le type
            this.drawEnemyDetails(enemy, x, y, w, h);
        }

        drawEnemyDetails(enemy, x, y, w, h) {
            switch (enemy.type) {
                case 'truck':
                    this.drawTruckDetails(x, y, w, h, enemy.color);
                    break;
                case 'sportsCar':
                    this.drawSportsCarDetails(x, y, w, h, enemy.color);
                    break;
                case 'police':
                    this.drawPoliceCarDetails(x, y, w, h);
                    break;
                default:
                    this.drawCarDetails(x, y, w, h, enemy.color);
            }
        }

        // ============================================================
        // FONCTIONS DE DESSIN POUR LES DIFFÉRENTS TYPES D'ENNEMIS
        // ============================================================

        drawTruckDetails(x, y, w, h, color) {
            // Remorque
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x + w * 0.05, y + h * 0.1, w * 0.9, h * 0.75);

            // Cabine
            this.ctx.fillStyle = "#222233";
            this.ctx.fillRect(x + w * 0.15, y + h * 0.85, w * 0.7, h * 0.15);

            // Détails remorque
            this.ctx.strokeStyle = "#00000033";
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x + w * 0.1, y + h * 0.15, w * 0.35, h * 0.55);
            this.ctx.strokeRect(x + w * 0.55, y + h * 0.15, w * 0.35, h * 0.55);

            // Roues (doubles)
            this.ctx.fillStyle = "#111";
            this.ctx.fillRect(x - w * 0.02, y + h * 0.6, w * 0.12, h * 0.15);
            this.ctx.fillRect(x + w * 0.9, y + h * 0.6, w * 0.12, h * 0.15);
            this.ctx.fillRect(x - w * 0.02, y + h * 0.8, w * 0.12, h * 0.15);
            this.ctx.fillRect(x + w * 0.9, y + h * 0.8, w * 0.12, h * 0.15);

            // Feux
            this.ctx.fillStyle = "#ff3333";
            this.ctx.shadowColor = "#ff3333";
            this.ctx.shadowBlur = 4;
            this.ctx.fillRect(x + w * 0.08, y + h * 0.02, w * 0.12, h * 0.05);
            this.ctx.fillRect(x + w * 0.8, y + h * 0.02, w * 0.12, h * 0.05);
            this.ctx.shadowBlur = 0;
        }

        drawSportsCarDetails(x, y, w, h, color) {
            // Corps principal (forme aéro)
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.moveTo(x + w * 0.1, y + h * 0.5);
            this.ctx.lineTo(x + w * 0.2, y + h * 0.35);
            this.ctx.lineTo(x + w * 0.8, y + h * 0.35);
            this.ctx.lineTo(x + w * 0.9, y + h * 0.5);
            this.ctx.lineTo(x + w * 0.9, y + h * 0.95);
            this.ctx.lineTo(x + w * 0.1, y + h * 0.95);
            this.ctx.closePath();
            this.ctx.fill();

            // Cockpit
            this.ctx.fillStyle = "#111122";
            this.ctx.beginPath();
            this.ctx.moveTo(x + w * 0.25, y + h * 0.38);
            this.ctx.lineTo(x + w * 0.35, y + h * 0.25);
            this.ctx.lineTo(x + w * 0.65, y + h * 0.25);
            this.ctx.lineTo(x + w * 0.75, y + h * 0.38);
            this.ctx.closePath();
            this.ctx.fill();

            // Spoiler
            this.ctx.fillStyle = "#222";
            this.ctx.fillRect(x + w * 0.15, y + h * 0.05, w * 0.7, h * 0.04);

            // Roues
            this.ctx.fillStyle = "#111";
            this.ctx.fillRect(x - w * 0.05, y + h * 0.7, w * 0.18, h * 0.2);
            this.ctx.fillRect(x + w * 0.87, y + h * 0.7, w * 0.18, h * 0.2);

            // Phares arrière
            this.ctx.fillStyle = "#ff0000";
            this.ctx.shadowColor = "#ff0000";
            this.ctx.shadowBlur = 6;
            this.ctx.fillRect(x + w * 0.12, y + h * 0.08, w * 0.2, h * 0.06);
            this.ctx.fillRect(x + w * 0.68, y + h * 0.08, w * 0.2, h * 0.06);
            this.ctx.shadowBlur = 0;
        }

        drawPoliceCarDetails(x, y, w, h) {
            // Corps principal
            this.ctx.fillStyle = "#000080";
            this.ctx.fillRect(x + w * 0.1, y + h * 0.3, w * 0.8, h * 0.7);

            // Cabine
            this.ctx.fillStyle = "#111122";
            this.ctx.fillRect(x + w * 0.2, y + h * 0.12, w * 0.6, h * 0.25);

            // Gyrophare
            const flashOn = Math.sin(Date.now() / 50) > 0;
            this.ctx.fillStyle = flashOn ? "#ff0000" : "#0000ff";
            this.ctx.shadowColor = flashOn ? "#ff0000" : "#0000ff";
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(x + w * 0.35, y + h * 0.05, w * 0.3, h * 0.08);
            this.ctx.shadowBlur = 0;

            // Bande blanche
            this.ctx.fillStyle = "#ffffff";
            this.ctx.fillRect(x + w * 0.1, y + h * 0.55, w * 0.8, h * 0.1);

            // Roues
            this.ctx.fillStyle = "#111";
            this.ctx.fillRect(x - w * 0.05, y + h * 0.75, w * 0.18, h * 0.22);
            this.ctx.fillRect(x + w * 0.87, y + h * 0.75, w * 0.18, h * 0.22);
        }

        drawCarDetails(x, y, w, h, color) {
            // Corps principal
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x + w * 0.1, y + h * 0.3, w * 0.8, h * 0.7);

            // Reflet sur le capot
            const gradReflet = this.ctx.createLinearGradient(x, y + h * 0.3, x, y + h * 0.6);
            gradReflet.addColorStop(0, "rgba(255,255,255,0.3)");
            gradReflet.addColorStop(1, "rgba(255,255,255,0)");
            this.ctx.fillStyle = gradReflet;
            this.ctx.fillRect(x + w * 0.15, y + h * 0.35, w * 0.7, h * 0.25);

            // Cabine
            this.ctx.fillStyle = "#111122";
            this.ctx.fillRect(x + w * 0.2, y + h * 0.12, w * 0.6, h * 0.25);

            // Reflet vitre
            this.ctx.fillStyle = "rgba(100,150,255,0.2)";
            this.ctx.fillRect(x + w * 0.22, y + h * 0.14, w * 0.25, h * 0.2);

            // Roues avec détails
            this.ctx.fillStyle = "#111";
            this.ctx.fillRect(x - w * 0.05, y + h * 0.75, w * 0.18, h * 0.22);
            this.ctx.fillRect(x + w * 0.87, y + h * 0.75, w * 0.18, h * 0.22);

            // Jantes
            this.ctx.fillStyle = "#444";
            this.ctx.fillRect(x - w * 0.02, y + h * 0.78, w * 0.12, h * 0.16);
            this.ctx.fillRect(x + w * 0.9, y + h * 0.78, w * 0.12, h * 0.16);

            // Phares
            this.ctx.fillStyle = "#ffe600";
            this.ctx.shadowColor = "#ffe600";
            this.ctx.shadowBlur = 4;
            this.ctx.fillRect(x + w * 0.12, y + h * 0.92, w * 0.15, h * 0.06);
            this.ctx.fillRect(x + w * 0.73, y + h * 0.92, w * 0.15, h * 0.06);
            this.ctx.shadowBlur = 0;
        }

        drawPowerups(state, entityManager) {
            entityManager.powerups.forEach(powerup => {
                this.drawPowerup(powerup, state, entityManager);
            });
        }

        drawPowerup(powerup, state, entityManager) {
            const depthT = Math.max(0, (powerup.y - CONFIG.HORIZON) / (CONFIG.HEIGHT - CONFIG.HORIZON));
            const scale = 0.4 + depthT * 0.6;
            const size = 24 * scale;
            const x = entityManager.roadXAt(powerup.y, powerup.lane, state);
            const y = powerup.y - size / 2;
            const float = Math.sin(Date.now() / 200 + powerup.y) * 3;

            // Cercle externe
            this.ctx.strokeStyle = powerup.color;
            this.ctx.shadowColor = powerup.color;
            this.ctx.shadowBlur = 10;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y + float, size / 2, 0, Math.PI * 2);
            this.ctx.stroke();

            // Cercle interne
            this.ctx.fillStyle = powerup.color + "44";
            this.ctx.beginPath();
            this.ctx.arc(x, y + float, size / 2 - 3, 0, Math.PI * 2);
            this.ctx.fill();

            // Icône
            this.ctx.fillStyle = powerup.color;
            this.ctx.font = `bold ${size * 0.5}px Arial`;
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(powerup.icon, x, y + float);

            this.ctx.shadowBlur = 0;
        }

        drawPlayer(state) {
            const w = CONFIG.PLAYER_WIDTH;
            const h = CONFIG.PLAYER_HEIGHT;
            const x = state.playerX - w / 2;
            const y = CONFIG.PLAYER_Y - h;

            // Ombre
            this.ctx.fillStyle = "rgba(0,0,0,0.4)";
            this.ctx.beginPath();
            this.ctx.ellipse(state.playerX, CONFIG.PLAYER_Y + 3, w * 0.4, h * 0.08, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Bouclier
            if (state.shieldActive) {
                this.ctx.strokeStyle = "#00f0ff";
                this.ctx.shadowColor = "#00f0ff";
                this.ctx.shadowBlur = 15;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.ellipse(state.playerX, CONFIG.PLAYER_Y - h / 2, w * 0.8, h * 0.6, 0, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }

            // Turbo (flammes)
            if (state.turboActive) {
                this.ctx.fillStyle = "#ff6a00";
                this.ctx.shadowColor = "#ff6a00";
                this.ctx.shadowBlur = 12;

                for (let i = 0; i < 3; i++) {
                    const fx = x + w * 0.25 + (i - 1) * w * 0.15;
                    const fh = 10 + Math.random() * 15;

                    this.ctx.beginPath();
                    this.ctx.moveTo(fx, y + h);
                    this.ctx.lineTo(fx - 5, y + h + fh);
                    this.ctx.lineTo(fx + 5, y + h + fh);
                    this.ctx.closePath();
                    this.ctx.fill();
                }

                this.ctx.shadowBlur = 0;
            }

            // Corps principal
            this.ctx.fillStyle = "#00f0ff";
            this.ctx.shadowColor = "#00f0ff";
            this.ctx.shadowBlur = 10;

            this.ctx.beginPath();
            this.ctx.moveTo(x + w * 0.1, y + h * 0.4);
            this.ctx.lineTo(x + w * 0.15, y + h * 0.3);
            this.ctx.lineTo(x + w * 0.85, y + h * 0.3);
            this.ctx.lineTo(x + w * 0.9, y + h * 0.4);
            this.ctx.lineTo(x + w * 0.9, y + h);
            this.ctx.lineTo(x + w * 0.1, y + h);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // Détails
            this.drawPlayerDetails(x, y, w, h);
        }

        drawPlayerDetails(x, y, w, h) {
            // Cockpit
            this.ctx.fillStyle = "#0a2a3a";
            this.ctx.beginPath();
            this.ctx.moveTo(x + w * 0.2, y + h * 0.32);
            this.ctx.lineTo(x + w * 0.3, y + h * 0.1);
            this.ctx.lineTo(x + w * 0.7, y + h * 0.1);
            this.ctx.lineTo(x + w * 0.8, y + h * 0.32);
            this.ctx.closePath();
            this.ctx.fill();

            // Roues
            this.ctx.fillStyle = "#111";
            this.ctx.fillRect(x - w * 0.08, y + h * 0.75, w * 0.2, h * 0.22);
            this.ctx.fillRect(x + w * 0.88, y + h * 0.75, w * 0.2, h * 0.22);

            // Feux arrière
            this.ctx.fillStyle = "#ff2d95";
            this.ctx.shadowColor = "#ff2d95";
            this.ctx.shadowBlur = 8;
            this.ctx.fillRect(x + w * 0.1, y + h * 0.02, w * 0.18, h * 0.08);
            this.ctx.fillRect(x + w * 0.72, y + h * 0.02, w * 0.18, h * 0.08);
            this.ctx.shadowBlur = 0;
        }

        drawEffects(state) {
            if (state.slowmoActive) {
                this.drawSlowmoEffect();
            }

            this.drawScanlines();

            if (state.crtEnabled) {
                this.drawCRTEffect();
            }
        }

        drawSlowmoEffect() {
            this.ctx.fillStyle = "rgba(255,45,149,0.1)";
            this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

            this.ctx.strokeStyle = "#ff2d95";
            this.ctx.shadowColor = "#ff2d95";
            this.ctx.shadowBlur = 20;
            this.ctx.lineWidth = 4 + Math.sin(Date.now() / 100) * 2;
            this.ctx.strokeRect(5, 5, CONFIG.WIDTH - 10, CONFIG.HEIGHT - 10);
            this.ctx.shadowBlur = 0;
        }

        drawScanlines() {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
            for (let y = 0; y < CONFIG.HEIGHT; y += 4) {
                this.ctx.fillRect(0, y, CONFIG.WIDTH, 2);
            }
        }

        drawCRTEffect() {
            // Vignette
            const vignetteGrad = this.ctx.createRadialGradient(
                CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.HEIGHT * 0.3,
                CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.HEIGHT * 0.8
            );
            vignetteGrad.addColorStop(0, "rgba(0,0,0,0)");
            vignetteGrad.addColorStop(1, "rgba(0,0,0,0.4)");

            this.ctx.fillStyle = vignetteGrad;
            this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

            // Ligne de balayage
            const scanY = (Date.now() * 0.1) % CONFIG.HEIGHT;
            this.ctx.fillStyle = "rgba(255,255,255,0.03)";
            this.ctx.fillRect(0, scanY, CONFIG.WIDTH, 4);
        }
    }

    // ============================================================
    // GESTIONNAIRE D'INTERFACE
    // ============================================================
    class UIManager {
        constructor() {
            this.elements = this.cacheElements();
            this.bindEvents();
        }

        cacheElements() {
            return {
                loadingScreen: document.getElementById('loadingScreen'),
                titleScreen: document.getElementById('titleScreen'),
                pauseScreen: document.getElementById('pauseScreen'),
                winScreen: document.getElementById('winScreen'),
                gameOverScreen: document.getElementById('gameOverScreen'),

                // HUD
                scoreDisplay: document.getElementById('scoreDisplay'),
                bestDisplay: document.getElementById('bestDisplay'),
                timeDisplay: document.getElementById('timeDisplay'),
                levelDisplay: document.getElementById('levelDisplay'),
                speedDisplay: document.getElementById('speedDisplay'),
                turboBar: document.getElementById('turboBar'),
                turboValue: document.getElementById('turboValue'),
                objectiveFill: document.getElementById('objectiveFill'),
                objectiveText: document.getElementById('objectiveText'),
                activeEffects: document.getElementById('activeEffects'),

                // Écran de pause
                pauseTime: document.getElementById('pauseTime'),
                pauseScore: document.getElementById('pauseScore'),
                pauseSpeed: document.getElementById('pauseSpeed'),

                // Écran de victoire
                winTime: document.getElementById('winTime'),
                winScore: document.getElementById('winScore'),
                winAvoided: document.getElementById('winAvoided'),
                winMaxSpeed: document.getElementById('winMaxSpeed'),
                winMessage: document.getElementById('winMessage'),

                // Game Over
                finalScore: document.getElementById('finalScore'),
                bestScore: document.getElementById('bestScore'),
                finalTime: document.getElementById('finalTime'),
                progressFill: document.getElementById('progressFill'),
                progressText: document.getElementById('progressText'),

                // Contrôles audio
                muteBtn: document.getElementById('muteBtn'),
                volumeSlider: document.getElementById('volumeSlider'),

                // Boutons
                resumeBtn: document.getElementById('resumeBtn'),
                restartBtn: document.getElementById('restartBtn'),
                menuBtn: document.getElementById('menuBtn'),
                nextLevelBtn: document.getElementById('nextLevelBtn'),
                winRestartBtn: document.getElementById('winRestartBtn'),
                winMenuBtn: document.getElementById('winMenuBtn')
            };
        }

        bindEvents() {
            console.log('Liaison des événements UI...');

            // Sélection du niveau
            document.querySelectorAll('.level-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectLevel(option);
                });
            });

            // Sélection du mode
            document.querySelectorAll('.mode-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectMode(option);
                });
            });

            console.log('Événements UI liés');
        }

        selectLevel(option) {
            console.log('Sélection niveau:', option.dataset.level);

            // Retirer la sélection actuelle
            document.querySelectorAll('.level-option').forEach(opt => {
                opt.classList.remove('active');
            });

            // Ajouter la sélection
            option.classList.add('active');

            const level = option.dataset.level;
            this.setActiveLevel(level);

            // Déclencher un événement personnalisé
            document.dispatchEvent(new CustomEvent('levelSelected', {
                detail: { level: level }
            }));
        }

        selectMode(option) {
            console.log('Sélection mode:', option.dataset.mode);
            const mode = option.dataset.mode;

            // Déclencher un événement personnalisé
            document.dispatchEvent(new CustomEvent('modeSelected', {
                detail: { mode: mode }
            }));
        }

        setActiveLevel(level) {
            // Mettre à jour l'affichage du HUD si disponible
            if (this.elements.levelDisplay) {
                this.elements.levelDisplay.textContent = CONFIG.LEVELS[level].name;
                this.elements.levelDisplay.style.color = CONFIG.LEVELS[level].color;
            }
        }

        updateHUD(state) {
            // Scores
            if (this.elements.scoreDisplay) {
                this.elements.scoreDisplay.textContent =
                    this.padScore(state.score, CONFIG.SCORE_DISPLAY_DIGITS);
            }

            if (this.elements.bestDisplay) {
                this.elements.bestDisplay.textContent =
                    this.padScore(state.bestScore, CONFIG.SCORE_DISPLAY_DIGITS);
            }

            // Temps
            if (this.elements.timeDisplay) {
                this.elements.timeDisplay.textContent = state.formatTime(state.gameTime);
            }

            // Vitesse
            if (this.elements.speedDisplay) {
                this.elements.speedDisplay.textContent = state.getSpeedKmh() + ' km/h';
            }

            // Turbo
            if (this.elements.turboBar && this.elements.turboValue) {
                const turboPercent = Math.floor((state.turbo / CONFIG.TURBO_MAX) * 100);
                this.elements.turboBar.style.width = turboPercent + '%';
                this.elements.turboValue.textContent = turboPercent + '%';
            }

            // Objectif (mode défi)
            if (state.mode === 'challenge' && this.elements.objectiveFill && this.elements.objectiveText) {
                const progress = state.getProgress() * 100;
                this.elements.objectiveFill.style.width = progress + '%';

                const timeLeft = Math.max(0, state.objectiveTime - state.gameTime);
                this.elements.objectiveText.textContent =
                    `${state.formatTime(state.gameTime)} / ${state.formatTime(state.objectiveTime)}`;
            }

            // Effets actifs
            this.updateActiveEffects(state);
        }

        updateActiveEffects(state) {
            if (!this.elements.activeEffects) return;

            let effects = [];

            if (state.shieldActive) {
                const timeLeft = Math.ceil(state.shieldTimer / 60);
                effects.push(`<span style="color:#00f0ff">BOUCLIER ${timeLeft}s</span>`);
            }

            if (state.slowmoActive) {
                const timeLeft = Math.ceil(state.slowmoTimer / 60);
                effects.push(`<span style="color:#ff2d95">RALENTI ${timeLeft}s</span>`);
            }

            this.elements.activeEffects.innerHTML = effects.join(' ');
        }

        updatePauseScreen(state) {
            if (this.elements.pauseTime) {
                this.elements.pauseTime.textContent = state.formatTime(state.gameTime);
            }

            if (this.elements.pauseScore) {
                this.elements.pauseScore.textContent = this.padScore(state.score, CONFIG.SCORE_DISPLAY_DIGITS);
            }

            if (this.elements.pauseSpeed) {
                this.elements.pauseSpeed.textContent = state.getSpeedKmh() + ' km/h';
            }
        }

        updateWinScreen(state) {
            if (this.elements.winTime) {
                this.elements.winTime.textContent = state.formatTime(state.gameTime);
            }

            if (this.elements.winScore) {
                this.elements.winScore.textContent = this.padScore(state.score, CONFIG.SCORE_DISPLAY_DIGITS);
            }

            if (this.elements.winAvoided) {
                this.elements.winAvoided.textContent = state.enemiesAvoided;
            }

            if (this.elements.winMaxSpeed) {
                this.elements.winMaxSpeed.textContent = Math.floor(state.maxSpeed * 25) + ' km/h';
            }

            // Message selon le nombre d'étoiles
            if (this.elements.winMessage) {
                const stars = state.calculateStars();
                let message = '';

                switch (stars) {
                    case 3:
                        message = 'PARFAIT ! 3 ÉTOILES ★★★';
                        break;
                    case 2:
                        message = 'EXCELLENT ! 2 ÉTOILES ★★☆';
                        break;
                    case 1:
                        message = 'BIEN JOUÉ ! 1 ÉTOILE ★☆☆';
                        break;
                    default:
                        message = 'NIVEAU TERMINÉ !';
                }

                this.elements.winMessage.textContent = message;

                // Mettre à jour les étoiles visuellement
                const starElements = document.querySelectorAll('.win-stars .star');
                starElements.forEach((star, index) => {
                    if (index < stars) {
                        star.style.opacity = '1';
                        star.style.textShadow = '0 0 20px var(--neon-yellow)';
                    } else {
                        star.style.opacity = '0.3';
                        star.style.textShadow = 'none';
                    }
                });
            }
        }

        updateGameOverScreen(state) {
            if (this.elements.finalScore) {
                this.elements.finalScore.textContent = this.padScore(state.score, CONFIG.SCORE_DISPLAY_DIGITS);
            }

            if (this.elements.bestScore) {
                this.elements.bestScore.textContent = this.padScore(state.bestScore, CONFIG.SCORE_DISPLAY_DIGITS);
            }

            if (this.elements.finalTime) {
                this.elements.finalTime.textContent = state.formatTime(state.gameTime);
            }

            // Progression
            if (state.mode === 'challenge' && this.elements.progressFill && this.elements.progressText) {
                const progress = state.getProgress() * 100;
                this.elements.progressFill.style.width = progress + '%';
                this.elements.progressText.textContent =
                    `Progression: ${Math.floor(progress)}% vers l'objectif`;
            }
        }

        showScreen(screenName) {
            console.log('Affichage écran:', screenName);

            // Cacher tous les écrans
            const screens = ['loadingScreen', 'titleScreen', 'pauseScreen', 'winScreen', 'gameOverScreen'];
            screens.forEach(screen => {
                const element = document.getElementById(screen);
                if (element) {
                    element.classList.remove('active');
                }
            });

            // Afficher l'écran demandé
            const screen = document.getElementById(screenName + 'Screen') ||
                document.getElementById(screenName);

            if (screen) {
                screen.classList.add('active');
            } else {
                console.warn('Écran non trouvé:', screenName);
            }
        }

        hideLoadingScreen() {
            console.log('Masquage écran de chargement');

            if (this.elements.loadingScreen) {
                this.elements.loadingScreen.classList.add('hidden');

                setTimeout(() => {
                    this.elements.loadingScreen.style.display = 'none';

                    // Afficher l'écran titre
                    this.showScreen('title');
                }, 500);
            }
        }

        padScore(score, digits) {
            return String(Math.floor(score)).padStart(digits, '0');
        }
    }

    // ============================================================
    // GAME MANAGER (COEUR DU JEU) - CORRIGÉ
    // ============================================================
    class GameManager {
        constructor() {
            console.log('Initialisation du GameManager...');

            this.state = new GameState();
            this.audioManager = new AudioManager();
            this.particleSystem = new ParticleSystem();
            this.entityManager = new EntityManager();

            // Initialiser le canvas
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) {
                console.error('Canvas non trouvé!');
                return;
            }

            this.renderEngine = new RenderEngine(canvas);
            this.uiManager = new UIManager();

            this.lastTime = 0;
            this.gameLoopId = null;
            this.isInitialized = false;

            // Initialiser le jeu
            this.init();
        }

        init() {
            console.log('Démarrage de l\'initialisation...');

            try {
                // Redimensionnement
                this.renderEngine.resize();
                window.addEventListener('resize', () => this.renderEngine.resize());

                // Gestion des touches
                this.setupInput();

                // Événements UI
                this.setupUIEvents();

                // Cacher l'écran de chargement après un délai
                setTimeout(() => {
                    this.hideLoadingScreen();
                }, 1500); // 1.5 secondes

                // Démarrer la boucle de jeu
                this.isInitialized = true;
                this.startGameLoop();

                console.log('GameManager initialisé avec succès');
            } catch (error) {
                console.error('Erreur lors de l\'initialisation:', error);
                // Forcer l'affichage de l'écran titre en cas d'erreur
                this.hideLoadingScreen();
            }
        }

        hideLoadingScreen() {
            console.log('Masquage forcé de l\'écran de chargement');

            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');

                setTimeout(() => {
                    loadingScreen.style.display = 'none';

                    // Afficher l'écran titre
                    const titleScreen = document.getElementById('titleScreen');
                    if (titleScreen) {
                        titleScreen.classList.add('active');
                    }
                }, 300);
            }

            // Activer le premier niveau par défaut
            const firstLevel = document.querySelector('.level-option');
            if (firstLevel) {
                firstLevel.classList.add('active');
                this.state.setLevel(firstLevel.dataset.level);
            }
        }

        setupInput() {
            console.log('Configuration des contrôles clavier...');

            window.addEventListener('keydown', (e) => this.handleKeyDown(e));
            window.addEventListener('keyup', (e) => this.handleKeyUp(e));

            // Bouton pour sauter le chargement
            const skipButton = document.getElementById('skipLoading');
            if (skipButton) {
                skipButton.addEventListener('click', () => {
                    console.log('Chargement sauté manuellement');
                    this.hideLoadingScreen();
                });
            }
        }

        setupUIEvents() {
            console.log('Configuration des événements UI...');

            // Écouter les événements de sélection
            document.addEventListener('levelSelected', (e) => {
                const level = e.detail.level;
                this.state.setLevel(level);
                console.log('Niveau défini:', level);
            });

            document.addEventListener('modeSelected', (e) => {
                const mode = e.detail.mode;
                this.startGame(mode);
            });

            // Boutons de l'écran de pause
            if (this.uiManager.elements.resumeBtn) {
                this.uiManager.elements.resumeBtn.addEventListener('click', () => this.resumeGame());
            }

            if (this.uiManager.elements.restartBtn) {
                this.uiManager.elements.restartBtn.addEventListener('click', () => this.restartGame());
            }

            if (this.uiManager.elements.menuBtn) {
                this.uiManager.elements.menuBtn.addEventListener('click', () => this.returnToMenu());
            }

            // Boutons de l'écran de victoire
            if (this.uiManager.elements.nextLevelBtn) {
                this.uiManager.elements.nextLevelBtn.addEventListener('click', () => this.nextLevel());
            }

            if (this.uiManager.elements.winRestartBtn) {
                this.uiManager.elements.winRestartBtn.addEventListener('click', () => this.restartGame());
            }

            if (this.uiManager.elements.winMenuBtn) {
                this.uiManager.elements.winMenuBtn.addEventListener('click', () => this.returnToMenu());
            }

            // Contrôles audio
            if (this.uiManager.elements.muteBtn) {
                this.uiManager.elements.muteBtn.addEventListener('click', () => {
                    const isEnabled = this.audioManager.toggleMute();
                    this.uiManager.elements.muteBtn.textContent = isEnabled ? '🔊' : '🔇';
                });
            }

            if (this.uiManager.elements.volumeSlider) {
                this.uiManager.elements.volumeSlider.addEventListener('input', (e) => {
                    const volume = e.target.value / 100;
                    this.audioManager.setVolume(volume);
                });
            }
        }

        handleKeyDown(e) {
            // Initialiser l'audio au premier appui
            if (!this.audioManager.initialized) {
                this.audioManager.init();
            }

            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.state.keys.left = true;
                    break;

                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.state.keys.right = true;
                    break;

                case ' ':
                    if (this.state.phase === 'playing') {
                        this.state.keys.turbo = true;
                        e.preventDefault();
                    }
                    break;

                case 'p':
                case 'P':
                    if (!this.state.keys.pausePressed) {
                        this.togglePause();
                        this.state.keys.pausePressed = true;
                        e.preventDefault();
                    }
                    break;

                case 'c':
                case 'C':
                    this.state.crtEnabled = !this.state.crtEnabled;
                    break;

                case '1':
                    if (this.state.phase === 'title') {
                        this.startGame('classic');
                        e.preventDefault();
                    }
                    break;

                case '2':
                    if (this.state.phase === 'title') {
                        this.startGame('arcade');
                        e.preventDefault();
                    }
                    break;

                case '3':
                    if (this.state.phase === 'title') {
                        this.startGame('challenge');
                        e.preventDefault();
                    }
                    break;

                case 'Enter':
                    if (this.state.phase === 'title') {
                        this.startGame('challenge');
                        e.preventDefault();
                    } else if (this.state.phase === 'gameover') {
                        this.restartGame();
                        e.preventDefault();
                    }
                    break;

                case 'r':
                case 'R':
                    if (this.state.phase === 'playing' || this.state.phase === 'paused') {
                        this.restartGame();
                        e.preventDefault();
                    }
                    break;

                case 'm':
                case 'M':
                    if (this.state.phase === 'paused') {
                        this.returnToMenu();
                        e.preventDefault();
                    }
                    break;
            }
        }

        handleKeyUp(e) {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.state.keys.left = false;
                    break;

                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.state.keys.right = false;
                    break;

                case ' ':
                    this.state.keys.turbo = false;
                    break;

                case 'p':
                case 'P':
                    this.state.keys.pausePressed = false;
                    break;
            }
        }

        startGame(mode = 'challenge') {
            console.log('Démarrage du jeu en mode:', mode);

            // Cacher l'écran titre
            this.uiManager.showScreen('');

            // Réinitialiser l'état
            this.state.reset();
            this.state.setMode(mode);
            this.entityManager.clear();
            this.particleSystem.clear();

            // Initialiser le jeu
            this.state.phase = 'playing';
            this.audioManager.startEngine();

            console.log('Jeu démarré!');
        }

        update(deltaTime) {
            if (this.state.phase !== 'playing') return;

            // Mettre à jour le temps
            this.state.gameTime += deltaTime;

            // Mettre à jour la vitesse avec le multiplicateur de niveau
            const baseSpeedMultiplier = this.state.difficulty.speedMultiplier;
            this.state.speed = Math.min(
                this.state.speed + CONFIG.SPEED_INCREMENT * baseSpeedMultiplier,
                CONFIG.MAX_SPEED * baseSpeedMultiplier
            );
            this.state.maxSpeed = Math.max(this.state.maxSpeed, this.state.speed);

            // Gestion du turbo
            this.updateTurbo(deltaTime);

            // Mettre à jour l'audio du moteur
            this.audioManager.updateEngine(this.state.speed, this.state.turboActive);

            // Mouvement latéral
            this.updatePlayerMovement(deltaTime);

            // Décor
            this.updateEnvironment(deltaTime);

            // Entités
            this.updateEntities(deltaTime);

            // Vérifier les collisions
            if (this.entityManager.checkCollisions(this.state, this.particleSystem, this.audioManager)) {
                this.triggerGameOver();
                return;
            }

            // Vérifier la victoire (mode défi)
            if (this.state.mode === 'challenge' && this.state.gameTime >= this.state.objectiveTime) {
                this.triggerWin();
                return;
            }

            // Mettre à jour le score
            this.state.score += CONFIG.SCORE_PER_FRAME * (this.state.turboActive ? 2 : 1);

            // Mettre à jour les effets
            this.updateEffects();
        }

        updateTurbo(deltaTime) {
            this.state.turboActive = this.state.keys.turbo && this.state.turbo > 0;

            if (this.state.turboActive) {
                this.state.turbo -= CONFIG.TURBO_DRAIN * deltaTime * 60;
                if (this.state.turbo <= 0) {
                    this.state.turbo = 0;
                    this.state.turboActive = false;
                }

                // Particules turbo
                this.particleSystem.emitTurbo(this.state.playerX - 8, CONFIG.PLAYER_Y + 5);
                this.particleSystem.emitTurbo(this.state.playerX + 8, CONFIG.PLAYER_Y + 5);
            } else {
                this.state.turbo = Math.min(
                    this.state.turbo + CONFIG.TURBO_REGEN * deltaTime * 60,
                    CONFIG.TURBO_MAX
                );
            }
        }

        updatePlayerMovement(deltaTime) {
            let lateralSpeed = CONFIG.PLAYER_SPEED_LATERAL;

            if (this.state.turboActive) lateralSpeed *= 1.4;
            if (this.state.slowmoActive) lateralSpeed *= 0.5;

            lateralSpeed *= deltaTime * 60;

            if (this.state.keys.left) this.state.playerX -= lateralSpeed;
            if (this.state.keys.right) this.state.playerX += lateralSpeed;

            // Limites de la route
            const halfRoadBot = CONFIG.ROAD_BOT_WIDTH / 2 + this.state.roadOffset;
            this.state.playerX = Math.max(
                CONFIG.ROAD_CENTER - halfRoadBot + 30,
                Math.min(CONFIG.ROAD_CENTER + halfRoadBot - 30, this.state.playerX)
            );

            // Virage sinusoïdal
            this.state.roadOffset = Math.sin(Date.now() / 1200) * 60 +
                Math.sin(Date.now() / 800) * 30;
        }

        updateEnvironment(deltaTime) {
            const effectiveSpeed = this.getEffectiveSpeed();

            // Arbres
            this.state.trees.forEach(tree => {
                tree.y += effectiveSpeed * 0.8 * deltaTime * 60;
                if (tree.y > CONFIG.HEIGHT + 40) {
                    tree.y = CONFIG.HORIZON + Math.random() * 20;
                    tree.scale = 0.6 + Math.random() * 0.6;
                }
            });
        }

        updateEntities(deltaTime) {
            const effectiveSpeed = this.getEffectiveSpeed();
            this.entityManager.update(this.state, effectiveSpeed * deltaTime * 60);
        }

        updateEffects() {
            if (this.state.shieldActive) {
                this.state.shieldTimer--;
                if (this.state.shieldTimer <= 0) {
                    this.state.shieldActive = false;
                }
            }

            if (this.state.slowmoActive) {
                this.state.slowmoTimer--;
                if (this.state.slowmoTimer <= 0) {
                    this.state.slowmoActive = false;
                }
            }

            // Mettre à jour les particules
            this.particleSystem.update();
        }

        getEffectiveSpeed() {
            let speed = this.state.speed;

            if (this.state.turboActive) {
                speed *= CONFIG.PLAYER_TURBO_BOOST;
            }

            if (this.state.slowmoActive) {
                speed *= 0.5;
            }

            return speed;
        }

        triggerGameOver() {
            console.log('Game Over!');
            this.state.phase = 'gameover';
            this.audioManager.stopEngine();
            this.audioManager.playSound('crash');

            // Explosion
            this.particleSystem.explode(
                this.state.playerX,
                CONFIG.PLAYER_Y - CONFIG.PLAYER_HEIGHT / 2
            );

            // Sauvegarder le meilleur score
            if (this.state.score > this.state.bestScore) {
                this.state.bestScore = this.state.score;
                localStorage.setItem("retroracer_best", String(Math.floor(this.state.score)));
            }

            // Mettre à jour l'UI
            setTimeout(() => {
                this.uiManager.updateGameOverScreen(this.state);
                this.uiManager.showScreen('gameOver');
            }, 800);
        }

        triggerWin() {
            console.log('Victoire!');
            this.state.phase = 'win';
            this.audioManager.stopEngine();
            this.audioManager.playSound('win');

            // Calculer les étoiles
            this.state.stars = this.state.calculateStars();

            // Mettre à jour l'UI
            setTimeout(() => {
                this.uiManager.updateWinScreen(this.state);
                this.uiManager.showScreen('win');
            }, 500);
        }

        togglePause() {
            if (this.state.phase === 'playing') {
                this.state.phase = 'paused';
                this.uiManager.updatePauseScreen(this.state);
                this.uiManager.showScreen('pause');
            } else if (this.state.phase === 'paused') {
                this.resumeGame();
            }
        }

        resumeGame() {
            this.state.phase = 'playing';
            this.uiManager.showScreen('');
        }

        restartGame() {
            console.log('Redémarrage du jeu');
            const currentMode = this.state.mode;
            const currentLevel = this.state.level;

            this.startGame(currentMode);
            this.state.setLevel(currentLevel);
        }

        returnToMenu() {
            console.log('Retour au menu');
            this.state.phase = 'title';
            this.uiManager.showScreen('title');
        }

        nextLevel() {
            console.log('Niveau suivant');
            const levels = ['easy', 'medium', 'hard'];
            const currentIndex = levels.indexOf(this.state.level);

            if (currentIndex < levels.length - 1) {
                const nextLevel = levels[currentIndex + 1];
                this.state.setLevel(nextLevel);
                this.startGame('challenge');
            } else {
                // Revenir au premier niveau si on est au dernier
                this.state.setLevel('easy');
                this.startGame('challenge');
            }
        }

        startGameLoop() {
            console.log('Démarrage de la boucle de jeu');

            const gameLoop = (currentTime) => {
                if (!this.lastTime) this.lastTime = currentTime;

                const deltaTime = (currentTime - this.lastTime) / 1000;
                this.lastTime = currentTime;

                // Mettre à jour le jeu
                this.update(deltaTime);

                // Rendu
                this.renderEngine.draw(
                    this.state,
                    this.entityManager,
                    this.particleSystem
                );

                // Mettre à jour l'UI
                if (this.state.phase === 'playing') {
                    this.uiManager.updateHUD(this.state);
                }

                // Continuer la boucle
                this.gameLoopId = requestAnimationFrame(gameLoop);
            };

            this.gameLoopId = requestAnimationFrame(gameLoop);
        }

        stopGameLoop() {
            if (this.gameLoopId) {
                cancelAnimationFrame(this.gameLoopId);
                this.gameLoopId = null;
            }
        }

        // Getters pour le débogage
        getState() {
            return this.state;
        }

        getAudioManager() {
            return this.audioManager;
        }
    }

    // ============================================================
    // INITIALISATION GLOBALE
    // ============================================================

    // Fonction pour démarrer le jeu
    function startRetroRacer() {
        console.log('=== DÉMARRAGE RETRO RACER ===');

        // Vérifier que tous les éléments nécessaires existent
        const requiredElements = ['gameCanvas', 'loadingScreen', 'titleScreen'];
        const missingElements = [];

        requiredElements.forEach(id => {
            if (!document.getElementById(id)) {
                missingElements.push(id);
            }
        });

        if (missingElements.length > 0) {
            console.error('Éléments manquants:', missingElements);

            // Essayer de continuer quand même
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }

            const titleScreen = document.getElementById('titleScreen');
            if (titleScreen) {
                titleScreen.classList.add('active');
            }

            // Afficher un message d'erreur simple
            alert('Erreur de chargement. Vérifiez la console (F12) pour plus de détails.');
            return;
        }

        // Initialiser le jeu
        try {
            window.game = new GameManager();
            console.log('=== RETRO RACER PRÊT ===');
        } catch (error) {
            console.error('Erreur critique lors du démarrage:', error);

            // Forcer l'affichage de l'écran titre
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }

            const titleScreen = document.getElementById('titleScreen');
            if (titleScreen) {
                titleScreen.classList.add('active');
            }
        }
    }

    // Démarrer quand le DOM est chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startRetroRacer);
    } else {
        // DOM déjà chargé
        startRetroRacer();
    }

    // Forcer le masquage du chargement après 3 secondes maximum (sécurité)
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            console.warn('Forçage du masquage de l\'écran de chargement (timeout)');
            loadingScreen.classList.add('hidden');

            setTimeout(() => {
                loadingScreen.style.display = 'none';

                const titleScreen = document.getElementById('titleScreen');
                if (titleScreen) {
                    titleScreen.classList.add('active');
                }
            }, 300);
        }
    }, 3000);

})();