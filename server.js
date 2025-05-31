const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const EXPIRATION_TIME = 30 * 1000; // 30 seconds

app.use(cors());
app.use(express.json());

const sessions = new Map(); // sessionId => { key, createdAt }

app.get("/", (req, res) => {
  res.send("✅ Location Sharing Server is Running");
});

// Create session when QR is generated
app.post("/create-session", (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).send("Key is required");

  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { key, createdAt: Date.now() });

  res.send({ sessionId });
});

// Peer accepts session
app.post("/consume-session", (req, res) => {
  const { sessionId } = req.body;
  const session = sessions.get(sessionId);

  if (!session || Date.now() - session.createdAt > EXPIRATION_TIME) {
    return res.status(404).send({ success: false, message: "Invalid or expired session" });
  }

  sessions.delete(sessionId); // one-time use
  res.send({ success: true, key: session.key });
});

// Clean expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > EXPIRATION_TIME) {
      sessions.delete(id);
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
