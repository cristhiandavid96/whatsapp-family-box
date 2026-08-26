'use strict';

var express = require('express');
var mh = require('../handlers/messageHandler');
var parseIncomingMessage = mh.parseIncomingMessage;
var isAuthorizedSender = mh.isAuthorizedSender;
var formatMessageLog = mh.formatMessageLog;

var router = express.Router();

var AUTHORIZED_NUMBERS = (process.env.AUTHORIZED_NUMBERS || '').split(',').filter(Boolean);
var VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'family-box-test';

// GET /webhook ? Verificacion del webhook de Meta
router.get('/', function(req, res) {
  var mode = req.query['hub.mode'];
  var token = req.query['hub.verify_token'];
  var challenge = req.query['hub.challenge'];

  console.log('?? GET /webhook intension -> mode:', mode, '| token recibido:', token, '| token esperado:', VERIFY_TOKEN);

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('? Webhook verificado exitosamente por Meta!');
    return res.status(200).send(challenge);
  }

  console.warn('?? Verificacion de webhook fallida: token o modo incorrecto');
  return res.sendStatus(403);
});

// POST /webhook ? Recepcion de eventos de WhatsApp
router.post('/', function(req, res) {
  var body = req.body;

  if (!body || body.object !== 'whatsapp_business_account') {
    console.warn('?? Payload no reconocido:', body && body.object);
    return res.sendStatus(404);
  }

  var parsed = parseIncomingMessage(body);

  if (parsed.type === 'unknown' || parsed.type === 'error') {
    console.log('?? Evento sin mensaje de usuario (status update u otro)');
    return res.sendStatus(200);
  }

  console.log('?? ' + formatMessageLog(parsed));

  if (AUTHORIZED_NUMBERS.length > 0 && !isAuthorizedSender(parsed.from, AUTHORIZED_NUMBERS)) {
    console.warn('?? Remitente no autorizado:', parsed.from);
    return res.sendStatus(200);
  }

  if (parsed.type === 'text') {
    console.log('?? Texto recibido:', parsed.payload && parsed.payload.body);
  } else if (parsed.type === 'audio') {
    console.log('??? Audio recibido ? media_id:', parsed.payload && parsed.payload.id);
  } else if (parsed.type === 'image') {
    console.log('??? Imagen recibida ? media_id:', parsed.payload && parsed.payload.id);
  } else {
    console.log('?? Tipo de mensaje no manejado aun: ' + parsed.type);
  }

  return res.sendStatus(200);
});

module.exports = router;
