'use strict';

require('dotenv').config();

var express = require('express');
var morgan = require('morgan');
var webhookRouter = require('./routes/webhook');

var app = express();
var PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', function(_req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'whatsapp-family-box',
    timestamp: new Date().toISOString(),
  });
});

// Webhook de WhatsApp Cloud API
app.use('/webhook', webhookRouter);

// 404 handler
app.use(function(_req, res) {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(function(err, _req, res, _next) {
  console.error('Error inesperado:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Solo levantar servidor si es el entry point (no durante tests)
if (require.main === module) {
  app.listen(PORT, function() {
    console.log('');
    console.log('Family Box API ejecutandose en http://localhost:' + PORT);
    console.log('Webhook disponible en http://localhost:' + PORT + '/webhook');
    console.log('Health check en http://localhost:' + PORT + '/health');
    console.log('');
  });
}

module.exports = app;
