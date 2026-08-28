'use strict';

var request = require('supertest');
var app = require('../src/server');

var VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'family-box-test';

// GET /webhook ? Verificacion de Meta
describe('GET /webhook ? Verificacion del webhook', function() {
  test('debe responder 200 y devolver el challenge con token correcto', async function() {
    var res = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': 'abc123challenge',
      });
    expect(res.status).toBe(200);
    expect(res.text).toBe('abc123challenge');
  });

  test('debe responder 403 con token incorrecto', async function() {
    var res = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'token-incorrecto',
        'hub.challenge': 'abc123',
      });
    expect(res.status).toBe(403);
  });

  test('debe responder 403 con modo distinto a subscribe', async function() {
    var res = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'unsubscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': 'abc123',
      });
    expect(res.status).toBe(403);
  });

  test('debe responder 403 sin parametros', async function() {
    var res = await request(app).get('/webhook');
    expect(res.status).toBe(403);
  });
});

// POST /webhook ? Recepcion de mensajes
describe('POST /webhook ? Recepcion de eventos de WhatsApp', function() {
  var textPayload = {
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ value: { messages: [{
      id: 'msg_001',
      from: '573001234567',
      type: 'text',
      timestamp: '1700000000',
      text: { body: 'Hola familia!' },
    }] } }] }],
  };

  var audioPayload = {
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ value: { messages: [{
      id: 'msg_002',
      from: '573001234567',
      type: 'audio',
      timestamp: '1700000001',
      audio: { id: 'audio_media_id_xyz', mime_type: 'audio/ogg; codecs=opus' },
    }] } }] }],
  };

  test('debe responder 200 ante un mensaje de texto', async function() {
    var res = await request(app)
      .post('/webhook')
      .send(textPayload)
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
  });

  test('debe responder 200 ante un mensaje de audio', async function() {
    var res = await request(app)
      .post('/webhook')
      .send(audioPayload)
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
  });

  test('debe responder 404 si el objeto no es whatsapp_business_account', async function() {
    var res = await request(app)
      .post('/webhook')
      .send({ object: 'page', entry: [] })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(404);
  });

  test('debe responder 200 ante un status update sin mensajes', async function() {
    var res = await request(app)
      .post('/webhook')
      .send({ object: 'whatsapp_business_account', entry: [{ changes: [{ value: { statuses: [] } }] }] })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
  });
});

// GET /health
describe('GET /health', function() {
  test('debe responder 200 con status ok', async function() {
    var res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('whatsapp-family-box');
    expect(res.body.timestamp).toBeDefined();
  });
});

// 404
describe('Rutas inexistentes', function() {
  test('debe responder 404 para rutas no definidas', async function() {
    var res = await request(app).get('/ruta-que-no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});
