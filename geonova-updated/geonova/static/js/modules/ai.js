/* GeoNova AI chat client — sends text to /api/ai/chat and applies
   the returned map actions (flyTo / route / enableLayer / quiz). */
(function () {
  function addMsg(text, who) {
    const log = document.getElementById("ai-log");
    if (!log) return;
    const div = document.createElement("div");
    div.className = `ai-msg ${who}`;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  GN.aiSay = t => addMsg(t, "bot");

  GN.applyAIActions = function (actions = []) {
    actions.forEach(a => {
      if (a.type === "flyTo") GN.flyTo(a.lat, a.lon, a.zoom || 9, a.label);
      else if (a.type === "route") {
        GN.drawRoute(a.from, a.to, a.from_name, a.to_name, a.distance_km);
        GN.map.flyToBounds(a.bounds, { padding: [40, 40], duration: 1.2 });
      }
      else if (a.type === "enableLayer" && a.layer) GN.setLayer(a.layer, true);
    });
  };

  GN.askAI = async function (text) {
    if (!text.trim()) return;
    addMsg(text, "user");
    try {
      const res = await GN.api("/api/ai/chat", { method: "POST", body: { message: text } });
      GN.aiSay(res.reply);
      GN.applyAIActions(res.actions);
      if (res.quiz) {
        GN.quiz = res.quiz;
        sessionStorage.setItem("geonova-quiz", JSON.stringify(res.quiz));
      }
    } catch (e) {
      GN.aiSay("Қате орын алды. Қайта көріңіз. 😔");
    }
  };

  GN.initAI = function () {
    const form = document.getElementById("ai-form");
    const input = document.getElementById("ai-input");
    if (!form) return;
    form.addEventListener("submit", e => {
      e.preventDefault();
      GN.askAI(input.value);
      input.value = "";
    });
    document.querySelectorAll(".chip").forEach(c =>
      c.addEventListener("click", () => GN.askAI(c.dataset.q)));
    GN.aiSay("Сәлем! Мен GeoNova AI-мың. Қашықтық, бағыт, қабат немесе тест сұраңыз. 🇰🇿");
  };
})();
