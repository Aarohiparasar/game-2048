# 2048 – React + Node (Full‑Stack)

Play the classic 2048 with smooth animations, swipe/drag controls, and a responsive UI.

- **Live Demo**: https://game-2048-git-main-aarohi-singhs-projects.vercel.app/
- **Frontend**: React (Vite) in `frontend/`
- **Backend**: Node.js + Express in `backend/`

## Features

- **Responsive UI**: Scales for desktop, tablet, and mobile. Board auto-sizes to fit viewport.
- **Controls**: Keyboard (Arrows/WASD), swipe/drag gestures, and Restart.
- **Game States**: Win and Game Over colorful modals; score tracking; dynamic hints.
- **Board Sizes**: Selectable grid sizes. Defaults to 4×4.
- **Server‑side Logic**: All merges and spawning handled on the backend for consistent state.

## Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **Styling**: CSS modules and custom styles

## Project Structure

```
project1/
├─ backend/
│  ├─ game.js          # Pure 2048 game logic (initialize, move, slide, etc.)
│  └─ server.js        # Express API (start/move/restart)
├─ frontend/
│  ├─ src/
│  │  ├─ components/   # Board, Tile, Controls, styles
│  │  ├─ api.js        # API client using VITE_API_BASE_URL
│  │  └─ App.jsx       # Main app
│  └─ .env             # Vite envs (e.g., VITE_API_BASE_URL)
└─ README.md
```

## API Endpoints

Base path: `/api/game`

- `POST /start`

- `POST /move`

- `POST /restart`
 

## Controls & UX

- **Keyboard**: Arrow keys or WASD
- **Swipe/Drag**: Pointer/touch gestures on the board
- **Restart**: Dedicated button (fixed position, no layout shift)
- **Hints**: Transient messages while moving
