import { create } from 'zustand';
import { fetchApi } from '../lib/api';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  checkAuth: async () => {
    try {
      const user = await fetchApi('/api/users/me');
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    set({ user: null });
  },
}));

export default useAuthStore;
