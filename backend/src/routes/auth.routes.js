import { Router } from 'express';
import { query, wrap } from '../db.js';
import { hashPassword, verifyPassword, signToken, authRequired } from '../auth.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple in-memory rate limiter for login — max 10 attempts per IP per minute.
const loginAttempts = new Map();
function loginRateLimit(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, reset: now + 60_000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000; }
  entry.count += 1;
  loginAttempts.set(ip, entry);
  if (entry.count > 10) return res.status(429).json({ error: 'Demasiados intentos. Espera un momento.' });
  next();
}

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, created_at: u.created_at };
}

router.post('/register', wrap(async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  if (!EMAIL_RE.test(String(email))) return res.status(400).json({ error: 'Email no válido' });
  if (String(password).length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  const normEmail = String(email).trim().toLowerCase();
  try {
    const inserted = await query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [normEmail, name ? String(name).trim() : null, hashPassword(password)]
    );
    const user = inserted.rows[0];
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ese email ya está registrado' });
    throw e;
  }
}));

router.post('/login', loginRateLimit, wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });

  const normEmail = String(email).trim().toLowerCase();
  const r = await query('SELECT * FROM users WHERE email = $1', [normEmail]);
  const user = r.rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', authRequired, wrap(async (req, res) => {
  const r = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const user = r.rows[0];
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user: publicUser(user) });
}));

export default router;
