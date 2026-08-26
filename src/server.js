'use strict';

require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const webhookRouter = require('./routes/webhook');
const { router: apiRouter } = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(morgan('dev'));

// Servir la interfaz web estatica del simulador
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'whatsapp-family-box',
    timestamp: new Date().toISOString(),
  });
});

// API REST para el simulador web
app.use('/api', apiRouter);

// Webhook de WhatsApp Cloud API
app.use('/webhook', webhookRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Error inesperado:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Solo levantar servidor si es el entry point
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('?? Family Box API ejecutandose en http://localhost:' + PORT);
    console.log('?? Simulador Web disponible en http://localhost:' + PORT + '/');
    console.log('?? Webhook disponible en http://localhost:' + PORT + '/webhook');
    console.log('?? Health check en http://localhost:' + PORT + '/health');
    console.log('');
  });
}

module.exports = app;
