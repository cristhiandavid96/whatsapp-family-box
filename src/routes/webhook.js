'use strict';

const express = require('express');
const { parseIncomingMessage, isAuthorizedSender, formatMessageLog } = require('../handlers/messageHandler');
const { getMediaMetadata, downloadMediaFile } = require('../services/whatsappService');

const router = express.Router();

const AUTHORIZED_NUMBERS = (process.env.AUTHORIZED_NUMBERS || '').split(',').filter(Boolean);
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'family-box-test';

// GET /webhook ? Verificacion del webhook de Meta
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('?? GET /webhook intension -> mode:', mode, '| token recibido:', token, '| token esperado:', VERIFY_TOKEN);

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('? Webhook verificado exitosamente por Meta!');
    return res.status(200).send(challenge);
  }

  console.warn('?? Verificacion de webhook fallida');
  return res.sendStatus(403);
});

// POST /webhook ? Recepcion de eventos de WhatsApp
router.post('/', async (req, res) => {
  const body = req.body;

  if (!body || body.object !== 'whatsapp_business_account') {
    console.warn('?? Payload no reconocido:', body && body.object);
    return res.sendStatus(404);
  }

  const parsed = parseIncomingMessage(body);

  if (parsed.type === 'unknown' || parsed.type === 'error') {
    console.log('?? Evento sin mensaje de usuario (status update u otro)');
    return res.sendStatus(200);
  }

  console.log('?? ' + formatMessageLog(parsed));

  if (AUTHORIZED_NUMBERS.length > 0 && !isAuthorizedSender(parsed.from, AUTHORIZED_NUMBERS)) {
    console.warn('?? Remitente no autorizado:', parsed.from);
    return res.sendStatus(200);
  }

  try {
    if (parsed.type === 'text') {
      console.log('?? Texto recibido:', parsed.payload && parsed.payload.body);
    } else if (parsed.type === 'audio') {
      const mediaId = parsed.payload && parsed.payload.id;
      console.log('??? Audio recibido ? media_id:', mediaId);

      if (process.env.WHATSAPP_TOKEN) {
        try {
          console.log('?? Obteniendo metadatos del audio ID:', mediaId);
          const meta = await getMediaMetadata(mediaId);
          const ext = meta.mime_type && meta.mime_type.includes('ogg') ? 'ogg' : 'mp3';
          const filename = 'audio_' + Date.now() + '_' + mediaId + '.' + ext;
          
          console.log('?? Descargando archivo de audio desde Meta...');
          const localPath = await downloadMediaFile(meta.url, filename);
          console.log('? Audio guardado exitosamente en:', localPath);
        } catch (downloadErr) {
          console.error('? Error al descargar audio:', downloadErr.message);
        }
      } else {
        console.log('?? WHATSAPP_TOKEN no configurado en .env. El audio no se descargo a disco.');
      }
    } else if (parsed.type === 'image') {
      console.log('??? Imagen recibida ? media_id:', parsed.payload && parsed.payload.id);
    } else {
      console.log('?? Tipo de mensaje no manejado aun: ' + parsed.type);
    }
  } catch (err) {
    console.error('?? Error procesando mensaje:', err);
  }

  return res.sendStatus(200);
});

module.exports = router;
