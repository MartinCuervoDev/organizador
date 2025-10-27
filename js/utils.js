// utils.js
(function () {
  window.uid = function () {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
  };

  window.formatTimestamp = function (ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  };

  window.toast = function (msg, type = 'info', ms = 2000) {
    const div = document.createElement('div');
    div.className = `toast toast-${type}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), ms + 500);
  };

  window.debounce = function (fn, delay = 500) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  };
})();
