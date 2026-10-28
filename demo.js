// Small in-memory demo of the missed-dose prompt. Sample data only. Nothing is stored or sent.
(function () {
  'use strict';

  try {
    var yr = document.getElementById('yr');
    if (yr) yr.textContent = String(new Date().getFullYear());
  } catch (e) { /* the static year stays */ }

  var medsEl = document.getElementById('demo-meds');
  var form = document.getElementById('demo-form');
  if (!medsEl || !form) return;

  var formTitle = document.getElementById('demo-form-title');
  var chipsEl = document.getElementById('demo-chips');
  var noteEl = document.getElementById('demo-note');
  var logEl = document.getElementById('demo-log');
  var cancelBtn = document.getElementById('demo-cancel');
  var resetBtn = document.getElementById('demo-reset');

  var REASONS = ['Travel', 'Work shift', 'Out of routine', 'Side effects'];

  function freshMeds() {
    return [
      { name: 'Sample medicine A', when: '8:00 AM', tag: 'Morning', left: 6 },
      { name: 'Sample medicine B', when: '1:00 PM', tag: 'Midday', left: 4 },
      { name: 'Sample medicine C', when: '9:00 PM', tag: 'Evening', left: 9 }
    ];
  }

  var meds = freshMeds();
  var log = [];
  var pending = null;
  var picked = {};

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function stockNote(left) {
    if (left <= 0) return { text: 'Out of stock', low: true };
    if (left <= 3) return { text: 'Refill notification would appear now', low: true };
    if (left < 5) return { text: 'Low stock', low: true };
    return null;
  }

  function actionButton(label, onClick, disabled, primary) {
    var b = el('button', primary ? 'btn primary' : 'btn', label);
    b.type = 'button';
    b.disabled = !!disabled;
    b.addEventListener('click', onClick);
    return b;
  }

  function renderMeds() {
    medsEl.replaceChildren();
    meds.forEach(function (m) {
      var li = el('li', 'dose');
      li.appendChild(el('div', 'dose-name', m.name));
      var meta = el('div', 'dose-meta', m.when + ', ' + m.tag + ', ' + m.left + (m.left === 1 ? ' pill left' : ' pills left'));
      var s = stockNote(m.left);
      if (s) {
        meta.appendChild(document.createTextNode(' '));
        meta.appendChild(el('span', 'low', '(' + s.text + ')'));
      }
      li.appendChild(meta);
      li.appendChild(actionButton('Taken', function () { take(m); }, m.left <= 0, true));
      li.appendChild(actionButton('Missed', function () { openForm(m, 'Missed'); }));
      li.appendChild(actionButton('Skipped', function () { openForm(m, 'Skipped'); }));
      medsEl.appendChild(li);
    });
  }

  function renderLog() {
    logEl.replaceChildren();
    if (!log.length) {
      logEl.appendChild(el('li', 'empty', 'Nothing logged yet.'));
      return;
    }
    log.slice().reverse().forEach(function (e) {
      var parts = [e.time + ', ' + e.name + ': ' + e.action + '.'];
      if (e.reasons.length) parts.push('Reason: ' + e.reasons.join(', ') + '.');
      if (e.note) parts.push('Note: ' + e.note);
      logEl.appendChild(el('li', '', parts.join(' ')));
    });
  }

  function nowTime() {
    try {
      return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return 'Now';
    }
  }

  function take(m) {
    if (m.left <= 0) return;
    m.left -= 1;
    log.push({ time: nowTime(), name: m.name, action: 'Taken', reasons: [], note: '' });
    renderMeds();
    renderLog();
  }

  function openForm(m, action) {
    pending = { med: m, action: action };
    picked = {};
    noteEl.value = '';
    formTitle.textContent = action + ' dose: ' + m.name + ' at ' + m.when;
    chipsEl.replaceChildren();
    REASONS.forEach(function (r) {
      var c = el('button', 'chip', r);
      c.type = 'button';
      c.setAttribute('aria-pressed', 'false');
      c.addEventListener('click', function () {
        picked[r] = !picked[r];
        c.setAttribute('aria-pressed', picked[r] ? 'true' : 'false');
      });
      chipsEl.appendChild(c);
    });
    form.hidden = false;
    noteEl.focus();
  }

  function closeForm() {
    pending = null;
    form.hidden = true;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!pending) return;
    var reasons = REASONS.filter(function (r) { return picked[r]; });
    log.push({
      time: nowTime(),
      name: pending.med.name,
      action: pending.action,
      reasons: reasons,
      note: noteEl.value.trim()
    });
    closeForm();
    renderLog();
  });

  cancelBtn.addEventListener('click', closeForm);

  resetBtn.addEventListener('click', function () {
    meds = freshMeds();
    log = [];
    closeForm();
    renderMeds();
    renderLog();
  });

  renderMeds();
  renderLog();
})();
