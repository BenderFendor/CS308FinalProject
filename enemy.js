class Enemy extends Square {
    // Represents an enemy in the game
    constructor(x, y, width, height, type = 'basic') {
        super(x, y, width, height);
        this.type = type;
        // Adjust attributes based on enemy type
        if (this.type === 'earth') {
            this.health = 2;
            this.speed = 1;
            this.color = 'green';
        } else if (this.type === 'solar') {
            this.health = 3;
            this.speed = 1.2;
            this.color = 'orange';
        } else if (this.type === 'blackhole') {
            this.health = 5;
            this.speed = 1.5;
            this.color = 'purple';
        } else {
            this.health = 2;
            this.speed = 1;
            this.color = 'red';
        }
        this.maxHealth = this.health;
        this.active = true;
        this.mass = 1; // Lower mass than player for bouncing
        this.attackCooldowns = {
            basic: 0,
            slow: 0,
            aoe: 0
        };
        this.cooldownTimes = {
            basic: 120,    // 2 seconds between basic shots
            slow: 240,     // 4 seconds between slow shots
            aoe: 360      // 6 seconds between AOE attacks
        };
        this.lastCollisionTime = 0; // Prevent multiple collisions
    }

    update(player, walls) {
        if (!this.active) return;

        // Update position and handle movement
        if (!this.isCharging) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                this.vx = (dx / distance) * this.speed;
                this.vy = (dy / distance) * this.speed;
                this.x += this.vx;
                this.y += this.vy;
            }
        }

        // Handle attack cooldowns
        Object.keys(this.attackCooldowns).forEach(key => {
            if (this.attackCooldowns[key] > 0) {
                this.attackCooldowns[key]--;
            }
        });

        // Check for player collision and damage
        if (this.collidesWith(player)) {
            const currentTime = Date.now();
            if (currentTime - this.lastCollisionTime > 100) { // Prevent multiple hits
                const impactSpeed = Math.sqrt(
                    Math.pow(player.vx - this.vx, 2) + 
                    Math.pow(player.vy - this.vy, 2)
                );
                
                if (impactSpeed > 5) {
                    this.takeDamage(1);
                    particleSystem.addHitParticle(this.x + this.width/2, this.y + this.height/2);
                }
                this.lastCollisionTime = currentTime;
            }
        }

        // Perform attacks
        this.performAttack(player);
    }

    performAttack(player) {
        let rand = Math.random();
        if (rand < 0.7 && this.attackCooldowns.basic === 0) {
            this.basicShot(player);
            this.attackCooldowns.basic = this.cooldownTimes.basic;
        } else if (rand < 0.9 && this.attackCooldowns.slow === 0) {
            this.slowShot(player);
            this.attackCooldowns.slow = this.cooldownTimes.slow;
        } else if (this.attackCooldowns.aoe === 0) {
            this.aoeAttack();
            this.attackCooldowns.aoe = this.cooldownTimes.aoe;
        }
    }

    basicShot(player) {
        // Basic projectile towards player with reduced speed
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const speed = 8; // Reduced from 15
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const projectile = new Projectile(this.x, this.y, vx, vy, 1, 'basic');
        projectiles.push(projectile);
    }

    slowShot(player) {
        // Slow but damaging projectile with reduced speed
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const speed = 2; // Reduced from 3
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const projectile = new Projectile(this.x, this.y, vx, vy, 2, 'slow');
        projectiles.push(projectile);
    }

    aoeAttack() {
        // Charge up for AOE attack
        this.isCharging = true;
        setTimeout(() => {
            this.isCharging = false;
            // Create an AOE effect
            const aoe = new AOEAttack(this.x, this.y, 50, 2);
            projectiles.push(aoe);
        }, 500); // 500ms charge time
    }

    handleCollisionWithPlayer(player) {
        if (this.isResolvingCollision) return;
        
        super.resolveCollision(player);
        
        // Check collision damage
        const impactSpeed = Math.sqrt(
            Math.pow(player.vx - this.vx, 2) + 
            Math.pow(player.vy - this.vy, 2)
        );
        
        if (impactSpeed > 5) {
            this.takeDamage(1);
        }
    }

    handleCollisionWithWall(wall) {
        // Similar collision response as in Square class
        // ...collision handling code...
    }

    resolveCollision(other) {
        // Calculate collision response
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return;

        // Normalize collision vector
        const nx = dx / distance;
        const ny = dy / distance;

        // Calculate relative velocity
        const dvx = this.vx - (other.vx || 0);
        const dvy = this.vy - (other.vy || 0);

        // Calculate impulse
        const impulse = -(2 * (dvx * nx + dvy * ny)) / 
                        (1/this.mass + (other.mass ? 1/other.mass : 0));

        // Apply impulse
        this.vx += impulse * nx / this.mass;
        this.vy += impulse * ny / this.mass;

        if (other.vx !== undefined) {
            other.vx -= impulse * nx / other.mass;
            other.vy -= impulse * ny / other.mass;
        }
    }

    draw(ctx) {
        // Draw the enemy
        ctx.fillStyle = this.color; // Enemy color
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw health bar
        const barWidth = this.width;
        const barHeight = 5;
        const barY = this.y - 10;

        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, barY, barWidth, barHeight);

        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, barY, (barWidth * this.health) / this.maxHealth, barHeight);

        // Visual feedback for AOE charging
        if (this.isCharging) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = 'yellow';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
    }

    collidesWith(square) {
        // Check for collision with a Square (e.g., the player)
        return !(
            this.x + this.width < square.x ||
            this.x > square.x + square.width ||
            this.y + this.height < square.y ||
            this.y > square.y + square.height
        );
    }

    takeDamage(amount) {
        if (this.active) {
            this.health -= amount;
            // Create hit effect
            particleSystem.addHitParticle(
                this.x + this.width/2, 
                this.y + this.height/2, 
                "255,0,0"
            );
            
            if (this.health <= 0) {
                this.active = false;
                // Create death effect
                for (let i = 0; i < 8; i++) {
                    particleSystem.addHitParticle(
                        this.x + this.width/2, 
                        this.y + this.height/2, 
                        "255,0,0"
                    );
                }
            }
        }
    }
}

// Projectile class
class Projectile {
    constructor(x, y, vx, vy, damage, type) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.type = type;
        this.active = true;
        this.radius = type === 'slow' ? 8 : 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        // Deactivate if out of bounds
        if (this.x < 0 || this.x > currentRoom.width || this.y < 0 || this.y > currentRoom.height) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.type === 'slow' ? 'purple' : 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    collidesWith(entity) {
        // Circle-rectangle collision detection
        const distX = Math.abs(this.x - entity.x - entity.width / 2);
        const distY = Math.abs(this.y - entity.y - entity.height / 2);

        if (distX > (entity.width / 2 + this.radius)) return false;
        if (distY > (entity.height / 2 + this.radius)) return false;

        if (distX <= (entity.width / 2)) return true;
        if (distY <= (entity.height / 2)) return true;

        const dx = distX - entity.width / 2;
        const dy = distY - entity.height / 2;
        return (dx * dx + dy * dy <= (this.radius * this.radius));
    }
}

// AOE Attack class
class AOEAttack extends Projectile {
    constructor(x, y, radius, damage) {
        super(x, y, 0, 0, damage, 'aoe');
        this.radius = radius;
        this.duration = 30; // Lasts for 30 frames
    }

    update() {
        this.duration--;
        if (this.duration <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}