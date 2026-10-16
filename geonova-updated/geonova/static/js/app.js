/* Main map page bootstrap. */
(async function () {
  GN.initMap("map");
  try {
  GN.data = await GN.api("/api/layers");
  GN.years = GN.data.years;

  GN.buildLayers(GN.data);
  GN.renderLayerToggles(GN.data);
  GN.initTimeline(GN.data.years);
  GN.initDrawing(GN.map);
  GN.initAI();
  GN.initExport();

  // Aral Sea layer is timeline-driven: always visible
  GN.layerGroups.aral.addTo(GN.map);
  await GN.applyYear(GN.data.years[GN.data.years.length - 1]);
  GN.setLayer("population", true);
  } catch (error) {
    console.error("GeoNova data initialization failed", error);
    const message = document.createElement("p");
    message.className = "hint error-note";
    message.setAttribute("role", "alert");
    message.textContent = "Деректер жүктелмеді. Бетті жаңартып көріңіз.";
    document.getElementById("layer-toggles").appendChild(message);
  }
})();
