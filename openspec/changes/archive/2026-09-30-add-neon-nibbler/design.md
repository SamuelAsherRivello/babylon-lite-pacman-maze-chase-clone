# Design

## Context

See proposal.md. The fresh template uses Vite and contains no game implementation. Babylon Lite 1.25.0's dynamic-texture and sprite APIs are verified in the local Pixel Walker project. User follow-up requires landscape.

## Goals / Non-Goals

Goals: deterministic simulation, responsive controls, original crisp artwork, verifiable game states, and one complete browser release. Non-goals: multiplayer, copied assets, camera scrolling, or additional game modes.

## Decisions

- Use pure JavaScript simulation at 120 fixed steps per second with render interpolation. Moving actors have tile-edge progress; reversing exchanges edge endpoints. Swept relative-distance collisions prevent exchanged tiles passing through actors.
- Author each 29 by 17 layout as explicit corridor runs. Validate connectivity, boundaries, spawns, power counts, and unique layout signatures. Breadth-first distance maps make pursuers and returning actors choose legal paths; seeded randomness makes wandering reproducible.
- Use code-native artwork drawn to an offscreen canvas, uploaded to a nearest-filtered Babylon Lite dynamic texture and displayed through its orthographic sprite renderer. This keeps pixel edges and uses one draw call; a full 3D scene is unnecessary for a flat maze.
- Use accessible DOM controls and HUD around the canvas. Landscape board occupies the center; procedural circuit gutters and the four corner roles remain outside gameplay. Audio is short original Web Audio tones.
- Keep the template's project-name application root, as AGENTS.md requires. Remove React because no component framework is needed. Pin Babylon Lite and install Vite and Playwright for build/browser checks.
- Retain bundled OpenSpec overlaps, importing the remaining shared skills as physical files; source revisions are recorded in documentation. GitHub's template generation produces its own single initial commit and is used rather than rewriting history to change capitalization.
- Scope a development-only browser test bridge to Vite DEV and an explicit test query. Production exposes no test controls. Browser verification uses real controls for basic play and the bridge for deterministic transitions and an autonomous path sweep through full boards.

## Risks / Trade-offs

- WebGPU availability varies by device → clear retry screen and verify actual WebGPU operation; do not silently substitute engines.
- Landscape board is smaller on portrait phones → preserve full board and use large directional buttons below it.
- Tight simulation boundaries can skip pellets or collisions → fixed steps and tests for reversal, crossings, repeated collection, and final-pellet precedence.
- Synthesized audio differs across devices → verify mute and activation; physical touch/audio perception remains explicitly unverified without hardware.

## Migration Plan

Build and test locally, push game implementation, release via the template Actions workflow, deploy the exact release revision, verify the live build, then sync specs and archive the completed change. Normal commits preserve rollback history.
