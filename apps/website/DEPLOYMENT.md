# Railway Deployment Guide

## 🚀 Despliegue en Railway

### Paso 1: Preparar el Repositorio

1. Asegúrate de que todos los archivos estén en el directorio `website/`
2. Verifica que el repositorio esté en GitHub/GitLab
3. Todos los archivos de configuración ya están incluidos

### Paso 2: Conectar a Railway

1. Ve a [Railway.app](https://railway.app)
2. Crea una nueva cuenta o inicia sesión
3. Haz clic en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Conecta tu repositorio de GitHub
6. Selecciona el repositorio `the_royal_barber`

### Paso 3: Configurar el Proyecto

1. **Directorio de despliegue**: `apps/website`
2. **Comando de inicio**: `npm start`
3. **Puerto**: Railway detectará automáticamente el puerto

### Paso 4: Variables de Entorno (Opcional)

Railway detectará automáticamente la configuración, pero puedes agregar variables si es necesario:

```bash
NODE_ENV=production
PORT=3000
```

### Paso 5: Despliegue Automático

- Cada push a `main` desplegará automáticamente
- Railway usará la configuración en `package.json`
- El sitio estará disponible en la URL proporcionada por Railway

## 📁 Archivos de Configuración

### `package.json`
- Define las dependencias (`serve`)
- Configura los scripts de inicio
- Especifica la versión de Node.js

### `railway.json`
- Configuración específica para Railway
- Health checks y políticas de reinicio
- Comando de inicio

### `static.json`
- Configuración para sitio estático
- Headers de seguridad
- Caché optimizado
- HTTPS forzado

### `nixpacks.toml`
- Configuración de Nixpacks
- Fases de instalación y construcción
- Comando de inicio

### `Procfile`
- Define el proceso web para Railway

## 🔧 Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Construcción
npm run build

# Inicio en producción
npm start

# Ver logs en Railway
railway logs

# Abrir en Railway
railway open
```

## 🛠️ Troubleshooting

### Error: "Module not found"
```bash
# Reinstalar dependencias
npm install
```

### Error: "Port already in use"
- Railway maneja automáticamente los puertos
- No necesitas configurar el puerto manualmente

### Error: "Build failed"
- Verifica que `package.json` esté en el directorio correcto
- Asegúrate de que todas las dependencias estén listadas

## 📊 Monitoreo

Railway proporciona:
- **Logs en tiempo real**
- **Métricas de rendimiento**
- **Health checks automáticos**
- **Alertas de errores**

## 🔒 Seguridad

El sitio incluye headers de seguridad:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 🚀 URLs de Producción

Una vez desplegado, tu sitio estará disponible en:
- `https://your-app-name.railway.app`
- Railway proporcionará una URL personalizada

## 📝 Notas Importantes

1. **HTTPS automático**: Railway proporciona SSL automáticamente
2. **CDN global**: Railway usa una CDN global para mejor rendimiento
3. **Escalado automático**: Se escala automáticamente según el tráfico
4. **Backups automáticos**: Railway hace backups automáticos de tu configuración

---

Para soporte técnico con Railway, consulta la [documentación oficial](https://docs.railway.app). 