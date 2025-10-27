document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.getElementById('loader-overlay');

  try {
    // Mostrar UI enseguida
    UI.initCalendarAndRender();

    // Mostrar pantalla de carga
    loader.classList.remove('hidden');

    // Mostrar datos desde caché instantáneamente
    const cached = localStorage.getItem('organizadorCache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        UI.state.tasks = parsed.tasks || [];
        UI.state.ideas = parsed.ideas || [];
        UI.state.notes = parsed.notes || [];
        UI.fullReRender();
      } catch {}
    }

    // Cargar datos reales desde IndexedDB
    await UI.loadStateFromDB();
    UI.fullReRender();
    UI.updateCalendarEvents();

    // ✅ Ocultar loader una vez todo está listo
    setTimeout(() => loader.classList.add('hidden'), 300);

  } catch (err) {
    console.error('Error al iniciar la app:', err);
    if (window.toast) window.toast('Error inicializando la app', 'error');
    loader.classList.add('hidden');
  }

  // Errores globales
  window.addEventListener('error', (e) => console.warn('Error global:', e.message));
});
