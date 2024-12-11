class Player {
    constructor(x, y, width, height, imgSrc) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.rotation = 0; // Add rotation angle
        this.health = 50; // Set base health to 20
        this.maxHealth = 50;
        this.isPlayer = false; // To distinguish player from other objects
        this.invulnerable = false; // For damage immunity frames
        this.invulnerableTimer = 0;
        this.speed = 2; // Increased from 1
        this.damage = 1; // Base damage
        this.mass = this.isPlayer ? 2 : 1; // Player has more mass
        if (imgSrc) {
            this.img = new Image();
            this.img.src = imgSrc;
        } else {
            this.img = null;
        }
        this.lastValidX = x;  // Add last valid position tracking
        this.lastValidY = y;
        this.colliding = false;  // Track collision state

        // Add upgrade and stats system
        this.stats = {
            maxHealth: 5,
            speed: 1,
            damage: 1,
            size: 1
        };
        
        this.upgrades = [];
        this.effects = [];
        
        // Movement mechanics
        this.dragStrength = 1;
        this.bounceResistance = 0.8;
        this.frictionCoefficient = 0.99; // Reduced friction for smoother movement
        
        // Debug info
        this.debugInfo = {
            velocity: false,
            collisions: false,
            stats: false
        };
    }

    startDrag(mouseX, mouseY) {
        this.isDragging = true;
        // Start from player center instead of mouse position
        this.startX = this.x + this.width / 2;
        this.startY = this.y + this.height / 2;
        this.endX = mouseX;
        this.endY = mouseY;

        // Store the initial player position
        this.dragStartPlayerX = this.x;
        this.dragStartPlayerY = this.y;
    }

    drag(mouseX, mouseY) {
        if (this.isDragging) {
            // Just update end position
            this.endX = mouseX;
            this.endY = mouseY;
        }
    }

    endDrag(mouseX, mouseY) {
        if (this.isDragging) {
            // Calculate velocity towards mouse cursor
            const dx = mouseX - (this.x + this.width / 2);
            const dy = mouseY - (this.y + this.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Calculate launch speed with better control
                const maxSpeed = 30;
                const speedMultiplier = 0.2; // Adjusted for better feel
                const launchSpeed = Math.min(distance * speedMultiplier, maxSpeed);
                
                // Set velocity towards mouse position
                this.vx = (dx / distance) * launchSpeed;
                this.vy = (dy / distance) * launchSpeed;
                
                // Play sound effect
                if (typeof window.audioSystem !== 'undefined') {
                    window.audioSystem.play('wind');
                }
            }
            
            this.isDragging = false;
        }
    }

    update(canvas) {
        if (!this.isDragging) {
            const oldX = this.x;
            const oldY = this.y;
            
            // Update position based on velocity
            this.x += this.vx;
            this.y += this.vy;

            // Apply friction
            this.vx *= this.frictionCoefficient;
            this.vy *= this.frictionCoefficient;

            // Edge collision detection and bounce
            let wallHit = false;
            
            if (this.x < 0) {
                this.x = 0;
                this.vx = -this.vx * this.bounceResistance;
                wallHit = true;
            } else if (this.x + this.width > canvas.width) {
                this.x = canvas.width - this.width;
                this.vx = -this.vx * this.bounceResistance;
                wallHit = true;
            }

            if (this.y < 0) {
                this.y = 0;
                this.vy = -this.vy * this.bounceResistance;
                wallHit = true;
            } else if (this.y + this.height > canvas.height) {
                this.y = canvas.height - this.height;
                this.vy = -this.vy * this.bounceResistance;
                wallHit = true;
            }

            // Play bounce sound if we hit a wall
            if (wallHit && typeof audioSystem !== 'undefined') {
                audioSystem.play('bounce');
            }
        }

        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
                this.isFlashing = false;
            }
        }

        // Update active effects
        this.effects = this.effects.filter(effect => {
            effect.duration--;
            return effect.duration > 0;
        });

        // Apply speed modifier from upgrades
        this.vx *= this.stats.speed;
        this.vy *= this.stats.speed;
    }

    draw(ctx) {
        // Draw drag line first (behind player)
        if (this.isDragging) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            const friction = 0.9;
            this.vx *= friction;
            this.vy *= friction;
            ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
            ctx.lineTo(this.endX, this.endY);
            ctx.stroke();

            // Draw direction arrow
            const dx = this.endX - (this.x + this.width / 2);
            const dy = this.endY - (this.y + this.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                // Draw arrow head
                const angle = Math.atan2(dy, dx);
                const arrowLength = 15;
                const arrowAngle = Math.PI / 6;
                
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
                ctx.lineTo(
                    this.x + this.width / 2 - Math.cos(angle + arrowAngle) * arrowLength,
                    this.y + this.height / 2 - Math.sin(angle + arrowAngle) * arrowLength
                );
                ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
                ctx.lineTo(
                    this.x + this.width / 2 - Math.cos(angle - arrowAngle) * arrowLength,
                    this.y + this.height / 2 - Math.sin(angle - arrowAngle) * arrowLength
                );
                ctx.stroke();
            }
        }

        if (this.isDragging) {
            // Draw drag line
            ctx.strokeStyle = 'white';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
            ctx.lineTo(this.endX, this.endY);
            ctx.stroke();
        }

        if (this.invulnerable && this.isPlayer) {
            ctx.globalAlpha = 0.5;
        } else {
            ctx.globalAlpha = 1.0;
        }

        if (this.isFlashing) {
            // Alternate visibility to create flashing effect
            if (Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            } else {
                ctx.globalAlpha = 1.0;
            }
        } else {
            ctx.globalAlpha = 1.0;
        }

        if (this.img && this.img.complete && this.img.naturalWidth !== 0) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'blue';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.globalAlpha = 1.0;

        // Draw centered HP bar
        const barWidth = this.width;
        const barHeight = 5;
        const barX = this.x;
        const barY = this.y - 10; // Position above the player/enemy

        // Center the health bar
        const centerX = this.x + (this.width - barWidth) / 2;

        // Background bar
        ctx.fillStyle = 'red';
        ctx.fillRect(centerX, barY, barWidth, barHeight);

        // Health bar
        const healthRatio = this.health / this.maxHealth;
        ctx.fillStyle = 'green';
        ctx.fillRect(centerX, barY, barWidth * healthRatio, barHeight);

        // Reset opacity
        ctx.globalAlpha = 1.0;

        // Add debug visualization
        if (this.debug) {
            ctx.strokeStyle = 'yellow';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        // Draw active effects
        this.effects.forEach(effect => {
        });

        // Draw debug info if enabled
        if (this.debugInfo.stats) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Alagard';
            ctx.fillText(`Health: ${this.health}`, this.x, this.y - 25);
        }
    }

    takeDamage(amount) {
        if (!this.invulnerable) {
            this.health -= amount;
            this.invulnerable = true;
            this.invulnerableTimer = 30; // 0.5 seconds at 60 FPS

            // Start flashing effect
            this.isFlashing = true;
            this.flashTimer = this.invulnerableTimer;

            // Check for player death
            if (this.health <= 0) {
                // Handle player death
                gameState.isGameOver = true;
            }
        }
    }

    collidesWith(other) {
        // Check for collision with another object
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }

    resolveCollision(other) {
        // Only calculate direction, don't modify position or bounce
        const dx = (this.x + this.width / 2) - (other.x + other.width / 2);
        const dy = (this.y + this.height / 2) - (other.y + other.height / 2);
        
        // Optional: Add slight push in collision direction
        const angle = Math.atan2(dy, dx);
// Export the Player class if using ES6 modules (optional)
        const pushForce = 0.5;
        
        this.vx += Math.cos(angle) * pushForce;
        this.vy += Math.sin(angle) * pushForce;
    }
}