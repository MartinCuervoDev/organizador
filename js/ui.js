// ui.js
(function () {
  // --------- ELEMENTOS DEL DOM EXISTENTES ---------
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

  // --------- CONTENEDOR PARA NOTAS (LO CREAMOS) ---------
  // debajo del textarea de nota vamos a insertar la lista de notas guardadas
  const notesList = document.createElement('div');
  notesList.id = 'notesList';
  // insertamos después del textarea de notas si aún no existe
  if (!document.getElementById('notesList')) {
    noteArea.insertAdjacentElement('afterend', notesList);
  }

  // --------- CONTENEDOR DE NAVEGACIÓN DE DÍAS (LO CREAMOS) ---------
  // lo insertamos antes de la UL de tareas
  const dayNav = document.createElement('div');
  dayNav.id = 'dayNav';
  dayNav.innerHTML = `
    <button id="prevDayBtn" class="day-nav-btn">◀</button>
    <span id="currentDayLabel" class="day-label"></span>
    <button id="nextDayBtn" class="day-nav-btn">▶</button>
  `;
  // lo ponemos justo antes de la lista de tareas
  taskList.parentElement.insertBefore(dayNav, taskList);

  const prevDayBtn       = document.getElementById('prevDayBtn');
  const nextDayBtn       = document.getElementById('nextDayBtn');
  const currentDayLabel  = document.getElementById('currentDayLabel');

  // --------- ESTADO GLOBAL ---------
  const state = {
    tasks: [],
    ideas: [],
    notes: [],
    selectedDate: getTodayISO(), // día mostrado en la lista de tareas
    calendar: null
  };

  // --------- HELPERS ---------
  function getTodayISO() {
    const d = new Date();
    // yyyy-mm-dd
    return d.toISOString().slice(0, 10);
  }

  // muestra "lunes 27/10/2025"
  function formatSelectedDayLabel(isoStr) {
    const d = new Date(isoStr + "T00:00:00");
    return d.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // mostrás fecha+hora tipo 27/10/25 15:30 usando util global
  function niceTimestamp(ts) {
    return window.formatTimestamp ? window.formatTimestamp(ts) : '';
  }

  // generar un id único usando util global uid() o fallback
  function makeId() {
    return window.uid
      ? window.uid()
      : (Math.random().toString(36).slice(2) + Date.now().toString(36));
  }

  // Mensajes flotantes
  function showToast(msg, kind = 'info') {
    if (window.toast) {
      window.toast(msg, kind);
    } else {
      console.log('[toast]', kind, msg);
    }
  }

  // --------- RENDER TAREAS (FILTRADAS POR DÍA) ---------
  function renderTasksForSelectedDate() {
    taskList.innerHTML = '';

    const tasksToday = state.tasks.filter(t => t.date === state.selectedDate);

    if (tasksToday.length === 0) {
      taskList.innerHTML = `<p class="no-tasks">No hay tareas para este día</p>`;
      return;
    }

    for (const task of tasksToday) {
      taskList.appendChild(createTaskItem(task));
    }
  }

  function createTaskItem(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    if (task.done) li.classList.add('done');

    const left = document.createElement('div');
    left.className = 'item-left';

    // checkbox visual
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

    // acciones (editar/borrar)
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
      await DB.removeTask(task.id);
      // sacamos del estado
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

  // --------- RENDER IDEAS ---------
  function renderIdeas() {
    ideasList.innerHTML = '';

    for (const idea of state.ideas) {
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
          await DB.addIdea(idea); // put() sobrescribe en IndexedDB
          showToast('Idea editada ✏️', 'info');
          renderIdeas();
        }
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'icon';
      delBtn.textContent = '🗑';
      delBtn.addEventListener('click', async () => {
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
    }
  }

  // --------- RENDER NOTAS ---------
  function renderNotes() {
    notesList.innerHTML = '';

    for (const note of state.notes) {
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
          await DB.addNote(note); // put() sobrescribe
          showToast('Nota editada ✏️', 'info');
          renderNotes();
        }
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'icon';
      delBtn.textContent = '🗑';
      delBtn.addEventListener('click', async () => {
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
    }
  }

  // --------- CALENDARIO ---------
  function initCalendar() {
    state.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 'auto'
    });
    state.calendar.render();
  }

  function updateCalendarEvents() {
    if (!state.calendar) return;
    state.calendar.removeAllEvents();
    // todas las tareas, no solo del día seleccionado
    state.tasks.forEach(t => {
      state.calendar.addEvent({
        title: (t.done ? '✔ ' : '') + t.text,
        start: t.date
      });
    });
  }

  // --------- EVENT LISTENERS ---------

  // agregar tarea
  addTaskBtn.addEventListener('click', async () => {
    const text = taskInput.value.trim();
    // si no eligió fecha manual, usamos el día actualmente seleccionado
    const chosenDate = taskDateInput.value || state.selectedDate;

    if (!text) {
      showToast('Ingresá una tarea', 'error');
      return;
    }
    if (!chosenDate) {
      showToast('Ingresá una fecha', 'error');
      return;
    }

    const newTask = {
      id: makeId(),
      text,
      date: chosenDate,   // yyyy-mm-dd
      done: false,
      createdAt: Date.now()
    };

    await DB.addTask(newTask);
    state.tasks.push(newTask);

    showToast('Tarea agregada ✅', 'success');

    // limpiamos input de texto, dejamos fecha para comodidad
    taskInput.value = '';

    renderTasksForSelectedDate();
    updateCalendarEvents();
  });

  // duplicar tareas de un día a otro
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
    // agrego clones a memoria
    state.tasks.push(...clones);

    showToast('Tareas duplicadas 📄', 'success');

    duplicatePanel.classList.add('hidden');
    fromDateInput.value = '';
    toDateInput.value = '';

    renderTasksForSelectedDate();
    updateCalendarEvents();
  });

  // agregar idea
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

  // guardar nota
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

  // moverse al día anterior
  prevDayBtn.addEventListener('click', () => {
    const d = new Date(state.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    state.selectedDate = d.toISOString().slice(0, 10);

    refreshDayView();
  });

  // moverse al día siguiente
  nextDayBtn.addEventListener('click', () => {
    const d = new Date(state.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    state.selectedDate = d.toISOString().slice(0, 10);

    refreshDayView();
  });

  function refreshDayView() {
    currentDayLabel.textContent = formatSelectedDayLabel(state.selectedDate);
    renderTasksForSelectedDate();
  }

  // export / import
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

  // --------- CARGA INICIAL Y RENDER GLOBAL ---------
  async function loadStateFromDB() {
    const [tasks, ideas, notes] = await Promise.all([
      DB.getAllTasks(),
      DB.getAllIdeas(),
      DB.getAllNotes()
    ]);

    state.tasks = tasks;
    state.ideas = ideas;
    state.notes = notes;

    // la fecha seleccionada arranca en HOY
    state.selectedDate = getTodayISO();
  }

  function fullReRender() {
    // actualizar header día
    currentDayLabel.textContent = formatSelectedDayLabel(state.selectedDate);

    // render parciales
    renderTasksForSelectedDate();
    renderIdeas();
    renderNotes();

    // calendario
    updateCalendarEvents();
  }

  function initCalendar() {
    state.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 'auto'
    });
    state.calendar.render();
  }

  function updateCalendarEvents() {
    if (!state.calendar) return;
    state.calendar.removeAllEvents();

    state.tasks.forEach(t => {
      state.calendar.addEvent({
        title: (t.done ? '✔ ' : '') + t.text,
        start: t.date
      });
    });
  }

  // --------- EXponer para main.js ---------
  window.UI = {
    loadStateFromDB,
    fullReRender,
    initCalendar,
    updateCalendarEvents,
    state
  };
})();
// ui.js
(function () {
  // --------- ELEMENTOS DEL DOM EXISTENTES ---------
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

  // --------- CONTENEDOR PARA NOTAS (LO CREAMOS) ---------
  // debajo del textarea de nota vamos a insertar la lista de notas guardadas
  const notesList = document.createElement('div');
  notesList.id = 'notesList';
  // insertamos después del textarea de notas si aún no existe
  if (!document.getElementById('notesList')) {
    noteArea.insertAdjacentElement('afterend', notesList);
  }

  // --------- CONTENEDOR DE NAVEGACIÓN DE DÍAS (LO CREAMOS) ---------
  // lo insertamos antes de la UL de tareas
  const dayNav = document.createElement('div');
  dayNav.id = 'dayNav';
  dayNav.innerHTML = `
    <button id="prevDayBtn" class="day-nav-btn">◀</button>
    <span id="currentDayLabel" class="day-label"></span>
    <button id="nextDayBtn" class="day-nav-btn">▶</button>
  `;
  // lo ponemos justo antes de la lista de tareas
  taskList.parentElement.insertBefore(dayNav, taskList);

  const prevDayBtn       = document.getElementById('prevDayBtn');
  const nextDayBtn       = document.getElementById('nextDayBtn');
  const currentDayLabel  = document.getElementById('currentDayLabel');

  // --------- ESTADO GLOBAL ---------
  const state = {
    tasks: [],
    ideas: [],
    notes: [],
    selectedDate: getTodayISO(), // día mostrado en la lista de tareas
    calendar: null
  };

  // --------- HELPERS ---------
  function getTodayISO() {
    const d = new Date();
    // yyyy-mm-dd
    return d.toISOString().slice(0, 10);
  }

  // muestra "lunes 27/10/2025"
  function formatSelectedDayLabel(isoStr) {
    const d = new Date(isoStr + "T00:00:00");
    return d.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // mostrás fecha+hora tipo 27/10/25 15:30 usando util global
  function niceTimestamp(ts) {
    return window.formatTimestamp ? window.formatTimestamp(ts) : '';
  }

  // generar un id único usando util global uid() o fallback
  function makeId() {
    return window.uid
      ? window.uid()
      : (Math.random().toString(36).slice(2) + Date.now().toString(36));
  }

  // Mensajes flotantes
  function showToast(msg, kind = 'info') {
    if (window.toast) {
      window.toast(msg, kind);
    } else {
      console.log('[toast]', kind, msg);
    }
  }

  // --------- RENDER TAREAS (FILTRADAS POR DÍA) ---------
  function renderTasksForSelectedDate() {
    taskList.innerHTML = '';

    const tasksToday = state.tasks.filter(t => t.date === state.selectedDate);

    if (tasksToday.length === 0) {
      taskList.innerHTML = `<p class="no-tasks">No hay tareas para este día</p>`;
      return;
    }

    for (const task of tasksToday) {
      taskList.appendChild(createTaskItem(task));
    }
  }

  function createTaskItem(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    if (task.done) li.classList.add('done');

    const left = document.createElement('div');
    left.className = 'item-left';

    // checkbox visual
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

    // acciones (editar/borrar)
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
      await DB.removeTask(task.id);
      // sacamos del estado
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

  // --------- RENDER IDEAS ---------
  function renderIdeas() {
    ideasList.innerHTML = '';

    for (const idea of state.ideas) {
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
          await DB.addIdea(idea); // put() sobrescribe en IndexedDB
          showToast('Idea editada ✏️', 'info');
          renderIdeas();
        }
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'icon';
      delBtn.textContent = '🗑';
      delBtn.addEventListener('click', async () => {
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
    }
  }

  // --------- RENDER NOTAS ---------
  function renderNotes() {
    notesList.innerHTML = '';

    for (const note of state.notes) {
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
          await DB.addNote(note); // put() sobrescribe
          showToast('Nota editada ✏️', 'info');
          renderNotes();
        }
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'icon';
      delBtn.textContent = '🗑';
      delBtn.addEventListener('click', async () => {
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
    }
  }

  // --------- CALENDARIO ---------
  function initCalendar() {
    state.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 'auto'
    });
    state.calendar.render();
  }

  function updateCalendarEvents() {
    if (!state.calendar) return;
    state.calendar.removeAllEvents();
    // todas las tareas, no solo del día seleccionado
    state.tasks.forEach(t => {
      state.calendar.addEvent({
        title: (t.done ? '✔ ' : '') + t.text,
        start: t.date
      });
    });
  }

  // --------- EVENT LISTENERS ---------

  // agregar tarea
  addTaskBtn.addEventListener('click', async () => {
    const text = taskInput.value.trim();
    // si no eligió fecha manual, usamos el día actualmente seleccionado
    const chosenDate = taskDateInput.value || state.selectedDate;

    if (!text) {
      showToast('Ingresá una tarea', 'error');
      return;
    }
    if (!chosenDate) {
      showToast('Ingresá una fecha', 'error');
      return;
    }

    const newTask = {
      id: makeId(),
      text,
      date: chosenDate,   // yyyy-mm-dd
      done: false,
      createdAt: Date.now()
    };

    await DB.addTask(newTask);
    state.tasks.push(newTask);

    showToast('Tarea agregada ✅', 'success');

    // limpiamos input de texto, dejamos fecha para comodidad
    taskInput.value = '';

    renderTasksForSelectedDate();
    updateCalendarEvents();
  });

  // duplicar tareas de un día a otro
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
    // agrego clones a memoria
    state.tasks.push(...clones);

    showToast('Tareas duplicadas 📄', 'success');

    duplicatePanel.classList.add('hidden');
    fromDateInput.value = '';
    toDateInput.value = '';

    renderTasksForSelectedDate();
    updateCalendarEvents();
  });

  // agregar idea
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

  // guardar nota
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

  // moverse al día anterior
  prevDayBtn.addEventListener('click', () => {
    const d = new Date(state.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    state.selectedDate = d.toISOString().slice(0, 10);

    refreshDayView();
  });

  // moverse al día siguiente
  nextDayBtn.addEventListener('click', () => {
    const d = new Date(state.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    state.selectedDate = d.toISOString().slice(0, 10);

    refreshDayView();
  });

  function refreshDayView() {
    currentDayLabel.textContent = formatSelectedDayLabel(state.selectedDate);
    renderTasksForSelectedDate();
  }

  // export / import
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

  // --------- CARGA INICIAL Y RENDER GLOBAL ---------
  async function loadStateFromDB() {
    const [tasks, ideas, notes] = await Promise.all([
      DB.getAllTasks(),
      DB.getAllIdeas(),
      DB.getAllNotes()
    ]);

    state.tasks = tasks;
    state.ideas = ideas;
    state.notes = notes;

    // la fecha seleccionada arranca en HOY
    state.selectedDate = getTodayISO();
  }

  function fullReRender() {
    // actualizar header día
    currentDayLabel.textContent = formatSelectedDayLabel(state.selectedDate);

    // render parciales
    renderTasksForSelectedDate();
    renderIdeas();
    renderNotes();

    // calendario
    updateCalendarEvents();
  }

  function initCalendar() {
    state.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 'auto'
    });
    state.calendar.render();
  }

  function updateCalendarEvents() {
    if (!state.calendar) return;
    state.calendar.removeAllEvents();

    state.tasks.forEach(t => {
      state.calendar.addEvent({
        title: (t.done ? '✔ ' : '') + t.text,
        start: t.date
      });
    });
  }

  // --------- EXponer para main.js ---------
  window.UI = {
    loadStateFromDB,
    fullReRender,
    initCalendar,
    updateCalendarEvents,
    state
  };
})();
