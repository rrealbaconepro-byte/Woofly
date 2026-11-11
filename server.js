'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Search common deployment layouts. Your GitHub repository currently keeps
// index.html and style.css in its root, but public/ is also supported.
const rootsToCheck = [
  __dirname,
  path.join(__dirname, 'public'),
  path.join(__dirname, 'client'),
  path.join(__dirname, 'src'),
  process.cwd(),
  path.join(process.cwd(), 'public')
];

function uniqueExistingDirectories(directories) {
  return [...new Set(directories)].filter((dir) => {
    try { return fs.statSync(dir).isDirectory(); }
    catch { return false; }
  });
}

const searchDirectories = uniqueExistingDirectories(rootsToCheck);

function findFile(filename) {
  for (const directory of searchDirectories) {
    const candidate = path.join(directory, filename);
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch { /* Continue searching other supported locations. */ }
  }
  return null;
}

const indexFile = findFile('index.html');
const styleFile = findFile('style.css');

// Fail during startup instead of deploying a blank or broken website.
const missingFiles = [];
if (!indexFile) missingFiles.push('index.html');
if (!styleFile) missingFiles.push('style.css');

if (missingFiles.length) {
  console.error('\n[WOOFLY STARTUP ERROR] Required website file(s) not found: ' + missingFiles.join(', '));
  console.error('[WOOFLY] Checked these directories:');
  for (const directory of searchDirectories) console.error(' - ' + directory);
  console.error('[WOOFLY] Put index.html and style.css in the repository root or together in public/.\n');
  process.exit(1);
}

const siteDirectory = path.dirname(indexFile);
console.log('[WOOFLY] Found index.html: ' + indexFile);
console.log('[WOOFLY] Found style.css: ' + styleFile);
console.log('[WOOFLY] Serving website files from: ' + siteDirectory);

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.gstatic.com", "https://www.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.firebaseio.com', 'wss://*.firebaseio.com', 'https://identitytoolkit.googleapis.com', 'https://securetoken.googleapis.com'],
      frameSrc: ['https://*.firebaseapp.com', 'https://accounts.google.com'],
      fontSrc: ["'self'", 'data:']
    }
  }
}));

app.use(express.json({ limit: '20kb' }));
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));

// Firebase Web config is public by design. Never put service-account keys here.
app.get('/api/firebase-config', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || ''
  });
});

app.get('/health', (req, res) => res.json({ ok: true, service: 'woofly' }));

// Serve all assets beside index.html (app.js, images, etc.).
app.use(express.static(siteDirectory, {
  index: false,
  extensions: ['html'],
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
}));

// If CSS is in a different supported directory, still serve it at /style.css.
app.get('/style.css', (req, res) => res.sendFile(styleFile));

// Express 5-compatible fallback for the single-page website.
app.get('/{*splat}', (req, res) => res.sendFile(indexFile));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[WOOFLY] Server listening on port ${PORT}`);
});
