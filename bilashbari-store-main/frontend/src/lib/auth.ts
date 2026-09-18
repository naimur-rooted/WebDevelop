import { useEffect, useState } from "react";

export type User = { id: number; name: string; email: string; role: "user" | "admin" };

const KEY_TOKEN = "bb_token";
const KEY_USER = "bb_user";
const EVT = "bb_auth_change";

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY_USER);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(token: string, user: User) {
  window.localStorage.setItem(KEY_TOKEN, token);
  window.localStorage.setItem(KEY_USER, JSON.stringify(user));
  window.dispatchEvent(new Event(EVT));
}

export function clearSession() {
  window.localStorage.removeItem(KEY_TOKEN);
  window.localStorage.removeItem(KEY_USER);
  window.dispatchEvent(new Event(EVT));
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    setUser(getUser());
    const h = () => setUser(getUser());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return user;
}
