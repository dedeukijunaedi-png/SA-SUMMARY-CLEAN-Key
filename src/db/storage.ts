// Penyimpanan database: IndexedDB (utama) + localStorage (cadangan/cermin).
// Key lama "sa_summary_db_v1" TIDAK berubah dan tidak pernah dihapus.

const LS_KEY = "sa_summary_db_v1";
const LS_TS_KEY = "sa_summary_db_v1_ts";
const IDB_NAME = "sa_summary_store";
const IDB_STORE = "kv";
const IDB_KEY = "db";
// Cermin localStorage hanya ditulis bila ukurannya aman (batas WebView sekitar 5 juta karakter).
const LS_MAX_CHARS = 3_500_000;
const FLUSH_DELAY_MS = 80;

export interface StoredDb {
  bytes: Uint8Array;
  savedAt: number;
  source: "idb" | "localStorage";
}

export interface LoadResult {
  candidates: StoredDb[]; // urut dari yang terbaru
  unreadable: boolean; // ada data tersimpan yang tidak bisa dibaca
}

let idbPromise: Promise<IDBDatabase | null> | null = null;

function getIdb(): Promise<IDBDatabase | null> {
  if (idbPromise) return idbPromise;
  idbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") {
        resolve(null);
        return;
      }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return idbPromise;
}

async function idbRead(): Promise<{ rec: StoredDb | null; unreadable: boolean }> {
  const db = await getIdb();
  if (!db) return { rec: null, unreadable: false };
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => {
        const v: any = req.result;
        if (v === undefined || v === null) {
          resolve({ rec: null, unreadable: false });
          return;
        }
        const raw = v.bytes;
        const bytes = raw instanceof Uint8Array ? raw : raw instanceof ArrayBuffer ? new Uint8Array(raw) : null;
        if (!bytes || bytes.length === 0) {
          resolve({ rec: null, unreadable: true });
          return;
        }
        resolve({ rec: { bytes, savedAt: Number(v.savedAt) || 0, source: "idb" }, unreadable: false });
      };
      req.onerror = () => resolve({ rec: null, unreadable: true });
    } catch {
      resolve({ rec: null, unreadable: true });
    }
  });
}

async function idbWrite(bytes: Uint8Array, savedAt: number): Promise<boolean> {
  const db = await getIdb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put({ bytes, savedAt }, IDB_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

function lsRead(): { rec: StoredDb | null; unreadable: boolean } {
  let saved: string | null = null;
  try {
    saved = window.localStorage.getItem(LS_KEY);
  } catch {
    return { rec: null, unreadable: false };
  }
  if (!saved) return { rec: null, unreadable: false };
  try {
    const binary = atob(saved);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    let ts = 0;
    try {
      ts = Number(window.localStorage.getItem(LS_TS_KEY)) || 0;
    } catch {
      ts = 0;
    }
    return { rec: { bytes, savedAt: ts, source: "localStorage" }, unreadable: false };
  } catch {
    return { rec: null, unreadable: true };
  }
}

function lsWrite(bytes: Uint8Array, savedAt: number): boolean {
  try {
    let binary = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)) as any);
    }
    const b64 = btoa(binary);
    if (b64.length > LS_MAX_CHARS) return false;
    window.localStorage.setItem(LS_KEY, b64);
    window.localStorage.setItem(LS_TS_KEY, String(savedAt));
    return true;
  } catch {
    return false;
  }
}

export async function loadStoredCandidates(): Promise<LoadResult> {
  const a = await idbRead();
  const b = lsRead();
  const candidates: StoredDb[] = [];
  if (a.rec) candidates.push(a.rec);
  if (b.rec) candidates.push(b.rec);
  // Terbaru dulu; bila sama, IndexedDB didahulukan.
  candidates.sort((x, y) => y.savedAt - x.savedAt || (x.source === "idb" ? -1 : 1));
  return { candidates, unreadable: a.unreadable || b.unreadable };
}

export async function verifyIdb(expectedLength: number): Promise<boolean> {
  const r = await idbRead();
  return !!r.rec && r.rec.bytes.length === expectedLength;
}

// ---------- Penjadwal simpan ----------

let getter: (() => Uint8Array) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let dirty = false;
let lastSavedAt = 0;
let chain: Promise<void> = Promise.resolve();
let listenersInstalled = false;

function reportStatus(ok: boolean, detail?: string) {
  try {
    window.dispatchEvent(new CustomEvent("sa-persist-status", { detail: { ok, message: detail } }));
  } catch {
    // abaikan
  }
}

export function configurePersist(fn: () => Uint8Array, loadedSavedAt: number) {
  getter = fn;
  lastSavedAt = Math.max(lastSavedAt, loadedSavedAt || 0);
  if (!listenersInstalled && typeof window !== "undefined") {
    listenersInstalled = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") void flushNow();
    });
    window.addEventListener("pagehide", () => {
      void flushNow();
    });
  }
}

export function requestPersist() {
  dirty = true;
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    void flushNow();
  }, FLUSH_DELAY_MS);
}

export function flushNow(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!dirty || !getter) return chain;
  dirty = false;
  let bytes: Uint8Array;
  try {
    bytes = getter();
  } catch (e) {
    console.warn("Gagal mengekspor database", e);
    reportStatus(false, "Gagal membaca database");
    return chain;
  }
  const savedAt = Math.max(Date.now(), lastSavedAt + 1);
  lastSavedAt = savedAt;
  // Cermin localStorage ditulis sinkron lebih dulu agar selamat bila aplikasi ditutup mendadak.
  const lsOk = lsWrite(bytes, savedAt);
  chain = chain.then(async () => {
    const idbOk = await idbWrite(bytes, savedAt);
    if (!idbOk && !lsOk) {
      console.warn("Gagal menyimpan database ke IndexedDB maupun localStorage");
      reportStatus(false, "Penyimpanan gagal");
    } else {
      reportStatus(true);
    }
  });
  return chain;
}

export async function requestStoragePersistence() {
  try {
    const s: any = (navigator as any).storage;
    if (s && typeof s.persist === "function") await s.persist();
  } catch {
    // abaikan
  }
}
