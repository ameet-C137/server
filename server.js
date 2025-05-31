const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let registeredKeys = new Set();

// Root health check
app.get("/", (req, res) => {
  res.send("✅ Location Sharing Server is Running");
});

// Register a public key
app.post("/register-key", (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).send("Key is required.");
  registeredKeys.add(key);
  console.log("✅ Registered key:", key.slice(0, 10), "...");
  res.send({ success: true });
});

// Accept a peer's scanned key
app.post("/accept-key", (req, res) => {
  const { key } = req.body;
  if (registeredKeys.has(key)) {
    console.log("🔐 Accepted key:", key.slice(0, 10), "...");
    res.send({ success: true });
  } else {
    res.status(404).send({ success: false, message: "Key not found" });
  }
});

// WebSocket setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on("connection", (ws) => {
  console.log("🔗 WebSocket client connected");
  clients.push(ws);

  ws.on("message", (message) => {
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);
    console.log("❌ WebSocket disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
