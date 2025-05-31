const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory key storage (auto-reset on server restart)
let registeredKeys = new Set();

// Health check route for Render
app.get("/", (req, res) => {
  res.send("✅ Location Sharing Server is Running");
});

// Register public key
app.post("/register-key", (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).send("Key is required.");
  registeredKeys.add(key);
  console.log("Registered key:", key.slice(0, 10), "...");
  res.send({ success: true });
});

// Accept peer-scanned key
app.post("/accept-key", (req, res) => {
  const { key } = req.body;
  if (registeredKeys.has(key)) {
    console.log("Key accepted:", key.slice(0, 10), "...");
    res.send({ success: true });
  } else {
    res.status(404).send({ success: false, message: "Key not found." });
  }
});

// Create HTTP + WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Manage connected clients
let clients = [];

wss.on("connection", (ws) => {
  console.log("🔗 New WebSocket connection");
  clients.push(ws);

  ws.on("message", (message) => {
    // Broadcast encrypted message to other clients
    for (let client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  });

  ws.on("close", () => {
    clients = clients.filter((client) => client !== ws);
    console.log("❌ WebSocket disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
