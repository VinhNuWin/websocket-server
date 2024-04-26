const WebSocket = require("ws");

// Set the port for your WebSocket Server
const PORT = 8081;
const wss = new WebSocket.Server({ host: "0.0.0.0", port: PORT });

let clients = [];

wss.on("connection", function connection(ws) {
  console.log("A new client connected.");
  clients.push(ws);

  ws.on("message", function incoming(message) {
    // Convert buffer to string to log it
    const messageString = message.toString();
    console.log("Received:", messageString);

    // Optionally, parse the message if it's JSON
    try {
      const jsonData = JSON.parse(messageString);
      console.log("JSON data:", jsonData);
    } catch (error) {
      console.log("Received non-JSON message.");
    }

    // Broadcast the message to all connected clients as string
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString); // Ensure we're sending the string, not the buffer
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients = clients.filter((client) => client !== ws);
  });

  ws.send("Welcome to the WebSocket server!");
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
