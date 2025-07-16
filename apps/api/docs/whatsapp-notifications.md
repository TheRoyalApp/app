# Sistema de Notificaciones WhatsApp con Twilio

Este sistema permite enviar notificaciones automáticas vía WhatsApp para las citas de la barbería.

## Configuración

### Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=your_whatsapp_number_here
```

### Configuración de Twilio

1. Crea una cuenta en [Twilio](https://www.twilio.com/)
2. Obtén tu Account SID y Auth Token desde el dashboard
3. Configura WhatsApp Business API en tu cuenta de Twilio
4. Obtén tu número de WhatsApp Business

## Funcionalidades

### 1. Confirmación Automática de Citas

Cuando una cita se marca como `confirmed`, automáticamente se envía un mensaje de confirmación vía WhatsApp al cliente.

**Mensaje de confirmación incluye:**
- Nombre del cliente
- Servicio contratado
- Fecha y hora de la cita
- Nombre del barbero
- Ubicación

### 2. Recordatorios Automáticos

El sistema verifica cada minuto las citas confirmadas que están programadas en los próximos 15 minutos y envía recordatorios automáticos.

**Mensaje de recordatorio incluye:**
- Recordatorio de que la cita está en 15 minutos
- Detalles del servicio y hora
- Nombre del barbero
- Ubicación

## Endpoints de la API

### Pruebas y Testing

#### `GET /notifications/test-connection`
Prueba la conexión con Twilio.

**Respuesta exitosa:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "WhatsApp connection successful",
    "details": "Twilio credentials are valid and connection is working"
  }
}
```

#### `POST /notifications/test-message`
Envía un mensaje de prueba inmediatamente.

**Body:**
```json
{
  "phoneNumber": "+1234567890",
  "message": "Mensaje de prueba"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "Test message sent successfully",
    "messageId": "SM1234567890",
    "phoneNumber": "+1234567890"
  }
}
```

### Gestión de Citas

#### `POST /notifications/confirm/:appointmentId`
Envía manualmente un mensaje de confirmación para una cita específica.

#### `POST /notifications/remind/:appointmentId`
Envía manualmente un recordatorio para una cita específica.

#### `POST /notifications/check-reminders`
Ejecuta manualmente la verificación de recordatorios (útil para testing).

**Respuesta:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "Reminder check completed",
    "remindersSent": 2,
    "errors": [],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Health Check

#### `GET /notifications/health`
Verifica el estado del sistema de notificaciones.

**Respuesta:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "service": "WhatsApp Notifications",
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "environment": "development",
    "twilioConfigured": true
  }
}
```

## Cron Job

### Configuración Automática

Para que los recordatorios se envíen automáticamente, configura un cron job que ejecute el script cada minuto:

```bash
# Agregar al crontab (crontab -e)
*/1 * * * * cd /path/to/your/api && bun run cron:reminders
```

### Ejecución Manual

Para probar el sistema manualmente:

```bash
# Ejecutar el script de recordatorios
bun run cron:reminders

# O directamente
bun run src/scripts/reminder-cron.ts
```

## Integración con el Sistema de Citas

### Confirmación Automática

Cuando una cita se actualiza a estado `confirmed`, automáticamente se envía la notificación de confirmación:

```typescript
// En updateAppointmentStatus
if (status === 'confirmed') {
  const notificationResult = await sendAppointmentConfirmation(id);
  if (!notificationResult.success) {
    console.warn('Failed to send WhatsApp confirmation:', notificationResult.error);
  }
}
```

### Estructura de Datos

El sistema utiliza los siguientes campos de la base de datos:

- `appointments.id`: ID de la cita
- `appointments.status`: Estado de la cita (pending, confirmed, cancelled, completed)
- `appointments.appointmentDate`: Fecha y hora de la cita
- `appointments.timeSlot`: Hora específica de la cita
- `users.phone`: Número de teléfono del cliente
- `users.firstName`: Nombre del cliente
- `services.name`: Nombre del servicio
- `users.firstName` (barbero): Nombre del barbero

## Logging

El sistema registra todas las actividades en los logs:

- Envío exitoso de mensajes
- Errores de envío
- Verificación de recordatorios
- Estado del cron job

## Troubleshooting

### Problemas Comunes

1. **Variables de entorno faltantes**
   - Verifica que todas las variables de Twilio estén configuradas
   - Usa el endpoint `/notifications/health` para verificar la configuración

2. **Números de teléfono incorrectos**
   - Los números deben estar en formato internacional (+1234567890)
   - Verifica que el número esté registrado en WhatsApp

3. **Errores de Twilio**
   - Verifica las credenciales de Twilio
   - Revisa el saldo de tu cuenta de Twilio
   - Verifica que el número de WhatsApp esté aprobado

### Testing

1. **Probar conexión:**
   ```bash
   curl http://localhost:8080/notifications/test-connection
   ```

2. **Probar mensaje:**
   ```bash
   curl -X POST http://localhost:8080/notifications/test-message \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "+1234567890", "message": "Test message"}'
   ```

3. **Probar recordatorios:**
   ```bash
   curl -X POST http://localhost:8080/notifications/check-reminders
   ```

## Seguridad

- Las credenciales de Twilio se almacenan en variables de entorno
- Los mensajes se validan antes del envío
- Los errores se registran sin exponer información sensible
- El sistema no falla si las notificaciones fallan (graceful degradation) 