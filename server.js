const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

// Store valid keys here
const validKeys = new Set();

// Register a new key for a session
app.post('/register-key', (req, res) => {
  const { key } = req.body;
  if (key && !validKeys.has(key)) {
    validKeys.add(key);
    console.log(`Registered key: ${key}`);
    res.json({ status: 'registered' });
  } else {
    res.status(400).json({ status: 'error', message: 'Invalid or duplicate key' });
  }
});

// Validate a key on scanner connection
app.post('/accept-key', (req, res) => {
  const { key } = req.body;
  if (validKeys.has(key)) {
    res.json({ status: 'accepted' });
  } else {
    res.status(404).json({ status: 'rejected' });
  }
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    // Broadcast message to all except sender
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});
