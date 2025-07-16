# 🔧 Services Setup - The Royal Barber

Guía completa para configurar todos los servicios externos necesarios para The Royal Barber.

## 📋 Servicios Requeridos

1. **Stripe** - Procesamiento de pagos
2. **Twilio** - SMS y WhatsApp
3. **PostgreSQL** - Base de datos
4. **Expo** - Desarrollo móvil

## 💳 Stripe Configuration

### 1. Crear Cuenta Stripe

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/)
2. Crea una cuenta nueva
3. Completa la verificación de identidad

### 2. Obtener API Keys

1. Ve a **Settings > API keys**
2. Copia las siguientes keys:

```env
# Development (Test Keys)
STRIPE_SECRET_KEY=sk_test_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Production (Live Keys)
STRIPE_SECRET_KEY=sk_live_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 3. Configurar Webhooks

1. Ve a **Developers > Webhooks**
2. Crea un nuevo endpoint:
   - **URL**: `https://your-api.com/payments/webhook`
   - **Events**: Selecciona estos eventos:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`

3. Copia el webhook secret:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Configurar Productos

Ejecuta el script de configuración:

```bash
cd apps/api
bun run setup-stripe-products
```

Esto creará:
- Productos para cada servicio
- Precios en MXN
- Configuración de impuestos

## 📱 Twilio Configuration

### 1. Crear Cuenta Twilio

1. Ve a [Twilio Console](https://console.twilio.com/)
2. Crea una cuenta nueva
3. Verifica tu número de teléfono

### 2. Obtener Credenciales

1. Ve a **Console Dashboard**
2. Copia las credenciales:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
```

### 3. Configurar Número de Teléfono

1. Ve a **Phone Numbers > Manage > Active numbers**
2. Compra un número o usa el trial
3. Configura el número:

```env
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

### 4. Configurar WhatsApp (Opcional)

1. Ve a **Messaging > Try it out > Send a WhatsApp message**
2. Sigue las instrucciones para conectar WhatsApp Business API
3. Actualiza la configuración:

```env
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

## 🗄️ PostgreSQL Configuration

### 1. Instalar PostgreSQL

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows
Descarga desde [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE the_royal_barber;

# Crear usuario (opcional)
CREATE USER royal_barber_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE the_royal_barber TO royal_barber_user;

# Salir
\q
```

### 3. Configurar Conexión

```env
# Development
DATABASE_URL=postgresql://username:password@localhost:5432/the_royal_barber

# Production
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/prod_db
```

### 4. Ejecutar Migraciones

```bash
cd apps/api

# Ejecutar migraciones
bun run db:migrate

# Verificar esquema
bun run db:studio
```

## 📱 Expo Configuration

### 1. Instalar Expo CLI

```bash
npm install -g @expo/cli
```

### 2. Configurar Proyecto

```bash
cd apps/app

# Instalar dependencias
bun install

# Configurar variables de entorno
cp env.example .env
```

### 3. Configurar Deep Links

Editar `app.json`:

```json
{
  "expo": {
    "scheme": "app",
    "ios": {
      "bundleIdentifier": "com.theroyalbarber.app",
      "associatedDomains": ["applinks:theroyalbarber.com"]
    },
    "android": {
      "package": "com.theroyalbarber.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "app",
              "host": "payment",
              "pathPrefix": "/success"
            },
            {
              "scheme": "app",
              "host": "payment",
              "pathPrefix": "/failed"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## 🔐 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/the_royal_barber

# JWT
JWT_SECRET=your-super-secure-jwt-secret
REFRESH_SECRET=your-super-secure-refresh-secret
INTERNAL_API_SECRET=your-internal-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Server
NODE_ENV=development
PORT=8080
API_BASE_URL=http://localhost:8080

# Features
DISABLE_SMS=false
ENABLE_NOTIFICATIONS=true
DEBUG_MODE=false
```

### Frontend (.env)

```env
# API
EXPO_PUBLIC_API_URL=http://localhost:8080

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Features
EXPO_PUBLIC_ENABLE_SMS_AUTH=true
EXPO_PUBLIC_ENABLE_PAYMENTS=true
EXPO_PUBLIC_DEBUG_MODE=false
```

## 🧪 Testing Configuration

### Stripe Test Mode

```env
# Usar test keys para desarrollo
STRIPE_SECRET_KEY=sk_test_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Twilio Test Mode

```env
# Deshabilitar SMS en desarrollo
DISABLE_SMS=true
NODE_ENV=development
```

### Test Database

```env
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/the_royal_barber_test
```

## 🚀 Production Deployment

### 1. Configurar Producción

```env
# Cambiar a producción
NODE_ENV=production
DISABLE_SMS=false
DEBUG_MODE=false

# Usar live keys
STRIPE_SECRET_KEY=sk_live_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 2. Verificar Servicios

```bash
# Verificar Stripe
curl -X POST https://api.stripe.com/v1/payment_intents \
  -H "Authorization: Bearer sk_live_..." \
  -d "amount=1000" \
  -d "currency=mxn"

# Verificar Twilio
curl -X POST https://api.twilio.com/2010-04-01/Accounts/AC.../Messages.json \
  -u "AC...:auth_token" \
  -d "To=+1234567890" \
  -d "From=+1234567890" \
  -d "Body=Test message"
```

### 3. Monitoreo

- **Stripe**: Dashboard > Analytics
- **Twilio**: Console > Monitor > Logs
- **Database**: Logs en `apps/api/logs/`
- **API**: Health check en `/health`

## 🔍 Troubleshooting

### Stripe Issues

```bash
# Verificar webhook
stripe listen --forward-to localhost:8080/payments/webhook

# Test payment
stripe payment_intents create --amount=1000 --currency=mxn
```

### Twilio Issues

```bash
# Verificar credenciales
curl -X GET https://api.twilio.com/2010-04-01/Accounts/AC.../Messages.json \
  -u "AC...:auth_token"
```

### Database Issues

```bash
# Verificar conexión
psql $DATABASE_URL -c "SELECT 1;"

# Resetear base de datos
bun run db:push
```

## 📞 Soporte

- **Stripe**: [Documentación](https://stripe.com/docs)
- **Twilio**: [Documentación](https://www.twilio.com/docs)
- **PostgreSQL**: [Documentación](https://www.postgresql.org/docs/)
- **Expo**: [Documentación](https://docs.expo.dev/)

---

*¿Problemas? Revisa los logs y la documentación específica de cada servicio.* 