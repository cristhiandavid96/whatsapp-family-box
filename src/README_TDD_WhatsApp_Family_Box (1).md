# WhatsApp Family Box — TDD / Contexto y Roadmap

## Contexto
Proyecto para crear una caja de mensajes para un niño de 3 años, sin pantalla.

Funcionamiento:
- Botón 1: mantener presionado → grabar voz → soltar → enviar audio.
- Botón 2: presionar → reproducir mensaje recibido.
- Micrófono, parlante y LEDs.
- Primera versión por Wi-Fi.
- Futuro: batería y posiblemente 4G/LTE.

## Decisiones
NO comprar hardware todavía.

Hardware futuro:
- Raspberry Pi Zero 2 W / Zero 2 WH.
- Micrófono.
- Parlante + amplificador si hace falta.
- 2 botones.
- LEDs.
- Batería.

No usar Raspberry Pi 4/5 ni Pico W para el primer prototipo.

## Meta / WhatsApp
SIM comprada y WhatsApp Business creado.

App de Meta:
- Nombre: `Cristhian's first app`
- App ID: `251511322042262`

WABAs:
- `Speaking-family` → objetivo real.
- `Test WhatsApp Business Account` → pruebas.

Ya se realizó una prueba exitosa con el número de prueba de Meta: desde un número externo se envió un mensaje tipo "pedido confirmado" y llegó correctamente.

El número real de la SIM ya está registrado en WhatsApp Business. Meta mostró:
"Este número de teléfono ya está registrado con una cuenta de WhatsApp. Para continuar, migra este número de teléfono o desconéctalo de esa cuenta."

NO desconectar ni borrar el número real todavía.

Queremos investigar/usar Coexistence para mantener WhatsApp Business en el teléfono y Cloud API simultáneamente.

No esperar 7 días para desarrollar el software: podemos trabajar desde ahora con la WABA de prueba. Los requisitos de Coexistence deben verificarse cuando llegue el momento de conectar el número real.

## UI actual de Meta
Ruta:
Mi app → Casos de uso → WhatsApp Business

Submenú:
- Configuración básica
  - Pruébalo
  - Configuración prod.
  - Verificación negocio
  - Próximos pasos
- Conviértete en socio
- Otras herramientas
  - Herramientas
    - Prueba la API
    - WhatsApp Business
      - Info de la cuenta
      - Plantilla mensajes
      - WhatsApp Flows
      - Números de teléfono

En Números de teléfono solo aparece el número de prueba `+1 555-1977608`.

No se encontró Facebook Login for Business en ese menú.

El usuario encontró:
https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/implementation/#step-2-create-a-facebook-login-for-business-configuration

## Backend actual
Carpeta creada:
`whatsapp-family-box`

Ya ejecutado:
```bash
mkdir whatsapp-family-box
cd whatsapp-family-box
npm init -y
npm install express
```

Stack:
- Node.js
- TypeScript
- Express
- WhatsApp Cloud API
- Webhooks
- ngrok durante desarrollo

## Objetivo técnico
Primero usar la WABA/número de prueba.

Flujo:
WhatsApp test → Meta Cloud API → Webhook → Node.js → lógica de mensajes/audio

En sentido inverso:
Node.js → WhatsApp Cloud API → audio/mensaje

Después conectar el número real mediante Embedded Signup/Coexistence.

## TDD / fases

### Fase 1 — Backend mínimo
Crear:
- `src/server.ts`
- `.env`
- `.gitignore`

Endpoints:
- `GET /webhook`
- `POST /webhook`

GET debe responder al challenge de Meta.
POST debe recibir y registrar payloads.

Criterio de aceptación:
Meta verifica el webhook y un mensaje enviado al número de prueba aparece en la terminal.

### Fase 2 — HTTPS local
Configurar ngrok:
Internet → ngrok HTTPS → localhost:3000

Meta necesita una URL HTTPS pública para Webhooks.

### Fase 3 — Webhooks en Meta
Configurar:
- Callback URL
- Verify Token
- campo `messages`

Suscribir la WABA de prueba.

### Fase 4 — Mensajes de texto
Detectar:
- remitente
- texto
- message ID
- timestamp

### Fase 5 — Audio entrante
Detectar audio → obtener media ID → descargar audio → guardar temporalmente → reproducir.

### Fase 6 — Audio saliente
Backend → subir audio → Cloud API → enviar audio al número destino.

### Fase 7 — Simulador de caja
Interfaz web:
- HABLAR
- ESCUCHAR
- estado de conexión
- mensajes

### Fase 8 — Familia y seguridad
Definir:
- familiares autorizados
- remitente/destinatario
- mensajes
- audio
- estados
- timestamps

Solo números autorizados podrán interactuar con la caja.
Nunca exponer tokens en frontend.

### Fase 9 — Número real
Configurar Embedded Signup / Coexistence.
No migrar/desconectar el número hasta confirmar el flujo correcto.

### Fase 10 — Hardware
Solo cuando el software funcione:
- Raspberry Pi Zero 2 W/WH
- micrófono
- parlante
- amplificador si hace falta
- botones
- LEDs
- alimentación

### Fase 11 — Portable
Primero batería + Wi-Fi.
Después evaluar 4G/LTE.

## Arquitectura
```text
                    WhatsApp
                       ↕
              WhatsApp Cloud API
                       ↕
                  Webhook/API
                       ↕
              ┌────────────────┐
              │ Node.js        │
              │ TypeScript     │
              └───────┬────────┘
                      │
              ┌───────┴────────┐
              │                │
            Audio           Mensajes
              │                │
              └───────┬────────┘
                      │
                 Caja física
                      │
             ┌────────┴────────┐
             │                 │
          Micrófono          Parlante
             │                 │
        Botón HABLAR      Botón ESCUCHAR
```

## Estado
COMPLETADO:
- SIM comprada.
- WhatsApp Business creado.
- App Meta creada.
- Caso de uso WhatsApp configurado.
- WABA de prueba disponible.
- Prueba de envío/recepción exitosa.
- Carpeta creada.
- npm init ejecutado.
- Express instalado.

EN PROGRESO:
- Webhook.
- Backend Node.js.

PENDIENTE:
- ngrok.
- webhook funcional.
- recepción de mensajes.
- recepción de audio.
- envío de audio.
- simulador web.
- Embedded Signup/Coexistence.
- verificación de negocio si Meta la exige.
- Raspberry Pi.
- batería.
- versión portable.

## Siguiente paso exacto
No seguir buscando Facebook Login for Business en "Otras herramientas → Herramientas" si no aparece.

Construir primero el webhook con la WABA de prueba.

Luego ngrok y conexión con Meta.

## Referencias
- Embedded Signup:
https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/implementation/
- Cloud API:
https://developers.facebook.com/docs/whatsapp/cloud-api/
- Meta Postman Embedded Signup:
https://www.postman.com/meta/whatsapp-business-platform/documentation/du6gzjv/embedded-signup
- Meta Postman Webhook Payload:
https://www.postman.com/meta/whatsapp-business-platform/folder/tduohwq/webhook-payload-reference

## Continuación en otro chat
Pegar este README y decir:
"Continuemos WhatsApp Family Box desde este README. El siguiente paso es Fase 1: crear el webhook Node.js."

No asumir como completado nada que no esté marcado COMPLETADO.
