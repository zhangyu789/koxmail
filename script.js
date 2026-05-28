(function () {
  const root = document.documentElement;
  const header = document.getElementById("siteHeader");
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");
  const themeToggle = document.getElementById("themeToggle");

  const mediaDark = window.matchMedia("(prefers-color-scheme: dark)");
  const savedTheme = localStorage.getItem("koxmail-theme");
  const initialTheme = savedTheme || (mediaDark.matches ? "dark" : "light");
  applyTheme(initialTheme);

  window.addEventListener("scroll", () => {
    header.classList.toggle("is-scrolled", window.scrollY > 50);
  });

  menuToggle?.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav?.addEventListener("click", (event) => {
    if (!(event.target instanceof HTMLAnchorElement)) return;
    mainNav.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });

  themeToggle?.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem("koxmail-theme", nextTheme);
  });

  setupAccordion();
  setupFaqSearch();
  setupContactForm();
  setupFadeIn();

  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (themeToggle) {
      themeToggle.textContent = theme === "dark" ? "🌞" : "🌓";
      themeToggle.setAttribute("aria-label", theme === "dark" ? "切换亮色模式" : "切换暗黑模式");
    }
  }

  function setupAccordion() {
    const accordion = document.getElementById("faqAccordion");
    if (!accordion) return;

    const triggers = accordion.querySelectorAll(".accordion-trigger");
    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const item = trigger.closest(".accordion-item");
        if (!item) return;

        const isOpen = item.classList.contains("is-open");
        closeAllItems(accordion);

        if (!isOpen) {
          openItem(item, trigger);
        }
      });
    });
  }

  function openItem(item, trigger) {
    const panel = item.querySelector(".accordion-panel");
    if (!(panel instanceof HTMLElement)) return;
    item.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    panel.style.maxHeight = `${panel.scrollHeight}px`;
  }

  function closeAllItems(container) {
    container.querySelectorAll(".accordion-item").forEach((item) => {
      const trigger = item.querySelector(".accordion-trigger");
      const panel = item.querySelector(".accordion-panel");
      item.classList.remove("is-open");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (panel instanceof HTMLElement) panel.style.maxHeight = "0px";
    });
  }

  function setupFaqSearch() {
    const searchInput = document.querySelector("#faq input[type='search']");
    const accordion = document.getElementById("faqAccordion");
    const emptyState = document.getElementById("faqEmptyState");
    if (!(searchInput instanceof HTMLInputElement) || !accordion || !emptyState) return;

    searchInput.addEventListener("input", () => {
      const keyword = searchInput.value.trim().toLowerCase();
      const items = Array.from(accordion.querySelectorAll(".accordion-item"));
      let visibleCount = 0;

      items.forEach((item) => {
        const text = item.textContent?.toLowerCase() || "";
        const matched = !keyword || text.includes(keyword);
        item.hidden = !matched;
        if (matched) visibleCount += 1;
      });

      emptyState.hidden = visibleCount !== 0;
    });
  }

  function setupContactForm() {
    const form = document.getElementById("contactForm");
    const submitBtn = document.getElementById("contactSubmit");
    const success = document.getElementById("contactSuccess");
    if (!(form instanceof HTMLFormElement) || !(submitBtn instanceof HTMLButtonElement) || !success) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const isValid = validateForm(form);
      if (!isValid) return;

      submitBtn.classList.add("is-loading");
      submitBtn.disabled = true;
      const text = submitBtn.querySelector(".btn-text");
      if (text) text.textContent = "正在提交...";

      await wait(1200);
      form.hidden = true;
      success.hidden = false;
      submitBtn.classList.remove("is-loading");
    });

    form.querySelectorAll("input, textarea").forEach((el) => {
      el.addEventListener("blur", () => validateField(el));
      el.addEventListener("input", () => {
        const field = el.closest(".field");
        if (field?.classList.contains("invalid")) {
          validateField(el);
        }
      });
    });
  }

  function validateForm(form) {
    const fields = Array.from(form.querySelectorAll("input, textarea"));
    const results = fields.map(validateField);
    return results.every(Boolean);
  }

  function validateField(element) {
    const field = element.closest(".field");
    const errorEl = field?.querySelector(".error-msg");
    if (!field || !errorEl) return true;

    let errorMessage = "";
    const value = element.value.trim();
    const isRequired = element.hasAttribute("required");

    if (isRequired && !value) {
      errorMessage = "此字段为必填项";
    } else if (element.getAttribute("type") === "email" && value) {
      const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailReg.test(value)) errorMessage = "请输入有效的邮箱地址";
    }

    field.classList.toggle("invalid", Boolean(errorMessage));
    errorEl.textContent = errorMessage;
    return !errorMessage;
  }

  function setupFadeIn() {
    const targets = document.querySelectorAll(".card, .price-card");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("fade-in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    targets.forEach((el) => observer.observe(el));
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
})();
