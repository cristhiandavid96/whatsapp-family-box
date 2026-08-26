'use strict';

const fs = require('fs');
const path = require('path');

/**
 * whatsappService.js
 * Servicio para interactuar con Meta WhatsApp Cloud API:
 * - Descargar archivos de media (audios/notas de voz)
 * - Enviar mensajes de texto y notas de voz
 */

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '';
const GRAPH_API_URL = 'https://graph.facebook.com/v19.0';
const STORAGE_DIR = path.join(process.cwd(), 'storage', 'audios');

/**
 * Obtiene los metadatos y la URL de descarga de un archivo de media usando su ID.
 * @param {string} mediaId - ID del media entregado por el webhook.
 * @returns {Promise<{ url: string, mime_type: string, file_size: number }>}
 */
async function getMediaMetadata(mediaId) {
  const token = process.env.WHATSAPP_TOKEN || WHATSAPP_TOKEN;
  const response = await fetch(`${GRAPH_API_URL}/${mediaId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al obtener metadata del media (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Descarga el archivo binario de audio desde la URL de Meta y lo guarda en disco.
 * @param {string} mediaUrl - URL binaria obtenida de getMediaMetadata.
 * @param {string} filename - Nombre con el que se guardara el archivo.
 * @returns {Promise<string>} Ruta absoluta del archivo guardado.
 */
async function downloadMediaFile(mediaUrl, filename) {
  const token = process.env.WHATSAPP_TOKEN || WHATSAPP_TOKEN;
  const response = await fetch(mediaUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error al descargar el archivo de media (${response.status})`);
  }

  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  const filePath = path.join(STORAGE_DIR, filename);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/**
 * Env?a un mensaje de texto por WhatsApp a trav?s de la Cloud API.
 * @param {string} to - Numero de telefono del destinatario (con codigo de pais, ej: '573001234567').
 * @param {string} textBody - Contenido del mensaje de texto.
 * @returns {Promise<object>} Respuesta de Meta Graph API.
 */
async function sendTextMessage(to, textBody) {
  const token = process.env.WHATSAPP_TOKEN || WHATSAPP_TOKEN;
  const phoneId = process.env.PHONE_NUMBER_ID || PHONE_NUMBER_ID;

  const response = await fetch(`${GRAPH_API_URL}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { body: textBody },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Error al enviar mensaje (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

/**
 * Env?a un mensaje de audio por WhatsApp a trav?s de la Cloud API usando un mediaId ya subido.
 * @param {string} to - Numero de telefono del destinatario.
 * @param {string} mediaId - ID del archivo de audio subido a Meta.
 * @returns {Promise<object>} Respuesta de Meta Graph API.
 */
async function sendAudioMessage(to, mediaId) {
  const token = process.env.WHATSAPP_TOKEN || WHATSAPP_TOKEN;
  const phoneId = process.env.PHONE_NUMBER_ID || PHONE_NUMBER_ID;

  const response = await fetch(`${GRAPH_API_URL}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'audio',
      audio: { id: mediaId },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Error al enviar audio (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

module.exports = {
  getMediaMetadata,
  downloadMediaFile,
  sendTextMessage,
  sendAudioMessage,
  STORAGE_DIR,
};
