let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let fpsCounter = document.getElementById('fpsCounter');

// FPS tracking variables
let frameCount = 0;
let lastTime = performance.now();
let fps = 0;

// Add these variables
let score = 0;
let isGameOver = false;
let bgMusic = document.getElementById('bgMusic');
let bounceSound = document.getElementById('bounce');
let scoreSound = document.getElementById('scoresfx');
let gameoverSound = document.getElementById('gameoversfx');

// Resize handler
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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

// Initialize
window.addEventListener('resize', resizeCanvas);
window.addEventListener('keydown', (e) => {
    if (e.key === 'f') toggleFullscreen();
});
resizeCanvas();

// Game state
let player = new Square(100, 100, 50, 50, 'path/to/player-image.png');
player.isPlayer = true;
let enemies = [new Enemy(400, 300, 40, 40)]; // Add a test enemy
let chests = [new Chest(600, 400)]; // Add a test chest

// Room boundaries (walls)
let walls = [
    new Square(0, 0, canvas.width, 20), // Top wall
    new Square(0, canvas.height - 20, canvas.width, 20), // Bottom wall
    new Square(0, 0, 20, canvas.height), // Left wall
    new Square(canvas.width - 20, 0, 20, canvas.height) // Right wall
];

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
    
    // Create new enemies and chests
    enemies = [
        new Enemy(400, 300, 40, 40),
        new Enemy(600, 200, 40, 40)
    ];
    
    chests = [
        new Chest(canvas.width - 100, canvas.height/2)
    ];
    
    bgMusic.play();
    bgMusic.volume = 0.2;
    
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    isGameOver = true;
    bgMusic.pause();
    gameoverSound.play();
    document.getElementById('game-over-overlay').style.visibility = 'visible';
    document.getElementById('final-score-value').innerText = score;
}

// Game loop
function gameLoop(currentTime) {
    if (isGameOver) return;

    // FPS calculation
    frameCount++;
    if (currentTime - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        fpsCounter.textContent = `FPS: ${fps}`;
    }

    // Update score display
    document.getElementById('score').innerText = 'Score: ' + score;

    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw room
    ctx.fillStyle = '#333'; // Dark gray for walls
    walls.forEach(wall => {
        wall.draw(ctx);
        if (player.collidesWith(wall)) {
            bounceSound.play();
        }
    });

    // Update and draw game objects
    player.update(canvas);
    player.draw(ctx);

    // Update and draw enemies
    enemies.forEach((enemy, index) => {
        if (!enemy.active) return;
        
        enemy.update(canvas, player.x + player.width/2, player.y + player.height/2);
        enemy.draw(ctx);
        
        // Check projectile collision
        if (enemy.checkProjectileCollision(player)) {
            player.takeDamage();
        }

        // Check collision with weighted physics
        if (player.collidesWith(enemy)) {
            // Player has more mass, enemy gets pushed more
            const pushFactor = 0.3; // Player's weight advantage
            if (player.vy > 0) { // Player is moving downward
                if (enemy.takeDamage()) {
                    score += 50;
                }
                // Bounce player with less impact
                player.vy = -player.vy * 0.7;
                // Push enemy more
                enemy.vy = player.vy * (1 + pushFactor);
                enemy.vx = player.vx * (1 + pushFactor);
            }
        }
    });

    // Remove defeated enemies
    enemies = enemies.filter(enemy => enemy.active);

    chests.forEach(chest => {
        chest.draw(ctx);
        if (!chest.isOpen && player.collidesWith(chest)) {
            chest.open(player);
            scoreSound.play();
            score += 100;
        }
    });

    // Check player health
    if (player.health <= 0) {
        gameOver();
        return;
    }

    requestAnimationFrame(gameLoop);
}

// Initialize the game
initialize();

// Handle mouse events for player
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click
        player.startDrag(e.clientX, e.clientY);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (player.isDragging) {
        player.drag(e.clientX, e.clientY);
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) { // Left click
        player.endDrag(e.clientX, e.clientY);
    }
});