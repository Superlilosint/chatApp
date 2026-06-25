import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export default function RoomList({ currentRoom, onJoinRoom }) {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState('');

  useEffect(() => {
    fetchApi('/api/rooms')
      .then(setRooms)
      .catch(() => {});
  }, []);

  function handleCreate(e) {
    e.preventDefault();
    const name = newRoom.trim();
    if (!name) return;
    onJoinRoom(name);
    if (!rooms.find((r) => r.name === name)) {
      setRooms((prev) => [{ id: Date.now(), name }, ...prev]);
    }
    setNewRoom('');
  }

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            placeholder="New room name..."
            maxLength={50}
            className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-sm text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
          >
            +
          </button>
        </form>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onJoinRoom(room.name)}
            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition-colors ${
              currentRoom === room.name ? 'bg-gray-700 text-white' : 'text-gray-300'
            }`}
          >
            # {room.name}
          </button>
        ))}
        {rooms.length === 0 && (
          <p className="p-4 text-sm text-gray-500 text-center">
            No rooms yet. Create one above.
          </p>
        )}
      </div>
    </aside>
  );
}
