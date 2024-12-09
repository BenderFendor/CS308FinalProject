class Square {
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
        this.health = 5; // Add health system
        this.isPlayer = false; // To distinguish player from other objects
        this.invulnerable = false; // For damage immunity frames
        this.invulnerableTimer = 0;

        if (imgSrc) {
            this.img = new Image();
            this.img.src = imgSrc;
        } else {
            this.img = null;
        }
    }

    startDrag(mouseX, mouseY) {
        this.isDragging = true;
        this.startX = this.x + this.width / 2;
        this.startY = this.y + this.height / 2;
    }

    drag(mouseX, mouseY) {
        this.endX = mouseX;
        this.endY = mouseY;
    }

    endDrag(mouseX, mouseY) {
        // Calculate velocity based on the distance and direction from mouse to square
        let dx = mouseX - (this.x + this.width/2);  // Reversed the subtraction order
        let dy = mouseY - (this.y + this.height/2);  // Reversed the subtraction order
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        this.vx = (dx / distance) * Math.min(distance/10, 20);
        this.vy = (dy / distance) * Math.min(distance/10, 20);
        this.isDragging = false;
    }

    update(canvas) {
        if (!this.isDragging) {
            this.x += this.vx;
            this.y += this.vy;
    
            this.vx *= 0.98;
            this.vy *= 0.98;
    
            // Collision detection with canvas boundaries
            if (this.x < 20) { // Add wall thickness
                this.x = 20;
                this.vx = -this.vx * 0.8;
                if (bounceSound) bounceSound.play();
            }
            if (this.x + this.width > canvas.width - 20) {
                this.x = canvas.width - this.width - 20;
                this.vx = -this.vx * 0.8;
                if (bounceSound) bounceSound.play();
            }
            if (this.y < 20) {
                this.y = 20;
                this.vy = -this.vy * 0.8;
                if (bounceSound) bounceSound.play();
            }
            if (this.y + this.height > canvas.height - 20) {
                this.y = canvas.height - this.height - 20;
                this.vy = -this.vy * 0.8;
                if (bounceSound) bounceSound.play();
            }
            
            // Add rotation based on velocity
            this.rotation += Math.sqrt(this.vx * this.vx + this.vy * this.vy) * 0.05;
            this.rotation = this.rotation % (Math.PI * 2);
        }

        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }

    draw(ctx) {
        if (this.isDragging) {
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.strokeStyle = 'white';
            ctx.moveTo(this.startX, this.startY);
            ctx.lineTo(this.endX, this.endY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        if (this.invulnerable && this.isPlayer) {
            ctx.globalAlpha = 0.5;
        }
        if (this.img && this.img.complete && this.img.naturalWidth !== 0) {
            ctx.save();
            //  Added this so it looks more like a ball
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            // Rotate
            ctx.rotate(this.rotation);
            // Draw image centered
            ctx.drawImage(this.img, -this.width/2, -this.height/2, this.width, this.height);
            ctx.restore();
        } else {
            ctx.fillStyle = 'gray'; // This was the pre texture function
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.globalAlpha = 1.0;

        // Draw HP bar for both player and enemies
        const barWidth = this.width;
        const barHeight = 5;
        const barY = this.y - 15;

        // Background bar
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, barY, barWidth, barHeight);

        // Health bar
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, barY, barWidth * (this.health / this.maxHealth), barHeight);
    }

    takeDamage() {
        if (!this.invulnerable && !this.isPlayer) { // Player doesn't take damage from collisions
            this.health--;
            this.invulnerable = true;
            this.invulnerableTimer = 60; // 1 second at 60fps
        }
    }

    collidesWith(other) {
        // Basic collision check
        if (!(this.x < other.x + other.width &&
              this.x + this.width > other.x &&
              this.y < other.y + other.height &&
              this.y + this.height > other.y)) {
            return false;
        }

        // If it's a player-enemy collision, check velocity
        if (this.isPlayer && other instanceof Enemy) {
            // Player damages enemy on collision
            other.takeDamage();

            // Apply physics: player has more weight
            other.vx = this.vx * 1.5;
            other.vy = this.vy * 1.5;
            this.vx *= 0.7;
            this.vy *= 0.7;

            return true;
        }

        // Regular collision response
        const overlapX = Math.min(
            this.x + this.width - other.x,
            other.x + other.width - this.x
        );
        const overlapY = Math.min(
            this.y + this.height - other.y,
            other.y + other.height - this.y
        );

        // Determine collision side
        if (overlapX < overlapY) {
            // Horizontal collision
            if (this.x < other.x) {
                this.x = other.x - this.width;
            } else {
                this.x = other.x + other.width;
            }
            this.vx = -this.vx * 0.8;
        } else {
            // Vertical collision
            if (this.y < other.y) {
                this.y = other.y - this.height;
            } else {
                this.y = other.y + other.height;
            }
            this.vy = -this.vy * 0.8;
        }

        return true;
    }
}