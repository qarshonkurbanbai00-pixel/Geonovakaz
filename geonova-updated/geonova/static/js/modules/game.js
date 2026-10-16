/* "Find the City" geography game with timer, score and scoreboard. */
(function () {
  let map, targets = [], idx = 0, score = 0, startTime = 0, timerId = null, marker = null;

  async function loadScoreboard() {
    const rows = await GN.api("/api/scores");
    const t = document.getElementById("scoreboard");
    t.innerHTML = "<tr><th>#</th><th>Ойыншы</th><th>Ұпай</th><th>Уақыт</th></tr>" +
      rows.map((r, i) =>
        `<tr><td>${i + 1}</td><td>${r.player}</td><td>${r.score}/${r.total}</td><td>${fmtTime(r.duration_sec)}</td></tr>`
      ).join("");
  }

  function fmtTime(s) {
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  function tick() {
    document.getElementById("hud-time").textContent = fmtTime((Date.now() - startTime) / 1000);
  }

  function nextTarget() {
    const el = document.getElementById("game-target");
    const msg = document.getElementById("game-msg");
    document.getElementById("hud-round").textContent = `${idx}/${targets.length}`;
    if (idx >= targets.length) return finish();
    el.classList.remove("hidden");
    el.textContent = `📍 ${targets[idx].name_kz} қаласын тап!`;
    msg.textContent = ""; msg.className = "game-msg";
  }

  async function finish() {
    clearInterval(timerId);
    const duration = (Date.now() - startTime) / 1000;
    const player = document.getElementById("player-name").value || "Оқушы";
    const msg = document.getElementById("game-msg");
    msg.className = "game-msg ok";
    msg.textContent = `🏁 Аяқталды! ${score}/${targets.length} — ${fmtTime(duration)}`;
    document.getElementById("game-target").classList.add("hidden");
    await GN.api("/api/scores", {
      method: "POST",
      body: { player, score, total: targets.length, duration_sec: duration, mode: "find_city" },
    });
    loadScoreboard();
  }

  async function start() {
    const data = await GN.api("/api/game/cities");
    targets = data.targets; idx = 0; score = 0;
    document.getElementById("hud-score").textContent = "0";
    startTime = Date.now();
    clearInterval(timerId); timerId = setInterval(tick, 500);
    nextTarget();
  }

  function onMapClick(e) {
    if (!targets.length || idx >= targets.length) return;
    const t = targets[idx];
    const d = GN.distKm(e.latlng.lat, e.latlng.lng, t.lat, t.lon);
    const msg = document.getElementById("game-msg");
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);
    if (d <= 60) {
      score++;
      document.getElementById("hud-score").textContent = score;
      msg.className = "game-msg ok";
      msg.textContent = `✅ Дұрыс! (${d.toFixed(0)} км қателік)`;
      idx++;
      setTimeout(nextTarget, 900);
    } else {
      msg.className = "game-msg bad";
      msg.textContent = `❌ Әлі ${d.toFixed(0)} км қалып қойды. Қайта көріңіз!`;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    map = GN.initMap("game-map");
    map.on("click", onMapClick);
    document.getElementById("btn-start-game").addEventListener("click", start);
    loadScoreboard();
  });
})();
