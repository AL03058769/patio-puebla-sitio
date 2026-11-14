(function () {
  "use strict";

  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- deseos dentro del RSVP ---------- */
  var form = $("[data-rsvp]");
  var wishUser = $("[data-wish-user]");
  var wishEmpty = $("[data-wish-empty]");
  var wishKey = "patio-wishes-ev-talavera";
  var wishIdKey = "patio-wish-id-ev-talavera";
  var extraKey = "patio-extra-ev-talavera";
  var rsvpKey = "patio-demo-ev-talavera";

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function wishDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return "";
    try {
      return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long" }).format(date);
    } catch (e) { return ""; }
  }
  function makeWishCard(wish, current) {
    var article = document.createElement("article");
    article.className = "wish";
    var head = document.createElement("header");
    head.className = "wish__head";
    var name = document.createElement("strong");
    name.textContent = wish.name;
    var date = document.createElement("span");
    date.textContent = wishDate(wish.date) + (current ? " · Tu mensaje" : "");
    head.appendChild(name);
    head.appendChild(date);
    var text = document.createElement("p");
    text.className = "wish__text";
    text.textContent = wish.message;
    article.appendChild(head);
    article.appendChild(text);
    return article;
  }
  function renderWishes() {
    if (!wishUser) return;
    var wishes = load(wishKey, []);
    var currentId = "";
    try { currentId = localStorage.getItem(wishIdKey) || ""; } catch (e) {}
    wishUser.textContent = "";
    wishes.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    }).slice(0, 6).forEach(function (wish) {
      wishUser.appendChild(makeWishCard(wish, wish.id === currentId));
    });
    if (wishEmpty) wishEmpty.hidden = wishes.length > 0;
  }
  function saveWish() {
    if (!form) return;
    var name = form.elements.name ? form.elements.name.value.trim() : "";
    var message = form.elements.message ? form.elements.message.value.trim() : "";
    if (name.length < 2 || message.length < 2) return;
    var attendance = form.querySelector('input[name="attendance"]:checked');
    if (attendance && attendance.value === "no") return;
    var wishes = load(wishKey, []);
    var id = "";
    try { id = localStorage.getItem(wishIdKey) || ""; } catch (e) {}
    if (!id) {
      id = "w-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
      try { localStorage.setItem(wishIdKey, id); } catch (e) {}
    }
    var existing = null;
    wishes.forEach(function (wish) { if (wish.id === id) existing = wish; });
    var payload = { id: id, name: name, message: message, date: new Date().toISOString() };
    if (existing) {
      existing.name = payload.name;
      existing.message = payload.message;
      existing.date = payload.date;
    } else {
      wishes.push(payload);
    }
    save(wishKey, wishes);
    renderWishes();
  }
  function saveExtras() {
    if (!form) return;
    save(extraKey, {
      notes: form.elements.notes ? form.elements.notes.value : "",
      transport: form.elements.transport ? form.elements.transport.value : ""
    });
  }
  function fillExtras() {
    if (!form) return;
    var extra = load(extraKey, null);
    if (!extra) return;
    if (form.elements.notes && form.elements.notes.value === "") form.elements.notes.value = extra.notes || "";
    if (form.elements.transport && extra.transport) form.elements.transport.value = extra.transport;
  }

  if (form) {
    form.addEventListener("submit", function () {
      saveExtras();
      window.setTimeout(saveWish, 0);
    });
    fillExtras();
  }
  var edit = $("[data-edit]");
  if (edit) {
    edit.addEventListener("click", function () {
      window.setTimeout(fillExtras, 30);
    });
  }
  renderWishes();

  /* ---------- rascar la fecha ---------- */
  var scratch = $("[data-scratch]");
  var canvas = $("[data-scratch-canvas]");
  var revealBtn = $("[data-scratch-reveal]");
  if (scratch && canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var drawing = false;
    var last = null;
    var revealed = false;
    var checkTimer = 0;

    function paint() {
      var rect = scratch.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var w = rect.width;
      var h = rect.height;
      var grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#245A9A");
      grad.addColorStop(.48, "#1B4A86");
      grad.addColorStop(1, "#123A6B");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Trama de azulejo tenue.
      ctx.strokeStyle = "rgba(246,239,223,.10)";
      ctx.lineWidth = 1;
      for (var x = 0; x < w; x += 34) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (var y = 0; y < h; y += 34) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(246,239,223,.55)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(10.5, 10.5, w - 21, h - 21);

      ctx.fillStyle = "#F6EFDF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "italic 400 " + Math.round(Math.min(w, h) * 0.19) + "px 'Instrument Serif', Georgia, serif";
      ctx.fillText("rasca aquí", w / 2, h / 2 - 6);
      ctx.font = "600 9px Manrope, system-ui, sans-serif";
      ctx.globalAlpha = .72;
      ctx.fillText("UNA PEQUEÑA SORPRESA", w / 2, h / 2 + 26);
      ctx.globalAlpha = 1;
      scratch.classList.add("is-ready");
    }

    function erase(x, y) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    function position(event) {
      var rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function scratchedRatio() {
      var w = canvas.width;
      var h = canvas.height;
      if (!w || !h) return 0;
      var data = ctx.getImageData(0, 0, w, h).data;
      var clear = 0;
      var total = 0;
      for (var i = 3; i < data.length; i += 4 * 24) {
        total += 1;
        if (data[i] < 24) clear += 1;
      }
      return total ? clear / total : 0;
    }

    function reveal() {
      if (revealed) return;
      revealed = true;
      drawing = false;
      scratch.classList.add("is-revealed");
      canvas.style.pointerEvents = "none";
      if (revealBtn) revealBtn.hidden = true;
    }

    function check() {
      if (scratchedRatio() > .45) reveal();
    }

    canvas.addEventListener("pointerdown", function (event) {
      if (revealed) return;
      drawing = true;
      last = position(event);
      erase(last.x, last.y);
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", function (event) {
      if (!drawing || revealed) return;
      var point = position(event);
      if (last) {
        var dx = point.x - last.x;
        var dy = point.y - last.y;
        var steps = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dy * dy) / 10));
        for (var i = 0; i <= steps; i += 1) {
          erase(last.x + (dx * i) / steps, last.y + (dy * i) / steps);
        }
      }
      last = point;
      window.clearTimeout(checkTimer);
      checkTimer = window.setTimeout(check, 120);
    });
    canvas.addEventListener("pointerup", function () { drawing = false; last = null; check(); });
    canvas.addEventListener("pointercancel", function () { drawing = false; last = null; });
    if (revealBtn) revealBtn.addEventListener("click", reveal);

    paint();
    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      if (revealed) return;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(paint, 180);
    });
    if (reduceMotion) {
      // Aun sin animación, rascar es una interacción directa: se conserva.
    }
  }
})();
