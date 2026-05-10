const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/payments
router.get('/', authMiddleware, async (req, res) => {
  let query = supabase
    .from('payments')
    .select('*, members(name), committees(name)')
    .order('created_at', { ascending: false });

  if (req.query.committee_id) query = query.eq('committee_id', req.query.committee_id);
  if (req.query.status) query = query.eq('status', req.query.status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/payments
router.post('/', authMiddleware, async (req, res) => {
  const { committee_id, member_id, month, amount } = req.body;
  if (!committee_id || !member_id || !month || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({ committee_id, member_id, month, amount, status: 'pending' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/payments/:id/mark-paid
router.patch('/:id/mark-paid', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'paid', payment_date: new Date().toISOString().split('T')[0] })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/payments/:id/remind
router.post('/:id/remind', authMiddleware, async (req, res) => {
  res.json({ message: 'Reminder sent successfully' });
});

module.exports = router;
