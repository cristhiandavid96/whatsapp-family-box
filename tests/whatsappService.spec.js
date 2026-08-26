'use strict';

const whatsappService = require('../src/services/whatsappService');

describe('whatsappService module', () => {
  test('debe definir las funciones principales del servicio', () => {
    expect(typeof whatsappService.getMediaMetadata).toBe('function');
    expect(typeof whatsappService.downloadMediaFile).toBe('function');
    expect(typeof whatsappService.sendTextMessage).toBe('function');
    expect(typeof whatsappService.sendAudioMessage).toBe('function');
    expect(whatsappService.STORAGE_DIR).toBeDefined();
  });
});
