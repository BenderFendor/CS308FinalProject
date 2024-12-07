# Final Project: Roguelike Bounce Game

## Overview
Building upon the drag bounce mechanics from Project 3, creating a dungeon-crawler with roguelike elements.

## Core Features
- Settings menu with volume control and pause functionality
- High score system using JSON
- Upgrade/debuff system
- Skip-able intro animation about Earth's destruction

## Gameplay Design
### Dungeon Mechanics
- Procedurally generated rooms
- Three zones, each with unique elemental themes:
    1. Earth
    2. Solar
    3. Gravity/Black Hole (final zone)
- Three rooms per zone, one containing a chest
- Final boss: Black Hole entity

### Combat System
- Player bounces on enemies to defeat them
- Enemies shoot projectiles
- Player starts with 5 hearts
- 3-4 basic enemy types
- 3-4 unique boss encounters

### Upgrade System
- Random chest encounters
- Warning system before chest opening
- Possible upgrade/debuff hints
- Upgrades obtained during runs

## Technical Requirements
- Maintain 60 FPS performance
- FPS counter implementation
- Off-screen asset optimization
- Full screen support
- Custom button sprites

## Development Stages
### Stage 1: Core Mechanics
- Single test room implementation
- Player Logic
    - Player has a HP bar that shows above his head
    - Player isn't damage from colliding with the enemies
- Basic enemy AI
    - Enemy shot at you and they themselves can't hurt you just have collisions with you
    - have it so each enemy is randomized in size and speed and moves a little different
    - You have to dodge their bullets and you damage them by hitting them / colliding.
    - They have a base HP of 3 and have a HP bar above them.
    - Each element would have a different attack
    - They have 3 attacks
    - Basic shot 
        - that shoots one little projectile this is like the move they use 70% of the time
    - Slow but damaging shot 
        - bigger projectile that is used 20% of the time
    - AOE move 
        - big damaging move but it has a charge up so like the enemy will wobble and like flash idk which color but it will flash and then do the move after like half a second so you can dodge they also stop moving
    - Shooting Logic
        - Define shooting intervals for each type of attack
        - Use timers to manage intervals between shots
        - Check conditions such as player's position and enemy's state
        - Add randomness to shooting intervals
        - Implement cooldowns to prevent continuous shooting
        
- Chest mechanics
    - When you collide with a chest it pauses the game and you get a pop up asking if you what an upgrade and gives you a hint of the type
    - The upgrade could be a debuff or buff the hint is only for the type of upgrade
- Physics system testing
    - The player should have more weight then the enemies like if the player collides with an enemy the enemy goes farther then the player
- Core gameplay loop

### Stage 2: Generation
- Room generation system
- Performance optimization
- Tutorial research and implementation

### Stage 3: Polish
- UI implementation
- Sprite work
- Final adjustments