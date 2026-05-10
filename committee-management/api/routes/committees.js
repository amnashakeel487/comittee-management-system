const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/committees
router.get('/', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('committees')
    .select('*, members(count)')
    .eq('created_by', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/committees/:id
router.get('/:id', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('committees')
    .select('*, members(*)')
    .eq('id', req.params.id)
    .eq('created_by', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'Committee not found' });
  res.json(data);
});

// POST /api/committees
router.post('/', authMiddleware, async (req, res) => {
  const { name, monthly_amount, total_members, start_date, duration_months, description } = req.body;

  if (!name || !monthly_amount || !total_members || !start_date || !duration_months) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('committees')
    .insert({
      name,
      monthly_amount: Number(monthly_amount),
      total_members: Number(total_members),
      start_date,
      duration_months: Number(duration_months),
      description,
      status: 'pending',
      created_by: req.user.id,
      current_month: 0
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/committees/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, monthly_amount, total_members, start_date, duration_months, description, status } = req.body;

  const { data, error } = await supabase
    .from('committees')
    .update({ name, monthly_amount, total_members, start_date, duration_months, description, status })
    .eq('id', req.params.id)
    .eq('created_by', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/committees/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const { error } = await supabase
    .from('committees')
    .delete()
    .eq('id', req.params.id)
    .eq('created_by', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Committee deleted successfully' });
});

// GET /api/committees/:id/stats
router.get('/:id/stats', authMiddleware, async (req, res) => {
  const [paymentsRes, payoutsRes] = await Promise.all([
    supabase.from('payments').select('*').eq('committee_id', req.params.id),
    supabase.from('payouts').select('*').eq('committee_id', req.params.id)
  ]);

  const payments = paymentsRes.data || [];
  const payouts = payoutsRes.data || [];

  res.json({
    totalCollected: payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    pendingPayments: payments.filter(p => p.status !== 'paid').length,
    releasedPayouts: payouts.filter(p => p.status === 'released').length,
    totalPayoutAmount: payouts.filter(p => p.status === 'released').reduce((s, p) => s + p.total_amount, 0)
  });
});

module.exports = router;
