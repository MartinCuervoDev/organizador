// main.js
import { Storage } from './storage.js'; // ✅ import arriba del todo

document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.getElementById('loader-overlay');

  // Mostrar el loader principal solo al inicio
  loader.classList.remove('hidden');

  // --- Test rápido de conexión al backend ---
  let backendOnline = false;
  try {
    const res = await fetch("http://localhost:3000/tasks");
    if (!res.ok) throw new Error("Servidor no respondió correctamente");
    backendOnline = true;
    console.log("✅ Backend conectado correctamente");
  } catch (err) {
    console.warn("⚠️ No se pudo conectar con el backend:", err);
    alert("El servidor no está activo o no responde. Ejecutá 'node server.js' en la carpeta /organizador-backend");
  }

  try {
    // Inicializar UI
    UI.initCalendarAndRender();

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

    // Cargar datos reales desde DB (online u offline)
    await UI.loadStateFromDB();
    UI.fullReRender();

    // 🔄 Sincronizar datos pendientes si el backend está online
    if (backendOnline) {
      try {
        await Storage.syncAll();
        console.log("✅ Sincronización completada con el servidor");
        window.toast?.("✅ Datos sincronizados con el servidor", "success");
      } catch (err) {
        console.error("Error durante la sincronización:", err);
      }
    } else {
      console.warn("⚠️ Modo offline: los cambios se guardarán localmente");
      window.toast?.("⚠️ Modo offline: los datos se guardarán localmente", "error");
    }

    // ✅ Ocultar loader una vez todo está listo
    setTimeout(() => loader.classList.add('hidden'), 400);

    // ====== EVENTO: click en evento del calendario ======
    if (UI.state.calendar) {
      UI.state.calendar.setOption('eventClick', (info) => {
        const title = info.event.title;
        const description = info.event.extendedProps.description || "Sin descripción.";

        // Eliminar tooltip previo si existe
        document.querySelectorAll('.calendar-tooltip').forEach(t => t.remove());

        // Crear tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'calendar-tooltip';
        tooltip.innerHTML = `
          <strong>${title}</strong>
          <small>${description}</small>
        `;
        document.body.appendChild(tooltip);

        // Posicionar tooltip sobre el evento clickeado
        const rect = info.el.getBoundingClientRect();
        tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 12}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;

        // Cerrar al hacer clic fuera
        const closeTooltip = (e) => {
          if (!tooltip.contains(e.target)) {
            tooltip.remove();
            document.removeEventListener('click', closeTooltip);
          }
        };
        setTimeout(() => document.addEventListener('click', closeTooltip), 0);
      });
    }

  } catch (err) {
    console.error('Error al iniciar la app:', err);
    window.toast?.('Error inicializando la app', 'error');
  } finally {
    // 👇 Esto garantiza que el loader se oculte incluso si algo falla
    setTimeout(() => loader.classList.add('hidden'), 400);
  }

  // Errores globales
  window.addEventListener('error', (e) => console.warn('Error global:', e.message));
});
