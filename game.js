// First get DOM elements
let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let fpsCounter = document.getElementById('fpsCounter');
let bgMusic = document.getElementById('bgMusic');
let bounceSound = document.getElementById('bounce');
let scoreSound = document.getElementById('scoresfx');
let gameoverSound = document.getElementById('gameoversfx');

// Game state variables
let frameCount = 0;
let lastTime = performance.now();
let fps = 0;
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

// Update the walls after canvas is available
function updateWalls() {
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

// Fullscreen handler
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        canvas.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
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
    player.x = 100;
    player.y = canvas.height / 2;
    player.vx = 0;
    player.vy = 0;
    
    // Initialize sounds
    initializeSounds();
    
    // Initialize first room
    currentRoom = roomManager.generateRoom('test');
    
    // Spawn player away from chest (top-left quadrant)
    player.x = currentRoom.width * 0.25;
    player.y = currentRoom.height * 0.25;
    
    // Reset camera
    camera.target = player;

    // Play music only after user interaction
    document.addEventListener('click', () => {
        if (bgMusic.muted) {
            toggleSound();
        }
        bgMusic.play();
    }, { once: true });

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    isGameOver = true;
    bgMusic.pause();
    gameoverSound.play();
    document.getElementById('game-over-overlay').style.visibility = 'visible';
    document.getElementById('final-score-value').innerText = score;
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
    ctx.fillText(`Enemies: ${currentRoom.enemies.length}`, 10, 80);
    
    // Draw other stats
    ctx.fillText(`Score: ${score}`, canvas.width - 150, 30);
    
    ctx.restore();
}

// Update gameLoop function
function gameLoop(currentTime) {
    if (isGameOver) return;

    // Skip updating if the game is paused
    if (isGamePaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // Clear and setup camera
    ctx.save();
    ctx.translate(-camera.x + canvas.width/2, -camera.y + canvas.height/2);
    ctx.clearRect(camera.x - canvas.width/2, camera.y - canvas.height/2, canvas.width, canvas.height);

    // Draw background and room
    currentRoom.draw(ctx);

    // Update and draw game objects
    player.update(canvas);
    player.draw(ctx);

    // Draw and update enemies
    currentRoom.enemies.forEach(enemy => {
        if (!enemy.active) return;
        enemy.updateAI(player, currentRoom);
        enemy.update(canvas, player.x + player.width/2, player.y + player.height/2);
        enemy.draw(ctx);
        
        // Check collisions
        if (enemy.checkProjectileCollision(player)) {
            player.takeDamage();
            camera.shake(5);
        }
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

    ctx.restore();
    drawHUD();

    requestAnimationFrame(gameLoop);
}

// Update collision handling for chest
function checkCollisions() {
    // ...existing code...

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

// Implement showUpgradeDialog function
function showUpgradeDialog(hint, onConfirm) {
    // Display dialog UI with the hint
    // On confirmation, call onConfirm()
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