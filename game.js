const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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

// Wave configuration
const waveConfig = {
    earth: {
        baseHealth: 2,
        baseSpeed: 1,
        color: '#4a8505',
        bossHealth: 5 // Updated boss health for earth
    },
    solar: {
        baseHealth: 3,
        baseSpeed: 1.2,
        color: '#ffa726',
        bossHealth: 10 // Updated boss health for solar
    },
    blackhole: {
        baseHealth: 5,
        baseSpeed: 1.5,
        color: '#4a148c',
        bossHealth: 15 // Updated boss health for blackhole
    }
};

// Add the Chest class
class Chest {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.opened = false;
        
        // Define all possible upgrades
        this.upgrades = [
            // Stat Modifications
            {
            type: 'stat',
            name: 'Health Boost',
            description: 'Health Increase',
            effect: () => ({
                type: 'stat',
                category: 'health',
                modifier: (Math.random() * 0.4 + 1.1) // 1.1 to 1.5 (+10% to +50%)
            })
            },
            {
            type: 'stat',
            name: 'Speed Boost',
            description: 'Speed Increase',
            effect: () => ({
                type: 'stat',
                category: 'speed',
                modifier: (Math.random() * 0.4 + 1.1) // 1.1 to 1.5 (+10% to +50%)
            })
            },
            {
            type: 'stat',
            name: 'Power Boost',
            description: 'Damage Increase',
            effect: () => ({
                type: 'stat',
                category: 'damage',
                modifier: (Math.random() * 0.4 + 1.1) // 1.1 to 1.5 (+10% to +50%)
            })
            },
            // Special Abilities
            {
                type: 'ability',
                name: 'Temporary God Mode',
                description: '5 Second Invincibility',
                effect: () => ({
                    type: 'ability',
                    name: 'temporaryInvulnerability',
                    duration: 5000 // 5 seconds
                })
            },
            {
                type: 'ability',
                name: 'Projectile Shield',
                description: '8 Second Reflection Field',
                effect: () => ({
                    type: 'ability',
                    name: 'projectileReflection',
                    duration: 8000 // 8 seconds
                })
            },
            {
                type: 'ability',
                name: 'Mass Stun',
                description: '3 Second Enemy Freeze',
                effect: () => ({
                    type: 'ability',
                    name: 'enemyStunning',
                    duration: 3000 // 3 seconds
                })
            }
        ];
    }

    draw(ctx) {
        ctx.fillStyle = this.opened ? 'gray' : 'gold';
        ctx.fillRect(this.x, this.y, this.width, this.height);
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
            this.opened = true;
            const randomUpgrade = this.upgrades[Math.floor(Math.random() * this.upgrades.length)];
            const upgrade = randomUpgrade.effect();
            
            // Pause game and show upgrade
            gameState.isPaused = true;
            displayUpgrade(upgrade);
            
            // Apply upgrade after a delay
            setTimeout(() => {
                gameState.player.applyUpgrade(upgrade);
                gameState.chest = null;
                gameState.isPaused = false;
            }, 1000);
        }
    }
}

// Initialize player
gameState.player = new Player(
    canvas.width / 2,
    canvas.height / 2,
    30,
    30,
    'player.png'
);
gameState.player.isPlayer = true;
gameState.player.health = 20;
gameState.player.maxHealth = 20;

function startWave() {
    const config = waveConfig[gameState.currentPhase];
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
    
    // Apply difficulty scaling
    enemy.health = config.baseHealth * gameState.difficulty;
    enemy.maxHealth = enemy.health;
    enemy.speed *= gameState.difficulty;
    
    gameState.enemies.push(enemy);
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
    
    // Update enemies
    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.update(gameState.player);
        if(!enemy.active) {
            gameState.score += enemy.isBoss ? 100 : 10;
            return false;
        }
        return true;
    });

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

function drawBackground() {
    const backgrounds = {
        earth: '#1a472a',
        solar: '#2a1a47',
        blackhole: '#0a0a0a'
    };
    ctx.fillStyle = backgrounds[gameState.currentPhase];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

    updateGameState();
    drawGame();
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
    
    startWave();
    gameLoop();
}

function endGame() {
    gameState.isGameOver = true;
    if(gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('highScore', gameState.highScore);
    }
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
    }
});

// Modify projectile update to check collision with player
function updateProjectiles() {
    gameState.projectiles = gameState.projectiles.filter(projectile => {
        projectile.update();

        // Check for collisions with enemies for reflected projectiles
        if (projectile.type === 'player') {
            for (let enemy of gameState.enemies) {
                if (projectile.collidesWith(enemy)) {
                    enemy.takeDamage(projectile.damage);
                    projectile.active = false;
                    return false;
                }
            }
        }

        if (projectile.active && projectile.collidesWith(gameState.player)) {
            if (gameState.player.reflectProjectiles) {
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
}

// Function to display the upgrade message
function displayUpgrade(upgrade) {
    const upgradeMessage = document.getElementById('upgrade-message');
    const upgradeText = document.getElementById('upgrade-text');
    let displayText = '';
    
    if (upgrade.type === 'stat') {
        const percentage = ((upgrade.modifier - 1) * 100).toFixed(0);
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
                gameState.enemies.forEach(enemy => enemy.stunned = true);
                setTimeout(() => {
                    gameState.enemies.forEach(enemy => enemy.stunned = false);
                }, duration);
                break;
        }
    }
};

// Start the game
startGame();
