import { Router } from 'express';
import { verifyToken } from '../../common/utils/tokenLogic.js';
import { registerClient, removeClient } from '../../common/sse.js';

const router = Router();

const ALLOWED_ORIGINS = ['http://localhost:5173', 'https://semsync.pages.dev'];

router.get('/stream', (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const token = req.query.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const userId = decoded.userId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write('event: connected\ndata: {}\n\n');
  if (typeof res.flush === 'function') res.flush();

  const heartbeat = setInterval(() => {
    res.write(':ping\n\n');
    if (typeof res.flush === 'function') res.flush();
  }, 25000);

  registerClient(userId, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(userId, res);
  });
});

export default router;