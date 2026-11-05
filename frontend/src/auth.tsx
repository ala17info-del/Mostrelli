import React, { createContext, useContext, useEffect, useState } from "react";

import { api, TOKEN_KEY } from "@/src/api";
import { storage } from "@/src/utils/storage";

type User = { id: string; email: string };
type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginApple: (identityToken: string, email: string | null, fullName: string | null) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.secureGet<string | null>(TOKEN_KEY, null).then((t) => {
      if (!t) return setLoading(false);
      api<User>("/auth/me")
        .then(setUser)
        .catch(() => storage.secureRemove(TOKEN_KEY))
        .finally(() => setLoading(false));
    });
  }, []);

  const handle = async (path: string, email: string, password: string) => {
    const r = await api<{ token: string; user: User }>(path, {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    await storage.secureSet(TOKEN_KEY, r.token);
    setUser(r.user);
  };

  const value: AuthCtx = {
    user,
    loading,
    login: (e, p) => handle("/auth/login", e, p),
    register: (e, p) => handle("/auth/register", e, p),
    loginApple: async (identityToken, email, fullName) => {
      const r = await api<{ token: string; user: User }>("/auth/apple", {
        method: "POST",
        body: JSON.stringify({ identity_token: identityToken, email, full_name: fullName }),
      });
      await storage.secureSet(TOKEN_KEY, r.token);
      setUser(r.user);
    },
    logout: async () => {
      await storage.secureRemove(TOKEN_KEY);
      setUser(null);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthProvider mancante");
  return v;
}
