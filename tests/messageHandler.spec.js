'use strict';

var mh = require('../src/handlers/messageHandler');
var parseIncomingMessage = mh.parseIncomingMessage;
var isAuthorizedSender = mh.isAuthorizedSender;
var formatMessageLog = mh.formatMessageLog;

function buildPayload(msg) {
  return {
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ value: { messages: [msg] } }] }],
  };
}

// parseIncomingMessage
describe('parseIncomingMessage()', function() {
  test('parsea correctamente un mensaje de texto', function() {
    var body = buildPayload({
      id: 'msg_001', from: '573001234567',
      type: 'text', timestamp: '1700000000',
      text: { body: 'Hola!' },
    });
    var result = parseIncomingMessage(body);
    expect(result.type).toBe('text');
    expect(result.from).toBe('573001234567');
    expect(result.messageId).toBe('msg_001');
    expect(result.timestamp).toBe('1700000000');
    expect(result.payload).toEqual({ body: 'Hola!' });
  });

  test('parsea correctamente un mensaje de audio', function() {
    var body = buildPayload({
      id: 'msg_002', from: '573009876543',
      type: 'audio', timestamp: '1700000001',
      audio: { id: 'audio_media_xyz', mime_type: 'audio/ogg; codecs=opus' },
    });
    var result = parseIncomingMessage(body);
    expect(result.type).toBe('audio');
    expect(result.payload.id).toBe('audio_media_xyz');
  });

  test('retorna type=unknown si no hay mensajes', function() {
    var body = { object: 'whatsapp_business_account', entry: [{ changes: [{ value: { statuses: [] } }] }] };
    var result = parseIncomingMessage(body);
    expect(result.type).toBe('unknown');
    expect(result.from).toBeNull();
  });

  test('retorna type desconocido si el payload es null (manejo gracioso)', function() {
    var result = parseIncomingMessage(null);
    // null se maneja graciosamente como 'unknown' (no lanza excepcion)
    expect(['unknown', 'error']).toContain(result.type);
    expect(result.from).toBeNull();
  });

  test('retorna type=unknown para objeto vacio', function() {
    var result = parseIncomingMessage({});
    expect(result.type).toBe('unknown');
  });
});

// isAuthorizedSender
describe('isAuthorizedSender()', function() {
  var authorized = ['573001234567', '573009876543'];

  test('retorna true para numero autorizado', function() {
    expect(isAuthorizedSender('573001234567', authorized)).toBe(true);
  });

  test('retorna false para numero no autorizado', function() {
    expect(isAuthorizedSender('573001111111', authorized)).toBe(false);
  });

  test('retorna false con lista vacia', function() {
    expect(isAuthorizedSender('573001234567', [])).toBe(false);
  });

  test('retorna false si authorizedNumbers es undefined', function() {
    expect(isAuthorizedSender('573001234567', undefined)).toBe(false);
  });
});

// formatMessageLog
describe('formatMessageLog()', function() {
  test('formatea correctamente el log de un mensaje', function() {
    var parsed = { type: 'text', from: '573001234567', messageId: 'msg_001', timestamp: '1700000000' };
    var log = formatMessageLog(parsed);
    expect(log).toContain('tipo=text');
    expect(log).toContain('de=573001234567');
    expect(log).toContain('id=msg_001');
    expect(log).toContain('2023-');
  });

  test('maneja timestamp nulo sin explotar', function() {
    var parsed = { type: 'audio', from: '573001234567', messageId: 'msg_002', timestamp: null };
    var log = formatMessageLog(parsed);
    expect(log).toContain('ts=N/A');
  });
});
