/* Shared, key-free OpenStreetMap base map for every GeoNova view. */
(function () {
  GN.initMap = function (elId, opts = {}) {
    const map = L.map(elId, Object.assign({
      center: [48.2, 67.0], zoom: 5, minZoom: 4, maxZoom: 16,
      zoomControl: true,
    }, opts));
    const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
      subdomains: "abc", maxZoom: 19, crossOrigin: "anonymous",
    }).addTo(map);
    const stage = map.getContainer().closest(".map-stage, .quiz-stage");
    const status = stage && stage.querySelector(".map-status");
    let tileErrors = 0;
    tiles.on("loading", () => {
      tileErrors = 0;
      if (status) { status.textContent = "Карта жүктелуде…"; status.dataset.state = "loading"; }
    });
    tiles.on("tileerror", () => { tileErrors++; });
    tiles.on("load", () => {
      if (!status) return;
      status.textContent = tileErrors ? "Кейбір бөліктер жүктелмеді. Интернет байланысын тексеріңіз." : "OpenStreetMap · Дайын";
      status.dataset.state = tileErrors ? "error" : "ready";
    });
    // Grid reflow and wrapped navigation must never leave blank map strips.
    if (window.ResizeObserver) {
      let frame;
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
      });
      observer.observe(map.getContainer());
      map.on("unload", () => { observer.disconnect(); cancelAnimationFrame(frame); });
    }
    map.setMaxBounds([[38, 43], [58, 90]]);
    GN.map = map;
    return map;
  };

  GN.flyTo = function (lat, lon, zoom = 9, label) {
    GN.map.flyTo([lat, lon], zoom, { duration: 1.2 });
    if (label) L.popup().setLatLng([lat, lon]).setContent(`<b>${label}</b>`).openOn(GN.map);
  };

  GN.drawRoute = function (from, to, fromName, toName, distKm) {
    if (GN.routeLayer) GN.map.removeLayer(GN.routeLayer);
    const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
    const line = L.polyline([from, to], { color: "#38bdf8", weight: 5, dashArray: "10 8" });
    const m1 = L.circleMarker(from, { radius: 8, color: "#34d399", fillOpacity: 1 });
    const m2 = L.circleMarker(to, { radius: 8, color: "#f87171", fillOpacity: 1 });
    const lbl = L.tooltip({ permanent: true, direction: "top", className: "gn-label" })
      .setLatLng(mid).setContent(`${fromName} → ${toName}: <b>≈${distKm} км</b>`);
    GN.routeLayer = L.layerGroup([line, m1, m2, lbl]).addTo(GN.map);
  };
})();
