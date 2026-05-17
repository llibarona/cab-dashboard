// Inject a site-wide footer with the last snapshot timestamp.
// Reads /snapshots/index.json to know when data was last updated.

(async function () {
  const footer = document.createElement("footer");
  footer.className = "site";
  const inner = document.createElement("div");
  inner.className = "container";
  footer.appendChild(inner);

  // Static branding
  const left = document.createElement("div");
  left.innerHTML = `<strong style="color:#fafaf9">Club Ateneo Ingeniero Raver</strong> · estadísticas no oficiales`;
  inner.appendChild(left);

  // Timestamp
  const right = document.createElement("div");
  right.className = "freshness";
  inner.appendChild(right);

  document.body.appendChild(footer);

  try {
    const r = await fetch("snapshots/index.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("no index");
    const idx = await r.json();
    const ts = idx.generated_at;
    if (!ts) {
      right.textContent = "Datos: sin información de actualización";
      return;
    }
    const when = new Date(ts * 1000);
    const ageMs = Date.now() - when.getTime();
    const ageH = Math.floor(ageMs / 3600000);
    const ageMin = Math.floor((ageMs % 3600000) / 60000);
    const ageDays = Math.floor(ageH / 24);

    let ageStr;
    if (ageDays >= 2) ageStr = `hace ${ageDays} días`;
    else if (ageDays === 1) ageStr = "hace 1 día";
    else if (ageH >= 1) ageStr = `hace ${ageH} h`;
    else if (ageMin >= 1) ageStr = `hace ${ageMin} min`;
    else ageStr = "hace unos segundos";

    const stale = ageDays >= 2;
    const dateText = when.toLocaleString("es-AR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    right.innerHTML = `Datos actualizados ${dateText} <span class="${stale ? "stale" : ""}">(${ageStr})</span>`;
  } catch (e) {
    right.textContent = "Datos: timestamp no disponible";
  }
})();
