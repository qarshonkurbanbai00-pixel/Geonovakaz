/* Theme preferences are optional: privacy/storage restrictions must not break UI. */
(function () {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  function sync() {
    const dark = root.dataset.theme !== "light";
    if (!btn) return;
    btn.textContent = dark ? "☀" : "☾";
    btn.setAttribute("aria-pressed", String(!dark));
    btn.setAttribute("aria-label", dark ? "Жарық режимге ауысу" : "Қараңғы режимге ауысу");
    btn.title = btn.getAttribute("aria-label");
    document.querySelector('meta[name="theme-color"]').content = dark ? "#101923" : "#f3f6fa";
  }
  sync();
  if (btn) btn.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    try { localStorage.setItem("geonova-theme", root.dataset.theme); } catch (_) {}
    sync();
  });
})();
