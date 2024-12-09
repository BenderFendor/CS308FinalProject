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
        this.speed = 1
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
            // Store last valid position before movement
            this.lastValidX = this.x;
            this.lastValidY = this.y;

            // Apply movement
            this.x += this.vx;
            this.y += this.vy;
            
            // Apply friction
            this.vx *= 0.98;
            this.vy *= 0.98;

            this.colliding = false;
            
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

        // Add debug visualization
        if (this.debug) {
            // Draw velocity vector
            ctx.beginPath();
            ctx.strokeStyle = 'yellow';
            ctx.moveTo(this.x + this.width/2, this.y + this.height/2);
            ctx.lineTo(this.x + this.width/2 + this.vx * 10, 
                      this.y + this.height/2 + this.vy * 10);
            ctx.stroke();

            // Draw collision box
            ctx.strokeStyle = this.colliding ? 'red' : 'lime';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    takeDamage(amount) {
        if (!this.invulnerable) {
            this.health -= amount;
            this.invulnerable = true;
            this.invulnerableTimer = 60; // 1 second immunity
            
            // Handle game over if player dies
            if (this.isPlayer && this.health <= 0) {
                gameOver();
            }

            // Flash effect when hit
            if (this.isPlayer) {
                camera.shake(5);
                particleSystem.addHitParticle(
                    this.x + this.width/2,
                    this.y + this.height/2,
                    "255,0,0"
                );
            }
        }
    }

    collidesWith(other) {
        // Check for collision with another object
        if (!(this.x < other.x + other.width &&
              this.x + this.width > other.x &&
              this.y < other.y + other.height &&
              this.y + this.height > other.y)) {
            return false;
        }

        // Calculate overlap on both axes
        const overlapX = (this.x + this.width / 2) - (other.x + other.width / 2);
        const overlapY = (this.y + this.height / 2) - (other.y + other.height / 2);
        const halfWidths = (this.width + other.width) / 2;
        const halfHeights = (this.height + other.height) / 2;

        // Determine collision side and adjust position and velocity
        if (Math.abs(overlapX) < halfWidths && Math.abs(overlapY) < halfHeights) {
            const offsetX = halfWidths - Math.abs(overlapX);
            const offsetY = halfHeights - Math.abs(overlapY);

            if (offsetX < offsetY) {
                // Horizontal collision
                if (overlapX > 0) {
                    this.x += offsetX;
                } else {
                    this.x -= offsetX;
                }
                this.vx = -this.vx * 0.8;
            } else {
                // Vertical collision
                if (overlapY > 0) {
                    this.y += offsetY;
                } else {
                    this.y -= offsetY;
                }
                this.vy = -this.vy * 0.8;
            }
        }

        // Adjust collision response based on masses
        const totalMass = this.mass + other.mass;
        const diffMass = this.mass - other.mass;
            
        const newVx = (this.vx * diffMass + 2 * other.mass * other.vx) / totalMass;
        const newVy = (this.vy * diffMass + 2 * other.mass * other.vy) / totalMass;

        this.vx = newVx * 0.8; // Dampen the velocity
        this.vy = newVy * 0.8;

        return true;
    }

    resolveCollision(other) {
        // Prevent handling multiple collisions in same frame
        if (this.isResolvingCollision) return;
        this.isResolvingCollision = true;

        console.log(`Collision: ${this.isPlayer ? 'Player' : 'Entity'} collided with`, 
                    other.constructor.name,
                    `at (${this.x}, ${this.y})`);

        // Log velocity changes
        const oldVx = this.vx;
        const oldVy = this.vy;

        // Handle wall collision with priority
        if (other instanceof Wall) {
            this.resolveWallCollision(other);
            this.isResolvingCollision = false;
            return;
        }

        // Calculate separation vector
        const dx = this.x + this.width/2 - (other.x + other.width/2);
        const dy = this.y + this.height/2 - (other.y + other.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) {
            this.isResolvingCollision = false;
            return;
        }

        // Normalize separation
        const nx = dx / distance;
        const ny = dy / distance;

        // Calculate minimum separation distance
        const minSeparation = (this.width + other.width) / 2;
        const separation = minSeparation - distance;

        // Separate objects
        const totalMass = this.mass + (other.mass || 1);
        const ratio1 = this.mass / totalMass;
        const ratio2 = (other.mass || 1) / totalMass;

        this.x += nx * separation * ratio2;
        this.y += ny * separation * ratio2;
        
        if (other.mass) { // Only move other object if it has mass
            other.x -= nx * separation * ratio1;
            other.y -= ny * separation * ratio1;
        }

        // Calculate new velocities
        const relativeVelocityX = this.vx - (other.vx || 0);
        const relativeVelocityY = this.vy - (other.vy || 0);
        const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;

        // Only bounce if objects are moving toward each other
        if (velocityAlongNormal > 0) {
            this.isResolvingCollision = false;
            return;
        }

        const restitution = 0.8; // Bounce factor
        const impulseMagnitude = -(1 + restitution) * velocityAlongNormal / 
                                ((1/this.mass) + (other.mass ? 1/other.mass : 0));

        // Apply impulse
        this.vx += impulseMagnitude * nx / this.mass;
        this.vy += impulseMagnitude * ny / this.mass;
        
        if (other.mass) {
            other.vx -= impulseMagnitude * nx / other.mass;
            other.vy -= impulseMagnitude * ny / other.mass;
        }

        // Apply minimum velocity threshold
        const minVelocity = 0.1;
        if (Math.abs(this.vx) < minVelocity) this.vx = 0;
        if (Math.abs(this.vy) < minVelocity) this.vy = 0;

        console.log('Velocity changed from:', 
                    `(${oldVx.toFixed(2)}, ${oldVy.toFixed(2)})`,
                    'to:',
                    `(${this.vx.toFixed(2)}, ${this.vy.toFixed(2)})`);

        this.isResolvingCollision = false;
    }

    resolveWallCollision(wall) {
        const overlapX = (this.width + wall.width) / 2 - 
                        Math.abs((this.x + this.width/2) - (wall.x + wall.width/2));
        const overlapY = (this.height + wall.height) / 2 - 
                        Math.abs((this.y + this.height/2) - (wall.y + wall.height/2));

        if (overlapX < overlapY) {
            this.x += overlapX * (this.x < wall.x ? -1 : 1);
            this.vx = -this.vx * 0.5;
        } else {
            this.y += overlapY * (this.y < wall.y ? -1 : 1);
            this.vy = -this.vy * 0.5;
        }
    }
}

class Wall {
    // Represents a wall that the player can collide with
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw(ctx) {
        // Draw the wall as a background element
        ctx.fillStyle = '#444'; // Dark gray color for walls
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    collidesWith(square) {
        // Check for collision with a Square object
        return !(
            this.x + this.width < square.x ||
            this.x > square.x + square.width ||
            this.y + this.height < square.y ||
            this.y > square.y + square.height
        );
    }
}