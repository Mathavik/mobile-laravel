import { useSyncExternalStore } from "react";
import api from "../services/api";

/* ── Minimal session (id + role only) — full user always fetched from backend ── */
const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

let state = { user: getSession(), loading: false };
const listeners = new Set();

const emit = () => listeners.forEach((l) => l());

const setState = (partial) => {
  state = typeof partial === "function" ? partial(state) : { ...state, ...partial };
  emit();
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const fetchUser = async () => {
  const session = getSession();
  if (!session.id || !session.role) return null;

  setState({ loading: true });
  try {
    const res = await api.get("/auth/get_user", {
      params: { id: session.id, role: session.role },
    });
    if (res.data.status) {
      const user = { ...res.data.data, role: res.data.role };
      setState({ user, loading: false });
      return user;
    }
  } catch (err) {
    console.error(err);
  }
  setState({ loading: false });
  return null;
};

const setUser = (user) => setState({ user });

const logout = () => {
  localStorage.clear();
  setState({ user: {} });
};

/* Hook for components */
export function useAuthStore() {
  const snapshot = useSyncExternalStore(subscribe, () => state);
  return { ...snapshot, fetchUser, setUser, logout };
}

/* Imperative access (Login, logout handlers, etc.) */
useAuthStore.getState = () => ({ ...state, fetchUser, setUser, logout });
useAuthStore.fetchUser = fetchUser;
useAuthStore.logout = logout;
