const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();

const wss = new WebSocket.Server({ server });

let messages = [];

wss.on('connection', (ws) => {
  console.log('New client connected');

  // Send message history to the newly connected client
  ws.send(JSON.stringify({ type: 'history', messages }));

  // Listen for messages from the client
  ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.type === 'message') {
      messages.push(data); 

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }

    if (data.type === 'edit') {
      messages = messages.map((msg) =>
        msg.id === data.id ? { ...msg, text: data.text } : msg
      );

      // Broadcast the edited message to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }

    // Handle message deletion
    if (data.type === 'delete') {
      messages = messages.filter((msg) => msg.id !== data.id);

      // Notify all clients that the message was deleted
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

// Start the HTTP/WebSocket server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
