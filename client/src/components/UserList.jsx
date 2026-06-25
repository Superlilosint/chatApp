export default function UserList({ users }) {
  return (
    <aside className="w-56 bg-gray-800 border-l border-gray-700 p-4 hidden lg:block">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Online — {users.length}
      </h3>
      <div className="space-y-2">
        {users.map((user, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
                  {user.displayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-800" />
            </div>
            <span className="text-sm text-gray-300 truncate">{user.displayName}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
