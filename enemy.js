class Enemy extends Square {
    constructor(x, y, width, height, imgSrc) {
        // Randomize size between 30 and 60
        const randomSize = Math.random() * 30 + 30;
        super(x, y, randomSize, randomSize, imgSrc);
        
        this.health = 3; // Base HP of 3
        // Randomize movement properties more extensively
        this.movementSpeed = Math.random() * 4 + 0.5; // Speed between 0.5 and 4.5
        this.wobble = Math.random() * 0.4; // Increased random wobble effect
        this.angle = 0; // For wobble movement
        this.shootTimer = 0;
        this.shootInterval = Math.random() * 2000 + 500; // Random shoot interval between 0.5-2.5 seconds
        this.projectileSpeed = Math.random() * 3 + 2; // Random projectile speed
        this.projectileSize = Math.random() * 10 + 5; // Random projectile size
        this.projectiles = [];
        this.active = true;
        this.attackType = 'basic'; // 'basic', 'power', 'aoe'
        this.chargingAttack = false;
        this.chargeTimer = 0;
        this.flashState = false;
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

    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            this.active = false;
            return true; // Enemy defeated
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
}