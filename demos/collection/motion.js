/* Patio · movimiento de la colección Eventos
   GSAP + ScrollTrigger para la entrada de portada, el héroe y las secciones.
   Los loops ambientales viven aquí; el CSS hace el trabajo de respaldo. */

(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.gsap) return;

  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  var cover = document.querySelector(".cover");
  var body = document.body;

  function safe(selector, root) {
    try { return (root || document).querySelector(selector); } catch (e) { return null; }
  }

  function initCover() {
    if (!cover) return;
    var media = safe(".cover__media img", cover);
    var panel = safe(".cover__panel", cover);
    var stage = safe(".envelope-stage", cover);
    var seal = safe(".cover__seal", cover);
    var decor = cover.querySelectorAll(".cover__decor > *");

    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    if (media) tl.fromTo(media, { scale: 1.075, opacity: 0.2 }, { scale: 1.01, opacity: 1, duration: 1.5 }, 0);
    if (panel) tl.fromTo(panel, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.15);
    if (stage) tl.fromTo(stage, { y: 30, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 1 }, 0.35);
    if (seal) tl.fromTo(seal, { scale: 0.72, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.65, ease: "back.out(1.8)" }, 0.55);
    if (decor.length) tl.fromTo(decor, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07 }, 0.25);
    tl.eventCallback("onComplete", function () {
      if (seal) gsap.set(seal, { clearProps: "transform,opacity" });
    });

    // Loops ambientales de la portada.
    cover.querySelectorAll(".cover__butterfly").forEach(function (el, i) {
      gsap.to(el, {
        y: -9 - i * 2,
        rotation: "+=3",
        duration: 2.8 + i * 0.7,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: i * 0.3,
      });
    });
    cover.querySelectorAll(".cover__sprig").forEach(function (el, i) {
      gsap.to(el, {
        rotation: i % 2 ? "-=2.2" : "+=2.2",
        duration: 4.5 + i,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    });
    var cd = safe(".cover__cd", cover);
    if (cd) gsap.to(cd, { rotation: 360, duration: 18, repeat: -1, ease: "none" });
    var ball = safe(".cover__ball", cover);
    if (ball) gsap.to(ball, { rotation: 360, duration: 26, repeat: -1, ease: "none" });
    var mobile = safe(".cover__mobile", cover);
    if (mobile) {
      gsap.to(mobile, { rotation: 2.2, transformOrigin: "top center", duration: 3.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
    }
    var clouds = safe(".cover__clouds", cover);
    if (clouds) gsap.to(clouds, { x: 18, duration: 5, yoyo: true, repeat: -1, ease: "sine.inOut" });
    var letter = safe(".cover__letter", cover);
    if (letter) gsap.to(letter, { y: 6, duration: 3.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
    var foil = safe(".cover__foil-label", cover);
    if (foil) {
      gsap.to(foil, {
        backgroundPosition: "200% center",
        duration: 4.5,
        repeat: -1,
        ease: "sine.inOut",
      });
    }
    var constellation = safe(".cover__constellation path", cover);
    if (constellation) {
      var len = constellation.getTotalLength ? constellation.getTotalLength() : 900;
      gsap.fromTo(constellation, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.2, ease: "power2.out", delay: 0.4 });
    }
    var picado = safe(".cover__picado", cover);
    if (picado) gsap.to(picado, { rotation: 0.55, transformOrigin: "top center", duration: 3.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
    var dove = safe(".cover__dove", cover);
    if (dove) gsap.to(dove, { y: -9, rotation: 1.6, duration: 4.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
    var windowLight = safe(".cover__window", cover);
    if (windowLight) gsap.to(windowLight, { opacity: 0.86, duration: 5.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
    var balloons = safe(".cover__balloons", cover);
    if (balloons) gsap.to(balloons, { y: -8, duration: 3.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
    var animal = safe(".cover__animal", cover);
    if (animal) gsap.to(animal, { rotation: 1.6, transformOrigin: "bottom center", duration: 3.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    var stamp = safe(".cover__stamp", cover);
    if (stamp) gsap.fromTo(stamp, { scale: 1.14, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2.2)", delay: 0.85 });
    var chrome = safe(".cover__chrome", cover);
    if (chrome) gsap.to(chrome, { backgroundPosition: "220% center", duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" });
  }

  function initHero() {
    var hero = safe(".ev-hero");
    if (!hero) return;
    var talavera = body.classList.contains("ev--talavera");
    var title = safe(".ev-hero__title", hero);
    var restSelector = ".ev-hero__sub, .ev-hero__meta, .ev-hero__actions";
    if (talavera) restSelector += ", .ev-hero__marks, .ev-hero__caption";
    var rest = hero.querySelectorAll(restSelector);
    var tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: talavera ? 0.02 : 0.05 });
    if (title) tl.fromTo(title, { y: 38, opacity: 0 }, { y: 0, opacity: 1, duration: talavera ? 0.85 : 1.1 }, 0);
    if (rest.length) tl.fromTo(rest, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: talavera ? 0.6 : 0.75, stagger: talavera ? 0.08 : 0.1 }, talavera ? 0.18 : 0.25);
  }

  function initScroll() {
    if (!window.ScrollTrigger) return;
    gsap.utils.toArray(".ev-count, .ev-section").forEach(function (section) {
      gsap.fromTo(section,
        { y: 26, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: section, start: "top 88%", once: true },
        });
    });

    // La galería respira un poco al entrar.
    gsap.utils.toArray(".ev-gallery__grid img").forEach(function (img) {
      gsap.fromTo(img, { scale: 1.04 }, {
        scale: 1,
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: { trigger: img, start: "top 90%", once: true },
      });
    });
  }

  function watchGate() {
    if (!body.classList.contains("is-locked")) {
      initHero();
      return;
    }
    var observer = new MutationObserver(function () {
      if (body.classList.contains("invitation-open")) {
        observer.disconnect();
        initHero();
      }
    });
    observer.observe(body, { attributes: true, attributeFilter: ["class"] });
  }

  initCover();
  watchGate();
  initScroll();
})();
