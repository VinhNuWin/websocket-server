const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();

// Configuring CORS
app.use(
  cors({
    origin: "*", // Allowing all origins, customize based on your needs
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
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

// Handling new WebSocket connections
wss.on("connection", function connection(ws) {
  console.log("New client connected.");

  // Event listener for messages from clients
  ws.on("message", function incoming(message) {
    console.log(`Message received: ${message}`);

    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Handling connection closure
  ws.on("close", () => {
    console.log("Client disconnected");
  });

  // Send a welcome message to the client upon connection
  ws.send("Welcome, you are connected!");
});

// Optional: handle HTTP server close events
process.on("SIGTERM", () => {
  console.log("Shutting down server...");
  server.close(() => {
    console.log("Server has shut down.");
  });
});
