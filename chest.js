class Chest extends Square {
    constructor(x, y) {
        super(x, y, 40, 40, 'chest.png');
        this.isOpen = false;
        this.loot = null;
        this.shouldRemove = false; // Add removal flag
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
            this.generateLoot(); // Generate loot first
            
            const dialogElement = document.createElement('div');
            dialogElement.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                padding: 20px;
                border: 2px solid gold;
                color: white;
                z-index: 1000;
            `;
            
            const lootType = this.loot.value > 1 ? 'buff' : 'debuff';
            dialogElement.innerHTML = `
                <h2>Mysterious Chest</h2>
                <p>${this.getHint()}</p>
                <button>Open chest?</button>
            `;
            
            document.body.appendChild(dialogElement);
            isGamePaused = true;
            
            // Apply upgrade when dialog is closed
            dialogElement.querySelector('button').onclick = () => {
                this.applyUpgrade(player);
                dialogElement.innerHTML = `<P>You found a ${this.loot.type} buff with value ${this.loot.value}!</p>`;
                setTimeout(() => {
                    dialogElement.remove();
                    isGamePaused = false;
                    this.shouldRemove = true; // Mark chest for removal
                    // Remove chest from room's chest array
                    currentRoom.chests = currentRoom.chests.filter(c => !c.shouldRemove);
                }, 1000);
            };
        }
    }

    getHint() {
        const hints = {
            health: "A healing aura emanates from within...",
            speed: "The chest seems to vibrate with kinetic energy...",
            size: "A transformative power lurks inside..."
        };
        return hints[this.loot.type] || "An aura surrounds the chest...";
    }

    applyUpgrade(player) {
        this.generateLoot();
        // Apply loot effect to player
        switch (this.loot.type) {
            case 'health':
                player.health += this.loot.value;
                break;
            case 'speed':
                player.speed *= this.loot.value;
                player.speed *= this.loot.value;
                break;
            case 'size':
                player.width *= this.loot.value;
                player.height *= this.loot.value;
                break;
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