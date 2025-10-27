// ui.js
(function () {
  const taskInput = document.getElementById('taskInput');
  const taskDateInput = document.getElementById('taskDate');
  const taskList = document.getElementById('taskList');
  const ideaArea = document.getElementById('ideaArea');
  const ideasList = document.getElementById('ideasList');
  const noteArea = document.getElementById('noteArea');
  const saveNoteBtn = document.getElementById('saveNote');
  const calendarEl = document.getElementById('calendarContainer');
  const exportBtn = document.getElementById('exportData');
  const importInput = document.getElementById('importData');
  let calendar;

  // === Estado global ===
  const state = { tasks: [], ideas: [], notes: [], selectedDate: todayISO() };

  // === Helpers ===
  const todayISO = () => new Date().toISOString().slice(0, 10);

  const formatDateHuman = iso => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // === Cabecera con navegación de días ===
  const navContainer = document.createElement('div');
  navContainer.id = 'dayNav';
  navContainer.innerHTML = `
    <button id="prevDay">◀</button>
    <span id="currentDay"></span>
    <button id="nextDay">▶</button>
  `;
  taskList.parentElement.insertBefore(navContainer, taskList);

  const currentDayEl = document.getElementById('currentDay');
  const updateDayHeader = () => currentDayEl.textContent = formatDateHuman(state.selectedDate);

  // === Renders ===
  function renderTasks() {
    taskList.innerHTML = '';
    const filtered = state.tasks.filter(t => t.date === state.selectedDate);
    if (filtered.length === 0) {
      taskList.innerHTML = `<p class="no-tasks">No hay tareas para este día</p>`;
      return;
    }
    filtered.forEach(t => taskList.appendChild(createTaskItem(t)));
  }

  function createTaskItem(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    li.className = task.done ? 'done' : '';

    const left = document.createElement('div');
    left.className = 'item-left';

    const check = document.createElement('div');
    check.className = 'check' + (task.done ? ' checked' : '');
    check.addEventListener('click', async () => {
      task.done = !task.done;
      await DB.updateTask(task);
      toast(task.done ? 'Tarea completada ✅' : 'Tarea pendiente', 'info');
      renderTasks();
      updateCalendarEvents();
    });

    const text = document.createElement('span');
    text.textContent = task.text;

    const meta = document.createElement('small');
    meta.className = 'meta';
    meta.textContent = formatTimestamp(task.createdAt);

    left.append(check, text, meta);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.className = 'icon';
    editBtn.addEventListener('click', async () => {
      const nuevo = prompt('Editar tarea:', task.text);
      if (nuevo && nuevo.trim()) {
        task.text = nuevo.trim();
        await DB.updateTask(task);
        toast('Tarea editada ✏️', 'info');
        renderTasks();
        updateCalendarEvents();
      }
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑';
    delBtn.className = 'icon';
    delBtn.addEventListener('click', async () => {
      await DB.removeTask(task.id);
      state.tasks = state.tasks.filter(t => t.id !== task.id);
      toast('Tarea eliminada 🗑', 'error');
      renderTasks();
      updateCalendarEvents();
    });

    actions.append(editBtn, delBtn);
    li.append(left, actions);
    return li;
  }

  // === Ideas ===
  const createIdeaItem = idea => {
    const div = document.createElement('div');
    div.className = 'idea-item';
    div.innerHTML = `
      <span>${idea.text}</span>
      <small class="meta">${formatTimestamp(idea.createdAt)}</small>
      <div class="item-actions">
        <button class="icon edit">✏️</button>
        <button class="icon delete">🗑</button>
      </div>
    `;
    const editBtn = div.querySelector('.edit');
    const delBtn = div.querySelector('.delete');
    editBtn.addEventListener('click', async () => {
      const nuevo = prompt('Editar idea:', idea.text);
      if (nuevo && nuevo.trim()) {
        idea.text = nuevo.trim();
        await DB.addIdea(idea);
        toast('Idea editada ✏️', 'info');
        renderIdeas();
      }
    });
    delBtn.addEventListener('click', async () => {
      await DB.removeIdea(idea.id);
      state.ideas = state.ideas.filter(i => i.id !== idea.id);
      toast('Idea eliminada', 'error');
      renderIdeas();
    });
    return div;
  };

  function renderIdeas() {
    ideasList.innerHTML = '';
    state.ideas.forEach(i => ideasList.appendChild(createIdeaItem(i)));
  }

  // === Notas ===
  const notesList = document.createElement('div');
  notesList.id = 'notesList';
  noteArea.insertAdjacentElement('afterend', notesList);

  const createNoteItem = note => {
    const div = document.createElement('div');
    div.className = 'note-item';
    div.innerHTML = `
      <p>${note.text}</p>
      <small class="meta">${formatTimestamp(note.createdAt)}</small>
      <div class="item-actions">
        <button class="icon edit">✏️</button>
        <button class="icon delete">🗑</button>
      </div>
    `;
    const edit = div.querySelector('.edit');
    const del = div.querySelector('.delete');

    edit.addEventListener('click', async () => {
      const nuevo = prompt('Editar nota:', note.text);
      if (nuevo && nuevo.trim()) {
        note.text = nuevo.trim();
        await DB.addNote(note);
        toast('Nota editada ✏️', 'info');
        renderNotes();
      }
    });
    del.addEventListener('click', async () => {
      await DB.removeNote(note.id);
      state.notes = state.notes.filter(n => n.id !== note.id);
      toast('Nota eliminada', 'error');
      renderNotes();
    });
    return div;
  };

  function renderNotes() {
    notesList.innerHTML = '';
    state.notes.forEach(n => notesList.appendChild(createNoteItem(n)));
  }

  // === Acciones ===
  document.getElementById('addTask').addEventListener('click', async () => {
    const text = taskInput.value.trim();
    const date = taskDateInput.value || state.selectedDate;
    if (!text) return toast('Ingresá una tarea', 'error');
    const task = { id: uid(), text, date, done: false, createdAt: Date.now() };
    await DB.addTask(task);
    state.tasks.push(task);
    toast('Tarea agregada ✅', 'success');
    renderTasks();
    updateCalendarEvents();
    taskInput.value = '';
  });

  saveNoteBtn.addEventListener('click', async () => {
    const txt = noteArea.value.trim();
    if (!txt) return toast('Escribí una nota', 'error');
    const note = { id: uid(), text: txt, createdAt: Date.now() };
    await DB.addNote(note);
    state.notes.push(note);
    toast('Nota guardada 📝', 'success');
    renderNotes();
    noteArea.value = '';
  });

  document.getElementById('addIdea').addEventListener('click', async () => {
    const text = ideaArea.value.trim();
    if (!text) return toast('Ingresá una idea', 'error');
    const idea = { id: uid(), text, createdAt: Date.now() };
    await DB.addIdea(idea);
    state.ideas.push(idea);
    toast('Idea agregada 💡', 'success');
    renderIdeas();
    ideaArea.value = '';
  });

  // === Navegación de días ===
  document.getElementById('prevDay').addEventListener('click', () => {
    const d = new Date(state.selectedDate);
    d.setDate(d.getDate() - 1);
    state.selectedDate = d.toISOString().slice(0, 10);
    updateDayHeader();
    renderTasks();
  });
  document.getElementById('nextDay').addEventListener('click', () => {
    const d = new Date(state.selectedDate);
    d.setDate(d.getDate() + 1);
    state.selectedDate = d.toISOString().slice(0, 10);
    updateDayHeader();
    renderTasks();
  });

  // === Import / Export ===
  exportBtn.addEventListener('click', async () => {
    const data = await DB.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'organizador-backup.json' });
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup exportado 💾', 'success');
  });

  importInput.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    await DB.importAll(JSON.parse(text));
    await loadStateFromDB();
    fullReRender();
    toast('Datos importados correctamente 🔄', 'success');
  });

  // === Calendario ===
  function initCalendar() {
    calendar = new FullCalendar.Calendar(calendarEl, { initialView: 'dayGridMonth', height: 'auto' });
    calendar.render();
  }

  function updateCalendarEvents() {
    if (!calendar) return;
    calendar.removeAllEvents();
    state.tasks.forEach(t => calendar.addEvent({
      title: (t.done ? '✔ ' : '') + t.text,
      start: t.date
    }));
  }

  // === Carga inicial ===
  async function loadStateFromDB() {
    const [tasks, ideas, notes] = await Promise.all([
      DB.getAllTasks(), DB.getAllIdeas(), DB.getAllNotes()
    ]);
    state.tasks = tasks;
    state.ideas = ideas;
    state.notes = notes;
  }

  function fullReRender() {
    updateDayHeader();
    renderTasks();
    renderIdeas();
    renderNotes();
    updateCalendarEvents();
  }

  window.UI = { initCalendar, updateCalendarEvents, loadStateFromDB, fullReRender, state };
})();
