'use strict';

const fs = require('fs');
const path = require('path');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '';
const GRAPH_API_URL = 'https://graph.facebook.com/v19.0';
const STORAGE_DIR = path.join(process.cwd(), 'storage', 'audios');

async function getMediaMetadata(mediaId) {
  const token = process.env.WHATSAPP_TOKEN || WHATSAPP_TOKEN;
  const response = await fetch(`${GRAPH_API_URL}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al obtener metadata del media (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function downloadMediaFile(mediaUrl, filename) {
  const token = process.env.WHATSAPP_TOKEN || WHATSAPP_TOKEN;
  const response = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${token}` },
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

/**
 * Sube un archivo binario de audio local a los servidores de Meta WhatsApp.
 * @param {string} filePath - Ruta local del archivo de audio.
 * @param {string} mimeType - Mime type (ej: 'audio/ogg' o 'audio/mp4').
 * @returns {Promise<string>} mediaId asignado por Meta.
 */
async function uploadMedia(filePath, mimeType = 'audio/ogg') {
  const token = process.env.WHATSAPP_TOKEN || WHATSAPP_TOKEN;
  const phoneId = process.env.PHONE_NUMBER_ID || PHONE_NUMBER_ID;

  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: mimeType });

  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('file', blob, path.basename(filePath));
  formData.append('type', mimeType);

  const response = await fetch(`${GRAPH_API_URL}/${phoneId}/media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Error al subir archivo a Meta (${response.status}): ${JSON.stringify(data)}`);
  }

  return data.id; // mediaId
}

module.exports = {
  getMediaMetadata,
  downloadMediaFile,
  sendTextMessage,
  sendAudioMessage,
  uploadMedia,
  STORAGE_DIR,
};
