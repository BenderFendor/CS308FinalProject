class Enemy {
    constructor(x, y, width, height, type = 'earth') {
        // Enemy position and size
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        // Velocity
        this.vx = 0;
        this.vy = 0;

        // Enemy attributes based on type
        const enemyTypes = {
            earth: { 
                health: 2,
                speed: 1,
                color: '#4a8505',
                attacks: ['groundSlam', 'rockThrow']
            },
            solar: { 
                health: 3,
                speed: 1.2,
                color: '#ffa726',
                attacks: ['solarFlare', 'heatWave']
            },
            blackhole: { 
                health: 5,
                speed: 1.5,
                color: '#4a148c',
                attacks: ['gravityPull', 'voidBlast']
            }
        };

        const typeData = enemyTypes[type] || enemyTypes.earth;
        Object.assign(this, typeData);
        this.type = type;
        this.maxHealth = this.health;
        this.active = true;
        this.mass = 1; // For collision physics
        this.isCharging = false;
        this.isBoss = false;
        this.attackPatterns = this.initializeAttackPatterns();
        this.lastCollisionTime = 0;
        this.isFlashing = false;
        this.flashTimer = 0;
        this.stunned = false;
        this.stunDuration = 0;
        this.lastDamageTime = 0; // Add cooldown for taking damage
        this.damageImmunity = 500; // 500ms between damage taken

        this.lastDamageTime = 0;
        this.damageCooldown = 1000; // 1000ms = 1 second between hits
        this.isInvulnerable = false; // Add invulnerability state

        // Initialize attack cooldowns with random values
        for (const key in this.attackPatterns) {
            this.attackPatterns[key].lastUsed = Math.floor(Math.random() * this.attackPatterns[key].cooldown);
        }
    }

    initializeAttackPatterns() {
        // Increase cooldowns by factor of 5 to slow down attack rate to 20%
        return {
            basic: { probability: 0.7, cooldown: 240 * 5, lastUsed: 0 },
            heavy: { probability: 0.2, cooldown: 480 * 5, lastUsed: 0 },
            aoe:   { probability: 0.1, cooldown: 720 * 5, lastUsed: 0 }
        };
    }

    update(player) {
        if (!this.active) return;

        if (this.stunned) {
            // Remain idle while stunned
            this.stunDuration--;
            if (this.stunDuration <= 0) {
                this.stunned = false;
            }
            return;
        }

        if (this.isFlashing) {
            this.flashTimer--;
            if (this.flashTimer <= 0) {
                this.isFlashing = false;
                this.explode();
            }
        } else {
            if (!this.isCharging) {
                // Move towards the player
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const distance = Math.hypot(dx, dy);

                if (distance > 0) {
                    this.vx = (dx / distance) * this.speed;
                    this.vy = (dy / distance) * this.speed;
                    this.x += this.vx;
                    this.y += this.vy;
                }
            }

            // Handle attack cooldowns with randomness
            for (const key in this.attackPatterns) {
                const pattern = this.attackPatterns[key];
                if (pattern.lastUsed > 0) {
                    pattern.lastUsed--;
                } else {
                    if (Math.random() < pattern.probability) {
                        this.executeAttack(key, player);
                        // Add randomness to cooldown
                        pattern.lastUsed = pattern.cooldown + Math.floor(Math.random() * 100);
                    }
                }
            }

            // Check collision with player
            if (this.collidesWith(player)) {
                this.handleCollisionWithPlayer(player);
            }
        }
    }

    executeAttack(type, player) {
        const attacks = {
            earth: {
                basic: () => this.groundSlam(player),
                heavy: () => this.rockThrow(player),
                aoe:   () => this.areaQuake()
            },
            solar: {
                basic: () => this.solarFlare(player),
                heavy: () => this.heatWave(player),
                aoe:   () => this.solarEruption()
            },
            blackhole: {
                basic: () => this.gravityPull(player),
                heavy: () => this.voidBlast(player),
                aoe:   () => this.singularity()
            }
        };

        if (attacks[this.type] && attacks[this.type][type]) {
            attacks[this.type][type]();
        } else {
            this.basicShot(player);
        }
    }

    // Define all attack methods (groundSlam, rockThrow, etc.)

    groundSlam(player) {
        // Creates a shockwave attack
        const shockwave = new AOEAttack(this.x, this.y, 50, 2);
        shockwave.type = 'earth';
        shockwave.duration = 45;
        gameState.projectiles.push(shockwave);
    }

    rockThrow(player) {
        // Throws a rock projectile towards the player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const speed = 5 * 0.25; // Reduce speed to 25%
        const rock = new Projectile(
            this.x, 
            this.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            3,
            'rock'
        );
        rock.size = 15;
        gameState.projectiles.push(rock);
    }

    solarFlare(player) {
        // Shoots projectiles in all directions
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 6 * 0.25; // Reduce speed to 25%
            const flare = new Projectile(
                this.x, 
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                1,
                'solar'
            );
            gameState.projectiles.push(flare);
        }
    }

    heatWave(player) {
        // Shoots a wave attack towards the player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const wave = new WaveAttack(
            this.x, 
            this.y,
            dx, 
            dy,
            100,
            2
        );
        gameState.projectiles.push(wave);
    }

    gravityPull(player) {
        // Creates a gravity field that pulls the player
        const pull = new GravityField(this.x, this.y, 150);
        gameState.projectiles.push(pull);
    }

    voidBlast(player) {
        // Shoots a powerful projectile towards the player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const speed = 8 * 0.25; // Reduce speed to 25%
        const blast = new Projectile(
            this.x, 
            this.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            5,
            'void'
        );
        blast.size = 20;
        gameState.projectiles.push(blast);
    }

    areaQuake() {
        // Creates an area-of-effect attack around the enemy
        const quake = new AOEAttack(this.x, this.y, 100, 3);
        quake.type = 'earth';
        quake.duration = 60;
        gameState.projectiles.push(quake);
    }

    solarEruption() {
        // Creates a large area-of-effect attack after a delay
        this.isCharging = true;
        setTimeout(() => {
            const eruption = new AOEAttack(this.x, this.y, 150, 4);
            eruption.type = 'solar';
            eruption.duration = 60;
            gameState.projectiles.push(eruption);
            this.isCharging = false;
        }, 1000); // 1-second charge time
    }

    singularity() {
        // Creates a black hole that sucks in the player and projectiles
        const singularity = new GravityField(this.x, this.y, 200);
        singularity.pullForce = 1.0;
        singularity.duration = 120; // Lasts longer
        gameState.projectiles.push(singularity);
    }

    basicShot(player) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const speed = 5 * 0.25; // Reduce speed to 25%
        const projectile = new Projectile(
            this.x, 
            this.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            1,
            this.type
        );
        gameState.projectiles.push(projectile);
    }
    handleCollisionWithPlayer(player) {
        const currentTime = Date.now();
        // Only process collision if enemy isn't invulnerable
        if (!this.isInvulnerable) {
            // Apply damage and make enemy invulnerable
            this.takeDamage(player.damage);
            this.isInvulnerable = true;
            
            // Reset invulnerability after cooldown
            setTimeout(() => {
                this.isInvulnerable = false;
            }, this.damageCooldown);
            
            // Bounce physics
            this.vx = -this.vx;
            this.vy = -this.vy;
            player.vx = -player.vx * 0.8;
            player.vy = -player.vy * 0.8;
        }
    }

    takeDamage(amount) {
        // Only apply damage if not invulnerable
        if (!this.isInvulnerable) {
            this.health -= amount;

            // Visual feedback
            this.isFlashing = true;
            this.flashTimer = 5;

            // Check for death
            if (this.health <= 0) {
                this.active = false;
            }
        }
    }

    explode() {
        // Perform AoE attack upon exploding
        const explosion = new AOEAttack(this.x + this.width / 2, this.y + this.height / 2, 50, 2);
        explosion.type = this.type;
        explosion.duration = 30;
        gameState.projectiles.push(explosion);

        this.active = false;
        // Additional logic for enemy death (e.g., particle effects)
    }

    draw(ctx) {
        if (this.isFlashing) {
            ctx.fillStyle = 'orange';
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw centered HP bar
        const barWidth = this.width;
        const barHeight = 5;
        const barY = this.y - 10;

        // Center the health bar
        const centerX = this.x + (this.width - barWidth) / 2;

        // Background bar
        ctx.fillStyle = 'red';
        ctx.fillRect(centerX, barY, barWidth, barHeight);

        // Health bar
        const healthRatio = this.health / this.maxHealth;
        ctx.fillStyle = 'green';
        ctx.fillRect(centerX, barY, barWidth * healthRatio, barHeight);

        
        if (this.isCharging) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = 'yellow';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }

        // Add visual indicator for stunned state
        if (this.stunned) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }

        // Add health number display for bosses
        if (this.isBoss) {
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.health}/${this.maxHealth}`, this.x + this.width/2, this.y - 25);
            ctx.textAlign = 'left'; // Reset alignment
        }
    }

    collidesWith(entity) {
        return !(
            this.x + this.width < entity.x ||
            this.x > entity.x + entity.width ||
            this.y + this.height < entity.y ||
            this.y > entity.y + entity.height
        );
    }
}

// Projectile class for enemy and player projectiles
class Projectile {
    constructor(x, y, vx, vy, damage, type) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.type = type;
        this.active = true;
        this.radius = type === 'slow' ? 8 : 5;
    }

    update() {
        // Move the projectile
        this.x += this.vx;
        this.y += this.vy;

        // Deactivate if out of bounds
        if (
            this.x < 0 || 
            this.x > canvas.width || 
            this.y < 0 || 
            this.y > canvas.height
        ) {
            this.active = false;
        }
    }

    draw(ctx) {
        // Draw the projectile
        ctx.fillStyle = this.type === 'player' ? 'blue' : 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    collidesWith(entity) {
        // Circle vs. Rectangle collision detection
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

// AOEAttack class for area-of-effect attacks
class AOEAttack extends Projectile {
    constructor(x, y, radius, damage) {
        super(x, y, 0, 0, damage, 'aoe');
        this.radius = radius;
        this.duration = 30; // Frames the AOE attack lasts
    }

    update() {
        // Reduce the duration and deactivate if expired
        this.duration--;
        if (this.duration <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        // Draw the AOE effect
        ctx.fillStyle = 'rgba(255, 128, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// WaveAttack class for wave-shaped projectiles
class WaveAttack extends Projectile {
    constructor(x, y, dx, dy, width, damage) {
        const angle = Math.atan2(dy, dx);
        const speed = 4;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        super(x, y, vx, vy, damage, 'wave');
        this.width = width;
        this.length = 20;
    }

    update() {
        // Move the wave
        this.x += this.vx;
        this.y += this.vy;
        // Deactivate if out of bounds
        if (
            this.x < 0 || 
            this.x > canvas.width || 
            this.y < 0 || 
            this.y > canvas.height
        ) {
            this.active = false;
        }
    }

    draw(ctx) {
        // Draw the wave
        ctx.save();
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = this.width;
        ctx.beginPath();
        ctx.moveTo(this.x - this.vx * this.length, this.y - this.vy * this.length);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        ctx.restore();
    }
}

// GravityField class for gravitational attacks
class GravityField extends AOEAttack {
    constructor(x, y, radius) {
        super(x, y, radius, 1);
        this.pullForce = 0.5;
    }

    update() {
        super.update();
        // Apply gravitational pull to the player
        const dx = this.x - gameState.player.x;
        const dy = this.y - gameState.player.y;
        const distance = Math.hypot(dx, dy);

        if (distance < this.radius && distance > 0) {
            const force = (this.radius - distance) * this.pullForce / distance;
            gameState.player.vx += dx * force;
            gameState.player.vy += dy * force;
        }
    }

    draw(ctx) {
        // Draw the gravity field
        ctx.save();
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, 'rgba(75, 0, 130, 0.6)');
        gradient.addColorStop(1, 'rgba(75, 0, 130, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Update the Player's applyUpgrade method
Player.prototype.applyUpgrade = function(upgrade) {
    if (upgrade.type === 'stat') {
        // ...existing stat upgrade code...
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
                gameState.enemies.forEach(enemy => {
                    enemy.stunned = true;
                    enemy.stunDuration = Math.floor(duration / (1000/60)); // Convert ms to frames
                });
                break;
        }
    }
};