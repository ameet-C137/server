const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Simulate a store of valid keys
let validKeys = new Set();

app.get('/', (req, res) => {
  res.send('✅ WebSocket Server is Running');
});

app.post('/register-key', (req, res) => {
  const { key } = req.body;
  if (key) {
    validKeys.add(key);
    res.json({ status: 'registered' });
  } else {
    res.status(400).json({ status: 'failed' });
  }
});

app.post('/accept-key', (req, res) => {
  const { key } = req.body;
  if (validKeys.has(key)) {
    res.json({ status: 'accepted' });
  } else {
    res.status(404).json({ status: 'rejected' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🔌 Client connected');

  ws.on('message', (message) => {
    // Optionally broadcast
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected');
  });
});
