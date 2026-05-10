require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const committeeRoutes = require('./routes/committees');
const memberRoutes = require('./routes/members');
const paymentRoutes = require('./routes/payments');
const payoutRoutes = require('./routes/payouts');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:4200',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'CommitteeHub API' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/committees', committeeRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payouts', payoutRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

module.exports = app;
