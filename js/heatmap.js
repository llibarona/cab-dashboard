// Shared shot-chart panel: dual view (dots + zone heatmap) with optional player filter.
//
// Usage:
//   RaverHeatmap.render(container, shots, { players: [...], teamLabel: "...", showFilter: true })

(function () {
  const { h, escapeHtml } = window.RaverRender;
  const {
    makeCourtSvg, renderShots, renderZoneHeatmap, shotSummary, ZONES, aggregateZones,
  } = window.RaverCourt;

  /**
   * Render a heatmap panel.
   * @param {HTMLElement} container
   * @param {Array} shots
   * @param {Object} opts
   *   - teamLabel: string heading
   *   - players: optional list of {componente_id, nombre, dorsal} for the player filter
   *   - showFilter: enable filter dropdown (defaults: true if players given)
   *   - sideFilter: 'local'|'visitante'|null (used by game page for separate sides)
   */
  function render(container, shots, opts = {}) {
    container.innerHTML = "";
    const players = opts.players || null;
    const teamLabel = opts.teamLabel || "Mapa de tiros";
    const showFilter = opts.showFilter ?? !!players;
    const sideFilter = opts.sideFilter || null;

    if (!shots.length) {
      container.appendChild(h("p", { class: "muted" }, "Sin datos de tiros."));
      return;
    }

    // Filter row
    let activeComponente = "";
    const subEl = h("p", { class: "muted" });
    const wrap = h("div", { class: "court-wrap" });
    const dotsBlock = h("div", { class: "court-block" }, h("h4", {}, "Tiros (puntos)"));
    const zonesBlock = h("div", { class: "court-block" }, h("h4", {}, "Por zona (eficiencia)"));
    const dotsSvg = makeCourtSvg();
    const zonesSvg = makeCourtSvg();
    dotsBlock.appendChild(dotsSvg);
    zonesBlock.appendChild(zonesSvg);
    const dotsLegend = h("div", { class: "legend" });
    dotsBlock.appendChild(dotsLegend);
    const zonesLegend = h("div", { class: "legend" },
      h("span", { class: "key" }, h("span", { class: "dot", style: "background: rgba(220, 38, 38, 0.55)" }), "< 25%"),
      h("span", { class: "key" }, h("span", { class: "dot", style: "background: rgba(234, 88, 12, 0.55)" }), "25–35%"),
      h("span", { class: "key" }, h("span", { class: "dot", style: "background: rgba(234, 179, 8, 0.55)" }), "35–45%"),
      h("span", { class: "key" }, h("span", { class: "dot", style: "background: rgba(132, 204, 22, 0.55)" }), "45–55%"),
      h("span", { class: "key" }, h("span", { class: "dot", style: "background: rgba(22, 163, 74, 0.65)" }), "≥ 55%"),
    );
    zonesBlock.appendChild(zonesLegend);

    function update() {
      let filtered = shots;
      if (sideFilter) filtered = filtered.filter(s => (sideFilter === "local") === !!s.local);
      if (activeComponente) filtered = filtered.filter(s => String(s.componente_id) === activeComponente);

      const sum = shotSummary(filtered);
      subEl.textContent = activeComponente
        ? `${sum.total} tiros · ${sum.made} convertidos (${sum.pct}%)`
        : `${sum.total} tiros · ${sum.made} convertidos (${sum.pct}%) · ${teamLabel}`;

      renderShots(dotsSvg, filtered, { radius: activeComponente ? 7 : 5 });
      renderZoneHeatmap(zonesSvg, filtered);

      dotsLegend.innerHTML = "";
      dotsLegend.appendChild(h("span", { class: "key" }, h("span", { class: "dot made" }), `${sum.made} convertidos`));
      dotsLegend.appendChild(h("span", { class: "key" }, h("span", { class: "dot missed" }), `${sum.missed} fallados`));
    }

    if (showFilter && players && players.length) {
      const select = h("select", {},
        h("option", { value: "" }, `Todo el equipo (${players.reduce((a,p) => a + (p.shotCount || 0), 0)} tiros)`),
        ...players
          .filter(p => p.componente_id)
          .sort((a,b) => (a.nombre || "").localeCompare(b.nombre || ""))
          .map(p => h("option", { value: String(p.componente_id) },
            `#${p.dorsal || "?"} ${p.nombre}${p.shotCount != null ? ` (${p.shotCount} tiros)` : ""}`
          ))
      );
      select.addEventListener("change", () => {
        activeComponente = select.value;
        update();
      });
      const filterRow = h("div", { class: "filter-row" },
        h("label", {}, "Jugador: "),
        select
      );
      container.appendChild(filterRow);
    }
    container.appendChild(subEl);
    wrap.appendChild(dotsBlock);
    wrap.appendChild(zonesBlock);
    container.appendChild(wrap);
    update();
  }

  window.RaverHeatmap = { render };
})();
