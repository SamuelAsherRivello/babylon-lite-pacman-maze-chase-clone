# Sources and original assets

- Required template: SamuelAsherRivello/github-repository-template, main revision `497d9e911cfcb04c9d20134ae3001a75d8a8ac15`.
- Shared skill library: SamuelAsherRivello/ai-skills-library, master revision `e5a3298eaa4f824008b425c497118e90ce4bf9b2`.
- GitHub template generation created the new repository with a single `Initial commit`; its generated history was preserved. The template checklist's alternate copy/empty-repository flow was superseded by the game skill's required template-generation flow.
- `project-name/` remains the application root as required by AGENTS.md, overriding the checklist's rename suggestion.
- All library skills were imported as physical files where absent. Existing template OpenSpec skills were retained rather than overwriting bundled 1.13.1 generated instructions. Shared nongenerated OpenSpec utilities are retained with their source metadata.
- Pixel Walker's README was inspected for the original-prompt details-block presentation. Its renderer and installed Babylon Lite README were inspected for supported APIs; no gameplay or artwork was copied.
- Public reference links: https://www.pacman.com/ and https://en.wikipedia.org/wiki/Pac-Man, used for genre, pacing, and contrast only.
- Maze layouts, Nib's pixel polygon/tail design, Rivet/Blip/Flux/Ember silhouettes, circuit gutters, UI, and favicon are original code-native artwork. No AI raster image generation was needed for the flat pixel direction.
- Audio is synthesized from original square-wave note sequences in src/audio.js; no downloaded sound recordings.
- Documentation screenshots are captured from the running Babylon Lite game, never mockups.
- The inherited author banner is preserved for template attribution. The inherited demo screenshot was replaced with the actual game.

# Verification boundaries

Rule tests exercise deterministic simulation and all three original boards. Browser tests use real keyboard/pointer/touch emulation for controls and controlled development-only fixtures for capture, failure, progression, and replay. The full path sweep disables pursuing enemies to isolate legal movement and complete pellet traversal; it does not prove that every human play style wins. Enemy behavior, release, return, speed, and collisions are independently tested.

Screenshots verify 1440×900 desktop, 390×844 portrait mobile, and 844×390 landscape mobile. Physical mobile hardware and perceived speaker audio quality were not tested. Browser audio activation/mute and emulated touch were tested. WebGPU-capable Chrome/Edge with hardware acceleration is required; unavailable graphics and storage have explicit recovery/fallback coverage.
