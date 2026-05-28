const clients = new Map();

export function registerClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
}

export function removeClient(userId, res) {
  clients.get(userId)?.delete(res);
  if (clients.get(userId)?.size === 0) clients.delete(userId);
}

export function pushAchievements(userId, achievements) {
  if (!achievements?.length) return;
  const payload = JSON.stringify(achievements);
  const chunk = `event: achievements\ndata: ${payload}\n\n`;
  for (const res of clients.get(userId) ?? []) {
    res.write(chunk);
    if (typeof res.flush === 'function') res.flush();
  }
}