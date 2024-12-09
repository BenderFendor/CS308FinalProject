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
    - It has one chest
    - Three test enemies
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
        - Collision with chest triggers game pause
        - Dialog popup system for upgrade choice
        - Hint system for upgrade type
            - Hint doesn't type you if it is positive or negative
        - Random selection of buff/debuff
        - When you open the chest it shows you the debuff or buff you got as dialog on the screen as well
        - Effect categories:
            - Health modifiers
            - Speed adjustments
            - Attack changes
        - Visual feedback:
            - Chest open/closed states
            - Effect animations
            - UI state changes
        - Sound integration
        - Persistent state tracking
        - Remove the chest after it is opened
        - Chest doesn't remove enemies it has them in the same state as there where when the chest was opened
- Physics system testing
    - The player should have more weight then the enemies like if the player collides with an enemy the enemy goes farther then the player
- Core gameplay loop

#### Audio Framework
- Basic sound effects implementation
    - Player movement sounds
    - Enemy shooting sounds
    - Hit/damage feedback
    - Chest opening sound
    - Background music system

#### Visual Feedback
- Particle effects system
    - Hit particles
    - Damage numbers
    - Enemy death effects
    - Projectile trails
- Screen shake effects
    - On heavy hits
    - On AOE attacks
    - On chest opening

#### UI Elements
- Main HUD implementation
    - Player health display
    - Score counter
    - Current room indicator
- Pause menu
    - Basic options
    - Resume/quit functionality
- Debug overlay
    - FPS counter
    - Enemy count
    - Player stats




### Stage 2: Generation
- Room generation system
- Performance optimization
- Tutorial research and implementation

#### Game State Management
- Basic save system
    - Current health
    - Active upgrades
    - Room progress
- Scene transitions
    - Room transition effects
    - Loading screens

### Stage 3: Polish
- UI implementation
- Sprite work
- Final adjustments
- Add a start screen and it would have the sound play and it wouldn't need to be muted
- Screen boundaries
    - Player containment
    - Projectile cleanup
- Camera system
    - Basic follow
    - Screen shake integration
- Input buffer system
    - Smooth controls
    - Action queuing