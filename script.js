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
  setupFaqTagFilter();
  setupContactForm();
  setupFadeIn();
  setupSectionTransitions();
  setupStatCounters();

  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (themeToggle) {
      themeToggle.textContent = theme === "dark" ? "🌞" : "🌓";
      const i18n = window.KoxI18n;
      const labelKey = theme === "dark" ? "theme.light" : "theme.dark";
      themeToggle.setAttribute(
        "aria-label",
        i18n ? i18n.t(labelKey) : (theme === "dark" ? "Switch to light mode" : "Switch to dark mode")
      );
    }
  }

  document.addEventListener("koxmail:langchange", () => {
    if (themeToggle && root.dataset.theme) {
      applyTheme(root.dataset.theme);
    }
    document.querySelectorAll(".field.invalid .error-msg").forEach((errorEl) => {
      const field = errorEl.closest(".field");
      const input = field?.querySelector("input, textarea");
      if (input) validateField(input);
    });
  });

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

  function setupFaqTagFilter() {
    const faqTags = document.getElementById("faqTags");
    if (!faqTags) return;

    const tagBtns = faqTags.querySelectorAll(".tag-btn");
    const accordion = document.getElementById("faqAccordion");
    const emptyState = document.getElementById("faqEmptyState");
    const searchInput = document.getElementById("faqSearch");

    tagBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tagBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const filter = btn.dataset.filter;
        const items = accordion?.querySelectorAll(".accordion-item") || [];
        let visibleCount = 0;

        items.forEach((item) => {
          const category = item.dataset.category;
          const shouldShow = filter === "all" || category === filter;
          item.hidden = !shouldShow;
          if (shouldShow) visibleCount += 1;
        });

        if (emptyState) {
          emptyState.hidden = visibleCount !== 0;
        }

        if (searchInput instanceof HTMLInputElement) {
          searchInput.value = "";
        }
      });
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
      if (text) {
        text.textContent = window.KoxI18n ? window.KoxI18n.t("form.submitting") : "Submitting...";
      }

      await wait(1200);
      form.hidden = true;
      success.hidden = false;
      submitBtn.classList.remove("is-loading");
      window.setTimeout(() => {
        window.location.href = "support.html?from=contact";
      }, 900);
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

    const i18n = window.KoxI18n;
    if (isRequired && !value) {
      errorMessage = i18n ? i18n.t("form.required") : "This field is required";
    } else if (element.getAttribute("type") === "email" && value) {
      const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailReg.test(value)) {
        errorMessage = i18n ? i18n.t("form.emailInvalid") : "Please enter a valid email address";
      }
    }

    field.classList.toggle("invalid", Boolean(errorMessage));
    errorEl.textContent = errorMessage;
    return !errorMessage;
  }

  function setupFadeIn() {
    if (!("IntersectionObserver" in window)) return;
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

  function setupSectionTransitions() {
    if (!("IntersectionObserver" in window)) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const sections = document.querySelectorAll("section");
    sections.forEach((section) => section.classList.add("section-glow"));

    const revealTargets = document.querySelectorAll(
      ".hero-content, .hero-art, .badge, .feature-card, .quote-card, .z-flow .card, .cards-4 .card, .price-card, .accordion-item, .contact-info, #contact .card, .cta-box"
    );

    revealTargets.forEach((el, index) => {
      el.classList.add("reveal");
      const delay = (index % 6) * 70;
      el.style.setProperty("--reveal-delay", `${delay}ms`);
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("reveal-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));
  }

  function setupStatCounters() {
    const statNumbers = document.querySelectorAll(".stat-number");
    if (!statNumbers.length) return;

    const animateCounter = (el) => {
      const target = parseInt(el.dataset.target || "0", 10);
      const duration = 2000;
      const startTime = performance.now();
      const startValue = 0;

      const formatNumber = (num) => {
        if (num >= 1000000000) {
          return (num / 1000000000).toFixed(1) + "B";
        }
        if (num >= 1000000) {
          return (num / 1000000).toFixed(1) + "M";
        }
        if (num >= 1000) {
          return (num / 1000).toFixed(1) + "K";
        }
        return num.toString();
      };

      const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(startValue + (target - startValue) * easeOut);

        el.textContent = formatNumber(currentValue);

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          el.textContent = formatNumber(target);
        }
      };

      requestAnimationFrame(updateCounter);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.3 }
    );

    statNumbers.forEach((el) => observer.observe(el));
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function setupOptionCards() {
    const optionCards = document.querySelectorAll(".option-card");
    if (!optionCards.length) return;

    optionCards.forEach((card) => {
      card.addEventListener("click", () => {
        optionCards.forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
      });
    });
  }

  function setupTabSwitcher() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    if (!tabButtons.length) return;

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }

  setupOptionCards();
  setupTabSwitcher();
  setupFloatingActions();
})();

function setupFloatingActions() {
  const floatingActions = document.getElementById("floatingActions");
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  const darkModeBtn = document.getElementById("darkModeBtn");

  if (!floatingActions) return;

  const handleScroll = () => {
    const isVisible = window.scrollY > 500;
    floatingActions.classList.toggle("visible", isVisible);
  };

  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  if (darkModeBtn) {
    darkModeBtn.addEventListener("click", () => {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateDarkModeIcon(darkModeBtn, isDark);
    });

    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    
    if (isDark) {
      document.documentElement.classList.add("dark");
      updateDarkModeIcon(darkModeBtn, true);
    }
  }
}

function updateDarkModeIcon(btn, isDark) {
  const svg = btn.querySelector("svg");
  if (!svg) return;
  
  if (isDark) {
    svg.innerHTML = '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>';
  } else {
    svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  }
}
