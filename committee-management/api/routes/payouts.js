const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/payouts
router.get('/', authMiddleware, async (req, res) => {
  let query = supabase
    .from('payouts')
    .select('*, members(name), committees(name)')
    .order('month');

  if (req.query.committee_id) query = query.eq('committee_id', req.query.committee_id);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/payouts
router.post('/', authMiddleware, async (req, res) => {
  const { committee_id, member_id, month, total_amount, payout_date } = req.body;
  if (!committee_id || !member_id || !month || !total_amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('payouts')
    .insert({ committee_id, member_id, month, total_amount, payout_date, status: 'scheduled' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/payouts/:id/release
router.patch('/:id/release', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('payouts')
    .update({ status: 'released', payout_date: new Date().toISOString().split('T')[0] })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
