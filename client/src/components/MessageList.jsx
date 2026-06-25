import { useEffect, useRef } from 'react';

export default function MessageList({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.system ? 'justify-center' : ''}`}
        >
          {msg.system ? (
            <span className="text-xs text-gray-500 italic">{msg.text}</span>
          ) : (
            <>
              {msg.avatar ? (
                <img
                  src={msg.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full mt-0.5 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full mt-0.5 shrink-0 bg-indigo-600 flex items-center justify-center text-xs font-bold">
                  {msg.user?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm text-white">{msg.user}</span>
                  {msg.createdAt && (
                    <span className="text-xs text-gray-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-sm break-words">{msg.text}</p>
              </div>
            </>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
