// POST /api/auth
// { type:'owner', passcode }  →  { token, role:'owner' }
// { type:'tenant', query }    →  { token, tenant }

const { preflight, db, sign } = require('./_lib');

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, passcode, query } = req.body || {};

  // ── Owner ────────────────────────────────────────────────────
  if (type === 'owner') {
    if (!passcode) return res.status(400).json({ error: 'Passcode required' });
    if (passcode !== process.env.OWNER_PASSCODE)
      return res.status(401).json({ error: 'Invalid passcode' });
    return res.json({ token: sign({ role: 'owner' }, '8h'), role: 'owner' });
  }

  // ── Tenant ───────────────────────────────────────────────────
  if (type === 'tenant') {
    if (!query) return res.status(400).json({ error: 'Email or unit number required' });
    const q = query.toLowerCase().trim();
    const { data, error } = await db()
      .from('tenants')
      .select('*')
      .or(`email.ilike.${q},unit.ilike.${q}`)
      .limit(1)
      .single();
    if (error || !data) return res.status(404).json({ error: 'No account found' });
    return res.json({
      token: sign({ role: 'tenant', tenantId: data.id, unit: data.unit }, '24h'),
      tenant: serialize(data),
    });
  }

  res.status(400).json({ error: 'Invalid auth type' });
};

function serialize(t) {
  return {
    id: t.id, unit: t.unit, name: t.name, email: t.email,
    phone: t.phone, size: t.size, key: t.unit_key,
    rent: t.rent, balance: t.balance, due: t.due_date,
    status: t.status, gate: t.gate_code, notes: t.notes,
    autopay: t.autopay,
  };
}
