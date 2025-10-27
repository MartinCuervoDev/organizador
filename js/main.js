// main.js
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await UI.loadStateFromDB();
    UI.fullReRender();
    UI.initCalendar();
  } catch (err) {
    console.error('Error al iniciar la app:', err);
  }

  // Captura global de errores
  window.addEventListener('error', e => {
    console.warn('Error global:', e.message);
  });
});
