# 📚 API Documentation - The Royal Barber

Documentación completa de la API REST para The Royal Barber.

## 🚀 Información General

- **Base URL**: `http://localhost:8080` (development) / `https://api.theroyalbarber.com` (production)
- **Health Check**: `GET /health`
- **API Info**: `GET /`

## 🔐 Autenticación

### Endpoints de Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/signup` | Registrar usuario | No |
| POST | `/auth/signin` | Iniciar sesión | No |
| POST | `/auth/refresh` | Refrescar token | No |
| POST | `/auth/logout` | Cerrar sesión | No |
| DELETE | `/auth/delete-account` | Eliminar cuenta | Sí |

### Registro de Usuario

**POST** `/auth/signup`

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "customer"
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer"
    },
    "tokens": {
      "token": "jwt-access-token",
      "refreshToken": "jwt-refresh-token"
    }
  }
}
```

### Inicio de Sesión

**POST** `/auth/signin`

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Token Management

- **Access Token**: Expira en 7 días
- **Refresh Token**: Expira en 30 días
- **Headers**: `Authorization: Bearer <token>`

## 👥 Gestión de Usuarios

### Endpoints de Usuarios

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/users/profile` | Obtener perfil | Sí |
| PUT | `/users/profile` | Actualizar perfil | Sí |
| GET | `/users/staff` | Listar staff | Sí |

### Obtener Perfil

**GET** `/users/profile`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer",
    "phone": "+1234567890"
  }
}
```

## 🛠️ Servicios

### Endpoints de Servicios

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/services` | Listar servicios | No |
| GET | `/services/:id` | Obtener servicio | No |
| POST | `/services` | Crear servicio | Admin |
| PUT | `/services/:id` | Actualizar servicio | Admin |
| DELETE | `/services/:id` | Eliminar servicio | Admin |

### Listar Servicios

**GET** `/services`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Corte Clásico",
      "description": "Corte tradicional",
      "price": 25.00,
      "duration": 30,
      "isActive": true
    }
  ]
}
```

### Crear Servicio

**POST** `/services`

```json
{
  "name": "Corte Moderno",
  "description": "Corte con estilo moderno",
  "price": 30.00,
  "duration": 45
}
```

## 📅 Horarios y Disponibilidad

### Endpoints de Horarios

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/schedules/availability` | Obtener disponibilidad | No |
| GET | `/schedules/barber/:id` | Horarios del barbero | No |
| POST | `/schedules/set-schedule` | Configurar horario | Staff |
| PUT | `/schedules/:id` | Actualizar horario | Staff |

### Obtener Disponibilidad

**GET** `/schedules/availability?barberId=uuid&date=15/01/2024`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "date": "15/01/2024",
    "availableSlots": [
      "09:00", "10:00", "11:00", "14:00", "15:00"
    ],
    "bookedSlots": [
      "12:00", "13:00", "16:00"
    ]
  }
}
```

## 📋 Citas

### Endpoints de Citas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/appointments` | Crear cita | Sí |
| GET | `/appointments/user/me` | Mis citas | Sí |
| GET | `/appointments/:id` | Obtener cita | Sí |
| PUT | `/appointments/:id` | Actualizar cita | Sí |
| DELETE | `/appointments/:id` | Cancelar cita | Sí |
| POST | `/appointments/:id/reschedule` | Reprogramar | Sí |

### Crear Cita

**POST** `/appointments`

```json
{
  "barberId": "uuid",
  "serviceId": "uuid",
  "appointmentDate": "15/01/2024",
  "timeSlot": "14:00",
  "notes": "Corte con estilo"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "appointmentDate": "15/01/2024",
    "timeSlot": "14:00",
    "status": "pending",
    "barber": {
      "id": "uuid",
      "name": "John Barber"
    },
    "service": {
      "id": "uuid",
      "name": "Corte Clásico",
      "price": 25.00
    }
  }
}
```

### Estados de Cita

- `pending`: Pendiente de confirmación
- `confirmed`: Confirmada
- `completed`: Completada
- `cancelled`: Cancelada

## 💳 Pagos

### Endpoints de Pagos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/payments` | Crear pago | Sí |
| GET | `/payments/user/me` | Mis pagos | Sí |
| GET | `/payments/:id` | Obtener pago | Sí |
| POST | `/payments/create-intent` | Crear intent | Sí |
| POST | `/payments/:id/confirm` | Confirmar pago | Sí |
| POST | `/payments/:id/cancel` | Cancelar pago | Sí |

### Crear Pago

**POST** `/payments`

```json
{
  "appointmentId": "uuid",
  "amount": 2500,
  "paymentMethod": "stripe"
}
```

### Webhook de Stripe

**POST** `/payments/webhook`

Maneja eventos de Stripe:
- `checkout.session.completed`: Confirma cita automáticamente
- `payment_intent.succeeded`: Actualiza estado de pago
- `payment_intent.payment_failed`: Maneja fallos de pago

## 📱 Notificaciones

### Endpoints de Notificaciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/notifications/send-sms` | Enviar SMS | Sí |
| POST | `/notifications/send-whatsapp` | Enviar WhatsApp | Sí |
| GET | `/notifications/status` | Estado de servicios | No |

### Enviar SMS

**POST** `/notifications/send-sms`

```json
{
  "phone": "+1234567890",
  "message": "Tu cita está confirmada para mañana a las 14:00"
}
```

## 🔒 Seguridad

### Rate Limiting

- **General**: 100 requests/minuto
- **Autenticación**: 5 requests/15 minutos
- **Citas**: 10 requests/minuto
- **Pagos**: 20 requests/minuto

### Headers de Seguridad

- `X-RateLimit-Limit`: Límite de requests
- `X-RateLimit-Remaining`: Requests restantes
- `X-RateLimit-Reset`: Tiempo de reset

### CORS

Orígenes permitidos:
- `exp://localhost:8081`
- `exp://localhost:19000`
- `exp://192.168.1.*:8081`
- `http://localhost:3000`

## 📊 Respuestas

### Formato Estándar

**Éxito:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Mensaje de error",
  "details": { ... }
}
```

### Códigos de Estado

- `200`: Éxito
- `201`: Creado
- `400`: Error de validación
- `401`: No autorizado
- `403`: Prohibido
- `404`: No encontrado
- `409`: Conflicto
- `429`: Rate limit
- `500`: Error interno

## 🧪 Testing

### Ejecutar Tests

```bash
# Tests completos
bun run test:production

# Tests específicos
bun run test:appointments
bun run test:auth
```

### Ejemplos de Usuarios

Ver [admin_staff_example_users.md](./admin_staff_example_users.md) para usuarios de testing.

## 📞 Soporte

- **Logs**: `apps/api/logs/`
- **Health Check**: `GET /health`
- **Documentación**: Esta carpeta
- **Issues**: Repositorio del proyecto

---

*Para más detalles específicos, consulta los archivos individuales de esta documentación.* 