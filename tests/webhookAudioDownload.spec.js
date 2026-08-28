'use strict';

// Aisla el WHATSAPP_TOKEN y mockea el servicio de WhatsApp para probar,
// sin red real, el flujo de descarga de audio entrante del POST /webhook:
// - la URL directa del webhook puede venir expirada (falla la descarga)
// - en ese caso debe reintentar con una URL fresca obtenida via media_id
// - localFile solo debe quedar seteado si el archivo se guardo de verdad

process.env.WHATSAPP_TOKEN = 'test-token';

jest.mock('../src/services/whatsappService', () => ({
  getMediaMetadata: jest.fn(),
  downloadMediaFile: jest.fn(),
}));

var request = require('supertest');
var app = require('../src/server');
var whatsappService = require('../src/services/whatsappService');

function audioPayload(overrides) {
  return {
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ value: { messages: [Object.assign({
      id: 'msg_audio_test',
      from: '573013096983',
      type: 'audio',
      timestamp: '1787867945',
      audio: {
        id: 'media_123',
        mime_type: 'audio/ogg; codecs=opus',
        url: 'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=media_123&ext=1787868246',
      },
    }, overrides)] } }] }],
  };
}

describe('POST /webhook — descarga de audio entrante', function() {
  beforeEach(function() {
    whatsappService.getMediaMetadata.mockReset();
    whatsappService.downloadMediaFile.mockReset();
  });

  test('reintenta con URL fresca si la URL directa del webhook fallo (expirada) y guarda el archivo', async function() {
    whatsappService.downloadMediaFile
      .mockRejectedValueOnce(new Error('Error al descargar el archivo de media (403)'))
      .mockResolvedValueOnce('/storage/audios/audio_in_123.ogg');
    whatsappService.getMediaMetadata.mockResolvedValueOnce({ url: 'https://fresh-url.example/media_123' });

    var res = await request(app)
      .post('/webhook')
      .send(audioPayload())
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(whatsappService.downloadMediaFile).toHaveBeenCalledTimes(2);
    expect(whatsappService.getMediaMetadata).toHaveBeenCalledWith('media_123');

    var listRes = await request(app).get('/api/messages');
    var saved = listRes.body.messages.find(function(m) { return m.mediaId === 'media_123'; });
    expect(saved).toBeDefined();
    expect(saved.localFile).toMatch(/^audio_in_.*\.ogg$/);
  });

  test('no deja un localFile fantasma si la descarga y el reintento fallan', async function() {
    whatsappService.downloadMediaFile.mockRejectedValue(new Error('Error al descargar el archivo de media (403)'));
    whatsappService.getMediaMetadata.mockRejectedValueOnce(new Error('Error al obtener metadata del media (401)'));

    var res = await request(app)
      .post('/webhook')
      .send(audioPayload({ id: 'msg_audio_test_2', audio: { id: 'media_456', mime_type: 'audio/ogg', url: 'https://lookaside.fbsbx.com/x?mid=media_456' } }))
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);

    var listRes = await request(app).get('/api/messages');
    var saved = listRes.body.messages.find(function(m) { return m.mediaId === 'media_456'; });
    expect(saved).toBeDefined();
    expect(saved.localFile).toBeNull();
  });
});