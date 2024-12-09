class Enemy extends Square {
    constructor(x, y, width, height, imgSrc, type = 'basic') {
        // Randomize size between 30 and 60
        const randomSize = Math.random() * 30 + 30;
        super(x, y, randomSize, randomSize, imgSrc);
        
        this.maxHealth = 3;
        this.health = this.maxHealth;
        this.isPlayer = false;

        // Randomize movement speed
        this.movementSpeed = Math.random() * 2 + 1; // Speed between 1 and 3

        // Attack properties
        this.attackCooldown = 0;
        this.attackPatterns = [
            { type: 'basic', probability: 0.7 },
            { type: 'power', probability: 0.2 },
            { type: 'aoe', probability: 0.1 }
        ];
        this.projectiles = [];
        this.active = true;
        this.attackType = 'basic'; // 'basic', 'power', 'aoe'
        this.chargingAttack = false;
        this.chargeTimer = 0;
        this.flashState = false;
        this.type = type;
    }

    shoot(playerX, playerY) {
        const dx = playerX - (this.x + this.width/2);
        const dy = playerY - (this.y + this.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        switch(this.attackType) {
            case 'basic': // 70% chance, normal shot
                this.projectiles.push({
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    vx: (dx / distance) * this.projectileSpeed,
                    vy: (dy / distance) * this.projectileSpeed,
                    size: this.projectileSize,
                    damage: 1
                });
                break;
            case 'power': // 20% chance, bigger slower shot
                this.projectiles.push({
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    vx: (dx / distance) * (this.projectileSpeed * 0.5),
                    vy: (dy / distance) * (this.projectileSpeed * 0.5),
                    size: this.projectileSize * 2,
                    damage: 2
                });
                break;
            case 'aoe': // 10% chance, area attack
                for(let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 * i) / 8;
                    this.projectiles.push({
                        x: this.x + this.width/2,
                        y: this.y + this.height/2,
                        vx: Math.cos(angle) * this.projectileSpeed,
                        vy: Math.sin(angle) * this.projectileSpeed,
                        size: this.projectileSize * 1.5,
                        damage: 1.5
                    });
                }
                break;
        }
    }

    update(canvas, playerX, playerY) {
        if (!this.active) return;

        // Increment shoot timer
        this.shootTimer++;

        // Update movement
        this.angle += 0.05;
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only move if not charging attack
        if (!this.chargingAttack && distance > 0) {
            this.vx = (dx / distance) * this.movementSpeed + Math.sin(this.angle) * this.wobble;
            this.vy = (dy / distance) * this.movementSpeed + Math.cos(this.angle) * this.wobble;
        }

        // Attack pattern selection
        if (this.shootTimer >= this.shootInterval) {
            const roll = Math.random();
            if (roll < 0.1 && !this.chargingAttack) { // AOE attack
                this.chargingAttack = true;
                this.chargeTimer = 30; // Half second charge
                this.attackType = 'aoe';
            } else if (roll < 0.3) { // Power shot
                this.attackType = 'power';
                this.shoot(playerX, playerY);
                this.shootTimer = 0;
            } else { // Basic shot
                this.attackType = 'basic';
                this.shoot(playerX, playerY);
                this.shootTimer = 0;
            }
        }

        if (this.chargingAttack) {
            this.chargeTimer--;
            this.flashState = !this.flashState;
            if (this.chargeTimer <= 0) {
                this.shoot(playerX, playerY);
                this.chargingAttack = false;
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.vx;
            proj.y += proj.vy;

            // Remove projectiles that are off screen
            if (proj.x < 0 || proj.x > canvas.width || 
                proj.y < 0 || proj.y > canvas.height) {
                this.projectiles.splice(i, 1);
            }
        }

        super.update(canvas);
    }

    updateAI(player, room) {
        if (this.chargingAttack) {
            this.updateChargeAttack();
            return;
        }

        // Calculate distance to player
        const dist = this.getDistanceToPlayer(player);
        
        // Choose behavior based on distance
        if (dist < 200) {
            this.evadePlayer(player);
        } else if (dist > 400) {
            this.approachPlayer(player);
        } else {
            this.maintainDistance(player);
        }

        // Attack selection logic
        this.updateAttackPattern(player);
    }

    takeDamage() {
        this.health--;
        // Add particle effect on hit
        particleSystem.addHitParticle(this.x + this.width/2, this.y + this.height/2, "255,0,0");
        // Add screen shake
        camera.shake(3);
        
        if (this.health <= 0) {
            this.active = false;
            // Add death particles
            for(let i = 0; i < 15; i++) {
                particleSystem.addHitParticle(this.x + this.width/2, this.y + this.height/2, "255,0,0");
            }
            camera.shake(8);
            return true;
        }
        return false;
    }

    draw(ctx) {
        if (!this.active) return;
        
        // Change color based on charging state
        if (this.chargingAttack) {
            ctx.fillStyle = this.flashState ? 'red' : 'white';
        } else {
            ctx.fillStyle = `rgb(255, ${(this.health/3) * 255}, ${(this.health/3) * 255})`;
        }
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Health bar
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y - 10, (this.width * this.health) / 3, 5);
        
        // Draw angry eyes
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + this.width*0.2, this.y + this.height*0.2, this.width*0.1, this.height*0.1);
        ctx.fillRect(this.x + this.width*0.7, this.y + this.height*0.2, this.width*0.1, this.height*0.1);

        // Draw projectiles
        ctx.fillStyle = 'yellow';
        this.projectiles.forEach(proj => {
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size/2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw HP bar
        const barWidth = this.width;
        const barHeight = 5;
        const barY = this.y - 10;

        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, barY, barWidth, barHeight);

        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, barY, barWidth * (this.health / this.maxHealth), barHeight);
    }

    checkProjectileCollision(player) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            if (proj.x + proj.size > player.x && 
                proj.x < player.x + player.width &&
                proj.y + proj.size > player.y && 
                proj.y < player.y + player.height) {
                this.projectiles.splice(i, 1);
                return true; // Hit detected
            }
        }
        return false;
    }

    basicAttack(playerX, playerY) {
        const dx = playerX - (this.x + this.width/2);
        const dy = playerY - (this.y + this.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.projectiles.push({
            x: this.x + this.width/2,
            y: this.y + this.height/2,
            vx: (dx / distance) * this.projectileSpeed,
            vy: (dy / distance) * this.projectileSpeed,
            size: this.projectileSize,
            damage: 1
        });
    }

    powerAttack(playerX, playerY) {
        const dx = playerX - (this.x + this.width/2);
        const dy = playerY - (this.y + this.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.projectiles.push({
            x: this.x + this.width/2,
            y: this.y + this.height/2,
            vx: (dx / distance) * (this.projectileSpeed * 0.5),
            vy: (dy / distance) * (this.projectileSpeed * 0.5),
            size: this.projectileSize * 2,
            damage: 2
        });
    }

    aoeAttack(playerX, playerY) {
        for(let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.projectiles.push({
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                vx: Math.cos(angle) * this.projectileSpeed,
                vy: Math.sin(angle) * this.projectileSpeed,
                size: this.projectileSize * 1.5,
                damage: 1.5
            });
        }
    }

    getDistanceToPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    evadePlayer(player) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.vx = (dx / dist) * this.movementSpeed;
            this.vy = (dy / dist) * this.movementSpeed;
        }
    }

    approachPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.vx = (dx / dist) * this.movementSpeed * 0.5;
            this.vy = (dy / dist) * this.movementSpeed * 0.5;
        }
    }

    maintainDistance(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.vx = (dx / dist) * this.movementSpeed * 0.1;
            this.vy = (dy / dist) * this.movementSpeed * 0.1;
        }
    }

    updateAttackPattern(player) {
        if (this.shootTimer >= this.shootInterval) {
            const roll = Math.random();
            let selectedPattern = null;
            
            if (roll < this.attackPatterns.aoe.probability) {
                selectedPattern = this.attackPatterns.aoe;
            } else if (roll < this.attackPatterns.power.probability + this.attackPatterns.aoe.probability) {
                selectedPattern = this.attackPatterns.power;
            } else {
                selectedPattern = this.attackPatterns.basic;
            }
            
            selectedPattern.execute(player.x, player.y);
            this.shootTimer = 0;
        }
    }

    selectAttack(player) {
        const roll = Math.random();
        let cumulativeProbability = 0;
        for (let pattern of this.attackPatterns) {
            cumulativeProbability += pattern.probability;
            if (roll <= cumulativeProbability) {
                this.executeAttack(pattern.type, player);
                break;
            }
        }
    }

    executeAttack(type, player) {
        switch (type) {
            case 'basic':
                this.attackCooldown = 60;
                this.shootProjectile(player, 5, 4);
                break;
            case 'power':
                this.attackCooldown = 90;
                this.shootProjectile(player, 10, 2);
                break;
            case 'aoe':
                this.attackCooldown = 120;
                this.chargeAOEAttack();
                break;
        }
    }

    shootProjectile(player, size, speed) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        this.projectiles.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            vx: (dx / distance) * speed,
            vy: (dy / distance) * speed,
            size: size
        });
    }

    chargeAOEAttack() {
        this.charging = true;
        this.chargeTime = 30; // Half a second at 60fps
    }

    updateProjectiles() {
        // ...existing code for updating and drawing projectiles...
    }
}