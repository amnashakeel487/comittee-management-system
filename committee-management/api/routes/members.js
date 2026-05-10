const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/members?committee_id=xxx
router.get('/', authMiddleware, async (req, res) => {
  let query = supabase.from('members').select('*');
  if (req.query.committee_id) {
    query = query.eq('committee_id', req.query.committee_id);
  }
  const { data, error } = await query.order('payout_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/members/:id
router.get('/:id', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Member not found' });
  res.json(data);
});

// POST /api/members
router.post('/', authMiddleware, async (req, res) => {
  const { committee_id, name, phone, email, cnic, role, payout_order } = req.body;
  if (!committee_id || !name || !phone || !email || !cnic) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('members')
    .insert({ committee_id, name, phone, email, cnic, role: role || 'member', payout_order, status: 'active' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/members/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, phone, email, cnic, role, payout_order, status } = req.body;
  const { data, error } = await supabase
    .from('members')
    .update({ name, phone, email, cnic, role, payout_order, status })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/members/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const { error } = await supabase.from('members').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Member removed successfully' });
});

module.exports = router;
