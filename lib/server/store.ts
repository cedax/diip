import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { seedData } from "../seed";
import { applyAction, requireRole, visibleData } from "../domain";
import type { Action, AppData, ManagedUser, UserSession } from "../types";
const folder = process.env.DIIP_DATA_DIR || path.join(process.cwd(), ".data");
mkdirSync(folder, { recursive: true });
const db = new DatabaseSync(path.join(folder, "diip.sqlite"));
db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS credentials (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS attempts (email TEXT PRIMARY KEY, count INTEGER NOT NULL, until INTEGER NOT NULL)");
function passwordHash(password: string, salt: string) { return scryptSync(password, salt, 64).toString("hex"); }
function credentials(user: ManagedUser, password: string) {
  const salt = randomBytes(24).toString("hex");
  db.prepare("INSERT INTO credentials(id,email,salt,hash) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,salt=excluded.salt,hash=excluded.hash").run(user.id, user.email.toLowerCase(), salt, passwordHash(password, salt));
}
if (!db.prepare("SELECT id FROM state WHERE id=1").get()) {
  const production = process.env.NODE_ENV === "production" && process.env.DIIP_DEMO !== "true";
  const users: ManagedUser[] = production ? [] : [
    { id: "admin", name: "Laura González", email: "admin@diip.mx", role: "Administrador", active: true },
    { id: "supervisor", name: "Carlos Mendoza", email: "supervisor@diip.mx", role: "Supervisor", active: true },
    { id: "analista", name: "Mariana Soto", email: "analista@diip.mx", role: "Analista", active: true },
    { id: "colaborador", name: "Ana Martínez", email: "colaborador@diip.mx", role: "Colaborador", employeeId: "e1", active: true },
  ];
  if (production && process.env.DIIP_ADMIN_EMAIL && (process.env.DIIP_ADMIN_PASSWORD?.length ?? 0) >= 12) users.push({ id: "admin", name: "Administración", email: process.env.DIIP_ADMIN_EMAIL, role: "Administrador", active: true });
  // Do not initialize production during build or without bootstrap credentials.
  if (users.length) {
    const initial: AppData = production ? { employees: [], projects: [], shifts: [], attendance: [], incidents: [] } : structuredClone(seedData);
    initial.users = users; initial.policy = { maxDailyRecords: 1, maxMonthlyRecords: 31 };
    initial.shifts.forEach(s => s.workDays = [1, 2, 3, 4, 5]);
    initial.employees.forEach(e => e.startDate = "2026-09-01");
    db.exec("BEGIN IMMEDIATE");
    try { users.forEach(u => credentials(u, production ? process.env.DIIP_ADMIN_PASSWORD! : "demo123")); db.prepare("INSERT INTO state VALUES(1,1,?)").run(JSON.stringify(initial)); db.exec("COMMIT"); } catch (e) { db.exec("ROLLBACK"); throw e; }
  }
}
export function readState(): { data: AppData; version: number } {
  const row = db.prepare("SELECT version,body FROM state WHERE id=1").get() as { version: number; body: string } | undefined;
  if (!row) throw new Error("Configura DIIP_ADMIN_EMAIL y DIIP_ADMIN_PASSWORD (mínimo 12 caracteres) para iniciar el sistema.");
  return { data: JSON.parse(row.body), version: row.version };
}
export function sessionUser(token?: string): UserSession | null {
  if (!token) return null;
  const row = db.prepare("SELECT user_id FROM sessions WHERE token=? AND expires>?").get(createHash("sha256").update(token).digest("hex"), Date.now()) as { user_id: string } | undefined;
  return row ? readState().data.users?.find(u => u.id === row.user_id && u.active) ?? null : null;
}
export function login(email: string, password: string) {
  const key = email.trim().toLowerCase();
  const attempt = db.prepare("SELECT count,until FROM attempts WHERE email=?").get(key) as {count: number; until: number} | undefined;
  if (attempt && attempt.until > Date.now() && attempt.count >= 8) throw new Error("Demasiados intentos. Intenta de nuevo en 15 minutos.");
  const row = db.prepare("SELECT id,salt,hash FROM credentials WHERE email=?").get(key) as { id: string; salt: string; hash: string } | undefined;
  const hash = passwordHash(password, row?.salt ?? "invalid-account-salt");
  const user = readState().data.users?.find(u => u.id === row?.id && u.active);
  if (!row || !timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(row.hash, "hex")) || !user) {
    db.prepare("INSERT INTO attempts VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET count=excluded.count,until=excluded.until").run(key, attempt && attempt.until > Date.now() ? attempt.count + 1 : 1, Date.now() + 900000);
    throw new Error("Correo o contraseña incorrectos, o cuenta inactiva.");
  }
  db.prepare("DELETE FROM attempts WHERE email=?").run(key);
  db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(createHash("sha256").update(token).digest("hex"), user.id, Date.now() + 8 * 3600000);
  return { token, user };
}
export function logout(token: string) { db.prepare("DELETE FROM sessions WHERE token=?").run(createHash("sha256").update(token).digest("hex")); }
export function snapshot(user: UserSession) { const { data, version } = readState(); return { data: visibleData(data, user), version, user }; }
export function mutate(action: Action, user: UserSession, version: number) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const state = readState();
    if (state.version !== version) throw new Error("La información cambió en otra sesión. Actualiza y vuelve a intentar; tu formulario sigue abierto.");
    let next: AppData;
    if (action.type === "user") {
      requireRole(user, ["Administrador"]); const u = action.user;
      if (!u.id || !u.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email) || !["Administrador", "Supervisor", "Analista", "Colaborador"].includes(u.role)) throw new Error("Revisa nombre, correo y rol del usuario.");
      if (u.role === "Colaborador" && !state.data.employees.some(e => e.id === u.employeeId)) throw new Error("Vincula el usuario a un colaborador.");
      if (state.data.users?.some(x => x.id !== u.id && (x.email.toLowerCase() === u.email.toLowerCase() || (u.role === "Colaborador" && x.role === "Colaborador" && x.employeeId === u.employeeId)))) throw new Error("El correo o colaborador ya están vinculados a un usuario.");
      if (u.id === user.id && (!u.active || u.role !== "Administrador")) throw new Error("No puedes desactivar tu cuenta ni quitar tu propio rol administrador.");
      const existing = state.data.users?.find(x => x.id === u.id);
      if ((!existing || action.password) && (!action.password || action.password.length < 12 || action.password.length > 128)) throw new Error("La contraseña debe tener entre 12 y 128 caracteres.");
      next = state.data;
      next.users = existing ? next.users!.map(x => x.id === u.id ? u : x) : [...(next.users ?? []), u];
      if (action.password) credentials(u, action.password); else db.prepare("UPDATE credentials SET email=? WHERE id=?").run(u.email.toLowerCase(), u.id);
      if (existing && (action.password || !u.active || u.role !== existing.role || u.employeeId !== existing.employeeId)) db.prepare("DELETE FROM sessions WHERE user_id=?").run(u.id);
      next.audit = [{ id: randomBytes(16).toString("hex"), action: `Usuario ${u.email}: ${u.role}, ${u.active ? "activo" : "inactivo"}`, by: user.name, at: new Date().toISOString() }, ...(next.audit ?? [])];
    } else next = applyAction(state.data, action, user);
    db.prepare("UPDATE state SET body=?,version=version+1 WHERE id=1").run(JSON.stringify(next)); db.exec("COMMIT");
    return { data: visibleData(next, user), version: version + 1, user };
  } catch (e) { db.exec("ROLLBACK"); throw e; }
}
