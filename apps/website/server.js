import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = new Hono();

// Security headers middleware
app.use('*', async (c, next) => {
  c.header('X-Frame-Options', 'DENY');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  await next();
});

// Serve static assets with caching
app.use('/assets/*', serveStatic({ root: './', headers: { 'Cache-Control': 'public, max-age=31536000' } }));
app.use('*.css', serveStatic({ root: './', headers: { 'Cache-Control': 'public, max-age=31536000' } }));
app.use('*.js', serveStatic({ root: './', headers: { 'Cache-Control': 'public, max-age=31536000' } }));

// Specific route for privacy page
app.get('/privacy', (c) => {
  try {
    const privacyContent = readFileSync(join(process.cwd(), 'privacy.html'), 'utf-8');
    return c.html(privacyContent);
  } catch (error) {
    return c.html('<h1>Privacy page not found</h1>', 404);
  }
});

// Serve all other static files
app.use('*', serveStatic({ root: './' }));

// SPA fallback - serve index.html for unmatched routes
app.notFound((c) => {
  try {
    const indexContent = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
    return c.html(indexContent);
  } catch (error) {
    return c.html('<h1>Page not found</h1>', 404);
  }
});

const port = process.env.PORT || 3000;

console.log(`\n   ┌───────────────────────────────────────────┐`);
console.log(`   │                                           │`);
console.log(`   │   Serving!                                │`);
console.log(`   │                                           │`);
console.log(`   │   - Local:    http://localhost:${port}       │`);
console.log(`   │   - Network:  http://0.0.0.0:${port}         │`);
console.log(`   │                                           │`);
console.log(`   │   Routes:                                  │`);
console.log(`   │   - /         → index.html                │`);
console.log(`   │   - /privacy  → privacy.html              │`);
console.log(`   │   - /*        → index.html (SPA)          │`);
console.log(`   │                                           │`);
console.log(`   └───────────────────────────────────────────┘\n`);

serve({
  fetch: app.fetch,
  port
}); 