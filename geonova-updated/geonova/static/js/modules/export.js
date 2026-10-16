/* Export current map view: high-res PNG (client) and PDF report (server). */
(function () {
  function activeLayers() {
    return [...document.querySelectorAll("input[data-layer]:checked")].map(b => b.dataset.layer);
  }

  async function captureMap() {
    const hint = document.getElementById("map-capture-hint");
    hint && hint.classList.remove("hidden");
    try {
      const canvas = await html2canvas(document.getElementById("map"), {
        useCORS: true, allowTaint: false, scale: 2,   // high-resolution
      });
      const ctx = canvas.getContext("2d");
      const credit = "© OpenStreetMap contributors · openstreetmap.org/copyright";
      const size = Math.max(12, Math.round(canvas.width / 95));
      ctx.font = `${size}px sans-serif`;
      const width = ctx.measureText(credit).width + 24;
      ctx.fillStyle = "rgba(255,255,255,.94)";
      ctx.fillRect(canvas.width - width, canvas.height - size - 16, width, size + 16);
      ctx.fillStyle = "#142e42";
      ctx.fillText(credit, canvas.width - width + 12, canvas.height - 9);
      return canvas.toDataURL("image/png");
    } finally {
      hint && hint.classList.add("hidden");
    }
  }

  GN.initExport = function () {
    const pngBtn = document.getElementById("btn-export-png");
    const pdfBtn = document.getElementById("btn-export-pdf");

    pngBtn && pngBtn.addEventListener("click", async () => {
      const dataUrl = await captureMap();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `geonova_map_${GN.year}.png`;
      a.click();
    });

    pdfBtn && pdfBtn.addEventListener("click", async () => {
      const mapPng = await captureMap();
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Карта есебі",
          year: GN.year,
          layers: activeLayers(),
          map_png: mapPng,
        }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `geonova_report_${GN.year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };
})();
