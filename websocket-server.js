const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");
const axios = require("axios");

const app = express();
const ADB_SERVER_URL = "https://adb-api-server-43e9c48c4f66.herokuapp.com/";

// Hardcoded values for testing
const HARDCODED_DEVICE_ID = "2G0YC1ZF93023M";
const HARDCODED_DEEPLINK_URL = "craftlab://open?sceneId=homefeed";

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
        handleADBCommand(); // Call handleADBCommand without parameters for hardcoding

        if (
          parsedMessage.type === "register" &&
          parsedMessage.client === "unity"
        ) {
          unityClient = ws;
          console.log("Unity client registered.");
          sendPendingMessages();
        } else {
          if (unityClient && unityClient.readyState === WebSocket.OPEN) {
            unityClient.send(JSON.stringify(parsedMessage));
            console.log("Message sent to Unity client.");
          } else {
            console.log("Unity client not ready, storing message.");
            pendingMessages.push(parsedMessage);
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

function handleADBCommand() {
  // Use hardcoded values for testing
  const deviceId = HARDCODED_DEVICE_ID;
  const deepLinkUrl = HARDCODED_DEEPLINK_URL;

  axios
    .post(ADB_SERVER_URL, { deviceId, deepLinkUrl })
    .then((response) => {
      console.log("ADB Command executed:", response.data);
      if (unityClient && unityClient.readyState === WebSocket.OPEN) {
        unityClient.send(
          JSON.stringify({ type: "adb-response", data: response.data })
        );
        console.log("Response sent to Unity client.");
      }
    })
    .catch((error) => {
      console.error("Error executing ADB command:", error);
      if (unityClient && unityClient.readyState === WebSocket.OPEN) {
        unityClient.send(
          JSON.stringify({
            type: "adb-error",
            message: "ADB command failed",
            error: error.message,
          })
        );
        console.log("Error response sent to Unity client.");
      }
    });
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
// const axios = require("axios");

// const app = express();
// const ADB_SERVER_URL = "https://adb-api-server-43e9c48c4f66.herokuapp.com/";

// // Configuring CORS
// app.use(
//   cors({
//     origin: "*", // Allowing all origins, customize based on your needs
//     methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// app.get("/", (req, res) => res.send("Hello from WebSocket server"));

// const server = app.listen(process.env.PORT || 3000, () => {
//   console.log(`Server is running on port ${process.env.PORT || 3000}`);
// });

// const wss = new WebSocket.Server({ server });

// let unityClient = null;
// let pendingMessages = []; // Store messages temporarily if Unity client is not ready

// wss.on("connection", function connection(ws) {
//   console.log("New client connected.");

//   ws.on("message", (message) => {
//     console.log("Received:", message);
//     try {
//       const parsedMessage = JSON.parse(message);

//       if (validateMessage(parsedMessage)) {
//         if (
//           parsedMessage.type === "register" &&
//           parsedMessage.client === "unity"
//         ) {
//           // Register the Unity client
//           unityClient = ws;
//           console.log("Unity client registered.");
//           sendPendingMessages(); // Send any messages that were held while the Unity client was not connected
//         } else {
//           // Handle other messages normally
//           if (unityClient && unityClient.readyState === WebSocket.OPEN) {
//             unityClient.send(JSON.stringify(parsedMessage));
//             console.log("Message sent to Unity client.");
//           } else {
//             console.log("Unity client not ready, storing message.");
//             pendingMessages.push(parsedMessage); // Store messages if Unity client is not ready
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Failed to parse message as JSON:", error);
//     }
//   });

//   ws.on("close", function close() {
//     if (ws === unityClient) {
//       unityClient = null; // Clear the Unity client reference if it disconnects
//       console.log("Unity client disconnected.");
//     }
//     console.log("Client disconnected");
//   });

//   ws.on("error", function error(err) {
//     console.error("WebSocket error: ", err);
//   });

//   ws.send(
//     JSON.stringify({ type: "welcome", message: "Welcome, you are connected!" })
//   );
// });

// function validateMessage(message) {
//   return message && message.type;
// }

// function sendPendingMessages() {
//   if (unityClient && unityClient.readyState === WebSocket.OPEN) {
//     pendingMessages.forEach((msg) => unityClient.send(JSON.stringify(msg)));
//     pendingMessages = []; // Clear the pending messages after sending
//     console.log("Pending messages sent to Unity client.");
//   }
// }

// function handleADBCommand(message) {
//   // Construct and send a request to your ADB server
//   const { deviceId, deepLinkUrl } = message;
//   axios
//     .post(ADB_SERVER_URL, { deviceId, deepLinkUrl })
//     .then((response) => {
//       console.log("ADB Command executed:", response.data);
//       broadcast({ type: "adb-response", data: response.data });
//     })
//     .catch((error) => {
//       console.error("Error executing ADB command:", error);
//       broadcast({
//         type: "adb-error",
//         message: "ADB command failed",
//         error: error.message,
//       });
//     });
// }

// process.on("SIGTERM", () => {
//   console.log("Shutting down server...");
//   server.close(() => {
//     console.log("Server has shut down.");
//   });
// });
