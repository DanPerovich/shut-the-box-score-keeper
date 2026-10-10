# Shut the Box Score Keeper

Offline-first PWA for keeping score in Shut the Box with real dice. Tap tiles on an animated board, track multiple players across rounds, and install to your phone’s home screen.

## Features

- 2–8 players, editable names
- Board size 1–6 through 1–12 (default 1–12)
- Fixed rounds (default 1); lower total wins
- Skip a player mid-round (they must still play before the round ends)
- Remove a player mid-game
- Undo / reset board; one-tap end turn; edit scores later
- Optional dice-total validation (+ optional 1-die-when-sum≤6 rule)
- Themes (walnut, slate, carnival, nautical) with random default
- Autosave in-progress game; full offline after first load

## Develop

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
npm run preview
```

## Live

https://danperovich.github.io/shut-the-box-score-keeper/

Pushes to `main` deploy via GitHub Actions → GitHub Pages.

## Install on a phone

1. Open the live URL (or `npm run preview` on your LAN).
2. **iOS Safari:** Share → Add to Home Screen  
3. **Android Chrome:** Menu → Install app / Add to Home Screen
