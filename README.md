# SOLMARA — Streets of the Sun

[![make.fun](https://make.fun/badge.svg)](https://make.fun/bounty/gta6-01)

An original 2D top-down open-world crime game, built for the make.fun **gta6-01**
competition ("Make GTA 6"). Everything — city, characters, story, art, sound —
is original. Nothing from Rockstar Games.

You are **Dario Reyes**, back in Solmara. **Mama Rosa** has five jobs for you:
steal a car, run the bank, collect a hotel debt, deliver at the docks, and escape
to the beach. Drive, steal cars, dodge traffic and pedestrians, earn wanted
stars, outrun the police, punch and shoot your way through.

## Play

Open `game/index.html` in a desktop browser — no server, no network, no install.

- **WASD / Arrows** — move on foot, drive when in a car
- **E** — steal / enter a car, step out
- **F** — punch, **Space** — shoot, **Shift** — sprint
- **Enter** — start / continue, **P / Esc** — pause, **R** — restart, **M** — mute

Progress saves to localStorage. The city is 3600×3600 with an 8×8 road grid,
a park, a beach, docks, traffic, pedestrians, police pursuit and a HUD with a
minimap.

## Structure

14 modules under `game/src/`: `config`, `random`, `input`, `audio`, `city`,
`traffic`, `police`, `missions`, `player`, `world`, `render`, `shots`, `save`,
`main`. Sound is synthesized with WebAudio — no audio files.

## License

MIT — see [LICENSE](LICENSE).
