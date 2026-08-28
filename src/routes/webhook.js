'use strict';

const express = require('express');
const { parseIncomingMessage, isAuthorizedSender, formatMessageLog } = require('../handlers/messageHandler');
const { getMediaMetadata, downloadMediaFile } = require('../services/whatsappService');
const { recordIncomingMessage } = require('./api');

const router = express.Router();

const AUTHORIZED_NUMBERS = (process.env.AUTHORIZED_NUMBERS || '').split(',').filter(Boolean);
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'family-box-test';

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
      const text = parsed.payload && parsed.payload.body;
      console.log('?? Texto recibido:', text);
      recordIncomingMessage({
        type: 'text',
        from: parsed.from,
        timestamp: parsed.timestamp,
        text: text,
        outgoing: false,
      });
    } else if (parsed.type === 'audio') {
      const mediaId = parsed.payload && parsed.payload.id;
      const directUrl = parsed.payload && parsed.payload.url;
      const mimeType = (parsed.payload && parsed.payload.mime_type) || 'audio/ogg';
      console.log('??? Audio recibido de WhatsApp ? media_id:', mediaId);

      let filename = null;
      if (process.env.WHATSAPP_TOKEN) {
        const ext = mimeType.includes('ogg') ? 'ogg' : 'mp3';
        const candidateFilename = 'audio_in_' + Date.now() + '_' + mediaId + '.' + ext;

        try {
          let downloadUrl = directUrl;
          if (!downloadUrl) {
            console.log('?? Consultando URL de descarga para media ID:', mediaId);
            const meta = await getMediaMetadata(mediaId);
            downloadUrl = meta.url;
          } else {
            console.log('? Usando URL de descarga directa entregada por el webhook!');
          }

          console.log('?? Descargando archivo de audio desde Meta...');
          const localPath = await downloadMediaFile(downloadUrl, candidateFilename);
          filename = candidateFilename;
          console.log('? Audio entrante guardado exitosamente en:', localPath);
        } catch (downloadErr) {
          console.error('? Error al descargar audio entrante con la URL del webhook:', downloadErr.message);

          // La URL directa que entrega el webhook (lookaside.fbsbx.com) expira
          // pocos minutos despues de generada. Si fallo (403/410/expirada) y
          // veniamos usando esa URL directa, reintentamos una sola vez pidiendo
          // una URL fresca a la API de Meta a partir del media_id.
          if (directUrl) {
            try {
              console.log('?? Reintentando: solicitando URL fresca via media_id...');
              const meta = await getMediaMetadata(mediaId);
              const localPath = await downloadMediaFile(meta.url, candidateFilename);
              filename = candidateFilename;
              console.log('? Audio entrante guardado exitosamente en el reintento:', localPath);
            } catch (retryErr) {
              console.error('? El reintento tambien fallo al descargar audio entrante:', retryErr.message);
            }
          }
        }
      }

      recordIncomingMessage({
        type: 'audio',
        from: parsed.from,
        timestamp: parsed.timestamp,
        mediaId: mediaId,
        localFile: filename,
        outgoing: false,
      });
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
