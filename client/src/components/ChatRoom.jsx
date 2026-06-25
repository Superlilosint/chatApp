import { useEffect } from 'react';
import useSocket from '../hooks/useSocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';
import { fetchApi } from '../lib/api';

export default function ChatRoom({ roomName, onLeave }) {
  const { messages, activeUsers, connected, sendMessage, setMessages } = useSocket(roomName);

  useEffect(() => {
    fetchApi(`/api/rooms/${encodeURIComponent(roomName)}/messages`)
      .then((history) => setMessages(history))
      .catch(() => {});
  }, [roomName, setMessages]);

  return (
    <div className="flex-1 flex">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-white"># {roomName}</h2>
            {!connected && (
              <span className="text-xs px-2 py-0.5 bg-yellow-600 rounded-full">Reconnecting...</span>
            )}
          </div>
          <button
            onClick={onLeave}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Leave
          </button>
        </div>
        <MessageList messages={messages} />
        <MessageInput onSend={sendMessage} />
      </div>
      <UserList users={activeUsers} />
    </div>
  );
}
