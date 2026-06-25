import useAuthStore from '../store/useAuthStore';

export default function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
      <h1 className="text-lg font-semibold text-white">ChatApp</h1>
      {user && (
        <div className="flex items-center gap-3">
          {user.avatar && (
            <img
              src={user.avatar}
              alt=""
              className="w-8 h-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="text-sm text-gray-300">{user.displayName}</span>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
