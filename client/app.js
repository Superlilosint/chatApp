const socket = io();
let currentRoom = null;
let currentUser = null;

// Join Room
function joinRoom() {
  const username = document.getElementById('username').value.trim();
  const room = document.getElementById('room').value.trim();

  if (!username || !room) {
    alert('Username and room name are required!');
    return;
  }

  currentUser = username;
  currentRoom = room;

  // Emit event to server
  socket.emit('join-room', room, username);

  // Hide login form, show chat interface
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('chatInterface').style.display = 'block';
  document.getElementById('roomName').textContent = `Room: ${room}`;

  // Fetch historical messages for the room
  fetch(`/rooms/${room}/messages`)
    .then(response => response.json())
    .then(messages => {
      messages.forEach(msg => displayMessage(msg.user, msg.text));
    });
}

// Send Message
function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();

  if (text) {
    socket.emit('send-message', currentRoom, text, currentUser);
    input.value = '';
  }
}

// Leave Room
function leaveRoom() {
  socket.emit('leave-room', currentRoom);
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('chatInterface').style.display = 'none';
  document.getElementById('messages').innerHTML = '';
  currentRoom = null;
  currentUser = null;
}

// Display a Message
function displayMessage(user, text) {
  const messagesDiv = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.innerHTML = `<strong>${user}:</strong> ${text}`;
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to bottom
}

// Socket Event Listeners
socket.on('message', (data) => {
  displayMessage(data.user, data.text);
});

socket.on('user-joined', (username) => {
  displayMessage('System', `${username} joined the room!`);
});

socket.on('user-left', (username) => {
  displayMessage('System', `${username} left the room!`);
});

socket.on('active-users', (users) => {
  const activeUsersList = document.getElementById('activeUsersList');
  activeUsersList.innerHTML = users.map(user => `<li>${user}</li>`).join('');
});