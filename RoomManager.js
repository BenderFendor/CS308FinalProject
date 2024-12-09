class RoomManager {
    constructor() {
        this.roomTemplates = {
            test: {
                width: 800,
                height: 600,
                enemyCount: 3,
                chestCount: 1,
                wallThickness: 20
            }
        };
    }

    generateRoom(type) {
        const template = this.roomTemplates[type];
        const room = {
            width: template.width,
            height: template.height,
            enemies: [],
            chests: [],
            cleared: false,
            walls: [
                new Square(0, 0, template.width, template.wallThickness), // Top
                new Square(0, template.height - template.wallThickness, template.width, template.wallThickness), // Bottom
                new Square(0, 0, template.wallThickness, template.height), // Left
                new Square(template.width - template.wallThickness, 0, template.wallThickness, template.height) // Right
            ],
            draw: function(ctx) {
                // Draw background
                ctx.fillStyle = '#222';
                ctx.fillRect(0, 0, this.width, this.height);
                
                // Draw walls
                ctx.fillStyle = '#444';
                this.walls.forEach(wall => {
                    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
                });
                
                // Draw entities
                this.enemies.forEach(enemy => enemy.draw(ctx));
                this.chests.forEach(chest => chest.draw(ctx));
            }
        };

        // Spawn enemies in different quadrants to prevent clustering
        const quadrants = [
            { x: 0.25, y: 0.25 },
            { x: 0.75, y: 0.25 },
            { x: 0.25, y: 0.75 }
        ];

        for (let i = 0; i < template.enemyCount; i++) {
            const quadrant = quadrants[i];
            const enemy = this.spawnEnemy(room, quadrant);
            room.enemies.push(enemy);
        }

        // Add chest in the center
        const chest = new Chest(
            room.width * 0.5,
            room.height * 0.5
        );
        room.chests.push(chest);

        return room;
    }

    spawnEnemy(room, quadrant) {
        const padding = room.walls[0].height * 2;
        const availableWidth = room.width - padding * 2;
        const availableHeight = room.height - padding * 2;
        
        const x = padding + (availableWidth * quadrant.x);
        const y = padding + (availableHeight * quadrant.y);
        
        return new Enemy(x, y, 40, 40);
    }
}