// main.js
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // cargar todos los datos desde IndexedDB
    await UI.loadStateFromDB();

    // inicializar calendario una vez
    UI.initCalendar();

    // render inicial de todo (tareas filtradas por día actual, ideas, notas, calendario)
    UI.fullReRender();
  } catch (err) {
    console.error('Error al iniciar la app:', err);
    if (window.toast) {
      window.toast('Error inicializando la app', 'error');
    }
  }

  // fallback de errores globales (evita que la app muera silenciosamente)
  window.addEventListener('error', (e) => {
    console.warn('Error global:', e.message);
  });
});
