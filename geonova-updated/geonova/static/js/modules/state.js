/* GeoNova shared state + helpers (global namespace GN). */
window.GN = window.GN || {
  data: null,          // /api/layers payload
  year: 2025,
  years: [],
  map: null,
  layerGroups: {},     // key -> L.LayerGroup
  routeLayer: null,
  quiz: null,          // quiz currently injected by AI
};

GN.api = async function (url, opts = {}) {
  if (opts.body && typeof opts.body !== "string") {
    opts.body = JSON.stringify(opts.body);
    opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
  }
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const ct = res.headers.get("content-type") || "";
  return ct.includes("json") ? res.json() : res;
};

GN.distKm = function (aLat, aLon, bLat, bLon) {
  const r = 6371, p1 = aLat * Math.PI / 180, p2 = bLat * Math.PI / 180;
  const dp = (bLat - aLat) * Math.PI / 180, dl = (bLon - aLon) * Math.PI / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
};

GN.fmt = n => Number(n).toLocaleString("kk-KZ");
