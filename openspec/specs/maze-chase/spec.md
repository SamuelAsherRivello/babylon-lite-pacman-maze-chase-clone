# Maze Chase

## Purpose

Provide a fair, replayable arcade maze chase with responsive grid navigation, readable enemy behavior, and progression through three original boards.

## Requirements

### Requirement: Responsive navigation and valid mazes
The game SHALL provide three distinct connected mazes with loops and four power pellets each, buffered four-direction movement, immediate corridor reversal, and no wall clipping or frame-rate-dependent speed.

#### Scenario: Buffered turn
- **WHEN** a player requests a blocked turn before reaching a valid intersection
- **THEN** travel continues in the current direction and the requested turn occurs at that intersection.

#### Scenario: Complete reachable board
- **WHEN** a board begins
- **THEN** every collectible and actor spawn is reachable through legal corridors from the player spawn.

### Requirement: Collectibles and power scoring
The game SHALL award 10 points per standard pellet, 50 per power pellet, and capture bonuses of 200, 400, 800, and 1600. Power effects SHALL last six seconds; a new power pellet SHALL refresh duration and reset the multiplier. Each collectible SHALL score once.

#### Scenario: Refreshed power
- **WHEN** another power pellet is collected during an active effect
- **THEN** remaining power becomes six seconds and the next capture awards 200 points.

### Requirement: Enemy personalities and recovery
Four enemies SHALL respectively pursue, intercept, patrol, and roam. They SHALL follow legal corridors, release at staggered times, flee more slowly during power, and return home after capture before delayed re-entry. The final two power seconds SHALL have a visible warning.

#### Scenario: Enemy capture
- **WHEN** the powered player contacts an active enemy
- **THEN** the capture bonus is awarded once and that enemy returns home harmlessly.

### Requirement: Lives and progression
The game SHALL start with three lives, detect swept actor collisions, preserve collected pellets and score after losing exactly one life, and reset actors with a ready countdown and one-second visible protection. Final collectible completion SHALL take precedence over collision in the same step. Three completed boards SHALL end in victory; zero lives SHALL end in game over. Restart SHALL reset all round state.

#### Scenario: Board completion takes precedence
- **WHEN** the player collects the last pellet while also contacting a dangerous enemy
- **THEN** the board completes without losing a life.

#### Scenario: Restart after failure
- **WHEN** the player restarts from game over
- **THEN** board one begins with three lives, zero score, and all collectibles restored.
