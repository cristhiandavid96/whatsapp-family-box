'use strict';

/**
 * messageHandler.js
 * Logica central para procesar payloads de WhatsApp Cloud API.
 */

function parseIncomingMessage(body) {
  try {
    var entry = (body || {}).entry;
    var message = entry &&
      entry[0] &&
      entry[0].changes &&
      entry[0].changes[0] &&
      entry[0].changes[0].value &&
      entry[0].changes[0].value.messages &&
      entry[0].changes[0].value.messages[0];

    if (!message) {
      return { type: 'unknown', from: null, messageId: null, timestamp: null, payload: null };
    }

    var payload = Object.prototype.hasOwnProperty.call(message, message.type)
      ? message[message.type]
      : null;

    return {
      type: message.type,
      from: message.from,
      messageId: message.id,
      timestamp: message.timestamp,
      payload: payload,
    };
  } catch (err) {
    return { type: 'error', from: null, messageId: null, timestamp: null, payload: null };
  }
}

function isAuthorizedSender(phoneNumber, authorizedNumbers) {
  if (!authorizedNumbers) return false;
  return authorizedNumbers.includes(phoneNumber);
}

function formatMessageLog(parsed) {
  var time = parsed.timestamp
    ? new Date(Number(parsed.timestamp) * 1000).toISOString()
    : 'N/A';
  return '[MSG] tipo=' + parsed.type + ' de=' + parsed.from + ' id=' + parsed.messageId + ' ts=' + time;
}

module.exports = { parseIncomingMessage, isAuthorizedSender, formatMessageLog };
