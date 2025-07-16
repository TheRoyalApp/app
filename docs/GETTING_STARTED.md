# 🚀 Getting Started - The Royal Barber

Esta guía te ayudará a configurar y ejecutar el proyecto The Royal Barber desde cero.

## 📋 Prerrequisitos

- **Node.js**: v18 o superior
- **Bun**: v1.0 o superior
- **PostgreSQL**: v12 o superior
- **Git**: Para clonar el repositorio

## 🛠️ Instalación

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd the_royal_barber
```

### 2. Instalar Dependencias
```bash
# Instalar dependencias del workspace
bun install

# O usar pnpm
pnpm install
```

### 3. Configurar Variables de Entorno

#### Backend (API)
```bash
cd apps/api
cp env.example .env
```

Editar `apps/api/.env`:
```env
# Base de datos
DATABASE_URL=postgresql://username:password@localhost:5432/the_royal_barber

# JWT Secrets (generar con: openssl rand -base64 64)
JWT_SECRET=tu-secret-super-seguro
REFRESH_SECRET=tu-refresh-secret-super-seguro
INTERNAL_API_SECRET=tu-internal-secret

# Stripe (obtener de Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_tu_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret

# Twilio (obtener de Twilio Console)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Entorno
NODE_ENV=development
PORT=8080
```

#### Frontend (App)
```bash
cd apps/app
cp env.example .env
```

Editar `apps/app/.env`:
```env
# API URL
EXPO_PUBLIC_API_URL=http://localhost:8080

# Stripe (Frontend)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_tu_stripe_key
```

### 4. Configurar Base de Datos

```bash
cd apps/api

# Ejecutar migraciones
bun run db:migrate

# Verificar esquema
bun run db:studio
```

### 5. Ejecutar el Proyecto

#### Desarrollo
```bash
# Ejecutar backend y frontend simultáneamente
bun run dev

# O por separado
bun run dev:api      # Backend en puerto 8080
bun run dev:mobile   # Frontend con Expo
```

#### Producción
```bash
# Backend
cd apps/api
bun run start

# Frontend
cd apps/app
expo build
```

## 🧪 Testing

### Ejecutar Tests
```bash
# Tests del backend
cd apps/api
bun run test:production

# Tests del frontend
cd apps/app
bun test
```

### Verificar Configuración
```bash
# Health check
curl http://localhost:8080/health

# API info
curl http://localhost:8080/
```

## 📱 Configuración de la App Móvil

### Deep Links
La app está configurada para manejar deep links para pagos:
- `app://payment/success` - Pago exitoso
- `app://payment/failed` - Pago fallido

### Permisos
- **Cámara**: Para escanear códigos QR
- **Notificaciones**: Para recordatorios de citas
- **Almacenamiento**: Para datos offline

## 🔧 Servicios Externos

### Stripe
1. Crear cuenta en [Stripe Dashboard](https://dashboard.stripe.com/)
2. Obtener API keys en Settings > API keys
3. Configurar webhooks para `/payments/webhook`

### Twilio
1. Crear cuenta en [Twilio Console](https://console.twilio.com/)
2. Obtener Account SID y Auth Token
3. Verificar número de teléfono

## 🚨 Troubleshooting

### Problemas Comunes

#### Base de Datos
```bash
# Verificar conexión
psql $DATABASE_URL -c "SELECT 1;"

# Resetear base de datos
bun run db:push
```

#### API
```bash
# Verificar logs
tail -f logs/all.log

# Test de conectividad
curl http://localhost:8080/health
```

#### App Móvil
```bash
# Limpiar cache
expo start --clear

# Resetear Metro
npx react-native start --reset-cache
```

### Logs y Debugging
- **Backend**: Logs en `apps/api/logs/`
- **Frontend**: Console logs en desarrollo
- **Stripe**: Webhook logs en dashboard
- **Twilio**: SMS logs en console

## 📚 Próximos Pasos

1. **Configurar Producción**: Seguir [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
2. **Entender la API**: Revisar [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
3. **Configurar Servicios**: Ver [SERVICES_SETUP.md](./SERVICES_SETUP.md)
4. **Testing**: Ejecutar suite completa de tests

## 🆘 Soporte

- **Documentación**: Revisar archivos en `docs/`
- **Issues**: Crear issue en el repositorio
- **Debugging**: Usar logs y herramientas de debugging

---

*¿Necesitas ayuda? Revisa la documentación específica en esta carpeta.* 