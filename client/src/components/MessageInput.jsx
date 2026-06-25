import { useState } from 'react';

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          className="flex-1 px-4 py-2.5 bg-gray-700 rounded-xl text-sm text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition-colors"
        >
          Send
        </button>
      </div>
    </form>
  );
}
