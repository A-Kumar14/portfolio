/* =========================================================================
   Arssh Kumar — index behaviors (vanilla, no deps)
   1. Scroll-spy (+ sliding rail marker)   2. Reveal-on-enter (choreographed)
   3. Scroll telemetry → progress + parallax 4. Day/Night toggle
   Everything is driven from ONE requestAnimationFrame scroll loop using
   getBoundingClientRect (robust — no IntersectionObserver dependency).
   Motion is the personality; all of it respects prefers-reduced-motion and
   stays keyboard-accessible. Content is visible without JS (see the .js gate).
   ========================================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js"); // unlock the hidden-until-revealed states
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- 4. Day/Night toggle ---------------------------------------------- */
  var toggle = document.getElementById("theme-toggle");
  var STORAGE_KEY = "ak-theme";

  function readStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function writeStored(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* degrade gracefully */ }
  }
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (toggle) {
      var isLight = theme === "light";
      var label = toggle.querySelector("[data-theme-label]");
      if (label) { label.textContent = isLight ? "Night" : "Day"; }
      toggle.setAttribute("aria-pressed", String(isLight));
      toggle.setAttribute("aria-label", isLight ? "Switch to night theme" : "Switch to day theme");
    }
  }
  var stored = readStored();
  var systemLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  applyTheme(stored || (systemLight ? "light" : "dark"));
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      writeStored(next);
    });
  }

  /* --- Elements --------------------------------------------------------- */
  var grid = document.querySelector(".bg__grid");
  var glow = document.querySelector(".bg__glow");
  var hero = document.querySelector(".hero");
  var heroLines = Array.prototype.slice.call(document.querySelectorAll(".hero__line"));
  var sections = Array.prototype.slice.call(document.querySelectorAll("section[id]"));
  var allSections = Array.prototype.slice.call(document.querySelectorAll(".section"));
  var railLinks = Array.prototype.slice.call(document.querySelectorAll(".rail__list a"));
  var marker = document.querySelector(".rail__marker");
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  var linkById = {};
  railLinks.forEach(function (a) { linkById[a.getAttribute("href").replace(/^#/, "")] = a; });

  /* --- Choreographed stagger: delay reveals by order within a section --- */
  allSections.forEach(function (sec) {
    var kids = sec.querySelectorAll(".reveal");
    Array.prototype.forEach.call(kids, function (el, i) {
      el.style.setProperty("--d", (Math.min(i, 5) * 0.08) + "s");
    });
  });

  /* --- Rail marker ------------------------------------------------------ */
  function moveMarker(a) {
    if (!marker || !a) return;
    marker.style.setProperty("--marker-y", a.offsetTop + "px");
    marker.style.height = a.offsetHeight + "px";
    marker.classList.add("is-ready");
  }
  var activeId = null;
  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    railLinks.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
    var active = linkById[id];
    if (active) { active.classList.add("is-active"); active.setAttribute("aria-current", "true"); moveMarker(active); }
  }

  /* --- The one scroll loop: telemetry + parallax + reveal + spy --------- */
  var ticking = false;
  function render() {
    var y = window.scrollY || root.scrollTop || 0;
    var vh = root.clientHeight || 1;
    var scrollable = root.scrollHeight - root.clientHeight;
    var ratio = scrollable > 0 ? y / scrollable : 0;
    ratio = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
    root.style.setProperty("--p", String(ratio));

    if (!prefersReduced) {
      // background depth plane (slowest) + accent glow easing down and dimming
      root.style.setProperty("--grid-y", (y * 0.05).toFixed(1) + "px");
      root.style.setProperty("--glow-y", (-45 + ratio * 28).toFixed(1) + "%");
      if (glow) glow.style.opacity = String(0.5 - ratio * 0.32);
      // hero lines parallax at different rates and fade as the camera passes
      var heroFade = Math.max(0, 1 - y / (vh * 0.72));
      heroLines.forEach(function (line, i) {
        line.style.transform = "translate3d(0," + (-y * (i === 0 ? 0.16 : 0.30)).toFixed(1) + "px,0)";
        line.style.opacity = String(heroFade);
      });
    }

    // reveal-on-enter (rect-based; reveal once, then forget)
    if (revealEls.length) {
      var trigger = vh * 0.92;
      for (var i = revealEls.length - 1; i >= 0; i--) {
        if (revealEls[i].getBoundingClientRect().top < trigger) {
          revealEls[i].classList.add("is-visible");
          revealEls.splice(i, 1);
        }
      }
    }
    // section dividers wipe in
    if (pendingSections.length) {
      var wipeAt = vh * 0.85;
      for (var j = pendingSections.length - 1; j >= 0; j--) {
        if (pendingSections[j].getBoundingClientRect().top < wipeAt) {
          pendingSections[j].classList.add("is-in");
          pendingSections.splice(j, 1);
        }
      }
    }
    // scroll-spy: active = last section whose top has crossed the 42% line
    var line = vh * 0.42, current = sections[0];
    for (var k = 0; k < sections.length; k++) {
      if (sections[k].getBoundingClientRect().top <= line) current = sections[k];
    }
    if (current) setActive(current.id);

    ticking = false;
  }
  var pendingSections = allSections.slice();

  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(render); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    onScroll();
    var cur = document.querySelector(".rail__list a.is-active");
    if (cur) moveMarker(cur);
  });

  // hero mask-reveal once layout settles; reduced-motion shows it immediately.
  // double-rAF gives the entrance animation; the timeout is a failsafe so the
  // hero can never stay masked if rAF is throttled.
  function heroIn() { if (hero) hero.classList.add("is-in"); }
  if (hero) {
    if (prefersReduced) heroIn();
    else { requestAnimationFrame(function () { requestAnimationFrame(heroIn); }); setTimeout(heroIn, 500); }
  }

  // initial paint + post-layout passes (fonts, images), and whenever the page
  // actually becomes visible (covers tabs that load in the background).
  render();
  window.addEventListener("load", render);
  window.addEventListener("pageshow", render);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) render(); });
  requestAnimationFrame(render);
  setTimeout(render, 250);
  setTimeout(render, 800);

  /* --- Footer year ------------------------------------------------------ */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
