// File: chat.js

const socket = io();

const usernameContainer = document.getElementById('username-container');
const chatContainer = document.getElementById('chat-container');
const usernameInput = document.getElementById('username');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');

let username = '';

function joinChat() {
  username = usernameInput.value.trim();
  if (username === '') return;

  socket.emit('new-user', username);
  usernameContainer.classList.add('hidden');
  chatContainer.classList.remove('hidden');
}

messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message === '') return;

  appendMessage(`You: ${message}`);
  socket.emit('send-chat-message', message);
  messageInput.value = '';
});

socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`);
});

socket.on('user-connected', name => {
  appendMessage(`${name} joined the chat`);
});

socket.on('user-disconnected', name => {
  appendMessage(`${name} left the chat`);
});

function appendMessage(message) {
  const msgDiv = document.createElement('div');
  msgDiv.textContent = message;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
