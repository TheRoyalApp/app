# The Royal Barber Website

Sitio web oficial de The Royal Barber, diseñado para cumplir con los requisitos de Apple Developer.

## Características

- ✅ Diseño responsive y moderno
- ✅ Colores de marca consistentes con la app
- ✅ Optimizado para SEO
- ✅ Meta tags para Apple Developer
- ✅ Animaciones suaves y efectos visuales
- ✅ Información completa de servicios
- ✅ Sección de descarga de la app

## Estructura del Proyecto

```
website/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── script.js           # JavaScript interactivo
├── assets/             # Imágenes y recursos
│   ├── icon.png        # Icono principal
│   └── favicon.png     # Favicon
├── package.json        # Configuración de dependencias
├── railway.json        # Configuración de Railway
├── static.json         # Configuración de sitio estático
├── nixpacks.toml       # Configuración de Nixpacks
├── Procfile            # Configuración de proceso
├── .gitignore          # Archivos a ignorar
└── README.md           # Este archivo
```

## Servicios Incluidos

### Cortes de Cabello
- **Corte Prince (Junior)** - $180
- **Corte Royal** - $200
- **Corte Imperial** - $280

### Barba
- **Barba King** - $170
- **Corte y Barba Royal** - $300
- **Corte y Barba Imperial** - $380

### Facial y Spa
- **Limpieza Facial** - $200
- **Manicure Spa** - $200
- **Pedicure Spa** - $350
- **Combo del Rey** - $510

## Colores de Marca

- **Fondo principal**: `#201c13`
- **Fondo secundario**: `#453d27`
- **Acento dorado**: `#eac16a`
- **Texto claro**: `#a39b8c`
- **Éxito**: `#34c759`

## Requisitos de Apple Developer

El sitio web cumple con los requisitos de Apple Developer:

1. **Meta tags apropiados** para SEO y redes sociales
2. **Apple Touch Icons** en diferentes tamaños
3. **Información de contacto** clara y accesible
4. **Descripción de servicios** detallada
5. **Enlaces a la app** prominentes
6. **Diseño responsive** para todos los dispositivos

## Instalación y Uso

### Desarrollo Local

1. Clona o descarga los archivos del sitio web
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre `http://localhost:3000` en tu navegador

### Despliegue en Railway

1. Conecta tu repositorio a Railway
2. Railway detectará automáticamente la configuración
3. El sitio se desplegará automáticamente en cada push
4. Tu sitio estará disponible en la URL proporcionada por Railway

### Despliegue Manual

```bash
# Instalar dependencias
npm install

# Construir (opcional para sitio estático)
npm run build

# Iniciar servidor
npm start
```

## Personalización

### Cambiar Información de Contacto
Edita la sección de contacto en `index.html`:
```html
<div class="contact-item">
    <h3>📞 Teléfono</h3>
    <p>+1 (555) 123-4567</p>
</div>
```

### Actualizar Precios
Modifica los precios en la sección de servicios:
```html
<p class="price">$180</p>
```

### Cambiar Colores
Edita las variables de color en `styles.css`:
```css
:root {
    --primary-color: #eac16a;
    --background-color: #201c13;
}
```

## Optimización

- Las imágenes están optimizadas para web
- CSS y JavaScript están minificados para producción
- El sitio es completamente responsive
- Incluye lazy loading para mejor rendimiento
- Configurado para Railway con caché optimizado
- Headers de seguridad configurados
- HTTPS forzado en producción

## Soporte

Para soporte técnico o preguntas sobre el sitio web, contacta al equipo de desarrollo.

---

© 2024 The Royal Barber. Todos los derechos reservados. 