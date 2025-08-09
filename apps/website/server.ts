import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFileSync } from 'fs';
import type { Context } from 'hono';

const app = new Hono();

// Helper function to safely read HTML files
const readHtmlFile = (filename: string): string | null => {
  try {
    return readFileSync(filename, 'utf-8');
  } catch (error) {
    console.error(`Error reading ${filename}:`, (error as Error).message);
    return null;
  }
};

// Security headers middleware
app.use('*', async (c: Context, next) => {
  c.header('X-Frame-Options', 'DENY');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  await next();
});

// Health check endpoint
app.get('/health', (c: Context) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Static file serving with caching
app.use('/assets/*', async (c: Context, next) => {
  c.header('Cache-Control', 'public, max-age=31536000');
  await next();
});

app.use('*.css', async (c: Context, next) => {
  c.header('Cache-Control', 'public, max-age=31536000');
  await next();
});

app.use('*.js', async (c: Context, next) => {
  c.header('Cache-Control', 'public, max-age=31536000');
  await next();
});

app.use('/assets/*', serveStatic({ root: './' }));
app.use('*.css', serveStatic({ root: './' }));
app.use('*.js', serveStatic({ root: './js' }));

// HTML page routes
interface HtmlRoute {
  path: string;
  file: string;
}

const htmlRoutes: HtmlRoute[] = [
  { path: '/privacy', file: 'privacy.html' },
  { path: '/terms', file: 'terms.html' }
];

htmlRoutes.forEach(({ path, file }) => {
  app.get(path, (c: Context) => {
    const content = readHtmlFile(file);
    if (content) {
      return c.html(content);
    }
    
    const pageName = file.replace('.html', '');
    const capitalizedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    return c.html(`<h1>${capitalizedPageName} page not found</h1>`, 404);
  });
});

// Dynamic pages for Stripe redirect that bounce into the mobile app via custom scheme
const createPaymentBounceHtml = (target: 'success' | 'failed', queryString: string) => {
  const appSchemeUrl = `app://payment/${target}${queryString ? `?${queryString}` : ''}`;
  const altSchemeUrl = `theroyalbarber://payment/${target}${queryString ? `?${queryString}` : ''}`;
  const title = target === 'success' ? 'Pago Exitoso' : 'Pago Fallido';
  const message = target === 'success'
    ? 'Redirigiendo de vuelta a la app para confirmar tu cita...'
    : 'Redirigiendo de vuelta a la app para mostrar el estado del pago...';

  // Try custom scheme immediately, fallback to clickable links and a message
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#0b0b0b; color:#f2f2f2; margin:0; padding:24px; }
    .card { max-width:640px; margin:0 auto; padding:24px; background:#151515; border:1px solid #2a2a2a; border-radius:12px; }
    h1 { margin-top:0; font-size:20px; }
    a.button { display:inline-block; margin:12px 8px 0 0; padding:12px 16px; background:#c5a15e; color:#0b0b0b; text-decoration:none; border-radius:8px; font-weight:600; }
    p { color:#bdbdbd; }
    code { background:#1e1e1e; padding:2px 6px; border-radius:6px; }
  </style>
  <script>
    (function() {
      var triedAlt = false;
      function tryOpen(url) { window.location.href = url; }
      // Try primary scheme, then alt after a short delay
      setTimeout(function(){ tryOpen('${appSchemeUrl}'); }, 50);
      setTimeout(function(){ if (!triedAlt) { triedAlt = true; tryOpen('${altSchemeUrl}'); } }, 450);
    })();
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${appSchemeUrl}">
  </noscript>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      <p>${message}</p>
      <p>Si no se abre automáticamente, puedes intentar manualmente:</p>
      <p>
        <a class="button" href="${appSchemeUrl}">Abrir en la app</a>
        <a class="button" href="${altSchemeUrl}">Abrir (alternativo)</a>
      </p>
      <p style="margin-top:16px; font-size:12px;">Si sigues viendo esta página, vuelve a la app y revisa tu historial.</p>
    </div>
  </body>
  </html>`;
};

app.get('/payment/success', (c: Context) => {
  const query = c.req.url.split('?')[1] || '';
  const html = createPaymentBounceHtml('success', query);
  return c.html(html);
});

app.get('/payment/failed', (c: Context) => {
  const query = c.req.url.split('?')[1] || '';
  const html = createPaymentBounceHtml('failed', query);
  return c.html(html);
});

// Serve other static files
app.use('*', serveStatic({ root: './' }));

// SPA fallback
app.notFound((c: Context) => {
  const content = readHtmlFile('index.html');
  return content 
    ? c.html(content)
    : c.html('<h1>Page not found</h1>', 404);
});

const port = Number(process.env.PORT) || 3000;

// Start server
console.log(`🚀 Server running on port: ${port}`);
console.log(`📍 Routes: / /health /privacy /terms`);

serve({
  fetch: app.fetch,
  port
});
