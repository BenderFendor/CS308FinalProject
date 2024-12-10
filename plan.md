# Final Project: Simplified Roguelike Bounce Game

## Overview
Building upon drag bounce mechanics, creating a wave-based arena combat game with roguelike elements.

## Core Features
- Settings menu with volume control and pause functionality
- High score system using JSON
- Wave-based progression
- Difficulty scaling system
- Skip-able intro animation

## Gameplay Design
### Wave Mechanics
- Single large arena room
- Three enemy types with elemental themes:
    1. Earth
    2. Solar
    3. Black Hole
- Progressive waves with increasing difficulty
- Boss encounters after clearing element sets

### Combat System
- Player bounces on enemies to defeat them
- Enemies shoot projectiles
- Player starts with 5 hearts
- 2 basic enemy types per element
- 3 unique boss encounters

### Upgrade System
- Rewards after clearing waves
- Boss defeat bonuses
- Progressive difficulty increases
- Persistent upgrades during runs

## Technical Requirements
- Maintain 60 FPS performance
- FPS counter implementation
- Off-screen asset optimization
- Full screen support
- Custom button sprites

## Development Stages
### Stage 1: Core Mechanics
- Single arena implementation
- Wave spawning system
- Basic enemy AI with elemental variations
- Physics system testing
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
    - It just needs three rooms one earth one solar and one gravity
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

# Implementation Plan

## Earth Level
- Introduce basic gameplay mechanics.
- Enemies:
  - Type: earth
  - Health: 2
  - Speed: 1
- Background: Earth scenery.
- Objective: Defeat all enemies to proceed.

## Solar Level
- Increase difficulty with more enemies.
- Enemies:
  - Type: solar
  - Health: 3
  - Speed: 1.2
- Background: Solar system imagery.
- Objective: Collect chests and defeat enemies.

## Black Hole Level
- Highest difficulty with strongest enemies.
- Enemies:
  - Type: blackhole
  - Health: 5
  - Speed: 1.5
- Background: Black hole visuals.
- Objective: Survive and defeat all enemies.