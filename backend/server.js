import express from 'express';
import cors from 'cors';
import { initializeBoard, move as gameMove } from './game.js';

const app = express();

const PORT = process.env.PORT || 5001;

const gameStateStore = {}; 

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.post('/api/game/start', (req, res) => {
  try {
    const { size, userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const board = initializeBoard(Number(size) || 4);

    gameStateStore[userId] = {
      board,
      score: 0,
      gameOver: false,
      won: false,
      size: Number(size) || 4,
    };

    res.json(gameStateStore[userId]);
  } catch (err) {
    console.error('Error in /api/game/start:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Move
app.post('/api/game/move', (req, res) => {
  try {
    const { userId, direction } = req.body;
    if (!userId || !gameStateStore[userId])
      return res.status(400).json({ error: 'Invalid userId' });

    const state = gameStateStore[userId];
    const result = gameMove(state.board, direction);

    gameStateStore[userId] = {
      ...state,
      board: result.board,
      score: state.score + result.scoreDelta,
      gameOver: result.gameOver,
      won: result.won,
    };

    res.json({ ...gameStateStore[userId], moved: result.moved });
  } catch (err) {
    console.error('Error in /api/game/move:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Restart
app.post('/api/game/restart', (req, res) => {
  try {
    const { userId, size } = req.body;
    if (!userId) return res.status(400).json({ error: 'Invalid userId' });

    const board = initializeBoard(Number(size) || 4);
    gameStateStore[userId] = {
      board,
      score: 0,
      gameOver: false,
      won: false,
      size: Number(size) || 4,
    };

    res.json(gameStateStore[userId]);
  } catch (err) {
    console.error('Error in /api/game/restart:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
