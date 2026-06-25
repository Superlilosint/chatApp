import { useEffect, useState, useCallback, useRef } from 'react';
import { socket } from '../lib/socket';

export default function useSocket(roomName) {
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [connected, setConnected] = useState(socket.connected);
  const roomRef = useRef(roomName);
  roomRef.current = roomName;

  useEffect(() => {
    if (!roomName) return;

    if (!socket.connected) socket.connect();

    function onConnect() {
      setConnected(true);
      socket.emit('join-room', roomRef.current);
    }

    function onDisconnect() {
      setConnected(false);
    }

    function onMessage(data) {
      setMessages((prev) => [...prev, data]);
    }

    function onUserJoined({ displayName }) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: `${displayName} joined the room`, user: 'System', system: true },
      ]);
    }

    function onUserLeft({ displayName }) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: `${displayName} left the room`, user: 'System', system: true },
      ]);
    }

    function onActiveUsers(users) {
      setActiveUsers(users);
    }

    function onError({ error }) {
      console.error('Socket error:', error);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message', onMessage);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('active-users', onActiveUsers);
    socket.on('error-message', onError);

    if (socket.connected) {
      socket.emit('join-room', roomName);
    }

    return () => {
      socket.emit('leave-room', roomName);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message', onMessage);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('active-users', onActiveUsers);
      socket.off('error-message', onError);
      setMessages([]);
      setActiveUsers([]);
    };
  }, [roomName]);

  const sendMessage = useCallback(
    (text) => {
      if (text.trim() && roomName) {
        socket.emit('send-message', roomName, text.trim());
      }
    },
    [roomName]
  );

  return { messages, activeUsers, connected, sendMessage, setMessages };
}
