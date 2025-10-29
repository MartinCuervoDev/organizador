import { Storage as DB } from './storage.js';

(function () {
  // --------- ELEMENTOS DEL DOM ---------
  const taskInput        = document.getElementById('taskInput');
  const taskDescription  = document.getElementById('taskDescription');
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

// --------- MINI LOADER ---------
const miniLoader = document.getElementById('mini-loader');
const miniText = document.getElementById('mini-loader-text');

function showMiniLoader(text = 'Procesando...') {
  if (!miniLoader) return;
  miniText.textContent = text;
  miniLoader.classList.remove('hidden');
}

function hideMiniLoader() {
  if (!miniLoader) return;
  miniLoader.classList.add('hidden');
}

// --------- TOAST ---------
function showToast(msg, kind = 'info') {
  if (window.toast) window.toast(msg, kind);
  else console.log('[toast]', kind, msg);
}


  // --------- CONTENEDORES DINÁMICOS ---------
  const dayNav = document.createElement('div');
  dayNav.id = 'dayNav';
  dayNav.innerHTML = `
    <button id="prevDayBtn" class="day-nav-btn">◀</button>
    <span id="currentDayLabel" class="day-label"></span>
    <button id="nextDayBtn" class="day-nav-btn">▶</button>
  `;
  if (!document.getElementById('dayNav')) {
    taskList.parentElement.insertBefore(dayNav, taskList);
  }

  const prevDayBtn      = document.getElementById('prevDayBtn');
  const nextDayBtn      = document.getElementById('nextDayBtn');
  const currentDayLabel = document.getElementById('currentDayLabel');

  let notesList = document.getElementById('notesList');
  if (!notesList) {
    notesList = document.createElement('div');
    notesList.id = 'notesList';
    saveNoteBtn.insertAdjacentElement('afterend', notesList);

  }

  // --------- RENDERS ---------
  function renderTasksForSelectedDate() {
    taskList.innerHTML = '';
    const todaysTasks = state.tasks.filter(t => t.date === state.selectedDate);
    if (todaysTasks.length === 0) {
      taskList.innerHTML = `<p class="no-tasks">No hay tareas para este día</p>`;
      return;
    }
    todaysTasks.forEach(task => taskList.appendChild(createTaskItem(task)));
  }

  function createTaskItem(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id || 'temp-' + Math.random().toString(36).slice(2);
    if (task.done) li.classList.add('done');

    const left = document.createElement('div');
    left.className = 'item-left';

    const check = document.createElement('div');
    check.className = 'check' + (task.done ? ' checked' : '');
    check.addEventListener('click', () => toggleTaskDone(task, li, check));

    const title = document.createElement('span');
    title.textContent = task.text;

    const meta = document.createElement('small');
    meta.className = 'meta';
    meta.textContent = niceTimestamp(task.createdAt);

    if (task.description && task.description.trim()) {
      const desc = document.createElement('div');
      desc.className = 'meta';
      desc.textContent = `📝 ${task.description}`;
      left.appendChild(desc);
    }

    left.append(check, title, meta);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', async () => editTask(task));

    const delBtn = document.createElement('button');
    delBtn.className = 'icon';
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', async () => removeTask(task));

    actions.append(editBtn, delBtn);
    li.append(left, actions);
    return li;
  }

  async function toggleTaskDone(task, li, check) {
    task.done = !task.done;
    li.classList.toggle('done', task.done);
    check.classList.toggle('checked', task.done);
    const event = state.calendar?.getEvents()
      .find(e => e.startStr === task.date && e.title.includes(task.text));
    if (event) event.setProp('classNames', [task.done ? 'event-done' : 'event-pending']);
    else updateCalendarEvents();

    await DB.updateTask(task.id, task);
    showToast(task.done ? 'Tarea completada ✅' : 'Tarea pendiente ⏳');
  }

  async function editTask(task) {
    const nuevo = prompt('Editar tarea:', task.text);
    if (nuevo && nuevo.trim()) {
      task.text = nuevo.trim();
      await DB.updateTask(task.id, task);
      showToast('Tarea editada ✏️');
      renderTasksForSelectedDate();
      updateCalendarEvents();
    }
  }

  async function removeTask(task) {
    if (!confirm('¿Seguro que querés eliminar esta tarea?')) return;

    const li = taskList.querySelector(`li[data-id="${task.id}"]`);
    if (li) li.classList.add('removing');

    await DB.deleteTask(task.id);
    state.tasks = state.tasks.filter(t => t.id !== task.id);
    showToast('Tarea eliminada 🗑');

    if (li) setTimeout(() => li.remove(), 250);
    else renderTasksForSelectedDate();

    updateCalendarEvents();
  }

  function renderIdeas() {
    ideasList.innerHTML = '';
    if (state.ideas.length === 0) {
      ideasList.innerHTML = `<p class="no-tasks">No hay ideas guardadas</p>`;
      return;
    }
    state.ideas.forEach(i => ideasList.appendChild(createIdeaItem(i)));
  }

  function createIdeaItem(idea) {
    const div = document.createElement('div');
    div.className = 'idea-item';
    div.dataset.id = idea.id || 'temp-' + Math.random().toString(36).slice(2);

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
        await DB.updateIdea(idea.id, idea);
        showToast('Idea editada ✏️');
        renderIdeas();
      }
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'icon';
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', async () => {
      if (!confirm('¿Seguro que querés eliminar esta idea?')) return;
      div.classList.add('removing');
      await DB.deleteIdea(idea.id);
      state.ideas = state.ideas.filter(i => i.id !== idea.id);
      showToast('Idea eliminada');
      setTimeout(() => div.remove(), 250);
    });

    actions.append(editBtn, delBtn);
    div.append(spanText, meta, actions);
    return div;
  }

  function renderNotes() {
    notesList.innerHTML = '';
    if (state.notes.length === 0) {
      notesList.innerHTML = `<p class="no-tasks">No hay notas guardadas</p>`;
      return;
    }
    state.notes.forEach(n => notesList.appendChild(createNoteItem(n)));
  }

  function createNoteItem(note) {
    const wrapper = document.createElement('div');
    wrapper.className = 'note-item';
    wrapper.dataset.id = note.id || 'temp-' + Math.random().toString(36).slice(2);

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
        await DB.updateNote(note.id, note);
        showToast('Nota editada ✏️');
        renderNotes();
      }
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'icon';
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', async () => {
      if (!confirm('¿Seguro que querés eliminar esta nota?')) return;
      wrapper.classList.add('removing');
      await DB.deleteNote(note.id);
      state.notes = state.notes.filter(n => n.id !== note.id);
      showToast('Nota eliminada');
      setTimeout(() => wrapper.remove(), 250);
    });

    actions.append(editBtn, delBtn);
    wrapper.append(p, meta, actions);
    return wrapper;
  }

  // --------- CALENDARIO ---------
  function initCalendar() {
    state.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 'auto',
      dateClick: (info) => {
        state.selectedDate = info.dateStr;
        taskDateInput.value = state.selectedDate;
        refreshDayHeader();
        renderTasksForSelectedDate();
      }
    });
    state.calendar.render();
  }

  function updateCalendarEvents() {
    if (!state.calendar) return;
    state.calendar.removeAllEvents();
    state.tasks.forEach(t => {
      state.calendar.addEvent({
        title: (t.done ? '✔ ' : '') + t.text,
        start: t.date,
        classNames: [t.done ? 'event-done' : 'event-pending']
      });
    });
  }

  // --------- NAV DÍA ---------
  function goPrevDay() {
    const d = new Date(state.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    state.selectedDate = d.toISOString().slice(0, 10);
    taskDateInput.value = state.selectedDate;
    refreshDayHeader();
    renderTasksForSelectedDate();
  }

  function goNextDay() {
    const d = new Date(state.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    state.selectedDate = d.toISOString().slice(0, 10);
    taskDateInput.value = state.selectedDate;
    refreshDayHeader();
    renderTasksForSelectedDate();
  }

  function refreshDayHeader() {
    currentDayLabel.textContent = formatSelectedDayLabel(state.selectedDate);
  }

  // --------- EVENT LISTENERS ---------
  addTaskBtn.addEventListener('click', async () => {
    const text = taskInput.value.trim();
    const desc = taskDescription.value.trim();
    const chosenDate = taskDateInput.value || state.selectedDate;

    if (!text) return showToast('Ingresá una tarea', 'error');

    const newTask = { text, description: desc, date: chosenDate, done: false, createdAt: Date.now() };
    try {
      showMiniLoader('Guardando tarea...');
      const saved = await DB.addTask(newTask);
      newTask.id = saved.id || newTask.id;
      state.tasks.push(newTask);

      // Animación de entrada
      const li = createTaskItem(newTask);
      li.style.opacity = '0';
      taskList.appendChild(li);
      setTimeout(() => li.style.opacity = '1', 10);

      showToast(saved.offline ? 'Tarea guardada offline 📴' : 'Tarea agregada ✅');
      taskInput.value = '';
      taskDescription.value = '';
      updateCalendarEvents();
    } finally { hideMiniLoader(); }
  });

  addIdeaBtn.addEventListener('click', async () => {
    const text = ideaArea.value.trim();
    if (!text) return showToast('Escribí una idea', 'error');
    const idea = { text, createdAt: Date.now() };
    try {
      showMiniLoader('Guardando idea...');
      const saved = await DB.addIdea(idea);
      idea.id = saved.id || idea.id;
      state.ideas.unshift(idea);

      // Animación de entrada
      const div = createIdeaItem(idea);
      div.style.opacity = '0';
      ideasList.prepend(div);
      setTimeout(() => div.style.opacity = '1', 10);

      showToast(saved.offline ? 'Idea guardada offline 📴' : 'Idea guardada 💡');
      ideaArea.value = '';
    } finally { hideMiniLoader(); }
  });

  saveNoteBtn.addEventListener('click', async () => {
    const text = noteArea.value.trim();
    if (!text) return showToast('Escribí una nota', 'error');
    const note = { text, createdAt: Date.now() };
    try {
      showMiniLoader('Guardando nota...');
      const saved = await DB.addNote(note);
      note.id = saved.id || note.id;
      state.notes.unshift(note);

      // Animación de entrada
      const wrapper = createNoteItem(note);
      wrapper.style.opacity = '0';
      notesList.prepend(wrapper);
      setTimeout(() => wrapper.style.opacity = '1', 10);

      showToast(saved.offline ? 'Nota guardada offline 📴' : 'Nota guardada 📒');
      noteArea.value = '';
    } finally { hideMiniLoader(); }
  });

  confirmDuplicate.addEventListener('click', async () => {
    const src = fromDateInput.value;
    const dst = toDateInput.value;
    if (!src || !dst) return showToast('Elegí fechas válidas', 'error');

    const base = state.tasks.filter(t => t.date === src);
    if (!base.length) return showToast('No hay tareas para duplicar', 'error');

    const clones = [];
    for (const t of base) {
      const copy = { ...t, date: dst, done: false, createdAt: Date.now() };
      const saved = await DB.addTask(copy);
      copy.id = saved.id || copy.id;
      clones.push(copy);
    }
    state.tasks.push(...clones);
    showToast('Tareas duplicadas 📄');
    renderTasksForSelectedDate();
    updateCalendarEvents();
  });

  prevDayBtn.addEventListener('click', goPrevDay);
  nextDayBtn.addEventListener('click', goNextDay);

  // --------- CARGA INICIAL ---------
  async function loadStateFromDB() {
    const [tasks, ideas, notes] = await Promise.all([
      DB.getTasks(),
      DB.getIdeas(),
      DB.getNotes()
    ]);
    state.tasks = tasks || [];
    state.ideas = ideas || [];
    state.notes = notes || [];
    state.selectedDate = getTodayISO();
    taskDateInput.value = state.selectedDate;
  }

  function fullReRender() {
    refreshDayHeader();
    renderTasksForSelectedDate();
    renderIdeas();
    renderNotes();
    updateCalendarEvents();
  }

  function initCalendarAndRender() {
    initCalendar();
    updateCalendarEvents();
  }

  window.UI = { loadStateFromDB, fullReRender, initCalendarAndRender, updateCalendarEvents, state };
})();
