// ui.js
(function () {
  // --------- ELEMENTOS DEL DOM ---------
  const taskInput        = document.getElementById('taskInput');
  const taskDateInput    = document.getElementById('taskDate');
  const taskList         = document.getElementById('taskList');
  const addTaskBtn       = document.getElementById('addTask');

  const duplicateBtn     = document.getElementById('duplicateTasks');
  const duplicatePanel   = document.getElementById('duplicatePanel');
  const fromDateInput    = document.getElementById('fromDate');
  const toDateInput      = document.getElementById('toDate');
  const confirmDuplicate = document.getElementById('confirmDuplicate');

  const ideaArea         = document.getElementById('ideaArea');
  const addIdeaBtn       = document.getElementById('addIdea');
  const ideasList        = document.getElementById('ideasList');

  const noteArea         = document.getElementById('noteArea');
  const saveNoteBtn      = document.getElementById('saveNote');

  const calendarEl       = document.getElementById('calendarContainer');

  const exportBtn        = document.getElementById('exportData');
  const importInput      = document.getElementById('importData');

  // --------- ESTADO GLOBAL ---------
  const state = {
    tasks: [],
    ideas: [],
    notes: [],
    selectedDate: null,
    calendar: null
  };

  // --------- HELPERS ---------
  function getTodayISO() {
    // formato yyyy-mm-dd
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function formatSelectedDayLabel(isoStr) {
    const d = new Date(isoStr + 'T00:00:00');
    return d.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function niceTimestamp(ts) {
    return window.formatTimestamp ? window.formatTimestamp(ts) : '';
  }

  function makeId() {
    return window.uid
      ? window.uid()
      : (Math.random().toString(36).slice(2) + Date.now().toString(36));
  }

  function showToast(msg, kind = 'info') {
    if (window.toast) {
      window.toast(msg, kind);
    } else {
      console.log('[toast]', kind, msg);
    }
  }

  // --------- CREAR CONTENEDORES DINÁMICOS ---------

  // 1. Navegación de día (prev / label / next)
  // Lo insertamos antes de la lista de tareas, solo una vez
  const dayNav = document.createElement('div');
  dayNav.id = 'dayNav';
  dayNav.innerHTML = `
    <button id="prevDayBtn" class="day-nav-btn">◀</button>
    <span id="currentDayLabel" class="day-label"></span>
    <button id="nextDayBtn" class="day-nav-btn">▶</button>
  `;
  // Evitamos duplicar si ya existe
  if (!document.getElementById('dayNav')) {
    taskList.parentElement.insertBefore(dayNav, taskList);
  }

  const prevDayBtn      = document.getElementById('prevDayBtn');
  const nextDayBtn      = document.getElementById('nextDayBtn');
  const currentDayLabel = document.getElementById('currentDayLabel');

  // 2. Contenedor de notas guardadas debajo del textarea de nota
  let notesList = document.getElementById('notesList');
  if (!notesList) {
    notesList = document.createElement('div');
    notesList.id = 'notesList';
    noteArea.insertAdjacentElement('afterend', notesList);
  }

  // --------- RENDERS ---------

  // ----- TAREAS -----
  function renderTasksForSelectedDate() {
    taskList.innerHTML = '';

    // Filtra solo tareas del día seleccionado
    const todaysTasks = state.tasks.filter(t => t.date === state.selectedDate);

    if (todaysTasks.length === 0) {
      taskList.innerHTML = `<p class="no-tasks">No hay tareas para este día</p>`;
      return;
    }

    todaysTasks.forEach(task => {
      taskList.appendChild(createTaskItem(task));
    });
  }

  function createTaskItem(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    if (task.done) li.classList.add('done');

    const left = document.createElement('div');
    left.className = 'item-left';

    // "checkbox" visual
    const check = document.createElement('div');
    check.className = 'check' + (task.done ? ' checked' : '');
    check.addEventListener('click', async () => {
      task.done = !task.done;
      await DB.updateTask(task);

      showToast(task.done ? 'Tarea completada ✅' : 'Tarea marcada pendiente', 'info');

      renderTasksForSelectedDate();
      updateCalendarEvents();
    });

    const title = document.createElement('span');
    title.textContent = task.text;

    const meta = document.createElement('small');
    meta.className = 'meta';
    meta.textContent = niceTimestamp(task.createdAt);

    left.appendChild(check);
    left.appendChild(title);
    left.appendChild(meta);

    // acciones (editar / borrar)
    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', async () => {
      const nuevo = prompt('Editar tarea:', task.text);
      if (nuevo && nuevo.trim()) {
        task.text = nuevo.trim();
        await DB.updateTask(task);
        showToast('Tarea editada ✏️', 'info');
        renderTasksForSelectedDate();
        updateCalendarEvents();
      }
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'icon';
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', async () => {
      const seguro = confirm('¿Seguro que querés eliminar esta tarea?');
      if (!seguro) return;

      await DB.removeTask(task.id);
      state.tasks = state.tasks.filter(t => t.id !== task.id);

      showToast('Tarea eliminada 🗑', 'error');

      renderTasksForSelectedDate();
      updateCalendarEvents();
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(actions);

    return li;
  }

  // ----- IDEAS -----
  function renderIdeas() {
    ideasList.innerHTML = '';

    if (state.ideas.length === 0) {
      ideasList.innerHTML = `<p class="no-tasks">No hay ideas guardadas</p>`;
      return;
    }

    state.ideas.forEach(idea => {
      const div = document.createElement('div');
      div.className = 'idea-item';
      div.dataset.id = idea.id;

      const spanText = document.createElement('span');
      spanText.textContent = idea.text;

      const meta = document.createElement('small');
      meta.className = 'meta';
      meta.textContent = niceTimestamp(idea.createdAt);

      const actions = document.createElement('div');
      actions.className = 'item-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'icon';
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', async () => {
        const nuevo = prompt('Editar idea:', idea.text);
        if (nuevo && nuevo.trim()) {
          idea.text = nuevo.trim();
          await DB.addIdea(idea); // .put() sobreescribe
          showToast('Idea editada ✏️', 'info');
          renderIdeas();
        }
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'icon';
      delBtn.textContent = '🗑';
      delBtn.addEventListener('click', async () => {
        const seguro = confirm('¿Seguro que querés eliminar esta idea?');
        if (!seguro) return;

        await DB.removeIdea(idea.id);
        state.ideas = state.ideas.filter(i => i.id !== idea.id);

        showToast('Idea eliminada', 'error');
        renderIdeas();
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      div.appendChild(spanText);
      div.appendChild(meta);
      div.appendChild(actions);

      ideasList.appendChild(div);
    });
  }

  // ----- NOTAS -----
  function renderNotes() {
    notesList.innerHTML = '';

    if (state.notes.length === 0) {
      notesList.innerHTML = `<p class="no-tasks">No hay notas guardadas</p>`;
      return;
    }

    state.notes.forEach(note => {
      const wrapper = document.createElement('div');
      wrapper.className = 'note-item';
      wrapper.dataset.id = note.id;

      const p = document.createElement('p');
      p.textContent = note.text;

      const meta = document.createElement('small');
      meta.className = 'meta';
      meta.textContent = niceTimestamp(note.createdAt);

      const actions = document.createElement('div');
      actions.className = 'item-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'icon';
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', async () => {
        const nuevo = prompt('Editar nota:', note.text);
        if (nuevo && nuevo.trim()) {
          note.text = nuevo.trim();
          // usamos addNote porque internamente es .put()
          await DB.addNote(note);
          showToast('Nota editada ✏️', 'info');
          renderNotes();
        }
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'icon';
      delBtn.textContent = '🗑';
      delBtn.addEventListener('click', async () => {
        const seguro = confirm('¿Seguro que querés eliminar esta nota?');
        if (!seguro) return;

        await DB.removeNote(note.id);
        state.notes = state.notes.filter(n => n.id !== note.id);

        showToast('Nota eliminada', 'error');
        renderNotes();
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      wrapper.appendChild(p);
      wrapper.appendChild(meta);
      wrapper.appendChild(actions);

      notesList.appendChild(wrapper);
    });
  }

  // --------- CALENDARIO ---------
  function initCalendar() {
    state.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 'auto',

      // ✅ NUEVO: al hacer click en un día del calendario
      dateClick: (info) => {
        // info.dateStr viene como 'yyyy-mm-dd'
        state.selectedDate = info.dateStr;

        // actualizamos el input de fecha para que si agregás tarea se agregue a ese día
        if (taskDateInput) {
          taskDateInput.value = state.selectedDate;
        }

        // refrescamos header y lista
        refreshDayHeader();
        renderTasksForSelectedDate();

        showToast(`Día seleccionado: ${formatSelectedDayLabel(state.selectedDate)}`, 'info');
      }
    });

    state.calendar.render();
  }

  function updateCalendarEvents() {
  if (!state.calendar) return;

  // limpiamos todos los eventos del calendario
  state.calendar.removeAllEvents();

  // volvemos a agregarlos, con clase según done
  state.tasks.forEach(t => {
    state.calendar.addEvent({
      title: (t.done ? '✔ ' : '') + t.text,
      start: t.date,
      // ESTA PARTE ES CLAVE: le metemos la clase para que el CSS la pinte
      classNames: [t.done ? 'event-done' : 'event-pending']
    });
  });
}


  // --------- DAY NAV ---------
  function goPrevDay() {
    const d = new Date(state.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    state.selectedDate = d.toISOString().slice(0, 10);

    if (taskDateInput) {
      taskDateInput.value = state.selectedDate;
    }

    refreshDayHeader();
    renderTasksForSelectedDate();
  }

  function goNextDay() {
    const d = new Date(state.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    state.selectedDate = d.toISOString().slice(0, 10);

    if (taskDateInput) {
      taskDateInput.value = state.selectedDate;
    }

    refreshDayHeader();
    renderTasksForSelectedDate();
  }

  function refreshDayHeader() {
    currentDayLabel.textContent = formatSelectedDayLabel(state.selectedDate);
  }

  // --------- EVENT LISTENERS ---------

  // Agregar tarea
  addTaskBtn.addEventListener('click', async () => {
    const text = taskInput.value.trim();
    // si el usuario no elige fecha a mano, usamos el día seleccionado actual
    const chosenDate = taskDateInput.value || state.selectedDate;

    if (!text) {
      showToast('Ingresá una tarea', 'error');
      return;
    }
    if (!chosenDate) {
      showToast('Elegí una fecha', 'error');
      return;
    }

    const newTask = {
      id: makeId(),
      text,
      date: chosenDate,
      done: false,
      createdAt: Date.now()
    };

    await DB.addTask(newTask);
    state.tasks.push(newTask);

    showToast('Tarea agregada ✅', 'success');

    // limpiar input de texto, mantener fecha
    taskInput.value = '';

    // si agregaste la tarea a otra fecha (por ej, del calendario), actualizamos selectedDate coherente
    state.selectedDate = chosenDate;
    refreshDayHeader();
    renderTasksForSelectedDate();
    updateCalendarEvents();
  });

  // Duplicar tareas
  duplicateBtn.addEventListener('click', () => {
    duplicatePanel.classList.toggle('hidden');
  });

  confirmDuplicate.addEventListener('click', async () => {
    const src = fromDateInput.value;
    const dst = toDateInput.value;

    if (!src || !dst) {
      showToast('Elegí fechas válidas', 'error');
      return;
    }

    const baseTasks = state.tasks.filter(t => t.date === src);
    if (baseTasks.length === 0) {
      showToast('No hay tareas para duplicar en esa fecha', 'error');
      return;
    }

    const now = Date.now();
    const clones = baseTasks.map(t => ({
      id: makeId(),
      text: t.text,
      date: dst,
      done: false,
      createdAt: now
    }));

    await DB.addTasksBulk(clones);
    state.tasks.push(...clones);

    showToast('Tareas duplicadas 📄', 'success');

    // cerramos panel y limpiamos inputs
    duplicatePanel.classList.add('hidden');
    fromDateInput.value = '';
    toDateInput.value = '';

    // cambiamos la vista al día destino para que veas las nuevas
    state.selectedDate = dst;
    if (taskDateInput) {
      taskDateInput.value = dst;
    }

    refreshDayHeader();
    renderTasksForSelectedDate();
    updateCalendarEvents();
  });

  // Agregar idea
  addIdeaBtn.addEventListener('click', async () => {
    const txt = ideaArea.value.trim();
    if (!txt) {
      showToast('Ingresá una idea', 'error');
      return;
    }

    const newIdea = {
      id: makeId(),
      text: txt,
      createdAt: Date.now()
    };

    await DB.addIdea(newIdea);
    state.ideas.push(newIdea);

    showToast('Idea agregada 💡', 'success');

    ideaArea.value = '';
    renderIdeas();
  });

  // Guardar nota
  saveNoteBtn.addEventListener('click', async () => {
    const txt = noteArea.value.trim();
    if (!txt) {
      showToast('Escribí una nota', 'error');
      return;
    }

    const newNote = {
      id: makeId(),
      text: txt,
      createdAt: Date.now()
    };

    await DB.addNote(newNote);
    state.notes.push(newNote);

    showToast('Nota guardada 📝', 'success');

    noteArea.value = '';
    renderNotes();
  });

  // Navegación día anterior / siguiente
  prevDayBtn.addEventListener('click', goPrevDay);
  nextDayBtn.addEventListener('click', goNextDay);

  // Exportar / Importar
  exportBtn.addEventListener('click', async () => {
    const data = await DB.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'organizador-backup.json';
    a.click();

    URL.revokeObjectURL(url);
    showToast('Backup exportado 💾', 'success');
  });

  importInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      showToast('No seleccionaste archivo', 'error');
      return;
    }

    const text = await file.text();
    try {
      const parsed = JSON.parse(text);

      await DB.importAll(parsed);

      // recargar todo desde IndexedDB
      await loadStateFromDB();
      fullReRender();

      showToast('Datos importados correctamente 🔄', 'success');
    } catch (err) {
      console.error('Error al importar:', err);
      showToast('Error importando datos', 'error');
    }
  });

  // --------- CARGA INICIAL / RENDER GLOBAL ---------
  async function loadStateFromDB() {
    const [tasks, ideas, notes] = await Promise.all([
      DB.getAllTasks(),
      DB.getAllIdeas(),
      DB.getAllNotes()
    ]);

    state.tasks = tasks || [];
    state.ideas = ideas || [];
    state.notes = notes || [];

    // día inicial = hoy
    state.selectedDate = getTodayISO();

    // seteo fecha inicial en el input date
    if (taskDateInput) {
      taskDateInput.value = state.selectedDate;
    }
  }

  function refreshAllLists() {
    refreshDayHeader();
    renderTasksForSelectedDate();
    renderIdeas();
    renderNotes();
  }

  function fullReRender() {
    refreshAllLists();
    updateCalendarEvents();
  }

  // --------- EXponer para main.js ---------
  function initCalendarAndRender() {
    initCalendar();        // crea el calendario y setea dateClick
    updateCalendarEvents();// mete las tareas en el calendario
  }

  window.UI = {
    loadStateFromDB,
    fullReRender,
    initCalendarAndRender,
    updateCalendarEvents,
    state
  };
})();
