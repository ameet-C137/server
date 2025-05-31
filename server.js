const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const EXPIRATION_TIME = 30 * 1000; // 30 seconds
let registeredKeys = new Map(); // key => timestamp

app.get("/", (req, res) => {
  res.send("✅ Location Sharing Server is Running");
});

// Register key
app.post("/register-key", (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).send("Key is required.");
  registeredKeys.set(key, Date.now());
  console.log("✅ Registered key:", key.slice(0, 10), "...");
  res.send({ success: true });
});

// Accept key
app.post("/accept-key", (req, res) => {
  const { key } = req.body;
  const createdAt = registeredKeys.get(key);
  const now = Date.now();

  if (!createdAt || now - createdAt > EXPIRATION_TIME) {
    return res.status(404).send({ success: false, message: "Key not found or expired" });
  }

  registeredKeys.delete(key); // one-time use
  console.log("🔐 Accepted key:", key.slice(0, 10));
  res.send({ success: true });
});

// Clean expired keys every 10 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, time] of registeredKeys) {
    if (now - time > EXPIRATION_TIME) {
      registeredKeys.delete(key);
      console.log("🧹 Expired key removed:", key.slice(0, 10));
    }
  }
}, 10000);

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
