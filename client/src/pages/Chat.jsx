import { useState } from 'react';
import Header from '../components/Header';
import RoomList from '../components/RoomList';
import ChatRoom from '../components/ChatRoom';

export default function Chat() {
  const [currentRoom, setCurrentRoom] = useState(null);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <RoomList currentRoom={currentRoom} onJoinRoom={setCurrentRoom} />
        <main className="flex-1 flex">
          {currentRoom ? (
            <ChatRoom roomName={currentRoom} onLeave={() => setCurrentRoom(null)} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center space-y-2">
                <p className="text-4xl">💬</p>
                <p className="text-lg">Select or create a room to start chatting</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
