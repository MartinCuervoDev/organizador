// main.js
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Levantar datos persistidos de IndexedDB
    await UI.loadStateFromDB();

    // Pintar listas y fecha inicial
    UI.fullReRender();

    // Inicializar calendario + eventos + interacción dateClick
    UI.initCalendarAndRender();

  } catch (err) {
    console.error('Error al iniciar la app:', err);
    if (window.toast) {
      window.toast('Error inicializando la app', 'error');
    }
  }

  // Captura global de errores por si algo rompe después
  window.addEventListener('error', (e) => {
    console.warn('Error global:', e.message);
  });
});
