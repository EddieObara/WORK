// File: server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// MongoDB connection
mongoose.connect('mongodb+srv://Eddie:EddieBello@cluster0.5lvnz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  socketId: String
});

const Message = mongoose.model('Message', messageSchema);

// Serve static files for the entire portfolio
app.use(express.static(path.join(__dirname)));

// Redirect root to the main portfolio page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve chatapp.html at route "/chat"
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'projects', 'theprojects', 'chat', 'chatapp.html'));
});

const users = {};
const userColors = {};
const COLORS = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe'];

function assignColor(socketId) {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  userColors[socketId] = color;
  return color;
}

io.on('connection', async (socket) => {
  const messages = await Message.find().sort({ timestamp: 1 }).limit(100);
  socket.emit('chat-history', messages);

  socket.on('new-user', username => {
    users[socket.id] = username;
    assignColor(socket.id);
    socket.broadcast.emit('user-connected', { name: username, color: userColors[socket.id] });
  });

  socket.on('send-chat-message', async (message) => {
    const name = users[socket.id] || 'Anonymous';
    const color = userColors[socket.id] || '#000';
    const newMsg = new Message({ name, message, socketId: socket.id });
    await newMsg.save();

    // ✅ Keep io.emit so sender also receives the message once
    io.emit('chat-message', { name, message, color, id: newMsg._id });
  });

  socket.on('delete-message', async (msgId) => {
    const message = await Message.findById(msgId);
    if (message && message.socketId === socket.id) {
      await Message.findByIdAndDelete(msgId);
      io.emit('message-deleted', msgId);
    }
  });

  socket.on('disconnect', () => {
    if (users[socket.id]) {  // ✅ Guard against undefined user
      socket.broadcast.emit('user-disconnected', users[socket.id]);
      delete users[socket.id];
      delete userColors[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
