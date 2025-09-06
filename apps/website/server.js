import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFileSync } from 'fs';

const app = new Hono();

// Helper function to safely read HTML files
const readHtmlFile = (filename) => {
  try {
    return readFileSync(filename, 'utf-8');
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return null;
  }
};

// Security headers middleware
app.use('*', async (c, next) => {
  c.header('X-Frame-Options', 'DENY');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  await next();
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Static file serving with caching
const staticOptions = { root: './', headers: { 'Cache-Control': 'public, max-age=31536000' } };
app.use('/assets/*', serveStatic(staticOptions));
app.use('*.css', serveStatic(staticOptions));
app.use('*.js', serveStatic({ root: './js', headers: staticOptions.headers }));

// HTML page routes
const htmlRoutes = [
  { path: '/privacy', file: 'privacy.html' },
  { path: '/terms', file: 'terms.html' },
  { path: '/delete-account', file: 'delete-account.html' }
];

htmlRoutes.forEach(({ path, file }) => {
  app.get(path, (c) => {
    const content = readHtmlFile(file);
    return content 
      ? c.html(content)
      : c.html(`<h1>${file.replace('.html', '').charAt(0).toUpperCase() + file.replace('.html', '').slice(1)} page not found</h1>`, 404);
  });
});

// Serve other static files
app.use('*', serveStatic({ root: './' }));

// SPA fallback
app.notFound((c) => {
  const content = readHtmlFile('index.html');
  return content 
    ? c.html(content)
    : c.html('<h1>Page not found</h1>', 404);
});

const port = process.env.PORT || 3000;

// Start server
console.log(`🚀 Server running on http://localhost:${port}`);
console.log(`📍 Routes: / /health /privacy /terms /delete-account`);

serve({
  fetch: app.fetch,
  port
}); 