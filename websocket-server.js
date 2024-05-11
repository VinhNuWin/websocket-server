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

app.get("/", (req, res) => res.send("Hello from WebSocket server"));

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

const wss = new WebSocket.Server({ server });

let unityClient = null;
let pendingMessages = []; // Store messages temporarily if Unity client is not ready

wss.on("connection", function connection(ws) {
  console.log("New client connected.");

  ws.on("message", (message) => {
    console.log("Received:", message);
    try {
      const parsedMessage = JSON.parse(message);

      if (validateMessage(parsedMessage)) {
        if (
          parsedMessage.type === "register" &&
          parsedMessage.client === "unity"
        ) {
          // Register the Unity client
          unityClient = ws;
          console.log("Unity client registered.");
          sendPendingMessages(); // Send any messages that were held while the Unity client was not connected
        } else {
          // Handle other messages normally
          if (unityClient && unityClient.readyState === WebSocket.OPEN) {
            unityClient.send(JSON.stringify(parsedMessage));
            console.log("Message sent to Unity client.");
          } else {
            console.log("Unity client not ready, storing message.");
            pendingMessages.push(parsedMessage); // Store messages if Unity client is not ready
          }
        }
      }
    } catch (error) {
      console.error("Failed to parse message as JSON:", error);
    }
  });

  ws.on("close", function close() {
    if (ws === unityClient) {
      unityClient = null; // Clear the Unity client reference if it disconnects
      console.log("Unity client disconnected.");
    }
    console.log("Client disconnected");
  });

  ws.on("error", function error(err) {
    console.error("WebSocket error: ", err);
  });

  ws.send(
    JSON.stringify({ type: "welcome", message: "Welcome, you are connected!" })
  );
});

function validateMessage(message) {
  return message && message.type;
}

function sendPendingMessages() {
  if (unityClient && unityClient.readyState === WebSocket.OPEN) {
    pendingMessages.forEach((msg) => unityClient.send(JSON.stringify(msg)));
    pendingMessages = []; // Clear the pending messages after sending
    console.log("Pending messages sent to Unity client.");
  }
}

process.on("SIGTERM", () => {
  console.log("Shutting down server...");
  server.close(() => {
    console.log("Server has shut down.");
  });
});

// const express = require("express");
// const WebSocket = require("ws");
// const cors = require("cors");

// const app = express();

// // Configuring CORS
// app.use(
//   cors({
//     origin: "*", // Allowing all origins, customize based on your needs
//     methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// // A simple test route
// app.get("/", (req, res) => res.send("Hello from WebSocket server"));

// const server = app.listen(process.env.PORT || 3000, () => {
//   console.log(`Server is running on port ${process.env.PORT || 3000}`);
// });

// const wss = new WebSocket.Server({ server });

// // Handling new WebSocket connections
// wss.on("connection", function connection(ws) {
//   console.log("New client connected.");

//   // Event listener for messages from clients

//   ws.on("message", (message) => {
//     console.log("Received:", message);

//     // Broadcast to other clients
//     wss.clients.forEach((client) => {
//       if (client !== ws && client.readyState === WebSocket.OPEN) {
//         client.send(JSON.stringify(message));
//       }
//     });

//     return message;
//   });

//   ws.on("close", function close() {
//     console.log("Disconnected");
//   });

//   ws.on("error", function error(err) {
//     console.error("WebSocket error: ", err);
//   });

//   // Handling connection closure
//   ws.on("close", () => {
//     console.log("Client disconnected");
//   });

//   // Send a welcome message to the client upon connection
//   ws.send("Welcome, you are connected!");
// });

// // Optional: handle HTTP server close events
// process.on("SIGTERM", () => {
//   console.log("Shutting down server...");
//   server.close(() => {
//     console.log("Server has shut down.");
//   });
// });
