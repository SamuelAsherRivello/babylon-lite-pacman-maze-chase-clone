# Arcade Presentation

## Purpose

Present the entire original neon maze in a readable landscape cabinet with accessible browser controls, responsive sizing, audio, and recoverable play states.

## ADDED Requirements

### Requirement: Landscape arcade presentation
The game SHALL show the entire landscape maze with black background, neon-blue walls, white pellets, yellow player, four differentiated enemy silhouettes, flat pixel-inspired art, and a high-contrast HUD. Desktop and narrow mobile layouts SHALL fit the board and controls without cropping or overlap.

#### Scenario: Narrow viewport
- **WHEN** the browser is resized to a narrow mobile viewport
- **THEN** the complete landscape board scales to fit and touch controls remain visible below it.

### Requirement: Input and pause
The game SHALL support arrows/WASD, directional touch controls, Enter start/restart, P/Escape pause/resume, and visible pause/mute controls. Focus loss SHALL pause play. Pause SHALL freeze timers and resume SHALL clear stale movement input. Gameplay keys SHALL not scroll the page.

#### Scenario: Focus loss
- **WHEN** the browser loses focus during a power effect
- **THEN** play pauses and power duration stays unchanged until explicit resume.

### Requirement: Audio persistence and states
The game SHALL provide title, ready, playing, paused, board-clear, game-over, and victory states; score/best/lives/board displays; and original synthesized cues that start after user interaction. Best score SHALL persist when browser storage is available and failures SHALL not interrupt play.

#### Scenario: Storage unavailable
- **WHEN** saving the best score fails
- **THEN** the game continues and displays the best score for the current session.

### Requirement: Graphics recovery
The game SHALL report graphics initialization failure and unavailable WebGPU with readable guidance and a retry action.

#### Scenario: Unsupported browser
- **WHEN** no usable WebGPU device is available
- **THEN** the user sees an explanation and retry action instead of a blank screen.
