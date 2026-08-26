'use strict';

const express = require('express');
const { sendTextMessage, sendAudioMessage, STORAGE_DIR } = require('../services/whatsappService');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Memoria volatil para almacenar mensajes recibidos mientras corre el servidor
const messageStore = [];

/**
 * Agrega un mensaje recibido al store en memoria
 */
function recordIncomingMessage(msg) {
  messageStore.unshift(msg); // agregar al inicio
  if (messageStore.length > 50) messageStore.pop(); // max 50 mensajes
}

/**
 * GET /api/messages
 * Devuelve la lista de mensajes recibidos en la caja
 */
router.get('/messages', (req, res) => {
  res.json({
    success: true,
    messages: messageStore,
  });
});

/**
 * GET /api/audios/:filename
 * Sirve los archivos de audio guardados en storage/audios
 */
router.get('/audios/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(STORAGE_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo de audio no encontrado' });
  }

  res.sendFile(filePath);
});

/**
 * POST /api/send-text
 * Envia un mensaje de texto por WhatsApp a un numero destino
 */
router.post('/send-text', async (req, res) => {
  try {
    const { to, text } = req.body;
    if (!to || !text) {
      return res.status(400).json({ error: 'Parametros "to" y "text" son requeridos' });
    }

    const result = await sendTextMessage(to, text);
    res.json({ success: true, result });
  } catch (err) {
    console.error('Error al enviar texto desde API:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, recordIncomingMessage };
