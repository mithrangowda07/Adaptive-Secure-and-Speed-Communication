require("dotenv").config();
const path = require("path");
const fs = require("fs");
const http = require("http");
const cors = require("cors");
const express = require("express");
const { Server } = require("socket.io");
require("./database/db");

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const networkRoutes = require("./routes/networkRoutes");
const registerSocketHandlers = require("./sockets/socketHandler");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
app.set("io", io);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/", authRoutes);
app.use("/messages", messageRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/network", networkRoutes);
app.use("/simulate", networkRoutes);

registerSocketHandlers(io);

const PORT = Number(process.env.PORT || 5000);
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on port ${PORT}`);
});
