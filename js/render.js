// Small DOM helpers shared across pages.

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "html") el.innerHTML = v;
    else if (v != null && v !== false) el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
  return el;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
}

function initials(name, n = 2) {
  if (!name) return "?";
  const parts = name.split(/[\s,]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, n);
  return name.slice(0, n).toUpperCase();
}

/** Render an Escudo badge: image if decodable, else initials. */
function renderEscudo(escudoStr, name, sizeClass = "escudo") {
  const dataUri = decodeImageDataUri(escudoStr);
  if (dataUri) {
    return h("img", { class: sizeClass, src: dataUri, alt: name || "" });
  }
  return h("span", { class: sizeClass + " placeholder", title: name || "" }, initials(name));
}

function decodeImageDataUri(hexStr) {
  if (!hexStr || typeof hexStr !== "string") return null;
  if (!/^[0-9a-fA-F]+$/.test(hexStr) || hexStr.length % 2) return null;
  try {
    const bytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hexStr.substr(i*2, 2), 16);
    const utf16 = new TextDecoder("utf-16le").decode(bytes);
    const bin = atob(utf16);
    const b0 = bin.charCodeAt(0), b1 = bin.charCodeAt(1), b2 = bin.charCodeAt(2), b3 = bin.charCodeAt(3);
    let mime = null;
    if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) mime = "image/jpeg";
    else if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) mime = "image/png";
    else if (bin.startsWith("GIF8")) mime = "image/gif";
    else if (bin.startsWith("RIFF")) mime = "image/webp";
    else if (bin.startsWith("<svg") || bin.startsWith("<?xml")) mime = "image/svg+xml";
    else return null;
    return `data:${mime};base64,${utf16}`;
  } catch { return null; }
}

/** Format a Fecha string DD/MM/YYYY → "5 may". */
function fmtDate(fecha) {
  if (!fecha) return "";
  const [d, m, y] = fecha.split("/");
  if (!d || !m || !y) return fecha;
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const mi = parseInt(m, 10) - 1;
  if (mi < 0 || mi > 11) return fecha;
  return `${parseInt(d, 10)} ${months[mi]}`;
}

function fmtDateLong(fecha) {
  if (!fecha) return "";
  const [d, m, y] = fecha.split("/");
  if (!d || !m || !y) return fecha;
  const months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${parseInt(d, 10)} de ${months[parseInt(m,10) - 1]} ${y}`;
}

function urlFor(page, params) {
  const qs = new URLSearchParams(params).toString();
  return `${page}.html?${qs}`;
}

function getQuery() {
  const p = new URLSearchParams(location.search);
  const o = {};
  for (const [k, v] of p.entries()) o[k] = v;
  return o;
}

window.RaverRender = { h, escapeHtml, initials, renderEscudo, decodeImageDataUri, fmtDate, fmtDateLong, urlFor, getQuery };
