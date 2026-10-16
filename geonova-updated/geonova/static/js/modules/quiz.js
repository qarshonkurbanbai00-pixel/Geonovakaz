/* Quiz player: AI-generated quizzes (from sessionStorage) +
   teacher-built custom quizzes from /api/quizzes. */
(function () {
  let map, quiz = null, idx = 0, score = 0, pinMarker = null;

  function renderList(custom) {
    const host = document.getElementById("quiz-list");
    host.innerHTML = "";
    const ai = sessionStorage.getItem("geonova-quiz");
    if (ai) {
      const q = JSON.parse(ai);
      const b = document.createElement("button");
      b.className = "btn btn-primary";
      b.textContent = `🤖 ${q.title} (GeoNova AI)`;
      b.onclick = () => startQuiz(q);
      host.appendChild(b);
    }
    custom.forEach(q => {
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = `👩‍🏫 ${q.title} — ${q.author} (${q.questions.length} сұрақ)`;
      b.onclick = () => startQuiz(q);
      host.appendChild(b);
    });
    if (!host.children.length)
      host.innerHTML = '<div class="hint">Әзірге тест жоқ. Карта бетінде AI-дан тест сұраңыз немесе «Мұғалім» бетінде жасаңыз.</div>';
  }

  function startQuiz(q) {
    quiz = q; idx = 0; score = 0;
    document.getElementById("qz-title").textContent = quiz.title;
    renderQuestion();
  }

  function renderQuestion() {
    document.getElementById("qz-round").textContent = `${idx + 1}/${quiz.questions.length}`;
    document.getElementById("qz-score").textContent = score;
    const q = quiz.questions[idx];
    const box = document.getElementById("qz-options");
    const msg = document.getElementById("qz-msg");
    msg.textContent = ""; msg.className = "game-msg";
    document.getElementById("qz-question").textContent = q.question;
    box.innerHTML = "";
    if (q.lat && map) { map.flyTo([q.lat, q.lon], 6, { duration: 1 }); }

    if (q.type === "map") {
      msg.textContent = "🗺️ Төмендегі картадан дұрыс нүктені басыңыз!";
      quiz._awaitingMap = q;
      return;
    }
    quiz._awaitingMap = null;
    q.options.forEach((opt, i) => {
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = opt;
      b.onclick = () => {
        const ok = i === q.answer;
        b.classList.add(ok ? "correct" : "wrong");
        if (ok) { score++; msg.className = "game-msg ok"; msg.textContent = "✅ Дұрыс!"; }
        else { msg.className = "game-msg bad"; msg.textContent = `❌ Қате. Дұрыс жауап: ${q.options[q.answer]}`; }
        setTimeout(next, 1100);
      };
      box.appendChild(b);
    });
  }

  function next() {
    idx++;
    if (idx < quiz.questions.length) renderQuestion();
    else {
      document.getElementById("qz-question").textContent =
        `🏁 Тест аяқталды! Нәтиже: ${score}/${quiz.questions.length}`;
      document.getElementById("qz-options").innerHTML = "";
      document.getElementById("qz-round").textContent = "–";
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    map = GN.initMap("quiz-map");
    map.on("click", e => {
      if (!quiz || !quiz._awaitingMap) return;
      const q = quiz._awaitingMap;
      const d = GN.distKm(e.latlng.lat, e.latlng.lng, q.lat, q.lon);
      if (pinMarker) map.removeLayer(pinMarker);
      pinMarker = L.marker(e.latlng).addTo(map);
      const msg = document.getElementById("qz-msg");
      if (d <= 80) { score++; msg.className = "game-msg ok"; msg.textContent = `✅ Дұрыс! (${d.toFixed(0)} км)`; }
      else { msg.className = "game-msg bad"; msg.textContent = `❌ Қате — ${d.toFixed(0)} км қателік.`; }
      setTimeout(next, 1100);
    });
    const custom = await GN.api("/api/quizzes");
    renderList(custom);
  });
})();
