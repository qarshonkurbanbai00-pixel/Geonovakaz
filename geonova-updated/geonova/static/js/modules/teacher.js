/* Teacher / Admin custom quiz builder: pick coordinates on the map,
   write a question + options, save to the server. */
(function () {
  let map, picked = null, marker = null;
  const questions = [];

  function renderPreview() {
    const ol = document.getElementById("q-preview");
    ol.innerHTML = questions.map((q, i) =>
      `<li><b>${i + 1}.</b> ${q.question} <span class="hint">(${q.lat.toFixed(2)}, ${q.lon.toFixed(2)})</span></li>`
    ).join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    map = GN.initMap("teacher-map");

    map.on("click", e => {
      picked = e.latlng;
      document.getElementById("picked-coord").textContent =
        `📍 ${picked.lat.toFixed(4)}, ${picked.lng.toFixed(4)}`;
      if (marker) map.removeLayer(marker);
      marker = L.marker(picked).addTo(map);
    });

    document.getElementById("btn-add-q").addEventListener("click", () => {
      const text = document.getElementById("q-text").value.trim();
      const opts = [...document.querySelectorAll(".q-opt")].map(i => i.value.trim());
      if (!picked || !text || !opts[0]) {
        alert("Координата, сұрақ мәтіні және дұрыс жауап міндетті!");
        return;
      }
      questions.push({
        type: "choice", question: text,
        options: opts.filter(Boolean), answer: 0,
        lat: picked.lat, lon: picked.lng,
      });
      document.getElementById("q-text").value = "";
      document.querySelectorAll(".q-opt").forEach(i => (i.value = ""));
      renderPreview();
    });

    document.getElementById("btn-save-quiz").addEventListener("click", async () => {
      const title = document.getElementById("quiz-title").value.trim();
      const author = document.getElementById("quiz-author").value.trim();
      if (!title || !questions.length) {
        alert("Тест атауын жазыңыз және кемінде 1 сұрақ қосыңыз!");
        return;
      }
      const res = await GN.api("/api/quizzes", {
        method: "POST", body: { title, author, questions },
      });
      alert(`✅ Тест сақталды! ID: ${res.id}. «Тесттер» бөлімінен ойнатуға болады.`);
      questions.length = 0; renderPreview();
      document.getElementById("quiz-title").value = "";
    });
  });
})();
