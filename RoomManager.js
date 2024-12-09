class RoomManager {
    constructor() {
        // Room template definitions
        this.roomTemplates = {
            test: {
                width: 800,
                height: 600,
                enemyCount: 3,
                chestCount: 1,
                wallThickness: 20,
                padding: 40,
                backgroundColor: '#222',
                enemyType: 'basic'
            },
            earth: {
                width: 800,
                height: 600,
                enemyCount: 3,
                chestCount: 1,
                wallThickness: 20,
                padding: 40,
                backgroundColor: '#113355',
                backgroundImage: 'images/earth_background.png',
                enemyType: 'earth'
            },
            solar: {
                width: 1000,
                height: 800,
                enemyCount: 5,
                chestCount: 2,
                wallThickness: 20,
                padding: 50,
                backgroundColor: '#221144',
                backgroundImage: 'images/solar_background.png',
                enemyType: 'solar'
            },
            blackhole: {
                width: 1200,
                height: 1000,
                enemyCount: 7,
                chestCount: 3,
                wallThickness: 20,
                padding: 60,
                backgroundColor: '#000000',
                backgroundImage: 'images/blackhole_background.png',
                enemyType: 'blackhole'
            }
        };

        // Add debug mode
        this.debug = false;
    }

    generateRoom(type) {
        let template = this.roomTemplates[type];
        if (!template) {
            console.error(`Room template '${type}' not found, falling back to test template`);
            template = this.roomTemplates['test'];
        }

        // Create base room object with boundary and rendering layers
        const room = {
            width: template.width,
            height: template.height,
            enemies: [],
            chests: [],
            cleared: false,
            
            // Create room boundary
            boundary: new RoomBoundary(
                -template.width/2,  // Center the room around 0,0
                -template.height/2,
                template.width,
                template.height
            ),
            
            layers: {
                background: template.backgroundColor || '#222',
                walls: '#444',
                entities: []
            },
            
            // Create collision walls at the boundary edges
            walls: this.createBoundaryWalls(template),
            
            draw: function(ctx) {
                // Draw background
                ctx.save();
                ctx.fillStyle = this.layers.background;
                ctx.fillRect(
                    this.boundary.x,
                    this.boundary.y,
                    this.boundary.width,
                    this.boundary.height
                );

                // Draw boundary if debug mode is on
                if (this.boundary.debug) {
                    this.boundary.draw(ctx);
                }
                
                // Draw walls
                ctx.fillStyle = this.layers.walls;
                this.walls.forEach(wall => wall.draw(ctx));
                
                // Sort and draw entities
                this.layers.entities = [
                    ...this.chests.filter(chest => !chest.shouldRemove),
                    ...this.enemies.filter(enemy => enemy.active)
                ].sort((a, b) => a.y - b.y);
                
                this.layers.entities.forEach(entity => entity.draw(ctx));
                
                ctx.restore();
            }
        };

        console.log(`Generated room of type ${type} with dimensions:`, {
            x: room.boundary.x,
            y: room.boundary.y,
            width: room.boundary.width,
            height: room.boundary.height
        });

        // Spawn entities within boundary
        this.spawnEnemies(room, template);
        this.spawnChests(room, template);

        return room;
    }

    createBoundaryWalls(template) {
        const thickness = template.wallThickness;
        const x = -template.width/2;
        const y = -template.height/2;
        const width = template.width;
        const height = template.height;

        return [
            // Top wall
            new Wall(x, y, width, thickness),
            // Bottom wall
            new Wall(x, y + height - thickness, width, thickness),
            // Left wall
            new Wall(x, y, thickness, height),
            // Right wall
            new Wall(x + width - thickness, y, thickness, height)
        ];
    }

    spawnEnemies(room, template) {
        room.enemies = [];
        const boundary = room.boundary;
        const padding = template.padding;
        
        // Generate spawn positions within boundary
        const safePositions = [];
        const gridSize = 50;
        
        for (let x = boundary.x + padding; x < boundary.x + boundary.width - padding; x += gridSize) {
            for (let y = boundary.y + padding; y < boundary.y + boundary.height - padding; y += gridSize) {
                // Check minimum distance from center (where player spawns)
                const dx = x - boundary.x - boundary.width/2;
                const dy = y - boundary.y - boundary.height/2;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance >= 150) { // Minimum safe distance from player
                    safePositions.push({x, y});
                }
            }
        }

        // Shuffle and spawn enemies
        this.shuffleArray(safePositions);
        for (let i = 0; i < Math.min(template.enemyCount, safePositions.length); i++) {
            const pos = safePositions[i];
            const enemy = new Enemy(pos.x, pos.y, 40, 40, template.enemyType);
            if (this.debug) {
                enemy.debug = true;
                console.log(`Spawned enemy at:`, pos);
            }
            room.enemies.push(enemy);
        }
    }

    spawnChests(room, template) {
        room.chests = [];
        const boundary = room.boundary;
        
        // Spawn chest in center of room
        const chest = new Chest(
            boundary.x + boundary.width/2 - 20,
            boundary.y + boundary.height/2 - 20
        );
        
        if (this.debug) {
            chest.debug = true;
            console.log(`Spawned chest at:`, {
                x: chest.x,
                y: chest.y
            });
        }
        
        room.chests.push(chest);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    toggleDebug() {
        this.debug = !this.debug;
        console.log('Room Manager debug mode:', this.debug ? 'enabled' : 'disabled');
    }
}