// Shared utilities — underscore prefix means Vercel won't expose this as a route
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// ── CORS ──────────────────────────────────────────────────────────
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Returns true if this was a preflight (caller should return immediately)
function preflight(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

// ── Supabase (service key — bypasses RLS) ─────────────────────────
function db() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );
}

// ── JWT ───────────────────────────────────────────────────────────
function sign(payload, exp = '8h') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: exp });
}

function verifyToken(req) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) { return null; }
}

function verifyOwner(req) {
  const p = verifyToken(req);
  return p?.role === 'owner';
}

function verifyTenant(req) {
  const p = verifyToken(req);
  return p?.role === 'tenant' ? p : null;
}

// ── Helpers ───────────────────────────────────────────────────────
const genGate   = () => String(Math.floor(1000 + Math.random() * 9000));
const genUnitId = (key) => {
  const pre = key === 'rv' ? 'RV' : key === 'container' ? 'CT'
    : ['A','B','C','D'][Math.floor(Math.random() * 4)];
  return pre + (Math.floor(Math.random() * 89) + 10);
};

module.exports = { cors, preflight, db, sign, verifyToken, verifyOwner, verifyTenant, genGate, genUnitId };
