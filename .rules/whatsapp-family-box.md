# Regla: WhatsApp Family Box — No saltarse pasos

## Objetivo del proyecto
Construir un webhook Node.js que integre con WhatsApp Business Cloud API (Meta)
para crear una caja de mensajes de voz fisica sin pantalla para un nino de 3 anos.

## REGLA PRINCIPAL: No saltarse pasos

Antes de cualquier cambio de codigo o configuracion, SIEMPRE seguir este orden:

### Fase 1 — Backend minimo [COMPLETADO]
- [x] src/server.js con Express
- [x] GET /webhook (verificacion Meta)
- [x] POST /webhook (recepcion de mensajes)
- [x] GET /health
- [x] Tests (21/21 pasando)
- [x] .env.example

### Fase 2 — HTTPS publico con ngrok [EN PROGRESO]
- [ ] ngrok instalado y corriendo
- [ ] URL publica HTTPS disponible
- [ ] URL anotada para configurar en Meta

### Fase 3 — Configurar webhook en Meta Dashboard
REQUIERE Fase 2 completada.
- [ ] Ir a Meta App Dashboard > WhatsApp > Configuracion
- [ ] Callback URL: https://<ngrok-url>/webhook
- [ ] Verify Token: valor de WEBHOOK_VERIFY_TOKEN en .env
- [ ] Suscribir campo: messages
- [ ] Verificar que Meta hace GET /webhook y responde 200

### Fase 4 — Mensajes de texto
REQUIERE Fase 3 verificada.
- [ ] Enviar mensaje desde WhatsApp al numero de prueba
- [ ] Ver el payload en los logs del servidor
- [x] Parsear: remitente, texto, message ID, timestamp

### Fase 5 — Audio entrante
REQUIERE Fase 4 probada.
- [x] Detectar type=audio en el payload
- [x] Obtener media_id
- [x] Descargar audio via Cloud API con WHATSAPP_TOKEN
- [x] Guardar temporalmente en /tmp o carpeta local (storage/audios/)
- [ ] Reproducir (en simulador web por ahora)

### Fase 6 — Audio saliente
REQUIERE Fase 5 funcionando.
- [ ] Subir archivo de audio a Cloud API
- [ ] Enviar mensaje de audio al numero destino via API

### Fase 7 — Simulador web (UI)
- [ ] Interfaz con botones HABLAR / ESCUCHAR
- [ ] Estado de conexion
- [ ] Lista de mensajes recibidos

### Fase 8 — Familia y seguridad
- [ ] AUTHORIZED_NUMBERS configurado en .env
- [ ] Solo numeros autorizados pueden interactuar
- [ ] Tokens nunca expuestos en frontend

### Fase 9 — Numero real (Embedded Signup / Coexistence)
REQUIERE Fase 8 y verificacion de negocio si Meta la exige.
- [ ] NO migrar ni desconectar el numero real hasta confirmar el flujo
- [ ] Configurar Embedded Signup o Coexistence
- [ ] Probar con numero real

### Fase 10 — Hardware
REQUIERE Fase 9 funcionando en software.
- [ ] Raspberry Pi Zero 2 W/WH
- [ ] Microfono, parlante, amplificador
- [ ] 2 botones fisicos
- [ ] LEDs de estado

### Fase 11 — Portable
- [ ] Bateria
- [ ] Wi-Fi en produccion
- [ ] Evaluar 4G/LTE

## Reglas adicionales

1. NUNCA subir .env al repositorio (ya en .gitignore).
2. SIEMPRE responder HTTP 200 a Meta en POST /webhook, incluso si hay errores internos.
3. NUNCA exponer WHATSAPP_TOKEN ni WEBHOOK_VERIFY_TOKEN en logs de produccion ni en frontend.
4. NO desconectar ni migrar el numero real de WhatsApp hasta que el flujo completo este probado.
5. Cada fase debe estar probada (tests o verificacion manual) antes de pasar a la siguiente.
6. Documentar en este archivo el avance marcando [x] las tareas completadas.
7. Cuando se introduzca un nuevo endpoint o handler, agregar su spec en /tests antes de implementarlo (TDD).

## Stack de referencia
- Node.js v22 + Express 5
- WhatsApp Cloud API (Meta)
- ngrok (para desarrollo local con HTTPS)
- Jest + Supertest (tests)
- dotenv, morgan

## Referencias
- Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api/
- Webhooks: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/
- About the platform: https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform
- Embedded Signup: https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/implementation/