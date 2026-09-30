# Delivery evidence

Published on 2026-09-30 after explicit user approval.

- [Play Neon Nibbler](https://samuelasherrivello.github.io/babylon-lite-pacman-maze-chase-clone/)
- [Release v0.0.3](https://github.com/SamuelAsherRivello/babylon-lite-pacman-maze-chase-clone/releases/tag/v0.0.3)
- [Successful release workflow](https://github.com/SamuelAsherRivello/babylon-lite-pacman-maze-chase-clone/actions/runs/36720806821)
- [Successful release deployment](https://github.com/SamuelAsherRivello/babylon-lite-pacman-maze-chase-clone/actions/runs/36721030911)
- Implementation commit: `0d8f0fa58d21ad1eb4d574ec888f2cc4db269de7`.
- Release commit and tag: `5e63b3aae73719995c632e2d38bc5f18ad999491` / `v0.0.3`.

## Verified behavior

Clean dependency installation, 18 simulation tests, seven Chromium WebGPU browser tests, and production build passed. Release and deployment workflows independently passed their required checks.

The actual public site initializes WebGPU, displays v0.0.3, and excludes the development test bridge. Keyboard movement earns points; pause freezes scoring and resumes; ordinary enemy collisions reach game over; replay restores zero score and three lives. Sound mute works. Emulated touch moves the player and releases the visual button state. The landscape maze and reachable directional pad fit both 844×390 and 390×844 phone viewports. No JavaScript errors, console errors, or HTTP error responses were observed. Public version.txt also reports 0.0.3.

The public desktop screenshot is `public-release.png`; it was visually inspected. Other documentation images show the title screen and both mobile orientations.

The accepted maze-chase and arcade-presentation requirements exactly match their change deltas and passed strict OpenSpec validation before archival. The completed change is archived under `openspec/changes/archive/2026-09-30-add-neon-nibbler/`.

## Verification boundaries

Physical phone hardware and perceived speaker quality were not tested. Browser audio activation and mute were tested. Full three-board traversal uses development-only fixtures with pursuing enemies held home; enemy behavior and collisions have separate tests. See `provenance.md` for asset sources and remaining boundaries.
