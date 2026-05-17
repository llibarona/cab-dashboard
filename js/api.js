// Thin API wrapper for the Raver public page.
// Reuses snapshot session if available; otherwise registers a fresh one.

const API_BASE = "/api";
const SESSION_KEY = "raver_session";

const session = (() => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || {}; }
  catch { return {}; }
})();

function persistSession() { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }

async function rawCall(endpoint, params) {
  const body = new URLSearchParams(params).toString();
  const r = await fetch(`${API_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { _raw: text }; }
}

async function ensureSession() {
  if (session.id && session.key) return;
  const uid = [...crypto.getRandomValues(new Uint8Array(8))]
    .map(b => b.toString(16).padStart(2, "0")).join("");
  const r = await rawCall("dispositivo.ashx", {
    accion: "registrar", uid, plataforma: "android",
    tipo_dispositivo: "mobile", version: "40044",
  });
  if (r.resultado !== "correcto") throw new Error("register failed");
  session.id = r.id_dispositivo;
  session.key = r.key;
  persistSession();
}

async function call(endpoint, params = {}) {
  await ensureSession();
  const merged = { id_dispositivo: session.id, key: session.key, ...params };
  const r = await rawCall(endpoint, merged);
  if (r.resultado === "correcto" && r.key) {
    session.key = r.key;
    persistSession();
  }
  return r;
}

async function loadSnapshotIndex() {
  const r = await fetch("snapshots/index.json");
  if (!r.ok) throw new Error("snapshot index not found — run snapshot.py");
  return await r.json();
}

async function loadSnapshot(iccHash) {
  const r = await fetch(`snapshots/${iccHash}.json`);
  if (!r.ok) throw new Error("snapshot not found");
  return await r.json();
}

async function loadGameDetail(meta, iccHash) {
  // Stable hash matches snapshot.py
  const stable = `${iccHash}|J${meta.NumeroJornada}|${meta.NombreEquipoLocal}|${meta.NombreEquipoVisitante}`;
  const fhash = await sha1Hex(stable).then(h => h.slice(0, 16));
  const r = await fetch(`snapshots/games/${fhash}.json`);
  if (!r.ok) throw new Error("game detail not found in snapshot");
  return await r.json();
}

async function sha1Hex(s) {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-1", buf);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Adopt session from snapshot if newer
async function adoptSnapshotSession() {
  try {
    const idx = await loadSnapshotIndex();
    if (idx.session?.id && idx.session?.key) {
      session.id = idx.session.id;
      session.key = idx.session.key;
      persistSession();
    }
    return idx;
  } catch (_) { return null; }
}

window.RaverAPI = { call, ensureSession, loadSnapshotIndex, loadSnapshot, loadGameDetail, sha1Hex, adoptSnapshotSession };
