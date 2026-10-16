/* Teacher drawing & annotation toolbar (Leaflet.draw):
   freehand lines, region highlight, polygon area measure, text labels. */
(function () {
  GN.initDrawing = function (map) {
    const drawn = new L.FeatureGroup();
    map.addLayer(drawn);
    GN.drawnItems = drawn;

    const drawControl = new L.Control.Draw({
      position: "topleft",
      edit: { featureGroup: drawn },
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: { color: "#fbbf24", fillOpacity: 0.2 },
        },                     // region highlight + area measure
        polyline: { shapeOptions: { color: "#38bdf8", weight: 4 } },  // freehand line + length
        rectangle: { shapeOptions: { color: "#a78bfa", fillOpacity: 0.15 } },
        circle: { shapeOptions: { color: "#34d399", fillOpacity: 0.15 } },
        marker: false, circlemarker: false,
      },
    });
    map.addControl(drawControl);

    // Custom "text label" tool button
    const LabelControl = L.Control.extend({
      options: { position: "topleft" },
      onAdd() {
        const div = L.DomUtil.create("div", "leaflet-bar");
        const a = L.DomUtil.create("a", "", div);
        a.href = "#"; a.title = "Мәтін белгісі қою"; a.innerHTML = "🔤";
        L.DomEvent.on(a, "click", L.DomEvent.stop)
          .on(a, "click", () => {
            alert("Картадағы кез келген нүктені басыңыз — мәтін белгісі қоясыз.");
            map.once("click", e => {
              const text = prompt("Белгі мәтіні:", "Маңызды нүкте");
              if (text) {
                L.marker(e.latlng, {
                  icon: L.divIcon({ className: "gn-label", html: text, iconAnchor: [10, 10] }),
                }).addTo(drawn);
              }
            });
          });
        return div;
      },
    });
    map.addControl(new LabelControl());

    // Measurements on draw
    map.on(L.Draw.Event.CREATED, e => {
      const layer = e.layer;
      let note = "";
      if (e.layerType === "polygon" || e.layerType === "rectangle") {
        const latlngs = layer.getLatLngs()[0];
        const area = L.GeometryUtil ? L.GeometryUtil.geodesicArea(latlngs) : null;
        note = area ? `Ауданы: ≈${(area / 1e6).toFixed(1)} км²` : "";
      } else if (e.layerType === "polyline") {
        let d = 0; const pts = layer.getLatLngs();
        for (let i = 1; i < pts.length; i++) d += GN.distKm(pts[i-1].lat, pts[i-1].lng, pts[i].lat, pts[i].lng);
        note = `Ұзындығы: ≈${d.toFixed(1)} км`;
      }
      if (note) layer.bindTooltip(note, { permanent: true, className: "gn-label" }).openTooltip();
      drawn.addLayer(layer);
    });
  };
})();
