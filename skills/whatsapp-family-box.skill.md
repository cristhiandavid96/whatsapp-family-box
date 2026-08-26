---
name: whatsapp-family-box
description: >
  Skill para el proyecto WhatsApp Family Box.
  Contexto, convenciones, arquitectura y guías de desarrollo para el asistente de IA.
  Activar cuando el usuario trabaje en este proyecto.
---

# WhatsApp Family Box — Skill del Proyecto

## ¿Qué es este proyecto?
Una caja de mensajes de voz para un niño de 3 años, **sin pantalla**.
- **Botón HABLAR**: mantener presionado → graba voz → suelta → envía audio por WhatsApp.
- **Botón ESCUCHAR**: presionar → reproduce el último audio recibido.
- Hardware futuro: Raspberry Pi Zero 2 W, micrófono, parlante, LEDs, batería.

## Stack técnico
| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js v22 |
| Framework | Express 5 |
| API | WhatsApp Cloud API (Meta) |
| Tests | Jest + Supertest |
| Logging HTTP | Morgan |
| Config | dotenv |
| Tunnel dev | ngrok |

## Estructura del proyecto
`
whatsapp-family-box/
├── src/
│   ├── server.js              # Entry point — Express app exportada para tests
│   ├── routes/
│   │   └── webhook.js         # GET y POST /webhook
│   └── handlers/
│       └── messageHandler.js  # Parseo de payloads de WhatsApp
├── tests/
│   ├── webhook.spec.js        # Integración: endpoints del webhook
│   └── messageHandler.spec.js # Unitarios: parseo y lógica de mensajes
├── skills/
│   └── whatsapp-family-box.skill.md
├── .env.example               # Template de variables de entorno
├── .gitignore                 # Excluye node_modules, .env, dist
└── package.json
`

## Convenciones de código
- CommonJS (equire/module.exports), no ESM, hasta migrar a TypeScript en fases posteriores.
- Archivos en src/, tests en 	ests/ con sufijo .spec.js.
- pp.listen() solo si equire.main === module → permite tests con Supertest sin levantar puerto.
- Logging: console.log con emojis descriptivos para desarrollo. En producción, reemplazar por un logger estructurado (pino, winston).
- Variables de entorno **siempre** desde process.env, nunca hardcodeadas. Valores por defecto solo para desarrollo local.
- Nunca exponer WHATSAPP_TOKEN ni WEBHOOK_VERIFY_TOKEN en logs ni en frontend.

## Endpoints actuales
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /webhook | Verificación del webhook por Meta |
| POST | /webhook | Recepción de mensajes y eventos de WhatsApp |
| GET | /health | Health check (status, timestamp) |

## Variables de entorno requeridas
Ver .env.example para la lista completa.
- WEBHOOK_VERIFY_TOKEN: token para verificar el webhook con Meta.
- WHATSAPP_TOKEN: access token de la app de Meta (aún pendiente de completar).
- PHONE_NUMBER_ID: ID del número en la WABA.
- AUTHORIZED_NUMBERS: lista CSV de números autorizados (sin +, con código de país).

## Flujo de datos
`
WhatsApp → Meta Cloud API → POST /webhook → parseIncomingMessage() → switch(type)
                                                                         ├─ text  → log
                                                                         ├─ audio → obtener media_id (Fase 5)
                                                                         └─ otros → log
`

## Estado de las fases (TDD)
- ✅ Fase 1: Backend mínimo (server, webhook GET/POST, health)
- ⏳ Fase 2: ngrok HTTPS local
- ⏳ Fase 3: Configurar webhook en Meta Dashboard
- ⏳ Fase 4: Parseo de mensajes de texto
- ⏳ Fase 5: Audio entrante (descargar, guardar, reproducir)
- ⏳ Fase 6: Audio saliente (subir, enviar)
- ⏳ Fase 7: Simulador web (UI HABLAR / ESCUCHAR)
- ⏳ Fase 8: Familia y seguridad (AUTHORIZED_NUMBERS)
- ⏳ Fase 9: Número real (Embedded Signup / Coexistence)
- ⏳ Fase 10: Hardware (Raspberry Pi Zero 2 W)
- ⏳ Fase 11: Portable (batería + Wi-Fi → 4G/LTE)

## Comandos útiles
`ash
# Levantar servidor
node src/server.js

# Correr todos los tests
npm test

# Correr tests en modo watch
npm run test:watch

# Ver cobertura
npm run test:coverage

# Exponer servidor con ngrok (instalar globalmente: npm i -g ngrok)
ngrok http 3000
`

## Meta — App de referencia
- App Name: Cristhian's first app
- App ID: 251511322042262
- WABA de prueba: Test WhatsApp Business Account
- Número de prueba: +1 555-1977608
- Número real: registrado, NO desconectar todavía.

## Notas críticas
- Responder siempre HTTP 200 a Meta en el POST /webhook, incluso en errores de lógica interna.
- No responder 500 a Meta → puede causar desactivación del webhook.
- El equire.main === module en server.js es esencial para que Supertest funcione sin conflictos de puerto.
- AUTHORIZED_NUMBERS vacío = sin filtro (útil para pruebas). En producción, siempre definir.
