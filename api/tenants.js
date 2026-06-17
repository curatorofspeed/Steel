// GET  /api/tenants  — owner JWT, returns all tenants
// POST /api/tenants  — owner JWT, batch upsert + prune

const { preflight, db, verifyOwner } = require('./_lib');

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  if (!verifyOwner(req)) return res.status(401).json({ error: 'Unauthorized' });
  const supabase = db();

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('tenants').select('*').order('created_at');
    if (error) return res.status(500).json({ error: 'Could not load tenants' });
    return res.json(data.map(serialize));
  }

  if (req.method === 'POST') {
    const tenants = req.body;
    if (!Array.isArray(tenants)) return res.status(400).json({ error: 'Expected an array' });

    for (const t of tenants) {
      const { error } = await supabase.from('tenants').upsert({
        unit: t.unit, name: t.name, email: t.email || null,
        phone: t.phone || null, size: t.size, unit_key: t.key || null,
        rent: +t.rent || 0, balance: +t.balance || 0,
        due_date: t.due || null, status: t.status || 'Paid',
        gate_code: t.gate || null, notes: t.notes || null,
        autopay: !!t.autopay,
      }, { onConflict: 'unit' });
      if (error) console.error('Upsert error:', t.unit, error.message);
    }

    // Remove tenants no longer in the list
    if (tenants.length > 0) {
      const kept = tenants.map(t => t.unit);
      await supabase.from('tenants').delete().not('unit', 'in', `(${kept.map(u => `"${u}"`).join(',')})`);
    }

    await supabase.from('settings')
      .upsert({ key: 'tenants_updated', value: new Date().toISOString() });
    return res.json({ saved: tenants.length });
  }

  res.status(405).json({ error: 'Method not allowed' });
};

function serialize(t) {
  return {
    id: t.id, unit: t.unit, name: t.name, email: t.email,
    phone: t.phone, size: t.size, key: t.unit_key,
    rent: t.rent, balance: t.balance, due: t.due_date,
    status: t.status, gate: t.gate_code, notes: t.notes,
    autopay: t.autopay, since: t.created_at?.split('T')[0],
  };
}
