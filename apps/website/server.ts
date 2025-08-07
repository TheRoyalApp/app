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
