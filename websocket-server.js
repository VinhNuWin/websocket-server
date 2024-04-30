const express = require("express");
const app = express();
const WebSocket = require("ws");
const cors = require("cors");

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

// Object to store client connections with unique identifiers
const clients = {};

// Counter for generating unique client IDs
let clientIdCounter = 1;

wss.on("connection", function connection(ws) {
  // Assign a unique identifier to the client
  const clientId = clientIdCounter++;
  console.log(`Client ${clientId} connected.`);

  // Store the WebSocket connection with the client ID
  clients[clientId] = ws;

  ws.on("message", function incoming(message) {
    console.log(`Received from client ${clientId}: ${message}`);

    // Check if the message is an acknowledgment
    if (message === "Data received") {
      console.log("Acknowledgment received, closing connection.");
      ws.close();
    } else {
      // Broadcast the message to other clients
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      console.log(`Broadcasted message to other clients: ${message}`);
    }
  });

  ws.on("close", () => {
    console.log(`Client ${clientId} disconnected`);
    // Remove the WebSocket connection associated with the client ID
    delete clients[clientId];
  });

  ws.send(`Welcome, you are client ${clientId}!`);
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping(null, false, true);
  });
}, 30000);

process.on("SIGTERM", () => {
  console.log("Process terminating...");
  // Close your database connections, stop background tasks, etc.

  // Close all WebSocket connections
  Object.values(clients).forEach((ws) => {
    ws.terminate(); // Terminate the WebSocket connection
  });

  server.close(() => {
    console.log("Process exited");
  });
});
