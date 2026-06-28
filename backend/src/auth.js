import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ JWT_SECRET no definido en producción. Saliendo.');
    process.exit(1);
  }
  console.warn('⚠️  JWT_SECRET no definido — usando secreto de desarrollo. No usar en producción.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES = '30d';

export function hashPassword(pw) {
  return bcrypt.hashSync(String(pw), 10);
}

export function verifyPassword(pw, hash) {
  return bcrypt.compareSync(String(pw), hash);
}

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
