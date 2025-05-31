const WebSocket = require('ws');
const express = require('express');
const app = express();

// Use a default port or the one provided by Render
const PORT = process.env.PORT || 3000;

// Basic GET route to confirm server is running
app.get('/', (req, res) => {
  res.send('Live location WebSocket server is up and running!');
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

// Set up WebSocket server
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', (ws) => {
  console.log('🔌 New client connected');
  clients.push(ws);

  ws.on('message', (message) => {
    console.log(`📨 Message received: ${message}`);

    // Broadcast message to all other clients
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected');
    clients = clients.filter(client => client !== ws);
  });
});
