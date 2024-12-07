class Chest extends Square {
    constructor(x, y) {
        super(x, y, 40, 40, 'path/to/chest-image.png');
        this.isOpen = false;
        this.loot = null;
    }

    generateLoot() {
        const lootTable = [
            { type: 'health', value: 1 },
            { type: 'speed', value: 1.2 },
            { type: 'size', value: 1.2 }
        ];
        this.loot = lootTable[Math.floor(Math.random() * lootTable.length)];
    }

    open(player) {
        if (!this.isOpen) {
            this.isOpen = true;
            this.generateLoot();
            // Apply loot effect to player
            switch (this.loot.type) {
                case 'health':
                    player.health += this.loot.value;
                    break;
                case 'speed':
                    player.vx *= this.loot.value;
                    player.vy *= this.loot.value;
                    break;
                case 'size':
                    player.width *= this.loot.value;
                    player.height *= this.loot.value;
                    break;
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.isOpen ? '#964B00' : '#FFD700'; // Gold when closed, brown when open
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw lock/keyhole
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}