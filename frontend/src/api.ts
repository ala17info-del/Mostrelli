import { storage } from "@/src/utils/storage";
import { demoApi } from "@/src/demoApi";

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;
export const TOKEN_KEY = "auth_token";

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await storage.secureGet<string | null>(TOKEN_KEY, null);
  if (process.env.EXPO_PUBLIC_DEMO === "1") return demoApi<T>(path, init, token);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = (data as any).detail;
    throw new Error(typeof d === "string" ? d : Array.isArray(d) ? "Dati non validi (email o password troppo corta)" : "Errore di rete");
  }
  return data as T;
}
