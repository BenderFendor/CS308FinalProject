const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Replace audio system initialization
window.audioSystem = {
    sounds: {},
    volume: GAME_CONFIG.audio.defaultVolume,

    init() {
        // Initialize audio files from config
        Object.entries(GAME_CONFIG.audio.files).forEach(([key, file]) => {
            this.sounds[key] = new Audio(file);
            if (key === 'bgMusic') {
                this.sounds[key].loop = true;
                this.sounds[key].volume = this.volume * GAME_CONFIG.audio.musicVolume;
            } else {
                this.sounds[key].volume = this.volume;
            }
        });
    },

    play(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log(`Audio play error: ${e}`));
        }
    },

    setVolume(value) {
        this.volume = value;
        this.sounds.bgMusic.volume = value * 0.3;
        Object.values(this.sounds).forEach(sound => {
            if (sound !== this.sounds.bgMusic) {
                sound.volume = value;
            }
        });
    }
};

// Initialize audio system
window.audioSystem.init();

// Game state
const gameState = {
    wave: 1,
    currentPhase: 'earth', // 'earth', 'solar', 'blackhole'
    difficulty: 1,
    enemies: [],
    projectiles: [],
    score: 0,
    highScore: localStorage.getItem('highScore') || 0,
    isGameOver: false,
    isPaused: false,
    player: null,
    bossActive: false,
    chest: null,
    phaseLoopCount: 0  // Track how many times we've looped through all phases
};

// Replace wave configuration
const waveConfig = GAME_CONFIG.phases;

// Add the Chest class
class Chest {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.opened = false;

        // Redefine upgrades to include effect functions
        this.upgrades = [
            // Stat upgrades
            ...GAME_CONFIG.upgrades.stats.map(stat => ({
                type: 'stat',
                name: stat.name,
                description: stat.description,
                effect: () => {
                    // Calculate random modifier within range
                    const modifier = Math.random() * (stat.maxModifier - stat.minModifier) + stat.minModifier;
                    return {
                        type: 'stat',
                        category: stat.category,
                        modifier: modifier
                    };
                }
            })),
            // Ability upgrades
            ...GAME_CONFIG.upgrades.abilities.map(ability => ({
                type: 'ability',
                name: ability.name,
                description: ability.description,
                effect: () => ({
                    type: 'ability',
                    name: ability.effectName,
                    duration: ability.duration
                })
            }))
        ];
        
        // Add chest sprite
        this.img = new Image();
        this.img.src = 'chest.png';
    }

    draw(ctx) {
        // Draw chest sprite if loaded, otherwise fallback to rectangle
        if (this.img && this.img.complete) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.opened ? 'gray' : 'gold';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    update() {
        // Additional logic if needed
    }

    collidesWith(entity) {
        // Collision detection with the player
        return !(
            this.x + this.width < entity.x ||
            this.x > entity.x + entity.width ||
            this.y + this.height < entity.y ||
            this.y > entity.y + entity.height
        );
    }

    open() {
        if (!this.opened) {
            audioSystem.play('score');
            this.opened = true;
            const randomUpgrade = this.upgrades[Math.floor(Math.random() * this.upgrades.length)];
            const upgrade = randomUpgrade.effect(); // Now this will work because effect is properly defined
            
            // Pause game and show upgrade
            gameState.isPaused = true;
            displayUpgrade(upgrade);
            
            // Apply upgrade after a delay
            setTimeout(() => {
                gameState.player.applyUpgrade(upgrade);
                for (let enemy of gameState.enemies) {
                    if (upgrade.type === 'ability' && upgrade.name === 'enemyStunning') {
                        enemy.stunned = true;
                        setTimeout(() => { enemy.stunned = false; }, upgrade.duration);
                    }
                }
                gameState.chest = null;
                gameState.isPaused = false;
            }, 1000);
        }
    }
}

// Modify player initialization
if (typeof Player !== 'undefined') {
    gameState.player = new Player(
        canvas.width / 2,
        canvas.height / 2,
        GAME_CONFIG.settings.player.size,
        GAME_CONFIG.settings.player.size,
        'player.png'
    );
    gameState.player.isPlayer = true;
    gameState.player.health = GAME_CONFIG.settings.player.initialHealth;
    gameState.player.maxHealth = GAME_CONFIG.settings.player.maxHealth;
} else {
    console.error('Player class is not defined. Ensure player.js is loaded before game.js.');
}

// Add references to pause menu elements
const pauseMenu = document.getElementById('pause-menu');
const resumeButton = document.getElementById('resume-button');

// Modify startWave function
function startWave() {
    const config = GAME_CONFIG.phases[gameState.currentPhase];
    const waveInPhase = (gameState.wave - 1) % 4; // 3 normal waves + 1 boss wave

    if (waveInPhase < 3) {
        // Spawn normal enemies
        const enemyCount = Math.min(3 + Math.floor(gameState.wave / 2), 8);
        for(let i = 0; i < enemyCount; i++) {
            spawnEnemy(config);
        }
    } else {
        // Spawn boss
        spawnBoss(config);
    }

    // Increase difficulty
    gameState.difficulty = 1 + (gameState.wave * 0.1);

    // 50% chance to spawn a chest each new wave
    if (Math.random() < 0.5) {
        spawnChest();
    }
}

function spawnEnemy(config) {
    const x = Math.random() < 0.5 ? 0 : canvas.width;
    const y = Math.random() * canvas.height;
    const enemy = new Enemy(x, y, 30, 30, gameState.currentPhase);
    
    // Fix health scaling with difficulty
    enemy.health = Math.ceil(config.baseHealth * gameState.difficulty);
    enemy.maxHealth = enemy.health;
    enemy.speed = config.baseSpeed * (1 + (gameState.difficulty - 1) * 0.1); // 10% speed increase per difficulty level
    
    gameState.enemies.push(enemy);
    console.log(`Spawned enemy with health: ${enemy.health}, speed: ${enemy.speed}`);
}

function spawnBoss(config) {
    gameState.bossActive = true;
    const boss = new Enemy(
        canvas.width/2,
        canvas.height/2,
        60,
        60,
        gameState.currentPhase
    );
    boss.health = config.bossHealth * gameState.difficulty;
    boss.maxHealth = boss.health;
    boss.isBoss = true;
    gameState.enemies.push(boss);
}

function spawnChest() {
    let chestX, chestY;
    do {
        chestX = Math.random() * (canvas.width - 30);
        chestY = Math.random() * (canvas.height - 30);
        // Ensure chest is not near the player
    } while (Math.hypot(chestX - gameState.player.x, chestY - gameState.player.y) < 100);

    gameState.chest = new Chest(chestX, chestY);
}

function updateGameState() {
    if(gameState.isGameOver || gameState.isPaused) return;

    // Update player
    gameState.player.update(canvas);
    
    // Update enemies using a traditional for loop
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        enemy.update(gameState.player);
                
        // Only remove enemies that are both dead and inactive
        if (enemy.health <= 0) {
            console.log(`Enemy ${i} died - Final health: ${enemy.health}, Was boss: ${enemy.isBoss}`);
            gameState.score += enemy.isBoss ? 100 : 10;
            gameState.enemies.splice(i, 1);
        }
    }

    // Check wave completion
    checkWaveCompletion();

    // Update projectiles
    updateProjectiles();

    // Update chest
    if (gameState.chest) {
        gameState.chest.update();
        if (gameState.chest.collidesWith(gameState.player)) {
            // Pause the game
            gameState.isPaused = true;
            // Open the chest which applies the upgrade and displays it
            gameState.chest.open();
            // After 1 second, resume the game
            setTimeout(() => {
                gameState.isPaused = false;
            }, 1000);
        }
    }

    // Check player death
    if(gameState.player.health <= 0) {
        endGame();
    }
}

function checkWaveCompletion() {
    if (gameState.enemies.length === 0) {
        gameState.wave++;

        const waveInPhase = (gameState.wave - 1) % 4;

        if (waveInPhase === 0) {
            // After boss wave, move to the next phase
            switch(gameState.currentPhase) {
                case 'earth':
                    gameState.currentPhase = 'solar';
                    break;
                case 'solar':
                    gameState.currentPhase = 'blackhole';
                    break;
                case 'blackhole':
                    gameState.currentPhase = 'earth';
                    gameState.phaseLoopCount++;
                    // Only heal on second+ loop
                    if (gameState.phaseLoopCount > 1) {
                        const halfMaxHealth = Math.floor(gameState.player.maxHealth / 2);
                        gameState.player.health = Math.min(
                            gameState.player.maxHealth,
                            gameState.player.health + halfMaxHealth
                        );
                    }
                    break;
            }
        }

        startWave();
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background based on current phase
    drawBackground();
    
    // Draw game elements
    gameState.player.draw(ctx);
    gameState.enemies.forEach(enemy => enemy.draw(ctx));
    gameState.projectiles.forEach(projectile => projectile.draw(ctx));
    
    // Draw chest
    if (gameState.chest) {
        gameState.chest.draw(ctx);
    }

    // Draw HUD
    drawHUD();
}

// At the top with other initializations, add background image loading
const backgrounds = {
    earth: new Image(),
    solar: new Image(),
    blackhole: new Image()
};

backgrounds.earth.src = 'earthbackground.jpg';
backgrounds.solar.src = 'spacebackground.png';
backgrounds.blackhole.src = 'spacebackground.png'; // Using same space background for blackhole phase

// Replace the existing drawBackground function
function drawBackground() {
    const currentBg = backgrounds[gameState.currentPhase];
    
    if (currentBg && currentBg.complete) {
        // Use cover approach - scale to fill smallest dimension
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = currentBg.width / currentBg.height;
        let drawWidth, drawHeight;

        if (canvasRatio > imgRatio) {
            // Canvas is wider than image ratio
            drawWidth = canvas.width;
            drawHeight = drawWidth / imgRatio;
        } else {
            // Canvas is taller than image ratio
            drawHeight = canvas.height;
            drawWidth = drawHeight * imgRatio;
        }

        // Calculate centering offsets
        const offsetX = (canvas.width - drawWidth) / 2;
        const offsetY = (canvas.height - drawHeight) / 2;

        ctx.drawImage(currentBg, offsetX, offsetY, drawWidth, drawHeight);
    } else {
        // Fallback colors if images aren't loaded
        const backgrounds = {
            earth: '#1a472a',
            solar: '#2a1a47',
            blackhole: '#0a0a0a'
        };
        ctx.fillStyle = backgrounds[gameState.currentPhase];
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawHUD() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Alagard';
    ctx.fillText(`Wave: ${gameState.wave}`, 10, 30);
    ctx.fillText(`Score: ${gameState.score}`, 10, 60);
    ctx.fillText(`High Score: ${gameState.highScore}`, 10, 90);
    
    // Draw phase indicator
    ctx.fillText(`Phase: ${gameState.currentPhase.toUpperCase()}`, 10, 120);
    
    // Display player's HP
    ctx.fillText(`Player HP: ${gameState.player.health} / ${gameState.player.maxHealth}`, 10, 150);

    // Display enemy count
    ctx.fillText(`Enemies Remaining: ${gameState.enemies.length}`, 10, 180);

    // Draw FPS counter
    ctx.fillText(`FPS: ${Math.round(fps)}`, canvas.width - 100, 30);
}

let lastTime = 0;
let fps = 60;

function gameLoop(timestamp) {
    // Calculate FPS
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    fps = 1000 / deltaTime;

    if (!gameState.isPaused && !gameState.isGameOver) {
        updateGameState();
        drawGame();
    }
    requestAnimationFrame(gameLoop);
}

function startGame() {
    // Reset game state
    gameState.wave = 1;
    gameState.currentPhase = 'earth';
    gameState.difficulty = 1;
    gameState.score = 0;
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.isGameOver = false;
    gameState.player.health = gameState.player.maxHealth;
    gameState.phaseLoopCount = 0;
    
    // Hide game over screen
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('main-menu').style.display = 'none';
    
    // Initialize player with sprite
    if (typeof Player !== 'undefined') {
        gameState.player = new Player(
            canvas.width / 2,
            canvas.height / 2,
            70,
            70,
            'player.png'
        );
    }

    audioSystem.play('bgMusic');
    startWave();
    gameLoop();
}

function endGame() {
    gameState.isGameOver = true;
    if(gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('highScore', gameState.highScore);
    }
    audioSystem.sounds.bgMusic.pause();
    audioSystem.sounds.bgMusic.currentTime = 0;
    audioSystem.play('gameOver');
    document.getElementById('game-over').style.display = 'block';
}

// Event Listeners
canvas.addEventListener('mousemove', (e) => {
    if(!gameState.isGameOver && !gameState.isPaused) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        if(gameState.player.isDragging) {
            gameState.player.drag(mouseX, mouseY);
        }
    }
});

canvas.addEventListener('mousedown', (e) => {
    if(!gameState.isGameOver && !gameState.isPaused) {
        const rect = canvas.getBoundingClientRect();
        gameState.player.startDrag(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
    }
});

canvas.addEventListener('mouseup', (e) => {
    if(!gameState.isGameOver && !gameState.isPaused) {
        const rect = canvas.getBoundingClientRect();
        gameState.player.endDrag(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
    }
});

document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
        gameState.isPaused = !gameState.isPaused;
        pauseMenu.style.display = gameState.isPaused ? 'block' : 'none';
        
        if (!gameState.isPaused) {
            resumeGame();
        }
    }
});

// Modify projectile update to check collision with player
function updateProjectiles() {
    const initialProjectileCount = gameState.projectiles.length;
    gameState.projectiles = gameState.projectiles.filter(projectile => {
        projectile.update();

        if (projectile.type === 'player') {
            for (let enemy of gameState.enemies) {
                if (projectile.collidesWith(enemy) && enemy.health > 0) {
                    console.log(`Projectile hit enemy - Current health: ${enemy.health}`);
                    enemy.takeDamage(projectile.damage);
                    projectile.active = false;
                    return false;
                }
            }
        }

        // ...rest of projectile update code...
        if (projectile.active && projectile.collidesWith(gameState.player)) {
            console.log('Projectile hit player');
            if (gameState.player.reflectProjectiles) {
                console.log('Projectile reflected');
                // Reflect the projectile back
                projectile.vx = -projectile.vx;
                projectile.vy = -projectile.vy;
                projectile.type = 'player'; // Change to player projectile
                projectile.damage *= 2; // Double the damage for reflected projectiles
                return true;
            } else {
                gameState.player.takeDamage(projectile.damage);
                projectile.active = false;
                return false;
            }
        }
        return projectile.active;
    });
    const removedProjectiles = initialProjectileCount - gameState.projectiles.length;
    if (removedProjectiles > 0) {
        console.log(`Removed ${removedProjectiles} projectiles. Remaining: ${gameState.projectiles.length}`);
    }
}

// Function to display the upgrade message
function displayUpgrade(upgrade) {
    const upgradeMessage = document.getElementById('upgrade-message');
    const upgradeText = document.getElementById('upgrade-text');
    let displayText = '';
    
    if (upgrade.type === 'stat') {
        const percentage = ((upgrade.modifier - 1) * 100).toFixed(2); // Round to 2 decimal places
        const sign = percentage >= 0 ? '+' : '';
        
        // Map stat categories to friendly names
        const statNames = {
            health: 'Health',
            speed: 'Movement Speed',
            damage: 'Attack Power'
        };
        
        const statName = statNames[upgrade.category] || upgrade.category;
        displayText = `${statName} ${sign}${percentage}%`;
    } else if (upgrade.type === 'ability') {
        // Map ability names to friendly names and descriptions
        const abilityInfo = {
            temporaryInvulnerability: {
                name: 'Temporary God Mode',
                description: '5 seconds of invincibility'
            },
            projectileReflection: {
                name: 'Projectile Shield',
                description: '8 seconds of projectile reflection'
            },
            enemyStunning: {
                name: 'Mass Enemy Stun',
                description: '3 second freeze on all enemies'
            }
        };
        
        const ability = abilityInfo[upgrade.name] || { 
            name: upgrade.name, 
            description: `Duration: ${upgrade.duration/1000}s` 
        };
        
        displayText = `${ability.name}\n${ability.description}`;
    }
    
    upgradeText.textContent = displayText;
    upgradeMessage.style.display = 'block';
    
    setTimeout(() => {
        upgradeMessage.style.display = 'none';
    }, 1000);
}

// Apply upgrades to the player
Player.prototype.applyUpgrade = function(upgrade) {
    if (upgrade.type === 'stat') {
        switch(upgrade.category) {
            case 'health':
                this.maxHealth = Math.floor(this.maxHealth * upgrade.modifier);
                this.health = this.maxHealth;
                break;
            case 'speed':
                this.speed *= upgrade.modifier;
                break;
            case 'damage':
                this.damage *= upgrade.modifier;
                break;
        }
    } else if (upgrade.type === 'ability') {
        const duration = upgrade.duration || 5000;
        switch(upgrade.name) {
            case 'temporaryInvulnerability':
                this.invulnerable = true;
                setTimeout(() => { this.invulnerable = false; }, duration);
                break;
            case 'projectileReflection':
                this.reflectProjectiles = true;
                setTimeout(() => { this.reflectProjectiles = false; }, duration);
                break;
            case 'enemyStunning':
                // Apply stun to all current enemies
                gameState.enemies.forEach(enemy => {
                    enemy.stunned = true;
                    enemy.vx = 0; // Stop all movement
                    enemy.vy = 0;
                    enemy.isCharging = false; // Cancel any charging attacks
                });
                
                // Remove stun after duration
                setTimeout(() => {
                    gameState.enemies.forEach(enemy => {
                        if (enemy && enemy.stunned) { // Check if enemy still exists
                            enemy.stunned = false;
                        }
                    });
                }, duration);
                break;
        }
    }
};


function resumeGame() {
    gameState.isPaused = false;
    pauseMenu.style.display = 'none';
}

// Add volume control event listener
document.getElementById('sound-volume').addEventListener('change', (e) => {
    audioSystem.setVolume(e.target.value / 100);
});