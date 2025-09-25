import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getConn } from '../db/pool.js';

// REGISTER
export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const conn = await getConn();
    const existing = await conn.query('SELECT id FROM users WHERE email=?', [email]);
    if (existing.length) { conn.release(); return res.status(409).json({ error: 'Email already taken' }); }

    const hash = await bcrypt.hash(password, 10);
    const result = await conn.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash]);
    conn.release();
    res.status(201).json({ id: Number(result.insertId), email });
  } catch (err) { next(err); }
};

// LOGIN
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const conn = await getConn();
    const rows = await conn.query('SELECT * FROM users WHERE email=?', [email]);
    conn.release();

    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // include role; require JWT_SECRET to be set
    const token = jwt.sign(
      { sub: Number(user.id), role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ id: Number(user.id), email: user.email, token });
  } catch (err) { next(err); }
};
