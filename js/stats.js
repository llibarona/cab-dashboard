// Stat formatting + sortable column definitions for player/team tables.

const STAT_COLS = [
  // sort_key, label (es), format, group, default sort
  { key: "GP",      label: "PJ",     fmt: v => v ?? 0, group: "base", title: "Partidos jugados" },
  { key: "MIN_avg", label: "MIN",    fmt: v => v ? v.toFixed(1) : "0.0", group: "base", title: "Minutos por partido" },
  { key: "PTS_avg", label: "PTS",    fmt: v => v ? v.toFixed(1) : "0.0", group: "base", title: "Puntos por partido", desc: true, default: true },
  { key: "FG_M",    label: "TC ✓",   fmt: v => v ?? 0, group: "FG", title: "Tiros de campo metidos (totales)" },
  { key: "FG_A",    label: "TC int", fmt: v => v ?? 0, group: "FG", title: "Tiros de campo intentados (totales)" },
  { key: "FG_pct",  label: "TC%",    fmt: v => v ? v.toFixed(1) + "%" : "—", group: "FG", title: "Porcentaje de tiros de campo" },
  { key: "FG2_M",   label: "T2 ✓",   fmt: v => v ?? 0, group: "2P", title: "Tiros de 2 metidos (totales)" },
  { key: "FG2_A",   label: "T2 int", fmt: v => v ?? 0, group: "2P", title: "Tiros de 2 intentados (totales)" },
  { key: "FG2_pct", label: "T2%",    fmt: v => v ? v.toFixed(1) + "%" : "—", group: "2P", title: "Porcentaje de tiros de 2" },
  { key: "FG3_M",   label: "T3 ✓",   fmt: v => v ?? 0, group: "3P", title: "Tiros de 3 metidos (totales)" },
  { key: "FG3_A",   label: "T3 int", fmt: v => v ?? 0, group: "3P", title: "Tiros de 3 intentados (totales)" },
  { key: "FG3_pct", label: "T3%",    fmt: v => v ? v.toFixed(1) + "%" : "—", group: "3P", title: "Porcentaje de tiros de 3" },
  { key: "FT_M",    label: "TL ✓",   fmt: v => v ?? 0, group: "FT", title: "Tiros libres metidos (totales)" },
  { key: "FT_A",    label: "TL int", fmt: v => v ?? 0, group: "FT", title: "Tiros libres intentados (totales)" },
  { key: "FT_pct",  label: "TL%",    fmt: v => v ? v.toFixed(1) + "%" : "—", group: "FT", title: "Porcentaje de tiros libres" },
  { key: "REB_avg", label: "REB",    fmt: v => v ? v.toFixed(1) : "0.0", group: "rebs", title: "Rebotes por partido" },
  { key: "REB_O",   label: "REB Of", fmt: v => v ?? 0, group: "rebs", title: "Rebotes ofensivos (totales)" },
  { key: "REB_D",   label: "REB Def",fmt: v => v ?? 0, group: "rebs", title: "Rebotes defensivos (totales)" },
  { key: "AST_avg", label: "AST",    fmt: v => v ? v.toFixed(1) : "0.0", group: "playmaking", title: "Asistencias por partido" },
  { key: "STL_avg", label: "ROB",    fmt: v => v ? v.toFixed(1) : "0.0", group: "defense", title: "Robos por partido" },
  { key: "BLK_avg", label: "TAP",    fmt: v => v ? v.toFixed(1) : "0.0", group: "defense", title: "Tapones por partido" },
  { key: "TOV_avg", label: "PER",    fmt: v => v ? v.toFixed(1) : "0.0", group: "defense", title: "Pérdidas por partido" },
  { key: "VAL_avg", label: "VAL",    fmt: v => v ? v.toFixed(1) : "0.0", group: "advanced", title: "Valoración por partido" },
  { key: "MM_avg",  label: "+/-",    fmt: v => v != null ? v.toFixed(1) : "0.0", group: "advanced", title: "+/- por partido" },
  { key: "FOULS",   label: "FAL",    fmt: v => v ?? 0, group: "advanced", title: "Faltas cometidas (totales)" },
];

function fmtMin(ms) {
  if (!ms) return "—";
  const total = ms / 60000;
  const m = Math.floor(total);
  const s = Math.round((total - m) * 60);
  return `${m}:${String(s).padStart(2,"0")}`;
}

function compareStat(a, b, key) {
  const va = a[key] ?? -Infinity;
  const vb = b[key] ?? -Infinity;
  if (typeof va === "string" || typeof vb === "string") return String(va).localeCompare(String(vb));
  return va - vb;
}

function sortPlayers(rows, sortKey, asc = false) {
  const col = STAT_COLS.find(c => c.key === sortKey);
  const direction = asc ? 1 : -1;
  return [...rows].sort((a, b) => direction * compareStat(b, a, sortKey));
}

window.RaverStats = { STAT_COLS, fmtMin, compareStat, sortPlayers };
