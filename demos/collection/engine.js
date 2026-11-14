(function () {
  "use strict";

  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var slug = body.getAttribute("data-slug") || "demo";
  var storageKey = "patio-demo-" + slug;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad(n) { return String(n).padStart(2, "0"); }

  /* ---------- aviso ---------- */
  var toastEl = null;
  var toastTimer = 0;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2400);
  }

  /* ---------- invitado desde la URL ---------- */
  var params = new URLSearchParams(location.search);
  var guest = params.get("invitado") || params.get("familia") || "";
  var seats = parseInt(params.get("pases") || params.get("lugares") || "", 10);
  var table = params.get("mesa") || "";

  if (guest) {
    $$("[data-guest]").forEach(function (el) { el.textContent = guest; });
    $$("[data-guest-wrap]").forEach(function (el) { el.hidden = false; });
  }
  if (table) {
    $$("[data-table]").forEach(function (el) { el.textContent = table; });
    $$("[data-table-wrap]").forEach(function (el) { el.hidden = false; });
  }

  /* ---------- puerta ---------- */
  var gate = $("[data-gate]");
  var openBtns = $$("[data-open]");
  var openBtn = openBtns[0] || null;
  var skipBtn = $("[data-skip]");
  var main = $("main");
  var gateVideo = $("[data-gate-video]");
  var gateDone = false;
  var gateOpening = false;
  var gateHideDelay = 700;

  function finishGate() {
    if (gateDone) return;
    gateDone = true;
    if (gateVideo) {
      try { gateVideo.pause(); } catch (e) {}
    }
    body.classList.remove("is-locked");
    body.classList.add("invitation-open");
    if (gate) {
      gate.classList.add("is-leaving");
      window.setTimeout(function () {
        gate.hidden = true;
        gate.classList.add("is-hidden");
      }, reduceMotion ? 20 : gateHideDelay);
    }
    if (main) {
      window.setTimeout(function () {
        main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: true });
      }, reduceMotion ? 30 : gateHideDelay + 20);
    }
  }

  function startVideoGate() {
    if (!gateVideo || reduceMotion) { finishGate(); return; }
    gateVideo.hidden = false;
    gateVideo.muted = true;
    gateVideo.playsInline = true;
    gateVideo.preload = "auto";
    var rate = parseFloat(gateVideo.getAttribute("data-rate") || "1");
    function applyRate() {
      try { if (rate > 0) gateVideo.playbackRate = rate; } catch (e) {}
    }
    applyRate();
    gateVideo.addEventListener("loadedmetadata", applyRate, { once: true });
    gateVideo.addEventListener("error", finishGate, { once: true });
    var play = gateVideo.play();
    if (play && typeof play.catch === "function") {
      play.catch(function () { finishGate(); });
    }
    gateVideo.addEventListener("ended", finishGate, { once: true });
    window.setTimeout(function () {
      if (skipBtn) skipBtn.hidden = false;
    }, 800);
  }

  function openGate() {
    if (!gate || gateOpening) return;
    gateOpening = true;
    if (gateVideo) {
      gateHideDelay = 550;
      gate.classList.add("is-playing");
      startVideoGate();
      return;
    }
    var envelope = $(".envelope, [data-envelope]", gate);
    if (envelope) {
      gateHideDelay = 400;
      gate.classList.add("is-envelope", "is-opening", "is-open");
      envelope.classList.add("is-open");
      window.setTimeout(finishGate, reduceMotion ? 40 : 1200);
      return;
    }
    gateHideDelay = 500;
    gate.classList.add("is-opening", "is-open");
    window.setTimeout(finishGate, reduceMotion ? 40 : 900);
  }

  if (gate) {
    body.classList.add("is-locked");
    openBtns.forEach(function (btn) { btn.addEventListener("click", openGate); });
    gate.addEventListener("click", function (event) {
      if (event.target === gate && !gateVideo) openGate();
    });
    gate.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        if (event.target === gate || event.target.hasAttribute("data-open")) {
          event.preventDefault();
          openGate();
        }
      }
      if (event.key === "Escape") finishGate();
    });
  }
  if (skipBtn) skipBtn.addEventListener("click", finishGate);
  if (params.get("qa") === "open") finishGate();

  /* ---------- countdown ---------- */
  var countdown = $("[data-countdown]");
  if (countdown) {
    var target = new Date(countdown.getAttribute("data-countdown")).getTime();
    function tick() {
      var diff = target - Date.now();
      if (isNaN(target)) return;
      if (diff < 0) diff = 0;
      var sec = Math.floor(diff / 1000);
      var parts = {
        days: Math.floor(sec / 86400),
        hours: Math.floor((sec % 86400) / 3600),
        mins: Math.floor((sec % 3600) / 60),
        secs: sec % 60
      };
      Object.keys(parts).forEach(function (key) {
        var el = $('[data-cd="' + key + '"]', countdown);
        if (el) el.textContent = key === "days" ? String(parts[key]) : pad(parts[key]);
      });
    }
    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------- calendario ---------- */
  $$("[data-calendar]").forEach(function (cal) {
    var start = cal.getAttribute("data-start");
    var end = cal.getAttribute("data-end");
    if (!start || !end) return;
    var url = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(cal.getAttribute("data-title") || "Nuestra celebración") +
      "&dates=" + encodeURIComponent(start + "/" + end) +
      "&ctz=America%2FMexico_City" +
      "&location=" + encodeURIComponent(cal.getAttribute("data-location") || "") +
      "&details=" + encodeURIComponent(cal.getAttribute("data-details") || "");
    cal.setAttribute("href", url);
    cal.setAttribute("target", "_blank");
    cal.setAttribute("rel", "noopener");
  });

  /* ---------- copiar ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (e) { reject(e); }
      document.body.removeChild(area);
    });
  }

  $$("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy") || btn.textContent.trim();
      copyText(value).then(function () {
        btn.classList.add("is-copied");
        toast("Copiado");
        window.setTimeout(function () { btn.classList.remove("is-copied"); }, 1600);
      }).catch(function () {
        toast("No se pudo copiar. Selecciona el texto.");
      });
    });
  });

  /* ---------- compartir ---------- */
  $$("[data-share]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var data = {
        title: btn.getAttribute("data-title") || document.title,
        text: btn.getAttribute("data-text") || "",
        url: btn.getAttribute("data-url") || location.href
      };
      if (navigator.share) {
        navigator.share(data).catch(function () {});
      } else {
        copyText(data.url).then(function () { toast("Enlace copiado"); });
      }
    });
  });

  /* ---------- lightbox ---------- */
  var lightbox = document.createElement("dialog");
  lightbox.className = "lightbox";
  lightbox.innerHTML = '<button class="lightbox__close" type="button" aria-label="Cerrar">×</button><img alt=""><p class="lightbox__caption"></p>';
  document.body.appendChild(lightbox);
  var lightboxImg = $("img", lightbox);
  var lightboxCap = $(".lightbox__caption", lightbox);

  function openLightbox(src, alt, caption) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightboxCap.textContent = caption || "";
    if (typeof lightbox.showModal === "function") lightbox.showModal();
    else lightbox.setAttribute("open", "");
  }
  $(".lightbox__close", lightbox).addEventListener("click", function () { lightbox.close(); });
  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) lightbox.close();
  });

  $$("[data-lightbox]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var img = $("img", btn);
      openLightbox(
        btn.getAttribute("data-full") || (img && img.src),
        btn.getAttribute("data-alt") || (img && img.alt),
        btn.getAttribute("data-caption") || ""
      );
    });
  });

  /* ---------- hotspots del mapa ---------- */
  var info = document.createElement("dialog");
  info.className = "lightbox info-dialog";
  info.innerHTML = '<button class="lightbox__close" type="button" aria-label="Cerrar">×</button><img alt="" hidden><p class="lightbox__caption"></p>';
  document.body.appendChild(info);
  var infoImg = $("img", info);
  var infoCap = $(".lightbox__caption", info);
  function openInfo(title, text, src) {
    infoCap.textContent = "";
    var strong = document.createElement("strong");
    strong.textContent = title;
    var p = document.createElement("span");
    p.textContent = text;
    infoCap.appendChild(strong);
    infoCap.appendChild(document.createElement("br"));
    infoCap.appendChild(p);
    if (src) {
      infoImg.src = src;
      infoImg.alt = title;
      infoImg.hidden = false;
    } else {
      infoImg.hidden = true;
      infoImg.removeAttribute("src");
    }
    if (typeof info.showModal === "function") info.showModal();
    else info.setAttribute("open", "");
  }
  $(".lightbox__close", info).addEventListener("click", function () { info.close(); });
  info.addEventListener("click", function (event) {
    if (event.target === info) info.close();
  });
  $$("[data-hotspot]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openInfo(
        btn.getAttribute("data-title") || "",
        btn.getAttribute("data-text") || "",
        btn.getAttribute("data-img") || ""
      );
    });
  });

  /* ---------- idioma ---------- */
  var langBtn = $("[data-lang-toggle]");
  if (langBtn) {
    var storedLang = localStorage.getItem("patio-lang");
    function setLang(lang) {
      var english = lang === "en";
      document.documentElement.lang = english ? "en" : "es";
      $$("[data-en]").forEach(function (el) {
        if (!el.hasAttribute("data-es")) el.setAttribute("data-es", el.textContent);
        el.textContent = english ? el.getAttribute("data-en") : el.getAttribute("data-es");
      });
      $$("[data-en-placeholder]").forEach(function (el) {
        if (!el.hasAttribute("data-es-placeholder")) el.setAttribute("data-es-placeholder", el.getAttribute("placeholder") || "");
        el.setAttribute("placeholder", english ? el.getAttribute("data-en-placeholder") : el.getAttribute("data-es-placeholder"));
      });
      langBtn.textContent = english ? "ES" : "EN";
      langBtn.setAttribute("aria-label", english ? "Ver en español" : "View in English");
      localStorage.setItem("patio-lang", lang);
    }
    langBtn.addEventListener("click", function () {
      setLang(document.documentElement.lang === "en" ? "es" : "en");
    });
    if (storedLang === "en") setLang("en");
  }

  /* ---------- música: pista original o sintetizador de respaldo ---------- */
  var musicButtons = $$("[data-music]");
  var audioCtx = null;
  var musicTimer = 0;
  var musicGain = null;
  var musicOn = false;
  var musicStep = 0;
  var track = $("[data-track]");
  var trackFade = 0;
  var trackFailed = false;
  var musicMode = musicButtons.length ? (musicButtons[0].getAttribute("data-music") || "jardin") : "jardin";

  function mtof(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /* Cada modo es una paleta original: notas MIDI, bajo, acordes y tempo.
     No hay pistas comerciales; todo se sintetiza en el navegador. */
  var musicConfig = {
    talavera: {
      tempo: 0.46, type: "triangle", level: 0.2, chordEvery: 4,
      notes: [69, 74, 77, 76, 74, 72, 69, 67, 69, 72, 74, 77, 81, 79, 77, 74],
      bass: [45, 50, 48, 43],
      chords: [[57, 62, 65], [53, 57, 60], [55, 59, 62], [50, 53, 57]]
    },
    vals: {
      tempo: 0.55, type: "sine", level: 0.18, chordEvery: 6, sparkle: true,
      notes: [72, 76, 79, 84, 79, 76, 74, 77, 81, 86, 81, 77],
      bass: [48, 55, 53, 48],
      chords: [[60, 64, 67], [57, 60, 64], [55, 59, 62], [53, 57, 60]]
    },
    bride: {
      tempo: 0.32, type: "triangle", level: 0.21, chordEvery: 4,
      notes: [72, 76, 79, 83, 79, 76, 74, 79, 81, 84, 81, 79],
      bass: [48, 55, 53, 50],
      chords: [[60, 64, 67], [65, 69, 72], [62, 65, 69], [67, 71, 74]]
    },
    devocional: {
      tempo: 0.72, type: "sine", level: 0.17, chordEvery: 4, sparkle: true,
      notes: [69, 72, 76, 72, 69, 64, 67, 72],
      bass: [45, 52, 48, 43],
      chords: [[57, 60, 64], [52, 55, 59], [55, 59, 62], [48, 52, 55]]
    },
    y2k: {
      tempo: 0.3, type: "square", level: 0.14, chordEvery: 4, kick: true,
      notes: [76, 79, 83, 86, 83, 79, 76, 74, 76, 79, 84, 88, 84, 79, 76, 74],
      bass: [48, 55, 53, 50],
      chords: [[60, 64, 67], [67, 71, 74], [65, 69, 72], [62, 65, 69]]
    },
    jardin: {
      tempo: 0.62, type: "sine", level: 0.18, chordEvery: 4,
      notes: [67, 72, 76, 79, 76, 72, 74, 79, 81, 76, 74, 72],
      bass: [43, 48, 50, 48],
      chords: [[55, 59, 62], [60, 64, 67], [57, 60, 64], [50, 53, 57]]
    },
    bolero: {
      tempo: 0.58, type: "sine", level: 0.2, chordEvery: 4,
      notes: [64, 67, 71, 72, 71, 67, 65, 69, 72, 74, 72, 69],
      bass: [40, 45, 43, 38],
      chords: [[52, 55, 59], [57, 60, 64], [55, 59, 62], [50, 53, 57]]
    },
    celeste: {
      tempo: 0.66, type: "sine", level: 0.17, chordEvery: 4, sparkle: true,
      notes: [72, 79, 76, 83, 79, 84, 81, 76],
      bass: [48, 55, 53, 50],
      chords: [[60, 67, 72], [57, 64, 69], [55, 62, 67], [53, 60, 65]]
    },
    himno: {
      tempo: 0.4, type: "triangle", level: 0.22, chordEvery: 4,
      notes: [72, 76, 79, 84, 79, 76, 74, 79, 81, 84, 86, 84],
      bass: [48, 55, 53, 50],
      chords: [[60, 64, 67], [67, 71, 74], [65, 69, 72], [62, 65, 69]]
    },
    jazz: {
      tempo: 0.5, type: "sine", level: 0.18, chordEvery: 3,
      notes: [64, 67, 71, 74, 71, 67, 65, 69, 72, 76, 72, 69],
      bass: [40, 45, 43, 38],
      chords: [[52, 55, 59, 64], [57, 60, 64, 67], [55, 59, 62, 65], [50, 53, 57, 60]]
    },
    caja: {
      tempo: 0.68, type: "sine", level: 0.15, chordEvery: 6, sparkle: true,
      notes: [84, 88, 91, 96, 91, 88, 86, 89, 93, 98, 93, 89],
      bass: [48, 55, 53, 50],
      chords: [[60, 64, 67], [57, 60, 64], [55, 59, 62], [53, 57, 60]]
    },
    safari: {
      tempo: 0.36, type: "triangle", level: 0.2, chordEvery: 4,
      notes: [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 83, 79, 76, 74, 72],
      bass: [48, 53, 55, 50],
      chords: [[60, 64, 67], [65, 69, 72], [62, 65, 69], [55, 59, 62]]
    },
    minimal: {
      tempo: 0.44, type: "sine", level: 0.16, chordEvery: 4,
      notes: [69, 69, 72, 69, 76, 72, 69, 67, 69, 69, 74, 69, 77, 74, 69, 67],
      bass: [45, 45, 48, 45],
      chords: [[57, 60, 64], [57, 60, 64], [55, 59, 62], [55, 59, 62]]
    },
    disco: {
      tempo: 0.3, type: "square", level: 0.14, chordEvery: 4, kick: true,
      notes: [72, 72, 79, 76, 72, 72, 79, 81, 72, 72, 79, 76, 74, 74, 81, 79],
      bass: [48, 48, 55, 53],
      chords: [[60, 64, 67], [60, 64, 67], [65, 69, 72], [62, 65, 69]]
    }
  };

  function ensureAudio() {
    if (audioCtx) return audioCtx;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.1;
    musicGain.connect(audioCtx.destination);
    return audioCtx;
  }

  function note(freq, when, duration, type, level) {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(level || 0.25, when + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(when);
    osc.stop(when + duration + 0.05);
  }

  function kick(when) {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, when);
    osc.frequency.exponentialRampToValueAtTime(46, when + 0.16);
    gain.gain.setValueAtTime(0.16, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(when);
    osc.stop(when + 0.24);
  }

  function playMusicStep() {
    if (!audioCtx || !musicOn) return;
    var cfg = musicConfig[musicMode] || musicConfig.jardin;
    var when = audioCtx.currentTime + 0.06;
    var midi = cfg.notes[musicStep % cfg.notes.length];
    note(mtof(midi), when, 1.7, cfg.type || "sine", cfg.level || 0.2);
    if (cfg.sparkle) note(mtof(midi + 12), when + 0.02, 1.05, "sine", 0.045);
    if (musicStep % (cfg.chordEvery || 4) === 0) {
      var chordIndex = musicStep / (cfg.chordEvery || 4);
      note(mtof(cfg.bass[chordIndex % cfg.bass.length]), when, 2.8, "sine", 0.14);
      if (cfg.chords) {
        cfg.chords[chordIndex % cfg.chords.length].forEach(function (n, i) {
          note(mtof(n), when + i * 0.045, 3.1, "sine", 0.04);
        });
      }
    }
    if (cfg.kick && musicStep % 4 === 0) kick(when);
    musicStep += 1;
  }

  function setMusicUI(on) {
    musicButtons.forEach(function (btn) {
      btn.classList.toggle("is-playing", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      var label = $("[data-music-label]", btn);
      if (label) label.textContent = on ? "Pausar" : "Música";
    });
    var disc = $("[data-vinyl]");
    if (disc) disc.classList.toggle("is-paused", !on);
    var vinyl = $("[data-vinyl-toggle]");
    if (vinyl) {
      vinyl.setAttribute("aria-pressed", on ? "true" : "false");
      var vinylLabel = $("[data-vinyl-label]", vinyl);
      if (vinylLabel) vinylLabel.textContent = on ? "Pausar" : "Escuchar";
    }
  }

  function fadeTrack(target, duration, done) {
    if (!track) { if (done) done(); return; }
    window.clearInterval(trackFade);
    var from = track.volume;
    var started = Date.now();
    trackFade = window.setInterval(function () {
      var p = Math.min(1, (Date.now() - started) / duration);
      track.volume = Math.max(0, Math.min(1, from + (target - from) * p));
      if (p >= 1) {
        window.clearInterval(trackFade);
        trackFade = 0;
        if (done) done();
      }
    }, 30);
  }

  function startMusic() {
    if (track && !trackFailed) {
      try {
        track.volume = 0;
        var play = track.play();
        var unlock = function () {
          if (musicOn) fadeTrack(0.55, 700);
        };
        var fallback = function () {
          trackFailed = true;
          musicOn = false;
          setMusicUI(false);
          startMusic();
        };
        if (play && typeof play.then === "function") play.then(unlock).catch(fallback);
        else unlock();
        musicOn = true;
        setMusicUI(true);
        return;
      } catch (e) {
        trackFailed = true;
      }
    }
    var ctx = ensureAudio();
    if (!ctx) { toast("Tu navegador no permite audio."); return; }
    if (ctx.state === "suspended") ctx.resume();
    musicOn = true;
    musicStep = 0;
    playMusicStep();
    window.clearInterval(musicTimer);
    var cfg = musicConfig[musicMode] || musicConfig.jardin;
    musicTimer = window.setInterval(playMusicStep, cfg.tempo * 1000);
    setMusicUI(true);
  }

  function stopMusic() {
    musicOn = false;
    window.clearInterval(musicTimer);
    if (track && !trackFailed) {
      fadeTrack(0, 350, function () {
        try { track.pause(); } catch (e) {}
      });
    } else if (musicGain && audioCtx) {
      musicGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.15);
      window.setTimeout(function () {
        if (musicGain && !musicOn) musicGain.gain.value = 0.1;
      }, 500);
    }
    setMusicUI(false);
  }

  musicButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (musicOn) stopMusic(); else startMusic();
    });
  });

  document.addEventListener("visibilitychange", function () {
    if (track && !trackFailed) {
      if (document.hidden && musicOn && !track.paused) track.pause();
      if (!document.hidden && musicOn && track.paused) {
        try { track.play(); } catch (e) {}
      }
      return;
    }
    if (!audioCtx) return;
    if (document.hidden && musicOn && audioCtx.state === "running") audioCtx.suspend();
    if (!document.hidden && musicOn && audioCtx.state === "suspended") audioCtx.resume();
  });

  /* ---------- progreso y navegación ---------- */
  var progress = $("[data-progress] span");
  var topbar = $("[data-topbar]");
  function onScroll() {
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    }
    if (topbar) topbar.classList.toggle("is-scrolled", window.scrollY > 24);
    if (!reduceMotion) {
      $$("[data-parallax]").forEach(function (img) {
        var rect = img.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        var offset = (rect.top - window.innerHeight / 2) * -0.04;
        img.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0) scale(1.08)";
      });
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  var revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  var navLinks = $$("[data-nav-link]");
  var navToggle = $("[data-nav-toggle]");
  var mobileMenu = $("[data-mobile-menu]");
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      body.classList.toggle("menu-open", open);
    });
    $$("a", mobileMenu).forEach(function (link) {
      link.addEventListener("click", function () {
        mobileMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        body.classList.remove("menu-open");
      });
    });
  }
  if (navLinks.length && "IntersectionObserver" in window) {
    var sections = navLinks.map(function (a) {
      return document.querySelector(a.getAttribute("href"));
    }).filter(Boolean);
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -50% 0px" });
    sections.forEach(function (section) { navObserver.observe(section); });
  }

  /* ---------- confeti ---------- */
  var confettiColors = ["#D8FF3E", "#FF3E8A", "#FF5A3C", "#1F3FD1", "#FFF8E7", "#D7D9DE"];
  function confetti() {
    if (reduceMotion) return;
    var host = document.createElement("div");
    host.className = "confetti";
    host.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 42; i += 1) {
      var piece = document.createElement("i");
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = confettiColors[i % confettiColors.length];
      piece.style.animationDelay = (Math.random() * .35) + "s";
      piece.style.animationDuration = (1.8 + Math.random() * 1.4) + "s";
      piece.style.transform = "rotate(" + Math.floor(Math.random() * 360) + "deg)";
      host.appendChild(piece);
    }
    document.body.appendChild(host);
    window.setTimeout(function () { host.remove(); }, 3600);
  }
  $$("[data-confetti]").forEach(function (el) {
    el.addEventListener("click", confetti);
  });

  /* ---------- rsvp ---------- */
  var form = $("[data-rsvp]");
  var pass = $("[data-pass]");
  var passNote = $("[data-pass-note]");
  var success = $("[data-rsvp-success]");
  var formWrap = $("[data-rsvp-form-wrap]");
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(storageKey) || "null"); } catch (e) { saved = null; }

  function save(data) {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch (e) {}
  }
  function clear() {
    try { localStorage.removeItem(storageKey); } catch (e) {}
  }
  function folio() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var prefix = body.getAttribute("data-folio-prefix") || "PAT";
    var out = prefix + "-";
    for (var i = 0; i < 4; i += 1) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
  }

  function renderQr(data) {
    var box = $("[data-pass-qr]", pass);
    if (!box) return;
    if (typeof qrcode !== "function") {
      box.innerHTML = "";
      return;
    }
    var payload = "https://patio.mx/pase/" + slug +
      "?folio=" + encodeURIComponent(data.folio) +
      "&nombre=" + encodeURIComponent(data.name) +
      "&lugares=" + encodeURIComponent(String(data.guests || 1));
    try {
      var qr = qrcode(0, "M");
      qr.addData(payload);
      qr.make();
      box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true, alt: { text: "Pase QR de " + data.name } });
    } catch (e) {
      box.innerHTML = "";
    }
  }

  function setText(name, value) {
    $$('[data-pass-' + name + ']').forEach(function (el) { el.textContent = value || ""; });
  }

  function showPass(data, scroll) {
    if (!pass) return;
    setText("name", data.name);
    setText("seats", data.guests);
    setText("folio", data.folio);
    setText("menu", data.menu || "Por confirmar");
    setText("song", data.song || "");
    setText("date", body.getAttribute("data-date-label") || "");
    setText("venue", body.getAttribute("data-venue-label") || data.venue || "");
    setText("table", table || "Por asignar");
    var declined = data.attendance === "no";
    pass.classList.toggle("is-declined", declined);
    if (!declined) renderQr(data);
    if (formWrap) formWrap.hidden = true;
    if (passNote) passNote.hidden = true;
    if (success) success.classList.add("is-visible");
    pass.classList.add("is-visible");
    if (scroll) {
      window.setTimeout(function () {
        pass.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }, 80);
    }
  }

  function showForm(data) {
    if (!pass) return;
    pass.classList.remove("is-visible");
    pass.classList.remove("is-declined");
    if (passNote) passNote.hidden = false;
    if (success) success.classList.remove("is-visible");
    if (formWrap) formWrap.hidden = false;
    if (data && form) {
      ["name", "guests", "menu", "song", "message"].forEach(function (name) {
        var field = form.elements[name];
        if (field && data[name] !== undefined) field.value = data[name];
      });
      var attendance = form.querySelector('input[name="attendance"][value="' + (data.attendance || "si") + '"]');
      if (attendance) attendance.checked = true;
      syncAttendance();
    }
    var nameInput = form && form.elements.name;
    if (nameInput) nameInput.focus();
    if (formWrap) formWrap.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  function syncAttendance() {
    if (!form) return;
    var checked = form.querySelector('input[name="attendance"]:checked');
    var attending = !checked || checked.value !== "no";
    $$(".js-attending", form).forEach(function (el) { el.hidden = !attending; });
  }

  if (form) {
    $$('input[name="attendance"]', form).forEach(function (radio) {
      radio.addEventListener("change", syncAttendance);
    });
    syncAttendance();
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var nameInput = form.elements.name;
      if (nameInput && nameInput.value.trim().length < 2) {
        var field = nameInput.closest(".field");
        if (field) field.classList.add("field--error");
        nameInput.focus();
        return;
      }
      var attendance = form.querySelector('input[name="attendance"]:checked');
      var data = {
        name: nameInput ? nameInput.value.trim() : "",
        guests: form.elements.guests ? parseInt(form.elements.guests.value, 10) || 1 : 1,
        menu: form.elements.menu ? form.elements.menu.value : "",
        song: form.elements.song ? form.elements.song.value.trim() : "",
        message: form.elements.message ? form.elements.message.value.trim() : "",
        attendance: attendance ? attendance.value : "si",
        folio: folio(),
        date: new Date().toISOString()
      };
      save(data);
      showPass(data, true);
      if (data.attendance !== "no") confetti();
    });
    var nameInput = form.elements.name;
    if (nameInput) {
      nameInput.addEventListener("input", function () {
        var field = nameInput.closest(".field");
        if (field) field.classList.remove("field--error");
      });
    }
    if (guest && nameInput && !nameInput.value) nameInput.value = guest;
    if (seats && form.elements.guests) form.elements.guests.value = String(Math.min(Math.max(seats, 1), 10));
  }

  var editBtn = $("[data-edit]");
  if (editBtn) editBtn.addEventListener("click", function () {
    var current = null;
    try { current = JSON.parse(localStorage.getItem(storageKey) || "null"); } catch (e) {}
    showForm(current);
  });
  var resetBtn = $("[data-reset]");
  if (resetBtn) resetBtn.addEventListener("click", function () {
    clear();
    window.location.reload();
  });
  var printBtn = $("[data-print]");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

  if (saved && params.get("qa") !== "form") showPass(saved, false);

  /* ---------- libro de visitas ---------- */
  var wishesForm = $("[data-wishes]");
  var wishesUser = $("[data-wishes-user]");
  var wishesCount = $("[data-wishes-count]");
  var wishesEmpty = $("[data-wishes-empty]");
  var wishesKey = "patio-wishes-" + slug;
  var wishes = [];
  try { wishes = JSON.parse(localStorage.getItem(wishesKey) || "[]") || []; } catch (e) { wishes = []; }

  function saveWishes() {
    try { localStorage.setItem(wishesKey, JSON.stringify(wishes)); } catch (e) {}
  }

  function hashPassword(value) {
    var text = String(value);
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buffer) {
        return Array.prototype.map.call(new Uint8Array(buffer), function (byte) {
          return ("0" + byte.toString(16)).slice(-2);
        }).join("");
      });
    }
    try {
      return Promise.resolve("b64:" + btoa(unescape(encodeURIComponent(text))));
    } catch (e) {
      return Promise.resolve("plain:" + text);
    }
  }

  function wishDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return "";
    try {
      return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long" }).format(date);
    } catch (e) {
      return "";
    }
  }

  function renderWishes() {
    if (!wishesUser) return;
    wishesUser.textContent = "";
    wishes.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    }).forEach(function (wish) {
      var article = document.createElement("article");
      article.className = "wish";
      var head = document.createElement("header");
      head.className = "wish__head";
      var name = document.createElement("strong");
      name.textContent = wish.name;
      var date = document.createElement("span");
      date.textContent = wishDate(wish.date);
      head.appendChild(name);
      head.appendChild(date);
      var message = document.createElement("p");
      message.className = "wish__text";
      message.textContent = wish.message;
      var foot = document.createElement("footer");
      foot.className = "wish__foot";
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "wish__delete";
      remove.setAttribute("data-wish-delete", wish.id);
      remove.textContent = "Borrar mi mensaje";
      foot.appendChild(remove);
      article.appendChild(head);
      article.appendChild(message);
      article.appendChild(foot);
      wishesUser.appendChild(article);
    });
    if (wishesCount) wishesCount.textContent = String(wishes.length);
    if (wishesEmpty) wishesEmpty.hidden = wishes.length > 0;
  }

  var wishDialog = null;
  var wishToDelete = null;

  function ensureWishDialog() {
    if (wishDialog) return wishDialog;
    wishDialog = document.createElement("dialog");
    wishDialog.className = "wish-dialog";
    wishDialog.innerHTML =
      '<form class="wish-dialog__form" data-wish-delete-form>' +
        '<p class="wish-dialog__title">Borrar mensaje</p>' +
        '<p class="wish-dialog__text">Escribe la contraseña con la que publicaste el mensaje.</p>' +
        '<div class="field">' +
          '<label for="wish-delete-password">Contraseña</label>' +
          '<input id="wish-delete-password" name="password" type="password" autocomplete="current-password" required>' +
        '</div>' +
        '<p class="wish-dialog__error" data-wish-error role="alert"></p>' +
        '<div class="wish-dialog__actions">' +
          '<button class="btn btn--ghost" type="button" data-wish-cancel>Cancelar</button>' +
          '<button class="btn" type="submit">Borrar</button>' +
        '</div>' +
      '</form>';
    document.body.appendChild(wishDialog);
    $("[data-wish-cancel]", wishDialog).addEventListener("click", function () { wishDialog.close(); });
    wishDialog.addEventListener("click", function (event) {
      if (event.target === wishDialog) wishDialog.close();
    });
    $("[data-wish-delete-form]", wishDialog).addEventListener("submit", function (event) {
      event.preventDefault();
      var input = $('input[name="password"]', wishDialog);
      var error = $("[data-wish-error]", wishDialog);
      var password = input ? input.value : "";
      if (password.length < 1 || !wishToDelete) {
        if (error) error.textContent = "Escribe tu contraseña.";
        return;
      }
      hashPassword(password).then(function (hash) {
        var index = wishes.findIndex(function (wish) { return wish.id === wishToDelete.id; });
        if (index === -1) {
          wishDialog.close();
          return;
        }
        if (wishes[index].hash !== hash) {
          if (error) error.textContent = "La contraseña no coincide. Inténtalo otra vez.";
          if (input) { input.value = ""; input.focus(); }
          return;
        }
        wishes.splice(index, 1);
        saveWishes();
        renderWishes();
        wishDialog.close();
        toast("Mensaje borrado");
      });
    });
    return wishDialog;
  }

  if (wishesUser) {
    renderWishes();
    wishesUser.addEventListener("click", function (event) {
      var button = event.target.closest("[data-wish-delete]");
      if (!button) return;
      var id = button.getAttribute("data-wish-delete");
      wishToDelete = wishes.find(function (wish) { return wish.id === id; }) || null;
      if (!wishToDelete) return;
      var dialog = ensureWishDialog();
      var input = $('input[name="password"]', dialog);
      var error = $("[data-wish-error]", dialog);
      if (input) input.value = "";
      if (error) error.textContent = "";
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      if (input) input.focus();
    });
  }

  if (wishesForm) {
    wishesForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var nameInput = wishesForm.elements.name;
      var passInput = wishesForm.elements.password;
      var messageInput = wishesForm.elements.message;
      var name = nameInput ? nameInput.value.trim() : "";
      var password = passInput ? passInput.value : "";
      var message = messageInput ? messageInput.value.trim() : "";
      if (name.length < 2) {
        toast("Escribe tu nombre.");
        if (nameInput) nameInput.focus();
        return;
      }
      if (password.length < 4) {
        toast("La contraseña necesita al menos 4 caracteres.");
        if (passInput) passInput.focus();
        return;
      }
      if (message.length < 4) {
        toast("Escribe tu mensaje.");
        if (messageInput) messageInput.focus();
        return;
      }
      hashPassword(password).then(function (hash) {
        wishes.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          name: name,
          message: message,
          hash: hash,
          date: new Date().toISOString()
        });
        saveWishes();
        renderWishes();
        wishesForm.reset();
        toast("Mensaje publicado");
      });
    });
  }

  /* ---------- sobre sorpresa ---------- */
  $$("[data-reveal-secret]").forEach(function (button) {
    button.addEventListener("click", function () {
      var open = button.classList.toggle("is-revealed");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---------- vinil ---------- */
  var vinylDisc = $("[data-vinyl]");
  var vinylToggle = $("[data-vinyl-toggle]");
  if (vinylToggle && vinylDisc) {
    vinylToggle.addEventListener("click", function () {
      if (musicOn) stopMusic(); else startMusic();
    });
  }

  var year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
