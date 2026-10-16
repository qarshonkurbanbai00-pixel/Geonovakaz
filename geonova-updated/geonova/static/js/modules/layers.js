/* Curriculum-aligned toggleable layers:
   minerals / climate / transport / population density. */
(function () {
  function popRadius(popK) { return Math.max(7, Math.sqrt(popK) * 0.55); }
  function popColor(popK) {
    return popK > 1000 ? "#ef4444" : popK > 400 ? "#f97316" : popK > 200 ? "#facc15" : "#22d3ee";
  }

  GN.buildLayers = function (d) {
    const g = {};

    // --- minerals ---
    g.minerals = L.layerGroup(d.minerals.map(m =>
      L.marker([m.lat, m.lon], {
        icon: L.divIcon({ html: "⛏️", className: "", iconSize: [24, 24] }),
      }).bindPopup(`<b>${m.name}</b><br>${m.type}<br><i>${m.note}</i>`)));

    // --- climate zones ---
    g.climate = L.layerGroup(d.climate_zones.map(z =>
      L.polygon(z.polygon, { color: z.color, weight: 2, fillOpacity: 0.25 })
        .bindPopup(`<b>${z.name}</b><br>${z.desc}`)));

    // --- transport ---
    const rails = d.transport.railways.map(r =>
      L.polyline(r.coords, { color: "#e879f9", weight: 4 }).bindPopup(`<b>${r.name}</b>`));
    const roads = d.transport.highways.map(r =>
      L.polyline(r.coords, { color: "#fbbf24", weight: 4, dashArray: "12 6" }).bindPopup(`<b>${r.name}</b>`));
    g.transport = L.layerGroup([...rails, ...roads]);

    // --- population density (year-aware bubbles) ---
    g.population = L.layerGroup();
    GN.renderPopulation = function (year) {
      g.population.clearLayers();
      d.cities.forEach(c => {
        const pop = c.pop[String(year)];
        L.circleMarker([c.lat, c.lon], {
          radius: popRadius(pop), color: popColor(pop), weight: 2, fillOpacity: 0.45,
        }).bindPopup(`<b>${c.name_kz}</b><br>${c.region}<br>Халық (${year}): ≈${GN.fmt(pop)} мың`)
          .addTo(g.population);
      });
    };

    // --- Aral Sea time series (shown with timeline) ---
    g.aral = L.layerGroup();
    GN.renderAral = function (year) {
      g.aral.clearLayers();
      const poly = d.aral_sea[String(year)];
      if (poly) L.polygon(poly, { color: "#38bdf8", weight: 2, fillOpacity: 0.55 })
        .bindPopup(`<b>Арал теңізі</b><br>${year} жылғы жағалау (шамамен)`).addTo(g.aral);
    };

    GN.layerGroups = g;
    return g;
  };

  GN.renderLayerToggles = function (d) {
    const host = document.getElementById("layer-toggles");
    if (!host) return;
    host.innerHTML = "";
    d.layers_meta.forEach(meta => {
      const row = document.createElement("label");
      row.className = "layer-row";
      row.innerHTML = `<input type="checkbox" data-layer="${meta.key}">
        <span><div class="l-name">${meta.name_kz}</div><div class="l-en">${meta.name_en}</div></span>`;
      row.querySelector("input").addEventListener("change", e => {
        GN.setLayer(meta.key, e.target.checked);
      });
      host.appendChild(row);
    });
  };

  GN.setLayer = function (key, on) {
    const grp = GN.layerGroups[key];
    if (!grp || !GN.map) return;
    if (key === "population" && on) GN.renderPopulation(GN.year);
    if (on) grp.addTo(GN.map); else GN.map.removeLayer(grp);
    const box = document.querySelector(`input[data-layer="${key}"]`);
    if (box) box.checked = on;
  };

  GN.renderAnalysisTable = function (year, rows) {
    const t = document.getElementById("analysis-table");
    if (!t || !rows) return;
    t.innerHTML = rows.map((r, i) =>
      i === 0 ? `<tr>${r.map(c => `<th>${c}</th>`).join("")}</tr>`
              : `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("");
  };
})();
