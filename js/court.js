// SVG basketball court + shot-chart renderer.
// The API returns posicion_x/posicion_y as percentages of a full court (LxW).
// We render half-court oriented to attacking direction.

const COURT_W = 280;   // visual width (px) — short side of half-court
const COURT_H = 260;   // visual height — long side from baseline to half-court

function makeCourtSvg() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${COURT_W} ${COURT_H}`);
  svg.setAttribute("class", "court");
  svg.setAttribute("xmlns", ns);

  // Court outline
  const rect = document.createElementNS(ns, "rect");
  rect.setAttribute("x", 0); rect.setAttribute("y", 0);
  rect.setAttribute("width", COURT_W); rect.setAttribute("height", COURT_H);
  rect.setAttribute("class", "court-bg");
  svg.appendChild(rect);

  // Approximate FIBA half-court markings (28m × 15m → ratio).
  // We draw with the basket at top (y=0), half-court line at bottom (y=COURT_H).
  // Three-point line: 6.75m radius, basket at 1.575m from baseline. Lane: 4.9m wide × 5.8m deep.
  const px_per_m = COURT_W / 15;
  const basketY = 1.575 * px_per_m;
  const basketX = COURT_W / 2;

  // Three-point arc (radius 6.75m from basket)
  const arc = document.createElementNS(ns, "path");
  const r3 = 6.75 * px_per_m;
  // Corner threes start at 0.9m from sideline
  const cornerOffset = 0.9 * px_per_m;
  const cornerY = basketY + Math.sqrt(r3 * r3 - (COURT_W/2 - cornerOffset) * (COURT_W/2 - cornerOffset));
  arc.setAttribute("d", [
    `M ${cornerOffset} 0`,                  // baseline at corner
    `L ${cornerOffset} ${cornerY}`,        // up along corner
    `A ${r3} ${r3} 0 0 0 ${COURT_W - cornerOffset} ${cornerY}`,  // arc
    `L ${COURT_W - cornerOffset} 0`,
  ].join(" "));
  arc.setAttribute("class", "court-line");
  arc.setAttribute("fill", "none");
  svg.appendChild(arc);

  // Lane (paint) — 4.9m wide × 5.8m deep
  const laneW = 4.9 * px_per_m;
  const laneH = 5.8 * px_per_m;
  const lane = document.createElementNS(ns, "rect");
  lane.setAttribute("x", (COURT_W - laneW) / 2);
  lane.setAttribute("y", 0);
  lane.setAttribute("width", laneW);
  lane.setAttribute("height", laneH);
  lane.setAttribute("class", "court-line court-paint");
  svg.appendChild(lane);

  // Free-throw circle
  const ftCircle = document.createElementNS(ns, "circle");
  ftCircle.setAttribute("cx", COURT_W / 2);
  ftCircle.setAttribute("cy", laneH);
  ftCircle.setAttribute("r", 1.8 * px_per_m);
  ftCircle.setAttribute("class", "court-line");
  ftCircle.setAttribute("fill", "none");
  svg.appendChild(ftCircle);

  // Restricted area (1.25m radius from basket)
  const restricted = document.createElementNS(ns, "path");
  const ra_r = 1.25 * px_per_m;
  restricted.setAttribute("d",
    `M ${basketX - ra_r} 0 A ${ra_r} ${ra_r} 0 0 0 ${basketX + ra_r} 0`);
  restricted.setAttribute("class", "court-line");
  restricted.setAttribute("fill", "none");
  svg.appendChild(restricted);

  // Backboard
  const bb = document.createElementNS(ns, "line");
  bb.setAttribute("x1", basketX - 0.9 * px_per_m);
  bb.setAttribute("y1", 1.2 * px_per_m);
  bb.setAttribute("x2", basketX + 0.9 * px_per_m);
  bb.setAttribute("y2", 1.2 * px_per_m);
  bb.setAttribute("class", "court-backboard");
  svg.appendChild(bb);

  // Rim
  const rim = document.createElementNS(ns, "circle");
  rim.setAttribute("cx", basketX);
  rim.setAttribute("cy", basketY);
  rim.setAttribute("r", 0.225 * px_per_m);
  rim.setAttribute("class", "court-rim");
  rim.setAttribute("fill", "none");
  svg.appendChild(rim);

  // Half-court line (bottom edge of our half)
  const hc = document.createElementNS(ns, "line");
  hc.setAttribute("x1", 0); hc.setAttribute("y1", COURT_H);
  hc.setAttribute("x2", COURT_W); hc.setAttribute("y2", COURT_H);
  hc.setAttribute("class", "court-line");
  svg.appendChild(hc);

  return svg;
}

/**
 * Render shots onto an SVG (created via makeCourtSvg).
 * @param {SVGSVGElement} svg
 * @param {Array} shots — array of shot objects with posicion_x/posicion_y "NN.NN%" + metido/fallado
 * @param {Object} opts — { radius, opacity, side } (side = 'local'|'visitante'|null for both)
 */
function renderShots(svg, shots, opts = {}) {
  const ns = "http://www.w3.org/2000/svg";
  const radius = opts.radius || 4;
  const opacity = opts.opacity ?? 0.85;
  const side = opts.side || null;

  // Remove existing shot dots
  svg.querySelectorAll(".shot").forEach(el => el.remove());

  for (const s of shots) {
    if (side && (side === "local") !== !!s.local) continue;
    // Coords are percent-of-full-court-length (long side = X axis).
    // Local team attacks one half, visitante the other. Mirror visitante to our half-court.
    let xPct = parseFloat(s.posicion_x);
    let yPct = parseFloat(s.posicion_y);
    if (Number.isNaN(xPct) || Number.isNaN(yPct)) continue;

    // The long axis (full court) maps to roughly 0..100. Each team's offensive half is one side.
    // Treat 'local' as attacking left half (0..50) and 'visitante' as right half (50..100).
    // Either way we want to fold the shot into our [0,100] half.
    let halfX;
    if (xPct <= 50) {
      halfX = xPct * 2; // 0..100 (offensive half normalized)
    } else {
      halfX = (100 - xPct) * 2;
    }
    // The short axis is yPct (0..100, full width 15m).
    // In our SVG: x runs across the court (15m, COURT_W), y runs from basket-baseline (0) to half-court (COURT_H).
    // halfX corresponds to depth from basket → maps to our y axis.
    // yPct corresponds to side-to-side → maps to our x axis.
    const cx = (yPct / 100) * COURT_W;
    const cy = (halfX / 100) * COURT_H;

    const dot = document.createElementNS(ns, "circle");
    dot.setAttribute("cx", cx);
    dot.setAttribute("cy", cy);
    dot.setAttribute("r", radius);
    dot.setAttribute("class", `shot ${s.metido ? "made" : "missed"}`);
    dot.setAttribute("opacity", opacity);
    dot.setAttribute("data-zona", s.zona || "");
    const tooltip = `${s.metido ? "✓" : "✗"} ${s.accion_tipo} · ${s.dorsal ? "#"+s.dorsal+" " : ""}${s.zona || ""}`;
    const title = document.createElementNS(ns, "title");
    title.textContent = tooltip;
    dot.appendChild(title);
    svg.appendChild(dot);
  }
}

/** Build a side-by-side legend (made vs missed counts). */
function shotSummary(shots, sideFilter = null) {
  let made = 0, missed = 0;
  for (const s of shots) {
    if (sideFilter && (sideFilter === "local") !== !!s.local) continue;
    if (s.metido) made++;
    else missed++;
  }
  const total = made + missed;
  const pct = total ? (made / total * 100).toFixed(1) : "0.0";
  return { made, missed, total, pct };
}

// ───────── Zone classification + heatmap ─────────

// Compute geometry constants once.
const _PX_PER_M = COURT_W / 15;
const _BX = COURT_W / 2;
const _BY = 1.575 * _PX_PER_M;
const _R3 = 6.75 * _PX_PER_M;
const _CO = 0.9 * _PX_PER_M;
const _CY3 = _BY + Math.sqrt(_R3 * _R3 - (_BX - _CO) ** 2);  // y where arc meets corner line
const _LW = 4.9 * _PX_PER_M;
const _LH = 5.8 * _PX_PER_M;
const _LL = _BX - _LW / 2;
const _LR = _BX + _LW / 2;
const _RR = 1.25 * _PX_PER_M;
const _T30 = 30 * Math.PI / 180;

const ZONES = [
  { code: "AR",  label: "Aro" },
  { code: "PA",  label: "Pintura" },
  { code: "ML",  label: "Media izq" },
  { code: "MC",  label: "Media centro" },
  { code: "MR",  label: "Media der" },
  { code: "C3L", label: "Esquina 3 izq" },
  { code: "W3L", label: "3 ala izq" },
  { code: "T3",  label: "3 frontal" },
  { code: "W3R", label: "3 ala der" },
  { code: "C3R", label: "Esquina 3 der" },
];

/** Classify an SVG-coord shot into a zone code. */
function classifyShot(cx, cy) {
  const dx = cx - _BX;
  const dy = cy - _BY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Determine if it's a 3-pointer
  let is3;
  if (cy <= _CY3) {
    // In corner area → 3 if outside the corner offset
    is3 = (cx < _CO || cx > COURT_W - _CO);
  } else {
    is3 = dist > _R3;
  }

  if (!is3) {
    // 2-point territory
    if (dist < _RR + 4) return "AR";   // restricted area (with small slop)
    const inLane = cx >= _LL && cx <= _LR && cy <= _LH;
    if (inLane) return "PA";
    // Mid-range: split by side
    // Use the angle from the basket — front of basket = central
    const angleFromCenterLine = Math.abs(Math.atan2(dx, dy));  // 0 = directly below
    if (angleFromCenterLine < _T30) return "MC";
    if (cx < _BX) return "ML";
    return "MR";
  }

  // 3-point territory
  // Corner 3?
  if (cy <= _CY3 && (cx < _CO || cx > COURT_W - _CO)) {
    return cx < _BX ? "C3L" : "C3R";
  }
  // Above-the-break: split by angle from basket
  const angle = Math.atan2(dx, dy);  // 0 = directly below; +π/2 = right of basket
  if (angle < -_T30) return "W3L";
  if (angle > _T30) return "W3R";
  return "T3";
}

/** Aggregate shots into per-zone totals. */
function aggregateZones(shots, sideFilter = null) {
  const z = {};
  for (const code of ZONES.map(z => z.code)) z[code] = { made: 0, attempted: 0 };
  for (const s of shots) {
    if (sideFilter && (sideFilter === "local") !== !!s.local) continue;
    const xPct = parseFloat(s.posicion_x);
    const yPct = parseFloat(s.posicion_y);
    if (Number.isNaN(xPct) || Number.isNaN(yPct)) continue;
    let halfX;
    if (xPct <= 50) halfX = xPct * 2;
    else halfX = (100 - xPct) * 2;
    const cx = (yPct / 100) * COURT_W;
    const cy = (halfX / 100) * COURT_H;
    const zone = classifyShot(cx, cy);
    z[zone].attempted += 1;
    if (s.metido) z[zone].made += 1;
  }
  return z;
}

/** Color mapping for FG%. Matches NBA-style red→yellow→green. */
function efficiencyColor(pct, attempts) {
  if (attempts === 0) return { fill: "rgba(150,150,150,0.10)", text: "#9ca3af" };
  // Buckets:
  //   < 25%   → dark red
  //   25-35%  → red-orange
  //   35-45%  → yellow
  //   45-55%  → light green
  //   ≥ 55%   → strong green
  if (pct < 25)  return { fill: "rgba(220, 38, 38, 0.55)",  text: "#7f1d1d" };
  if (pct < 35)  return { fill: "rgba(234, 88, 12, 0.55)",  text: "#7c2d12" };
  if (pct < 45)  return { fill: "rgba(234, 179, 8, 0.55)",  text: "#713f12" };
  if (pct < 55)  return { fill: "rgba(132, 204, 22, 0.55)", text: "#365314" };
  return            { fill: "rgba(22, 163, 74, 0.65)",      text: "#14532d" };
}

/** Build the SVG path 'd' attribute for a zone. */
function zonePath(code) {
  // Helper for arc paths in SVG. Going clockwise, large-arc=0, sweep=1 from p1 to p2.
  const arc = (x, y, r = _R3, sweep = 1) => `A ${r} ${r} 0 0 ${sweep} ${x} ${y}`;
  const arcLeftLane = _BY + Math.sqrt(_R3 * _R3 - (_LL - _BX) ** 2);
  const arcRightLane = arcLeftLane;
  const arcTopY = _BY + _R3;

  // angle ±30° above-the-break splits
  const arcAt = (a) => [_BX + _R3 * Math.sin(a), _BY + _R3 * Math.cos(a)];
  const [aL30x, aL30y] = arcAt(-_T30);
  const [aR30x, aR30y] = arcAt(_T30);
  // Extend rays to half-court line for above-the-break zone borders
  const dToHalf = (COURT_H - _BY) / Math.cos(_T30);
  const endLx = _BX + dToHalf * Math.sin(-_T30);
  const endRx = _BX + dToHalf * Math.sin(_T30);

  switch (code) {
    case "AR":
      // Half-circle around basket on court side
      return `M ${_BX - _RR} ${_BY} A ${_RR} ${_RR} 0 0 1 ${_BX + _RR} ${_BY} Z`;
    case "PA":
      // Lane rectangle minus the restricted half-circle
      return `M ${_LL} 0 L ${_LL} ${_LH} L ${_LR} ${_LH} L ${_LR} ${_BY} ` +
             `L ${_BX + _RR} ${_BY} A ${_RR} ${_RR} 0 0 0 ${_BX - _RR} ${_BY} ` +
             `L ${_LL} ${_BY} Z`;
    case "ML":
      // Left mid-range: between left of lane and 3pt arc, baseline (above cy3) up to FT line area
      return `M ${_LL} 0 L ${_CO} 0 L ${_CO} ${_CY3} ` +
             arc(_LL, arcLeftLane, _R3, 1) +
             ` L ${_LL} 0 Z`;
    case "MR":
      return `M ${_LR} 0 L ${COURT_W - _CO} 0 L ${COURT_W - _CO} ${_CY3} ` +
             arc(_LR, arcRightLane, _R3, 0) +
             ` L ${_LR} 0 Z`;
    case "MC":
      // Top-of-key inside the arc: from lane top across, bounded by arc above
      return `M ${_LL} ${_LH} L ${_LR} ${_LH} ` +
             `L ${_LR} ${arcRightLane} ` +
             arc(aR30x, aR30y, _R3, 0) +
             arc(aL30x, aL30y, _R3, 0) +
             arc(_LL, arcLeftLane, _R3, 0) +
             ` Z`;
    case "C3L":
      // Left corner 3: triangle from baseline to corner-3 intersection
      return `M 0 0 L ${_CO} 0 L ${_CO} ${_CY3} L 0 ${_CY3} Z`;
    case "C3R":
      return `M ${COURT_W - _CO} 0 L ${COURT_W} 0 L ${COURT_W} ${_CY3} L ${COURT_W - _CO} ${_CY3} Z`;
    case "W3L":
      // Above-the-break left wing 3: arc from cornerY to -30° boundary, then ray to half court
      return `M ${_CO} ${_CY3} ` +
             arc(aL30x, aL30y, _R3, 0) +
             ` L ${endLx} ${COURT_H} L 0 ${COURT_H} L 0 ${_CY3} Z`;
    case "W3R":
      return `M ${COURT_W - _CO} ${_CY3} L ${COURT_W} ${_CY3} L ${COURT_W} ${COURT_H} ` +
             `L ${endRx} ${COURT_H} ` +
             arc(aR30x, aR30y, _R3, 0) +
             ` Z`;
    case "T3":
      // Above-the-break top: between -30° and +30° arc rays
      return `M ${aL30x} ${aL30y} ` +
             arc(aR30x, aR30y, _R3, 0) +
             ` L ${endRx} ${COURT_H} L ${endLx} ${COURT_H} Z`;
  }
  return "";
}

/** Returns {x, y} to place the label inside a zone (rough centroid). */
function zoneLabelXY(code) {
  switch (code) {
    case "AR":  return { x: _BX,                cy: _BY + _RR * 0.4 };
    case "PA":  return { x: _BX,                cy: _BY + (_LH - _BY) * 0.55 };
    case "ML":  return { x: (_CO + _LL) / 2,    cy: _LH * 0.5 };
    case "MC":  return { x: _BX,                cy: _LH + 14 };
    case "MR":  return { x: (COURT_W - _CO + _LR) / 2, cy: _LH * 0.5 };
    case "C3L": return { x: _CO / 2,            cy: _CY3 * 0.55 };
    case "C3R": return { x: COURT_W - _CO / 2,  cy: _CY3 * 0.55 };
    case "W3L": return { x: _CO / 2 + 14,       cy: _CY3 + (COURT_H - _CY3) * 0.55 };
    case "W3R": return { x: COURT_W - _CO / 2 - 14, cy: _CY3 + (COURT_H - _CY3) * 0.55 };
    case "T3":  return { x: _BX,                cy: _BY + _R3 + 22 };
  }
  // fallback
  return { x: _BX, cy: COURT_H / 2 };
}

/** Render zone heatmap into a fresh SVG (replaces existing zone layer if any). */
function renderZoneHeatmap(svg, shots, options = {}) {
  const ns = "http://www.w3.org/2000/svg";
  const sideFilter = options.side || null;
  // Remove any existing zone layer
  svg.querySelectorAll(".zone, .zone-label").forEach(el => el.remove());

  const z = aggregateZones(shots, sideFilter);

  // Insert zones BEHIND court lines: prepend before court-line elements
  const firstLine = svg.querySelector(".court-line, .court-paint, .court-rim, .court-backboard");

  for (const { code, label } of ZONES) {
    const stats = z[code];
    const pct = stats.attempted > 0 ? (stats.made / stats.attempted * 100) : 0;
    const colors = efficiencyColor(pct, stats.attempted);

    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", zonePath(code));
    path.setAttribute("class", "zone");
    path.setAttribute("fill", colors.fill);
    path.setAttribute("stroke", "rgba(0,0,0,0.15)");
    path.setAttribute("stroke-width", "0.5");
    if (firstLine) svg.insertBefore(path, firstLine);
    else svg.appendChild(path);

    if (stats.attempted > 0) {
      const { x, cy } = zoneLabelXY(code);
      const g = document.createElementNS(ns, "g");
      g.setAttribute("class", "zone-label");
      g.setAttribute("transform", `translate(${x}, ${cy})`);
      const t1 = document.createElementNS(ns, "text");
      t1.setAttribute("text-anchor", "middle");
      t1.setAttribute("y", "-2");
      t1.setAttribute("class", "zone-text");
      t1.textContent = `${stats.made}/${stats.attempted}`;
      const t2 = document.createElementNS(ns, "text");
      t2.setAttribute("text-anchor", "middle");
      t2.setAttribute("y", "9");
      t2.setAttribute("class", "zone-pct");
      t2.textContent = `${pct.toFixed(1)}%`;
      g.appendChild(t1); g.appendChild(t2);
      svg.appendChild(g);
    }
  }
}

/** Build the list of unique players (from shots) for filter dropdowns. */
function shotPlayers(shots, sideFilter = null) {
  const map = new Map();
  for (const s of shots) {
    if (sideFilter && (sideFilter === "local") !== !!s.local) continue;
    const k = String(s.componente_id || "");
    if (!k) continue;
    if (!map.has(k)) {
      map.set(k, { componente_id: k, dorsal: s.dorsal, count: 0 });
    }
    map.get(k).count += 1;
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

window.RaverCourt = {
  makeCourtSvg, renderShots, renderZoneHeatmap, shotSummary,
  classifyShot, aggregateZones, ZONES, shotPlayers,
  COURT_W, COURT_H,
};
