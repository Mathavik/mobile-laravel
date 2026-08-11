// AuthContext.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

// 🔥 Minimal session reference only — the full user is ALWAYS fetched fresh
// from the backend (`/auth/get_user`), never read from localStorage.
const getSession = () => {
  try {
    const raw = localStorage.getItem("botik_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSession);
  const [loading, setLoading] = useState(false);

  // 🔥 On app load: pull the logged-in user's details from the backend
  useEffect(() => {
    const session = getSession();
    if (!session || !session.id || !session.role) return;

    setLoading(true);
    api.get("/auth/get_user", { params: { id: session.id, role: session.role } })
      .then((res) => {
        if (res.data.status) {
          setUser({ ...res.data.data, role: res.data.role });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const payload = response.data;
      if (payload?.status) {
        const userData = payload.data || payload.user || null;
        if (userData) {
          setUser({ ...userData, role: payload.role || userData.role });
          // Store ONLY the minimal session reference — no full user details
          localStorage.setItem('botik_user', JSON.stringify({
            id: userData.id,
            role: payload.role || userData.role || '',
          }));
          localStorage.setItem('token', payload.active_token || '');
        }
      }
      return payload;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, phone, address, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        phone,
        address,
        password,
        role: 'user',
      });
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // 🔥 Clear the active_token in the users table on the backend
      const session = user && user.id ? user : getSession();
      if (session && session.id && session.role) {
        await api.post('/auth/logout', { id: session.id, role: session.role });
      }
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("botik_user");
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateProfile = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/update_profile', {
        user_id: user.id,
        name: userData.name,
        phone: userData.phone,
        address: userData.address,
      });
      if (response.data?.status || response.data?.success) {
        setUser(response.data.data || { ...user, ...userData });
      }
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/change_password', {
        user_id: user.id,
        current_password: currentPassword,
        new_password: newPassword,
      });
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot_password', { email });
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, newPassword, confirmPassword) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/reset_password', {
        token,
        password: newPassword,
        confirm_password: confirmPassword,
      });
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      forgotPassword,
      resetPassword,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
