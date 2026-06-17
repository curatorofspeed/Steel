// POST /api/reserve
// { unitKey, name, email, phone }

const { preflight, db, genGate, genUnitId } = require('./_lib');

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { unitKey, name, email, phone } = req.body || {};
  if (!unitKey || !name || !email)
    return res.status(400).json({ error: 'unitKey, name and email required' });

  const supabase = db();

  // Check availability
  const { data: unit, error: uErr } = await supabase
    .from('units').select('*').eq('key', unitKey).single();
  if (uErr || !unit) return res.status(404).json({ error: 'Unit type not found' });
  if (unit.available <= 0) return res.status(409).json({ error: 'No units available' });

  const gate         = genGate();
  const assignedUnit = genUnitId(unitKey);
  const dueDate      = (() => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  })();

  // Decrement availability
  const { error: dErr } = await supabase
    .from('units').update({ available: unit.available - 1 }).eq('key', unitKey);
  if (dErr) return res.status(500).json({ error: 'Could not update availability' });

  // Create tenant
  await supabase.from('tenants').upsert({
    unit: assignedUnit, name, email, phone: phone || null,
    size: unit.label, unit_key: unitKey, rent: unit.price,
    balance: 0, due_date: dueDate, status: 'Paid', gate_code: gate,
  }, { onConflict: 'unit' });

  // Log reservation
  await supabase.from('reservations').insert({
    unit_key: unitKey, assigned_unit: assignedUnit,
    name, email, phone: phone || null, gate_code: gate,
  });

  res.json({ unit: assignedUnit, gate, due: dueDate, rent: unit.price });
};
