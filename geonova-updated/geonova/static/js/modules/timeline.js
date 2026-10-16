/* Time-series slider: years 1990..2025 drive population bubbles,
   Aral Sea shoreline and a climate anomaly badge. */
(function () {
  let playing = false, timer = null;

  GN.applyYear = async function (year) {
    GN.year = year;
    const slider = document.getElementById("tl-slider");
    if (slider) {
      slider.value = GN.years.indexOf(year);
      const progress = Number(slider.max) > 0 ? Number(slider.value) / Number(slider.max) * 100 : 0;
      slider.style.setProperty("--progress", `${progress}%`);
      slider.setAttribute("aria-valuetext", `${year}`);
    }
    const label = document.getElementById("tl-label");
    if (label) label.textContent = year;
    if (GN.layerGroups.population && GN.map.hasLayer(GN.layerGroups.population)) GN.renderPopulation(year);
    GN.renderAral && GN.renderAral(year);
    try {
      const t = await GN.api(`/api/export/population/${year}`);
      if (GN.year === year) GN.renderAnalysisTable(year, t.rows);
    } catch (e) { /* ignore */ }
    if (GN.year !== year) return; // Ignore stale responses during rapid scrubbing.
    const anomaly = GN.data && GN.data.climate_anomaly[String(year)];
    if (anomaly !== undefined && GN.map) {
      if (GN._climateBadge) GN.map.removeControl(GN._climateBadge);
      GN._climateBadge = L.control({ position: "bottomleft" });
      GN._climateBadge.onAdd = () => {
        const div = L.DomUtil.create("div", "gn-label");
        div.innerHTML = `🌡️ ${year}: <b>+${anomaly}°C</b> аномалия`;
        return div;
      };
      GN._climateBadge.addTo(GN.map);
    }
  };

  GN.initTimeline = function (years) {
    const slider = document.getElementById("tl-slider");
    const play = document.getElementById("tl-play");
    if (!slider) return;
    GN.years = years;
    const ticks = document.getElementById("tl-ticks");
    if (ticks) { ticks.replaceChildren(...years.map(year => {
      const span = document.createElement("span"); span.textContent = year; return span;
    })); }
    slider.max = years.length - 1;
    slider.value = years.length - 1;
    slider.addEventListener("input", () => GN.applyYear(years[+slider.value]));
    play && play.addEventListener("click", () => {
      playing = !playing;
      play.textContent = playing ? "⏸" : "▶";
      play.setAttribute("aria-pressed", String(playing));
      play.setAttribute("aria-label", playing ? "Кідірту" : "Уақыт шкаласын ойнату");
      play.title = play.getAttribute("aria-label");
      if (playing) {
        timer = setInterval(() => {
          let v = (+slider.value + 1) % years.length;
          slider.value = v;
          GN.applyYear(years[v]);
        }, 1800);
      } else clearInterval(timer);
    });
    window.addEventListener("pagehide", () => clearInterval(timer));
  };
})();
