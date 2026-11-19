// Test version (EXPO_PUBLIC_DEMO=1): answers in place of the server, keeping the account and the
// save in this browser (localStorage). Single player only: online rooms need the real server.
const KEY = "mostrelli_demo";
type Db = { users: Record<string, { id: string; email: string; password: string }>; saves: Record<string, any> };

function load(): Db {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "") as Db;
  } catch {
    return { users: {}, saves: {} };
  }
}
function store(db: Db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {}
}
const fail = (msg: string) => { throw new Error(msg); };
const ONLINE = "Il gioco online non è disponibile nella versione di prova: arriverà con la pubblicazione vera.";

export async function demoApi<T>(path: string, init: RequestInit, token: string | null): Promise<T> {
  const db = load();
  const method = (init.method ?? "GET").toUpperCase();
  const body = init.body ? JSON.parse(String(init.body)) : {};
  const me = token ? Object.values(db.users).find((u) => `demo-${u.id}` === token) : undefined;
  const out = (v: any) => v as T;
  const p = path.split("?")[0];

  if (p === "/auth/register") {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email.includes("@")) fail("Inserisci un'email valida");
    if (String(body.password ?? "").length < 6) fail("La password deve avere almeno 6 caratteri");
    if (db.users[email]) fail("Email già registrata");
    const u = { id: Math.random().toString(16).slice(2, 14), email, password: String(body.password) };
    db.users[email] = u;
    store(db);
    return out({ token: `demo-${u.id}`, user: { id: u.id, email } });
  }
  if (p === "/auth/login") {
    const u = db.users[String(body.email ?? "").trim().toLowerCase()];
    if (!u || u.password !== body.password) fail("Email o password errate");
    return out({ token: `demo-${u!.id}`, user: { id: u!.id, email: u!.email } });
  }
  if (!me) fail("Sessione scaduta, accedi di nuovo");
  if (p === "/auth/me") return out({ id: me!.id, email: me!.email });
  if (p === "/save") {
    if (method === "GET") return out({ state: db.saves[me!.id] ?? null, updated_at: null });
    if (method === "PUT") { db.saves[me!.id] = body.state; store(db); return out({ state: body.state, updated_at: new Date().toISOString() }); }
    if (method === "DELETE") { delete db.saves[me!.id]; store(db); return out({ ok: true }); }
  }
  // Nobody else is around in the test version.
  if (p === "/presence") return out({ players: [], invites: [] });
  if (p === "/match" && method === "DELETE") return out({ ok: true });
  return fail(ONLINE);
}
