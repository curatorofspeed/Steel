// POST /api/waitlist
// { unitKey, name, email }

const { preflight, db } = require('./_lib');

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { unitKey, name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

  const { error } = await db().from('waitlist').insert({ unit_key: unitKey || null, name, email });
  if (error) return res.status(500).json({ error: 'Could not save — please try again' });

  res.json({ added: true });
};
