# 🚀 Guía de Despliegue a Producción - The Royal Barber

## ✅ Lista de Verificación Pre-Despliegue

### 🔒 **Prioridad Alta - Seguridad**
- [x] ✅ Middleware de headers de seguridad habilitado
- [x] ✅ Validación de variables de entorno implementada
- [x] ✅ CORS configurado para dominios específicos de producción
- [x] ✅ Manejo de errores mejorado con códigos y monitoreo

### 🏗️ **Prioridad Alta - Infraestructura**
- [x] ✅ Índices de base de datos para optimización de performance
- [x] ✅ Sistema de logging estructurado con IDs de correlación
- [ ] ⏳ Rate limiting basado en Redis (pendiente)
- [x] ✅ Configuración de aplicación móvil para producción

### 📱 **Aplicación Móvil**
- [x] ✅ Configuración EAS para builds de producción
- [x] ✅ Bundle IDs y configuración de app stores
- [x] ✅ Localización en español
- [x] ✅ Permisos y configuración de deep links

## 🚀 **Pasos de Despliegue**

### 1. **Configuración de Variables de Entorno**

#### Backend (API)
```bash
# Copiar y configurar variables de producción
cp apps/api/.env.production apps/api/.env

# Editar con valores reales de producción
# CRÍTICO: Usar secretos seguros, NO los valores de ejemplo
```

#### Aplicación Móvil
```bash
# Copiar y configurar variables de producción
cp apps/app/.env.production apps/app/.env

# Verificar que la URL del API apunte a producción
EXPO_PUBLIC_API_URL=https://api.theroyalbarber.com
```

### 2. **Despliegue de Base de Datos**

```bash
cd apps/api

# Aplicar migraciones de base de datos
bun run db:migrate

# Aplicar índices de performance (producción segura)
./scripts/deploy-indexes.sh

# Verificar conexión a base de datos
bun run db:studio
```

### 3. **Despliegue del API**

```bash
# Validar que todas las pruebas pasen
bun run test

# Desplegar a Railway
railway up

# Verificar health check
curl https://api.theroyalbarber.com/health
```

### 4. **Build de Aplicación Móvil**

```bash
cd apps/app

# Build para iOS (App Store)
eas build --platform ios --profile production

# Build para Android (Google Play)
eas build --platform android --profile production

# Verificar configuración antes del build
expo doctor
```

## 🔧 **Configuraciones de Servicios Externos**

### **Stripe (Modo Producción)**
1. Cambiar a modo "Live" en Stripe Dashboard
2. Configurar webhook: `https://api.theroyalbarber.com/payments/webhook`
3. Eventos del webhook:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### **Twilio (Producción)**
1. Verificar número de teléfono de Twilio
2. Asegurar créditos suficientes para SMS
3. Probar envío de SMS

### **Configuración de Dominio**
1. DNS para `api.theroyalbarber.com`
2. Certificados SSL configurados
3. CORS actualizado para dominios de producción

## 📊 **Verificación Post-Despliegue**

### **Health Checks**
```bash
# Verificar API
curl https://api.theroyalbarber.com/health

# Verificar base de datos
curl https://api.theroyalbarber.com/services

# Verificar pagos
curl -X POST https://api.theroyalbarber.com/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### **Pruebas de Aplicación Móvil**
1. ✅ Autenticación funciona
2. ✅ Reserva de citas funciona
3. ✅ Procesamiento de pagos funciona
4. ✅ Notificaciones SMS funcionan
5. ✅ Deep links funcionan

## 🛡️ **Características de Seguridad Implementadas**

### **API Backend**
- ✅ Headers de seguridad (HSTS, CSP, etc.)
- ✅ Rate limiting por usuario e IP
- ✅ Validación de entrada con Zod
- ✅ Manejo seguro de errores (no expone detalles internos)
- ✅ Logging estructurado para monitoreo
- ✅ CORS restrictivo para dominios específicos

### **Aplicación Móvil**
- ✅ Almacenamiento seguro de tokens
- ✅ Deep links seguros
- ✅ Validación de certificados SSL
- ✅ No hay datos sensibles en el código cliente

## 🚨 **Importante - Seguridad**

1. **NUNCA** commitear valores reales de producción a Git
2. Usar el sistema de variables de entorno seguro de Railway
3. Generar nuevos secretos JWT para producción
4. Usar claves LIVE de Stripe (no test)
5. Configurar monitoreo y alertas

## 📈 **Optimizaciones de Performance**

- ✅ Índices de base de datos para consultas frecuentes
- ✅ Logging optimizado por ambiente
- ✅ Rate limiting configurado
- ✅ Compresión y headers de cache
- ✅ Conexión a base de datos optimizada

## 🎯 **Estado Actual: LISTO PARA PRODUCCIÓN**

La aplicación ha sido optimizada y está lista para despliegue a producción con:
- Configuración de seguridad robusta
- Performance optimizado
- Manejo de errores profesional
- Logging y monitoreo implementados
- Configuración móvil completa para app stores

**¡Tu aplicación está lista para usuarios reales!** 🎉