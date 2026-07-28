(() => {
  "use strict";
  const search = document.querySelector("#tool-search");
  const cards = [...document.querySelectorAll(".tool-card")];
  const filters = [...document.querySelectorAll(".filter")];
  const empty = document.querySelector("#empty-state");
  if (!search || !cards.length) return;
  let category = "all";
  const normalize = value => value.toLowerCase().trim();
  function update() {
    const query = normalize(search.value);
    let visible = 0;
    cards.forEach(card => {
      const categories = (card.dataset.categories || "").split(/\s+/);
      const matchesCategory = category === "all" || categories.includes(category);
      const matchesQuery = !query || normalize(card.dataset.search || "").includes(query) || normalize(card.textContent || "").includes(query);
      card.hidden = !(matchesCategory && matchesQuery);
      if (!card.hidden) visible += 1;
    });
    empty.hidden = visible !== 0;
  }
  filters.forEach(button => button.addEventListener("click", () => {
    category = button.dataset.filter || "all";
    filters.forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    update();
  }));
  search.addEventListener("input", update);
  document.addEventListener("keydown", event => {
    if (event.key === "/" && document.activeElement !== search) {
      event.preventDefault();
      search.focus();
    }
    if (event.key === "Escape" && document.activeElement === search) {
      search.value = "";
      search.blur();
      update();
    }
  });
  filters[0]?.setAttribute("aria-pressed", "true");
})();
