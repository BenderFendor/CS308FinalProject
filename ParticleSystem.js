class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    addHitParticle(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    addDamageNumber(x, y, damage) {
        this.particles.push(new DamageNumber(x, y, damage));
    }

    update() {
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => p.update());
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
        this.vx *= 0.95;
        this.vy *= 0.95;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
        ctx.fillRect(this.x, this.y, 4, 4);
    }
}

class DamageNumber {
    constructor(x, y, damage) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.life = 1.0;
    }

    update() {
        this.y -= 1; // Move upward
        this.life -= 0.02;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255,255,255, ${this.life})`;
        ctx.font = '20px Arial';
        ctx.fillText(this.damage, this.x, this.y);
    }
}