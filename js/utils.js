(function () {
  window.uid = function () {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
  };

  window.formatTimestamp = function (ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  };

  // ✅ Versión mejorada de toast
  window.toast = function (msg, type = 'info', ms = 2500) {
    const div = document.createElement('div');
    div.className = `toast toast-${type}`;
    div.textContent = msg;

    // Animación inicial (aparece desde abajo)
    div.style.position = 'fixed';
    div.style.bottom = '20px';
    div.style.left = '50%';
    div.style.transform = 'translateX(-50%)';
    div.style.padding = '12px 20px';
    div.style.borderRadius = '8px';
    div.style.fontSize = '15px';
    div.style.fontWeight = '500';
    div.style.color = '#fff';
    div.style.zIndex = 9999;
    div.style.boxShadow = '0 4px 8px rgba(0,0,0,0.25)';
    div.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    div.style.opacity = '0';
    div.style.transform += ' translateY(20px)';

    // Colores según tipo
    const colors = {
      info: '#007bff',
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107'
    };
    div.style.background = colors[type] || colors.info;

    document.body.appendChild(div);

    // Animar entrada
    setTimeout(() => {
      div.style.opacity = '1';
      div.style.transform = 'translateX(-50%) translateY(0)';
    }, 50);

    // Desaparecer después del tiempo indicado
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => div.remove(), 600);
    }, ms);
  };

  window.debounce = function (fn, delay = 500) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  };
})();
