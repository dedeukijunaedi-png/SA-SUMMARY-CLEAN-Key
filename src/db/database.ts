
import { nowISO } from "@/src/lib/date";
import { MIGRATIONS, SCHEMA_VERSION } from "./schema";

export type SqlJsDatabase = any;

const STORAGE_KEY = "sa_summary_db_v1";

type Params = any[];

declare global {
  interface Window {
    initSqlJs?: (config?: any) => Promise<any>;
  }
}

const changeListeners = new Set<() => void>();

export function subscribeDatabase(listener: () => void) {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
}

export function notifyDatabaseChanged() {
  changeListeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error("Error in db listener", e);
    }
  });
}

export class WebDb {
  private db: SqlJsDatabase;
  private inTx = false;

  constructor(db: SqlJsDatabase) {
    this.db = db;
  }

  execSync(sql: string) {
    this.db.exec(sql);
    if (!this.inTx) {
      this.persist();
      notifyDatabaseChanged();
    }
  }

  runSync(sql: string, params: Params = []): { lastInsertRowId: number; changes: number } {
    const stmt = this.db.prepare(sql);
    try {
      stmt.bind(params);
      stmt.step();
    } finally {
      stmt.free();
    }
    const idRow = this.db.exec("SELECT last_insert_rowid() AS id, changes() AS c");
    const vals = idRow?.[0]?.values?.[0] ?? [0, 0];
    const result = { lastInsertRowId: Number(vals[0]), changes: Number(vals[1]) };

    if (!this.inTx) {
      this.persist();
      notifyDatabaseChanged();
    }
    return result;
  }

  getAllSync<T = any>(sql: string, params: Params = []): T[] {
    const stmt = this.db.prepare(sql);
    const out: T[] = [];
    try {
      stmt.bind(params);
      while (stmt.step()) {
        out.push(stmt.getAsObject() as T);
      }
    } finally {
      stmt.free();
    }
    return out;
  }

  getFirstSync<T = any>(sql: string, params: Params = []): T | null {
    const rows = this.getAllSync<T>(sql, params);
    return rows.length ? rows[0] : null;
  }

  withTransactionSync(fn: () => void) {
    this.db.run("BEGIN");
    this.inTx = true;
    try {
      fn();
      this.db.run("COMMIT");
      this.inTx = false;
      this.persist();
      notifyDatabaseChanged();
    } catch (e) {
      this.inTx = false;
      try {
        this.db.run("ROLLBACK");
      } catch {
      }
      throw e;
    }
  }

  exportBinary(): Uint8Array {
    return this.db.export();
  }

  persist() {
    try {
      const data: Uint8Array = this.db.export();
      let binary = "";
      for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
      }
      window.localStorage.setItem(STORAGE_KEY, btoa(binary));
    } catch (e) {
      console.warn("Failed to persist database to localStorage", e);
    }
  }
}

let _db: WebDb | null = null;

export function getDb(): WebDb {
  if (!_db) {
    throw new Error("Database not initialized yet");
  }
  return _db;
}

export function runMigrations() {
  const db = getDb();
  const row = db.getFirstSync<{ user_version: number }>("PRAGMA user_version");
  let current = row?.user_version ?? 0;
  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    const sql = MIGRATIONS[v];
    if (sql) {
      try {
        db.execSync(sql);
      } catch (e) {
        console.warn(`Migration ${v} note:`, e);
      }
      db.execSync(`PRAGMA user_version = ${v}`);
      current = v;
    }
  }
}

export function seedIfEmpty() {
  const db = getDb();
  const ts = nowISO();
  const teamCount = db.getFirstSync<{ c: number }>("SELECT COUNT(*) as c FROM team_members");
  if ((teamCount?.c ?? 0) === 0) {
    const team: [string, string, number][] = [
      ["Emily", "Manager", 0],
      ["Cipta", "Assistant Manager", 1],
      ["Matt", "Student Advisor", 1],
      ["Eric", "Student Advisor", 1],
      ["Liam", "Student Advisor", 1],
    ];
    for (const [name, position, hasTarget] of team) {
      db.runSync(
        "INSERT INTO team_members (name, position, has_target, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)",
        [name, position, hasTarget, ts, ts]
      );
    }
  }
  const prodCount = db.getFirstSync<{ c: number }>("SELECT COUNT(*) as c FROM products");
  if ((prodCount?.c ?? 0) === 0) {
    const dues: [string, number][] = [
      ["VIP Primary", 1488000],
      ["VIP Family", 788000],
      ["VIP Adult Family", 538000],
      ["VIP Adult Primary", 738000],
      ["Premiere Primary", 1298000],
      ["Premiere Family", 788000],
      ["Premiere Adult Family", 558000],
    ];
    for (const [name, price] of dues) {
      db.runSync(
        "INSERT INTO products (type, name, sessions, price, active, created_at, updated_at) VALUES ('DUES', ?, NULL, ?, 1, ?, ?)",
        [name, price, ts, ts]
      );
    }
  }
}

async function resolveInitSqlJs(): Promise<(config?: any) => Promise<any>> {
  if (typeof window !== "undefined" && window.initSqlJs) {
    return window.initSqlJs;
  }

  if (typeof document !== "undefined") {
    await new Promise<void>((resolve, reject) => {
      if (window.initSqlJs) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[src="/sql-wasm.js"]') as HTMLScriptElement;
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => {
          const cdn = document.createElement("script");
          cdn.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js";
          cdn.onload = () => resolve();
          cdn.onerror = (e) => reject(new Error("Gagal memuat SQLite script"));
          document.head.appendChild(cdn);
        });
        setTimeout(() => {
          if (window.initSqlJs) resolve();
        }, 100);
        return;
      }

      const script = document.createElement("script");
      script.src = "/sql-wasm.js";
      script.onload = () => resolve();
      script.onerror = () => {
        const cdn = document.createElement("script");
        cdn.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js";
        cdn.onload = () => resolve();
        cdn.onerror = (e) => reject(new Error("Gagal memuat SQLite script"));
        document.head.appendChild(cdn);
      };
      document.head.appendChild(script);
    });
  }

  if (window.initSqlJs) {
    return window.initSqlJs;
  }
  throw new Error("Fungsi initSqlJs tidak tersedia");
}

export async function initDatabase(): Promise<WebDb> {
  if (_db) return _db;

  const initFn = await resolveInitSqlJs();

  let SQL: any;
  try {
    SQL = await initFn({
      locateFile: (file: string) => `/${file}`,
    });
  } catch (err) {
    console.warn("Could not load local wasm, trying CDN fallback...", err);
    SQL = await initFn({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });
  }

  let database: SqlJsDatabase;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const binary = atob(saved);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      database = new SQL.Database(bytes);
    } else {
      database = new SQL.Database();
    }
  } catch (e) {
    console.warn("Error restoring saved database from localStorage, initializing fresh", e);
    database = new SQL.Database();
  }

  database.run("PRAGMA foreign_keys = ON;");
  _db = new WebDb(database);
  runMigrations();
  seedIfEmpty();
  return _db;
}
