// AuthContext.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { API_BASE_URL } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("botik_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("botik_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("botik_user");
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const payload = response.data;
      if (payload?.status) {
        const userData = payload.data || payload.user || null;
        if (userData) {
          setUser(userData);
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
        password,
        role: 'user',
      });
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
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
      changePassword, // ✅ expose it
       forgotPassword,   // expose
      resetPassword,    // expose
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);