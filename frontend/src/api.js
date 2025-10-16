const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/game`;

export async function startGame(userId, size = 4) {
  const res = await fetch(`${API_BASE}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, size }),
  });
  if (!res.ok) throw new Error('Failed to start game');
  return res.json();
}

export async function move(userId, direction) {
  const res = await fetch(`${API_BASE}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, direction }),
  });
  if (!res.ok) throw new Error('Failed to make move');
  return res.json();
}

export async function restart(userId, size) {
  const res = await fetch(`${API_BASE}/restart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, size }),
  });
  if (!res.ok) throw new Error('Failed to restart game');
  return res.json();
}
