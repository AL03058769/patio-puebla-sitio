(function () {
  'use strict';

  var body = document.body;
  var demo = body.getAttribute('data-demo') || 'premium';
  var storageKey = 'patio-rsvp-' + demo;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- cover ---------- */
  var cover = document.getElementById('cover');
  var openBtn = document.getElementById('open-invitation');
  var main = document.getElementById('invitation-main');

  function openInvitation() {
    if (!cover) return;
    body.classList.remove('is-locked');
    body.classList.add('invitation-open');
    cover.classList.add('is-leaving');
    cover.setAttribute('aria-hidden', 'true');
    var delay = reduceMotion ? 20 : 850;
    window.setTimeout(function () {
      cover.hidden = true;
      if (main) main.focus({ preventScroll: true });
    }, delay);
  }

  var qa = new URLSearchParams(location.search).get('qa');
  if (qa === 'open') {
    body.classList.remove('is-locked');
    body.classList.add('invitation-open');
    if (cover) cover.hidden = true;
  }

  if (openBtn) openBtn.addEventListener('click', openInvitation);
  if (cover) {
    cover.addEventListener('keydown', function (event) {
      if (event.target !== cover) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openInvitation();
      }
    });
  }

  /* ---------- countdown ---------- */
  var countdown = document.querySelector('[data-countdown]');
  if (countdown) {
    var target = new Date(countdown.getAttribute('data-countdown')).getTime();
    var daysEl = document.getElementById('cd-days');
    var hoursEl = document.getElementById('cd-hours');
    var minsEl = document.getElementById('cd-mins');
    var secsEl = document.getElementById('cd-secs');

    function pad(n) { return String(n).padStart(2, '0'); }
    function tick() {
      var diff = target - Date.now();
      if (isNaN(target)) return;
      if (diff <= 0) {
        if (daysEl) daysEl.textContent = '0';
        if (hoursEl) hoursEl.textContent = '00';
        if (minsEl) minsEl.textContent = '00';
        if (secsEl) secsEl.textContent = '00';
        return;
      }
      var sec = Math.floor(diff / 1000);
      var days = Math.floor(sec / 86400);
      var hours = Math.floor((sec % 86400) / 3600);
      var mins = Math.floor((sec % 3600) / 60);
      var secs = sec % 60;
      if (daysEl) daysEl.textContent = String(days);
      if (hoursEl) hoursEl.textContent = pad(hours);
      if (minsEl) minsEl.textContent = pad(mins);
      if (secsEl) secsEl.textContent = pad(secs);
    }
    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------- calendar ---------- */
  var cal = document.getElementById('add-calendar');
  if (cal) {
    var start = cal.getAttribute('data-start');
    var end = cal.getAttribute('data-end');
    var title = cal.getAttribute('data-title') || 'Nuestra celebración';
    var calLocation = cal.getAttribute('data-location') || '';
    var details = cal.getAttribute('data-details') || '';
    if (start && end) {
      var url = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
        '&text=' + encodeURIComponent(title) +
        '&dates=' + encodeURIComponent(start + '/' + end) +
        '&ctz=America%2FMexico_City' +
        '&location=' + encodeURIComponent(calLocation) +
        '&details=' + encodeURIComponent(details);
      cal.setAttribute('href', url);
    }
  }

  /* ---------- rsvp ---------- */
  var form = document.getElementById('rsvp-form');
  var pass = document.getElementById('rsvp-pass');
  var passNote = document.getElementById('pass-note');
  var nameInput = document.getElementById('rsvp-name');
  var guestsSelect = document.getElementById('rsvp-guests');
  var menuSelect = document.getElementById('rsvp-menu');
  var messageInput = document.getElementById('rsvp-message');
  var songInput = document.getElementById('rsvp-song');
  var fillBtn = document.getElementById('fill-demo');
  var editBtn = document.getElementById('edit-rsvp');
  var resetBtn = document.getElementById('reset-demo');
  var qrBox = document.getElementById('pass-qr');
  var passName = document.getElementById('pass-name');
  var passSeats = document.getElementById('pass-seats');
  var passFolio = document.getElementById('pass-folio');
  var passMenu = document.getElementById('pass-menu');
  var passDate = document.getElementById('pass-date');
  var passSongWrap = document.getElementById('pass-song-wrap');
  var passSong = document.getElementById('pass-song');
  var success = document.getElementById('rsvp-success');
  var printBtn = document.getElementById('print-pass');
  var eventDateLabel = body.getAttribute('data-date-label') || '';

  function makeFolio() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var out = '';
    for (var i = 0; i < 4; i += 1) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return 'PAT-' + out;
  }

  function readSaved() {
    try {
      var raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function save(data) {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch (e) {}
  }

  function clearSaved() {
    try { localStorage.removeItem(storageKey); } catch (e) {}
  }

  function renderQr(data) {
    if (!qrBox || typeof qrcode !== 'function') return;
    var slug = demo === 'express' ? 'regina-15' : 'mariana-emilio';
    var payload = 'https://patio.mx/pase/' + slug +
      '?folio=' + encodeURIComponent(data.folio) +
      '&nombre=' + encodeURIComponent(data.name) +
      '&lugares=' + encodeURIComponent(String(data.guests));
    try {
      var qr = qrcode(0, 'M');
      qr.addData(payload);
      qr.make();
      qrBox.innerHTML = qr.createSvgTag({
        cellSize: 4,
        margin: 3,
        scalable: true,
        alt: { text: 'Pase QR de ' + data.name + ', ' + data.guests + ' lugares' }
      });
    } catch (e) {
      qrBox.innerHTML = '<p class="form__note">Vista previa del pase. El QR final se genera al confirmar.</p>';
    }
  }

  function showPass(data, scroll) {
    if (!pass) return;
    if (passName) passName.textContent = data.name;
    if (passSeats) passSeats.innerHTML = String(data.guests) + '<span>lugares</span>';
    if (passFolio) passFolio.textContent = data.folio;
    if (passMenu) passMenu.textContent = data.menu || 'Por confirmar';
    if (passDate) passDate.textContent = eventDateLabel;
    if (passSongWrap && songInput && data.song) {
      passSongWrap.hidden = false;
      if (passSong) passSong.textContent = data.song;
    }
    renderQr(data);
    if (form) form.hidden = true;
    if (passNote) passNote.hidden = true;
    if (success) success.classList.add('is-visible');
    pass.classList.add('is-visible');
    if (scroll) {
      window.setTimeout(function () {
        pass.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }, 80);
    }
  }

  function showForm(data) {
    if (!pass) return;
    pass.classList.remove('is-visible');
    if (passNote) passNote.hidden = false;
    if (success) success.classList.remove('is-visible');
    if (form) {
      form.hidden = false;
      if (data && nameInput) {
        nameInput.value = data.name || '';
        if (guestsSelect) guestsSelect.value = String(data.guests || 2);
        if (menuSelect) menuSelect.value = data.menu || '';
        if (messageInput) messageInput.value = data.message || '';
        if (songInput) songInput.value = data.song || '';
      }
      if (nameInput) nameInput.focus();
      form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }
  }

  function validate() {
    var ok = true;
    if (nameInput) {
      var field = nameInput.closest('.field');
      if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        if (field) field.classList.add('field--error');
        ok = false;
      } else if (field) {
        field.classList.remove('field--error');
      }
    }
    return ok;
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!validate()) return;
      var data = {
        name: nameInput ? nameInput.value.trim() : '',
        guests: guestsSelect ? parseInt(guestsSelect.value, 10) || 1 : 1,
        menu: menuSelect ? menuSelect.value : '',
        message: messageInput ? messageInput.value.trim() : '',
        song: songInput ? songInput.value.trim() : '',
        folio: makeFolio(),
        date: new Date().toISOString()
      };
      save(data);
      showPass(data, true);
    });

    if (nameInput) {
      nameInput.addEventListener('input', function () {
        var field = nameInput.closest('.field');
        if (field) field.classList.remove('field--error');
      });
    }
  }

  if (fillBtn) {
    fillBtn.addEventListener('click', function () {
      if (nameInput) nameInput.value = demo === 'express' ? 'Familia Regina' : 'Familia García Hernández';
      if (guestsSelect) guestsSelect.value = demo === 'express' ? '3' : '2';
      if (menuSelect) menuSelect.value = menuSelect.options[1] ? menuSelect.options[1].value : '';
      if (messageInput) messageInput.value = 'Con muchas ganas de celebrar con ustedes.';
      if (songInput) songInput.value = 'Color Esperanza — Diego Torres';
      if (nameInput) nameInput.focus();
    });
  }

  if (editBtn) {
    editBtn.addEventListener('click', function () {
      showForm(readSaved());
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      clearSaved();
      window.location.reload();
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', function () { window.print(); });
  }

  var saved = readSaved();
  if (saved) showPass(saved, false);

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
