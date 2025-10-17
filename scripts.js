// ===============================
// 🧠 TickLite — build estable (dark)
// ===============================
(() => {
  const STORAGE_KEY = 'ticklite_data_v1';
  let data = { tasks: [], notes: '', ideas: [], notesList: [] };

  // ====== Persistencia ======
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) || {};
      // Compatibilidad y shape estable
      data.tasks     = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      data.ideas     = Array.isArray(parsed.ideas) ? parsed.ideas : [];
      data.notesList = Array.isArray(parsed.notesList) ? parsed.notesList : [];
      data.notes     = typeof parsed.notes === 'string' ? parsed.notes : '';
      // Limpiar campos obsoletos si existieran
      if ('doneDays' in parsed) delete parsed.doneDays;
    } catch (e) {
      console.warn('No se pudo cargar localStorage:', e);
    }
  }

  // ====== DOM ======
  document.addEventListener('DOMContentLoaded', () => {
    const taskInput   = document.getElementById('taskInput');
    const taskDate    = document.getElementById('taskDate');
    const taskList    = document.getElementById('taskList');
    const addTaskBtn  = document.getElementById('addTask');
    const dailyTask   = document.getElementById('dailyTask');
    const noteArea    = document.getElementById('noteArea');
    const saveNoteBtn = document.getElementById('saveNote');
    const calendarEl  = document.getElementById('calendarContainer');
    const ideaArea    = document.getElementById('ideaArea');
    const addIdeaBtn  = document.getElementById('addIdea');
    const ideasList   = document.getElementById('ideasList');

    // Si falta algo crítico, no seguimos para evitar errores en consola
    if (!taskList || !ideasList || !calendarEl) {
      console.error('Faltan elementos clave del DOM. Verificá el HTML.');
      return;
    }

    // ====== Cargar estado y montar UI inicial ======
    load();

    // ====== Calendario ======
    let calendar = null;
    function initCalendar() {
      if (!window.FullCalendar) {
        console.error('FullCalendar no está disponible.');
        return;
      }
      calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        buttonText: { today: 'hoy' },
        height: 'auto',
        // Tomamos los eventos desde el estado actual de forma segura
        events: (data.tasks || [])
          .filter(t => t && t.date)
          .map(t => ({ title: t.text, start: t.date })),
        dateClick(info) {
          if (taskDate) taskDate.value = info.dateStr;
        }
        // IMPORTANTE: no manipulamos el título aquí para evitar duplicaciones
      });
      calendar.render();
    }

    function updateCalendarEvents() {
      if (!calendar) return;
      calendar.removeAllEvents();
      (data.tasks || []).forEach(t => {
        if (t && t.date) calendar.addEvent({ title: t.text, start: t.date });
      });
    }

    // ====== Tareas ======
    function renderTasks() {
      taskList.innerHTML = '';
      (data.tasks || []).forEach(t => {
        const li = document.createElement('li');
        li.className = (t.done ? 'done ' : '') + 'fade-in';
        li.innerHTML = `
          <span>${escapeHtml(t.text)}${t.daily ? ' 🔁' : ''}${t.date ? ' (' + t.date + ')' : ''}</span>
          <div>
            <button class="ok" aria-label="Marcar como completada">✔</button>
            <button class="del" aria-label="Eliminar tarea">🗑️</button>
          </div>
        `;
        li.querySelector('.ok').addEventListener('click', () => toggleTask(t.id));
        li.querySelector('.del').addEventListener('click', () => deleteTask(t.id));
        taskList.appendChild(li);
      });
      updateCalendarEvents();
    }

    function addTask() {
      const text = (taskInput?.value || '').trim();
      const date = (taskDate?.value || '').trim();
      if (!text) return;

      data.tasks.unshift({
        id: Date.now(),
        text,
        done: false,
        // daily queda por compatibilidad visual en UI (se muestra con 🔁 si está tildado)
        daily: !!(dailyTask && dailyTask.checked),
        date: date || null
      });

      if (taskInput) taskInput.value = '';
      if (taskDate)  taskDate.value  = '';
      if (dailyTask) dailyTask.checked = false;
      taskInput?.focus();

      renderTasks();
      save();
    }

    function toggleTask(id) {
      const t = (data.tasks || []).find(x => x.id === id);
      if (t) t.done = !t.done;
      renderTasks();
      save();
    }

    function deleteTask(id) {
      if (!confirm('¿Seguro que querés eliminar esta tarea?')) return;
      data.tasks = (data.tasks || []).filter(t => t.id !== id);
      renderTasks();
      save();
    }

    addTaskBtn?.addEventListener('click', addTask);
    taskInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addTask();
    });

    // ====== Ideas ======
    function renderIdeas() {
      ideasList.innerHTML = '';
      const arr = data.ideas || [];
      if (!arr.length) {
        ideasList.innerHTML = '<p style="opacity:.6;">(Todavía no agregaste ideas)</p>';
        return;
      }
      arr.forEach(i => {
        const item = document.createElement('div');
        item.className = 'idea-item fade-in';
        item.innerHTML = `
          <p>${escapeHtml(i.text)}</p>
          <small>🕓 ${escapeHtml(i.createdAt || '')}</small>
          <button class="delete-idea" title="Eliminar">🗑️</button>
        `;
        item.querySelector('.delete-idea').addEventListener('click', () => {
          if (!confirm('¿Eliminar esta idea?')) return;
          data.ideas = (data.ideas || []).filter(x => x.id !== i.id);
          renderIdeas();
          save();
        });
        ideasList.appendChild(item);
      });
    }

    addIdeaBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      const text = (ideaArea?.value || '').trim();
      if (!text) return;
      (data.ideas ||= []);
      data.ideas.unshift({
        id: Date.now(),
        text,
        createdAt: new Date().toLocaleString('es-AR', { dateStyle:'short', timeStyle:'short' })
      });
      ideaArea.value = '';
      ideaArea.focus();
      renderIdeas();
      save();
    });

    // ====== Notas ======
    const notesListContainer = document.createElement('div');
    notesListContainer.id = 'notesList';
    saveNoteBtn?.parentNode?.insertBefore(notesListContainer, saveNoteBtn.nextSibling);

    function renderNotes() {
      notesListContainer.innerHTML = '';
      const notes = data.notesList || [];
      if (!notes.length) {
        notesListContainer.innerHTML = '<p style="opacity:0.6;">(Todavía no hay notas guardadas)</p>';
        return;
      }
      notes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'note-item fade-in';
        div.innerHTML = `
          <p>${escapeHtml(note.text)}</p>
          <small>🕓 ${escapeHtml(note.date || '')}</small>
          <button class="delete-note">🗑️</button>
        `;
        div.querySelector('.delete-note').addEventListener('click', () => {
          if (!confirm('¿Eliminar esta nota?')) return;
          data.notesList = (data.notesList || []).filter(n => n.id !== note.id);
          renderNotes();
          save();
        });
        notesListContainer.appendChild(div);
      });
    }

    saveNoteBtn?.addEventListener('click', () => {
      const text = (noteArea?.value || '').trim();
      if (!text) return;
      (data.notesList ||= []);
      data.notesList.unshift({
        id: Date.now(),
        text,
        date: new Date().toLocaleString('es-AR', { dateStyle:'short', timeStyle:'short' })
      });
      noteArea.value = '';
      noteArea.focus();
      renderNotes();
      save();
    });

    // ====== Utils ======
    function escapeHtml(s='') {
      const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
      return String(s).replace(/[&<>"']/g, c => map[c]);
    }

    // ====== Boot ======
    renderIdeas();
    renderTasks();
    renderNotes();
    initCalendar();
    // (no llamamos updateCalendarEvents() acá; renderTasks() ya lo hace)
  });
})();
