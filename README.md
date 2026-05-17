# cab-dashboard

Public dashboard de **Club Ateneo Ingeniero Raver** — estadísticas y mapas de
tiro de todos los torneos del club.

🌐 [Ver en vivo](https://llibarona.github.io/cab-dashboard/)

## Estructura

- `index.html` — listado de torneos
- `tournament.html` — posiciones y líderes estadísticos por categoría
- `team.html` — plantel, partidos y mapa de tiros por equipo
- `player.html` — estadísticas por partido y mapa de tiros por jugador
- `game.html` — boxscore detallado de cada partido
- `js/`, `css/` — scripts y estilos
- `snapshots/` — JSON con los datos extraídos (actualizado automáticamente
  por una Raspberry Pi)

## Datos

Los datos se obtienen de la app oficial de la federación. La extracción y
publicación están automatizadas: una Raspberry Pi corre un script todas las
noches, regenera los JSON y empuja el resultado a este repo. La página es
estática y se sirve a través de GitHub Pages.

Los datos no son oficiales — son una vista alternativa de información ya
pública.
