// GET  /api/units  — public, returns live availability
// PUT  /api/units  — owner JWT, replaces all unit records

const { preflight, db, verifyOwner } = require('./_lib');

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  const supabase = db();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('units').select('key,label,price,total,available,type,description').order('price');
    if (error) return res.status(500).json({ error: 'Could not load units' });
    return res.json(data.map(u => ({
      key: u.key, label: u.label, price: u.price,
      total: u.total, available: u.available,
      type: u.type, desc: u.description,
    })));
  }

  if (req.method === 'PUT') {
    if (!verifyOwner(req)) return res.status(401).json({ error: 'Unauthorized' });
    const units = req.body;
    if (!Array.isArray(units)) return res.status(400).json({ error: 'Expected an array' });

    for (const u of units) {
      const { error } = await supabase.from('units').upsert({
        key: u.key, label: u.label, price: u.price,
        total: u.total, available: Math.max(0, u.available),
        type: u.type, description: u.desc,
      }, { onConflict: 'key' });
      if (error) return res.status(500).json({ error: `Failed to update unit ${u.key}` });
    }
    await supabase.from('settings')
      .upsert({ key: 'avail_updated', value: new Date().toISOString() });
    return res.json({ saved: units.length });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
