'use strict';
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

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
app.use('/api/', rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false }));

// Firebase Web config is public by design. Keep private service-account keys out of this app.
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
app.use(express.static(publicDir, { extensions: ['html'], maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));
app.get('/{*splat}', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`Woofly listening on ${PORT}`));
