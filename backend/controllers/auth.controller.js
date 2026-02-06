const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { memoryStore, newId } = require('../store/memory.store');

async function register(req, res) {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, message: 'name, email and password are required' });
  }

  const existing = memoryStore.users.find((u) => u.email === email);
  if (existing) {
    return res.status(409).json({ ok: false, message: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user';

  const user = {
    id: newId(),
    name: String(name),
    email: String(email),
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  memoryStore.users.push(user);

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });

  return res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: 'email and password are required' });
  }

  const user = memoryStore.users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ ok: false, message: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    return res.status(401).json({ ok: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });

  return res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

async function me(req, res) {
  const user = memoryStore.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ ok: false, message: 'User not found' });
  }
  return res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

module.exports = {
  register,
  login,
  me
};
