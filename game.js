// First get DOM elements
let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let bgMusic = document.getElementById('bgMusic');
let bounceSound = document.getElementById('bounce');
let scoreSound = document.getElementById('scoresfx');
let gameoverSound = document.getElementById('gameoversfx');

// Game state variables
let frameCount = 0;
let lastTime = Date.now();
let fpsUpdateInterval = 1000; // Update FPS display every second
let lastFpsUpdate = lastTime;
let currentFps = 0;
let score = 0;
let isGameOver = false;
let isGamePaused = false; // Add pause state

// Initialize game systems
let particleSystem = new ParticleSystem();
let camera = new Camera(); // Move this before it's used
let roomManager = new RoomManager();

// Initialize game objects
let player = new Square(100, 100, 50, 50, 'path/to/player-image.png');
player.isPlayer = true;

// Initialize current room
let currentRoom = roomManager.generateRoom('test');

// Initialize arrays
let enemies = [new Enemy(400, 300, 40, 40)];
let chests = [new Chest(600, 400)];
let walls = [];
let projectiles = []; // Array to hold projectiles

// Add levels array
let levels = ['earth', 'solar', 'blackhole'];
let currentLevelIndex = 0;

// Update the walls after canvas is available
function updateWalls() { // I think that this will draw over te enemies.
    walls = [
        new Square(0, 0, canvas.width, 20),
        new Square(0, canvas.height - 20, canvas.width, 20),
        new Square(0, 0, 20, canvas.height),
        new Square(canvas.width - 20, 0, 20, canvas.height)
    ];
}

// Call updateWalls after resize
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateWalls();
}

// Add sound control
function initializeSounds() {
    const sounds = [bgMusic, bounceSound, scoreSound, gameoverSound];
    sounds.forEach(sound => {
        sound.muted = true; // Start muted
    });
}

// Add sound toggle function
function toggleSound() {
    const sounds = [bgMusic, bounceSound, scoreSound, gameoverSound];
    const newMuteState = !bgMusic.muted;
    sounds.forEach(sound => {
        sound.muted = newMuteState;
    });
}

// Initialize
window.addEventListener('resize', resizeCanvas);
window.addEventListener('keydown', (e) => {
    if (e.key === 'f') toggleFullscreen();
    if (e.key === 'm') toggleSound();
});
resizeCanvas();

// Game state
player.x = currentRoom.width / 2;
player.y = currentRoom.height / 2;

// Update initialize function
function initialize() {
    score = 0;
    isGameOver = false;
    document.getElementById('score').innerText = 'Score: 0';
    document.getElementById('game-over-overlay').style.visibility = 'hidden';
    
    // Reset player position
    player.vx = 0;
    player.vy = 0;
    
    // Initialize sounds
    initializeSounds();
    
    // Load the first level
    loadLevel(levels[currentLevelIndex]);
    
    // Play music only after user interaction
    document.addEventListener('click', () => {
        if (bgMusic.muted) {
            toggleSound();
        }
        bgMusic.play();
    }, { once: true });

    requestAnimationFrame(gameLoop);
}

// Add function to load levels
function loadLevel(levelName) {
    console.log(`Loading level: ${levelName}`);
    try {
        currentRoom = roomManager.generateRoom(levelName);
        // Center player in room
        player.x = currentRoom.boundary.x + currentRoom.boundary.width/2 - player.width/2;
        player.y = currentRoom.boundary.y + currentRoom.boundary.height/2 - player.height/2;
        camera.target = player;
    } catch (error) {
        console.error(`Error loading level ${levelName}:`, error);
        // Fallback to test level
        currentRoom = roomManager.generateRoom('test');
        player.x = currentRoom.boundary.x + currentRoom.boundary.width/2 - player.width/2;
        player.y = currentRoom.boundary.y + currentRoom.boundary.height/2 - player.height/2;
        camera.target = player;
    }
}

function gameOver() {
    isGameOver = true;
    bgMusic.pause();
    gameoverSound.play();
    document.getElementById('game-over-overlay').style.visibility = 'visible';
    document.getElementById('final-score-value').innerText = score;
    currentLevelIndex = 0; // Reset levels
}

// Add before gameLoop
function drawHUD() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for HUD

    // Draw health
    ctx.fillStyle = 'white';
    ctx.font = '20px monospace';
    ctx.fillText(`HP: ${player.health}`, 10, 50);
    
    // Draw enemy count
    const activeEnemies = currentRoom.enemies.filter(enemy => enemy.active).length;
    ctx.fillText(`Enemies: ${activeEnemies}`, 10, 80);
      
    ctx.restore();
}

// Update gameLoop function
function gameLoop(currentTime) {
    if (isGameOver) return;

    // Calculate accurate FPS
    const now = Date.now();
    frameCount++;

    // Update FPS counter once per second
    if (now - lastFpsUpdate >= fpsUpdateInterval) {
        currentFps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
        fpsCounter.textContent = `FPS: ${currentFps}`;
        frameCount = 0;
        lastFpsUpdate = now;
    }

    // Calculate delta time for smooth animations
    const deltaTime = now - lastTime;
    lastTime = now;

    // Skip updating if the game is paused
    if (isGamePaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // Clear the entire canvas before drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context and apply camera transformation
    ctx.save();
    
    // Center the camera on player while keeping room centered
    const roomCenterX = currentRoom.boundary.x + currentRoom.boundary.width/2;
    const roomCenterY = currentRoom.boundary.y + currentRoom.boundary.height/2;
    const cameraX = player.x - canvas.width/2;
    const cameraY = player.y - canvas.height/2;
    
    // Apply camera transform with room centering
    ctx.translate(
        -cameraX + (canvas.width - currentRoom.boundary.width)/2 - currentRoom.boundary.x,
        -cameraY + (canvas.height - currentRoom.boundary.height)/2 - currentRoom.boundary.y
    );

    // Update all entities first
    player.update(canvas);
    currentRoom.enemies.forEach(enemy => {
        if (enemy.active) {
            enemy.update(player, currentRoom.walls);
        }
    });

    // Handle all collisions
    handleCollisions();

    // Draw everything
    currentRoom.draw(ctx);
    player.draw(ctx);

    // Update and draw walls
    currentRoom.walls.forEach(wall => {
        wall.draw(ctx);
        player.collidesWith(wall);
    });

    // Update and draw enemies
    currentRoom.enemies.forEach(enemy => {
        if (!enemy.active) return;
        enemy.update(player, currentRoom.walls); // Pass walls to enemy update
        enemy.draw(ctx);
    });

    // Check collisions between enemies and walls
    currentRoom.enemies.forEach(enemy => {
        currentRoom.walls.forEach(wall => {
            enemy.collidesWith(wall);
        });
    });

    // Draw and update chests
    currentRoom.chests.forEach(chest => {
        chest.draw(ctx);
        if (!chest.isOpen && player.collidesWith(chest)) {
            chest.open(player);
            scoreSound.play();
            score += 100;
            camera.shake(3);
        }
    });

    // Update and draw projectiles with collision detection
    projectiles.forEach(projectile => {
        if (!projectile.active) return;
        
        projectile.update();
        projectile.draw(ctx);

        // Check for collision with player
        if (projectile.collidesWith(player)) {
            player.takeDamage(projectile.damage);
            projectile.active = false;
            
            // Visual feedback
            particleSystem.addHitParticle(
                player.x + player.width/2,
                player.y + player.height/2,
                "255,0,0"
            );
            camera.shake(3);
        }

        // Check for collision with walls
        currentRoom.walls.forEach(wall => {
            if (projectile.collidesWith(wall)) {
                projectile.active = false;
                particleSystem.addHitParticle(projectile.x, projectile.y, "128,128,128");
            }
        });
    });

    // Clean up inactive projectiles
    projectiles = projectiles.filter(p => p.active);

    // Update particles and effects
    particleSystem.update();
    particleSystem.draw(ctx);
    camera.update();

    // Check wall collisions
    currentRoom.walls.forEach(wall => {
        player.collidesWith(wall);
        currentRoom.enemies.forEach(enemy => {
            enemy.collidesWith(wall);
        });
    });

    // Draw room boundary
    currentRoom.boundary.draw(ctx);

    ctx.restore();
    drawHUD();

    // After updating and drawing all entities
    checkLevelCompletion();

    requestAnimationFrame(gameLoop);
}

// Add function to check for level completion
function checkLevelCompletion() {
    if (currentRoom.enemies.length === 0 && !currentRoom.cleared) {
        currentRoom.cleared = true;
        currentLevelIndex++;
        if (currentLevelIndex < levels.length) {
            loadLevel(levels[currentLevelIndex]);
        } else {
            // Game completed, handle accordingly
            console.log('All levels completed!');
            // ...handle end of game...
        }
    }
}

// Modify room initialization
function initializeRoom() {
    const roomSize = 1000; // or whatever size you want
    currentRoom = {
        boundary: new RoomBoundary(-roomSize/2, -roomSize/2, roomSize, roomSize),
        enemies: [],
        chests: [],
        // ...other room properties...
    };
}

function handleCollisions() {
    // Check if player is within bounds
    const playerCenter = {
        x: player.x + player.width/2,
        y: player.y + player.height/2
    };

    if (!currentRoom.boundary.containsPoint(playerCenter.x, playerCenter.y)) {
        console.warn(`Player out of bounds: ${playerCenter.x}, ${playerCenter.y}`);
        // Keep player in bounds
        player.x = Math.max(currentRoom.boundary.x, Math.min(currentRoom.boundary.x + currentRoom.boundary.width - player.width, player.x));
        player.y = Math.max(currentRoom.boundary.y, Math.min(currentRoom.boundary.y + currentRoom.boundary.height - player.height, player.y));
        player.vx *= -0.5; // Bounce effect
        player.vy *= -0.5;
    }

    // Check enemies
    currentRoom.enemies.forEach(enemy => {
        if (!currentRoom.boundary.containsPoint(enemy.x + enemy.width/2, enemy.y + enemy.height/2)) {
            console.warn(`Enemy out of bounds: ${enemy.x}, ${enemy.y}`);
            // Keep enemy in bounds
            enemy.x = Math.max(currentRoom.boundary.x, Math.min(currentRoom.boundary.x + currentRoom.boundary.width - enemy.width, enemy.x));
            enemy.y = Math.max(currentRoom.boundary.y, Math.min(currentRoom.boundary.y + currentRoom.boundary.height - enemy.height, enemy.y));
            enemy.vx *= -0.5;
            enemy.vy *= -0.5;
        }
    });

    // ...rest of collision handling...
}

function checkCollisions() {
    // Chest collision
    currentRoom.chests.forEach(chest => {
        if (!chest.isOpen && player.collidesWith(chest)) {
            chest.open(player);
            scoreSound.play();
            score += 100;
            camera.shake(3);
        }
    });
}

// Initialize the game
initialize();

// Handle mouse events for player
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / (rect.width / canvas.width) + camera.x - canvas.width/2;
        const mouseY = (e.clientY - rect.top) / (rect.height / canvas.height) + camera.y - canvas.height/2;
        player.startDrag(mouseX, mouseY);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (player.isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / (rect.width / canvas.width) + camera.x - canvas.width/2;
        const mouseY = (e.clientY - rect.top) / (rect.height / canvas.height) + camera.y - canvas.height/2;
        player.drag(mouseX, mouseY);
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) { // Left click
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / (rect.width / canvas.width) + camera.x - canvas.width/2;
        const mouseY = (e.clientY - rect.top) / (rect.height / canvas.height) + camera.y - canvas.height/2;
        player.endDrag(mouseX, mouseY);
    }
});

// Add debug toggle
window.addEventListener('keydown', (e) => {
    if (e.key === 'd') {
        currentRoom.boundary.debug = !currentRoom.boundary.debug;
        console.log('Debug visualization:', currentRoom.boundary.debug ? 'enabled' : 'disabled');
    }
});