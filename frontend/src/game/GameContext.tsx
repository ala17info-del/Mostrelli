import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

import { MAPS } from "./data";
import { makeMon, Mon } from "./engine";

export type Save = {
  name: string;
  map: string;
  x: number;
  y: number;
  dir: "up" | "down" | "left" | "right";
  party: Mon[];
  box: Mon[];
  seen: string[];
  caught: string[];
  money: number;
  items: Record<string, number>;
  defeated: string[];
  badges: string[];
  lastHeal: { map: string; x: number; y: number };
};

export function newSave(name: string, starter: string): Save {
  return {
    name, map: "bologna", x: 7, y: 7, dir: "down",
    party: [makeMon(starter, 5)], box: [],
    seen: [starter], caught: [starter],
    money: 150, items: { vasetto: 5, brodino: 3, tortellini: 1, caffe: 1 },
    defeated: [], badges: [],
    lastHeal: { map: "bologna", ...MAPS.bologna.heal },
  };
}

type SyncState = "saved" | "saving" | "error";
type Ctx = {
  save: Save | null;
  loading: boolean;
  sync: SyncState;
  setSave: (u: Save | ((s: Save) => Save)) => void;
  flush: () => Promise<void>;
  reset: () => Promise<void>;
  loadError: boolean;
  reload: () => void;
};

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [save, setSaveState] = useState<Save | null>(null);
  const [loading, setLoading] = useState(false);
  const [sync, setSync] = useState<SyncState>("saved");
  const [loadError, setLoadError] = useState(false);
  const latest = useRef<Save | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    if (!latest.current) return;
    setSync("saving");
    try {
      await api("/save", { method: "PUT", body: JSON.stringify({ state: latest.current }) });
      setSync("saved");
    } catch {
      setSync("error");
    }
  }, []);

  const setSave = useCallback(
    (u: Save | ((s: Save) => Save)) => {
      setSaveState((prev) => {
        const next = typeof u === "function" ? (prev ? u(prev) : prev) : u;
        latest.current = next;
        return next;
      });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 2500);
    },
    [flush],
  );

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    api<{ state: Save | null }>("/save")
      .then((r) => {
        latest.current = r.state;
        setSaveState(r.state);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      latest.current = null;
      setSaveState(null);
      setLoadError(false);
      return;
    }
    load();
  }, [user, load]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active") flush();
    });
    const doc = (globalThis as any).document;
    const onHide = () => {
      if (doc?.visibilityState === "hidden") flush();
    };
    doc?.addEventListener?.("visibilitychange", onHide);
    return () => {
      sub.remove();
      doc?.removeEventListener?.("visibilitychange", onHide);
    };
  }, [flush]);

  const reset = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await api("/save", { method: "DELETE" });
    latest.current = null;
    setSaveState(null);
  }, []);

  return <GameCtx.Provider value={{ save, loading, sync, setSave, flush, reset, loadError, reload: load }}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const v = useContext(GameCtx);
  if (!v) throw new Error("GameProvider mancante");
  return v;
}
