const express = require("express");
const app = express();
const WebSocket = require("ws");
const cors = require("cors");

// Configuring CORS
app.use(
  cors({
    // Optionally, specify allowed origins, methods, etc.
    origin: "*", // This allows all origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Customize based on your needs
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// A simple test route
app.get("/", (req, res) => res.send("Hello from WebSocket server"));

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

const wss = new WebSocket.Server({ server });

wss.on("connection", function connection(ws) {
  console.log("A new client connected.");
  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
    ws.send(`You sent -> ${message}`);
  });
  ws.on("close", () => console.log("Client disconnected"));
  ws.send("Welcome to the secure WebSocket server!");
});

process.on("SIGTERM", () => {
  console.log("Process terminating...");
  // Close your database connections, stop background tasks, etc.
  server.close(() => {
    console.log("Process exited");
  });
});
