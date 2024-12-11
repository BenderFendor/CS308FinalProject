
const GAME_CONFIG = {
    // Audio configuration
    audio: {
        files: {
            bgMusic: 'bgmusic.mp3',
            bounce: 'bounce.mp3',
            score: 'score.wav',
            wind: 'windnoise.wav',
            gameOver: 'gameover.wav'
        },
        defaultVolume: 0.5,
        musicVolume: 0.3
    },

    // Phase configurations
    phases: {
        earth: {
            baseHealth: 1,
            baseSpeed: 1,
            color: '#4a8505',
            bossHealth: 5,
            background: 'earthbackground.jpg',
            attacks: ['groundSlam', 'rockThrow']
        },
        solar: {
            baseHealth: 2,
            baseSpeed: 1.2,
            color: '#ffa726',
            bossHealth: 10,
            background: 'spacebackground.png',
            attacks: ['solarFlare', 'heatWave']
        },
        blackhole: {
            baseHealth: 5,
            baseSpeed: 1.5,
            color: '#4a148c',
            bossHealth: 15,
            background: 'spacebackground.png',
            attacks: ['gravityPull', 'voidBlast']
        }
    },

    // Upgrade configurations
    upgrades: {
        stats: [
            {
                type: 'stat',
                name: 'Health Boost',
                description: 'Health Increase',
                category: 'health',
                minModifier: 1.1,
                maxModifier: 1.5
            },
            {
                type: 'stat',
                name: 'Speed Boost',
                description: 'Speed Increase',
                category: 'speed',
                minModifier: 1.1,
                maxModifier: 1.5
            },
            {
                type: 'stat',
                name: 'Power Boost',
                description: 'Damage Increase',
                category: 'damage',
                minModifier: 1.1,
                maxModifier: 1.5
            }
        ],
        abilities: [
            {
                type: 'ability',
                name: 'Temporary God Mode',
                description: '5 Second Invincibility',
                effectName: 'temporaryInvulnerability',
                duration: 5000
            },
            {
                type: 'ability',
                name: 'Projectile Shield',
                description: '8 Second Reflection Field',
                effectName: 'projectileReflection',
                duration: 8000
            },
            {
                type: 'ability',
                name: 'Mass Stun',
                description: '3 Second Enemy Freeze',
                effectName: 'enemyStunning',
                duration: 3000
            }
        ]
    },

    // Game settings
    settings: {
        player: {
            initialHealth: 20,
            maxHealth: 50,
            size: 70,
            speed: 2,
            damage: 1
        },
        waves: {
            baseEnemyCount: 3,
            maxEnemies: 8,
            bossWaveInterval: 4,
            chestSpawnChance: 0.5
        },
        difficulty: {
            baseIncrease: 0.1,
            speedMultiplier: 0.1
        }
    }
};