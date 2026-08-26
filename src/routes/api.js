'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const { sendTextMessage, sendAudioMessage, uploadMedia, STORAGE_DIR } = require('../services/whatsappService');

const router = express.Router();

// Configurar multer para guardar audios con extension .ogg
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, STORAGE_DIR),
  filename: (_req, file, cb) => {
    const ext = file.mimetype.includes('ogg') ? 'ogg' : 'webm';
    cb(null, 'voice_web_' + Date.now() + '.' + ext);
  }
});
const upload = multer({ storage });

const messageStore = [];

function recordIncomingMessage(msg) {
  messageStore.unshift(msg);
  if (messageStore.length > 50) messageStore.pop();
}

router.get('/messages', (req, res) => {
  res.json({
    success: true,
    messages: messageStore,
  });
});

router.get('/audios/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(STORAGE_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo de audio no encontrado' });
  }

  res.sendFile(filePath);
});

router.post('/send-text', async (req, res) => {
  try {
    const { to, text } = req.body;
    if (!to || !text) {
      return res.status(400).json({ error: 'Parametros "to" y "text" son requeridos' });
    }

    const result = await sendTextMessage(to, text);
    recordIncomingMessage({
      type: 'text',
      from: 'Caja (Web)',
      timestamp: String(Math.floor(Date.now() / 1000)),
      text: text,
      outgoing: true,
    });
    res.json({ success: true, result });
  } catch (err) {
    console.error('Error al enviar texto desde API:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-audio', upload.single('audio'), async (req, res) => {
  try {
    const to = req.body.to;
    if (!to || !req.file) {
      return res.status(400).json({ error: 'Parametros "to" y archivo de audio son requeridos' });
    }

    console.log('??? Recibido audio desde la web. Archivo local:', req.file.path);
    console.log('?? Subiendo media a Meta Cloud API...');
    const mediaId = await uploadMedia(req.file.path, req.file.mimetype || 'audio/ogg');
    console.log('? Media subida a Meta exitosamente. ID:', mediaId);

    console.log('?? Enviando mensaje de audio por WhatsApp a:', to);
    const result = await sendAudioMessage(to, mediaId);

    recordIncomingMessage({
      type: 'audio',
      from: 'Caja (Web)',
      timestamp: String(Math.floor(Date.now() / 1000)),
      localFile: path.basename(req.file.path),
      outgoing: true,
    });

    res.json({ success: true, mediaId, result });
  } catch (err) {
    console.error('Error al enviar audio desde API:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, recordIncomingMessage };
