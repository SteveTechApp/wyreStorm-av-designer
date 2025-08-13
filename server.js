/* eslint-disable */
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 3000;
const TRANSLATE_API_URL = process.env.TRANSLATE_API_URL || 'https://libretranslate.de';
const TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY || '';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory message history (last 50)
const messageHistory = [];

// Map of ws -> user info
const clientInfo = new Map();

function broadcast(jsonData) {
  const data = JSON.stringify(jsonData);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      try { client.send(data); } catch (_) {}
    }
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (e) {
      return;
    }

    if (msg.type === 'join') {
      const safeName = String(msg.name || 'Guest').slice(0, 32);
      const safeLang = String(msg.lang || 'en').slice(0, 8);
      clientInfo.set(ws, { name: safeName, lang: safeLang });
      ws.send(JSON.stringify({ type: 'hello', history: messageHistory }));
      return;
    }

    if (msg.type === 'message') {
      const info = clientInfo.get(ws) || { name: 'Guest', lang: 'en' };
      const trimmed = String(msg.text || '').trim();
      if (!trimmed) return;

      const chatMessage = {
        type: 'message',
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        name: info.name,
        sourceLang: info.lang,
        text: trimmed,
        ts: Date.now()
      };
      messageHistory.push(chatMessage);
      while (messageHistory.length > 50) messageHistory.shift();
      broadcast(chatMessage);
      return;
    }
  });

  ws.on('close', () => {
    clientInfo.delete(ws);
  });
});

app.post('/translate', async (req, res) => {
  try {
    const { q, source = 'auto', target } = req.body || {};
    if (!q || !target) {
      return res.status(400).json({ error: 'Missing q or target' });
    }

    const url = `${TRANSLATE_API_URL}/translate`;
    const body = {
      q,
      source,
      target,
      format: 'text'
    };
    if (TRANSLATE_API_KEY) body.api_key = TRANSLATE_API_KEY;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ error: 'Translate failed', details: text });
    }

    const data = await resp.json();
    // libretranslate returns { translatedText }
    return res.json({ translatedText: data.translatedText || '' });
  } catch (err) {
    return res.status(500).json({ error: 'Translate error', details: String(err) });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});