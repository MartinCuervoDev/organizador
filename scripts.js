// ===============================
// 🧠 TickLite v1.4.2 - Dark Edition (corregida)
// ===============================

const STORAGE_KEY = 'ticklite_data_v1';
let data = { tasks: [], notes: '', ideas: [], notesList: [] };

// ====== GUARDAR Y CARGAR ======
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  data = JSON.parse(raw);

  // 🛡️ Compatibilidad con versiones anteriores
  if (!Array.isArray(data.tasks)) data.tasks = [];
  if (!Array.isArray(data.ideas)) data.ideas = [];
  if (!Array.isArray(data.notesList)) data.notesList = [];
  if ('doneDays' in data) delete data.doneDays; // elimina campo obsoleto
}

// ====== ELEMENTOS ======
const taskInput = document.getElementById('taskInput');
const taskDate = document.getElementById('taskDate');
const taskList = document.getElementById('taskList');
const addTaskBtn = document.getElementById('addTask');
const dailyTask = document.getElementById('dailyTask');
const noteArea = document.getElementById('noteArea');
const saveNoteBtn = document.getElementById('saveNote');
const calendarContainer = document.getElementById('calendarContainer');
const ideaArea = document.getElementById('ideaArea');
const addIdeaBtn = document.getElementById('addIdea');
const ideasList = document.getElementById('ideasList');

// ====== CALENDARIO ======
let calendar;
function initCalendar() {
  calendar = new FullCalendar.Calendar(calendarContainer, {
    initialView: 'dayGridMonth',
    locale: 'es',
    buttonText: { today: 'hoy' },
    height: 'auto',
    events: (data.tasks || [])
      .filter(t => t.date)
      .map(t => ({ title: t.text, start: t.date })),

    dateClick(info) { taskDate.value = info.dateStr; },
    datesSet() {
    const title = calendarContainer.querySelector('.fc-toolbar-title');
    if (title) {
      // ✅ Limpieza robusta del título del mes (soporta "octubre 2025" o "octubre de 2025")
      const match = title.textContent.match(/^[A-Za-zÁÉÍÓÚáéíóú\s]+(?:de\s)?\d{4}/);
      const newTitle = match ? match[0] : title.textContent;
      title.textContent =
        newTitle.charAt(0).toUpperCase() + newTitle.slice(1); 
      }
    }
  });
  calendar.render();
}

// ====== TAREAS ======
addTaskBtn.addEventListener('click', () => {
  const text = taskInput.value.trim();
  const date = taskDate.value;
  if (!text) return;

  data.tasks.push({
  id: Date.now(),
  text,
  done: false,
  date: date || null
});


  taskInput.value = '';
  taskDate.value = '';
  dailyTask.checked = false;
  taskInput.focus();

  renderTasks();
  updateCalendarEvents();
  save();
});

function renderTasks() {
  taskList.innerHTML = '';
  data.tasks.forEach(t => {
    const li = document.createElement('li');
    li.className = t.done ? 'done fade-in' : 'fade-in';
    li.innerHTML = `
      <span>${t.text}${t.daily ? ' 🔁' : ''}${t.date ? ' (' + t.date + ')' : ''}</span>
      <div>
        <button class="ok" aria-label="Marcar como completada">✔</button>
        <button class="del" aria-label="Eliminar tarea">🗑️</button>
      </div>
    `;
    li.querySelector('.ok').addEventListener('click', () => toggleTask(t.id));
    li.querySelector('.del').addEventListener('click', () => deleteTask(t.id));
    taskList.appendChild(li);
  });

  // 🔄 Mantener calendario actualizado automáticamente
  updateCalendarEvents();
}

function toggleTask(id) {
  const task = data.tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  renderTasks();
  save();
}

function deleteTask(id) {
  if (!confirm('¿Seguro que querés eliminar esta tarea?')) return;
  data.tasks = data.tasks.filter(t => t.id !== id);
  renderTasks();
  save();
}

function updateCalendarEvents() {
  if (!calendar) return;
  calendar.removeAllEvents();
  data.tasks.forEach(t => {
    if (t.date) calendar.addEvent({ title: t.text, start: t.date });
  });
}

// ====== IDEAS ======
addIdeaBtn.addEventListener('click', e => {
  e.preventDefault();
  const text = ideaArea.value.trim();
  if (!text) return;

  data.ideas.unshift({
    id: Date.now(),
    text,
    createdAt: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
  });

  ideaArea.value = '';
  ideaArea.focus();

  renderIdeas();
  save();
});

function renderIdeas() {
  ideasList.innerHTML = '';
  if (!data.ideas.length) {
    ideasList.innerHTML = '<p style="opacity:.6;">(Todavía no agregaste ideas)</p>';
    return;
  }

  data.ideas.forEach(i => {
    const item = document.createElement('div');
    item.className = 'idea-item fade-in';
    item.innerHTML = `
      <p>${escapeHtml(i.text)}</p>
      <small>🕓 ${i.createdAt}</small>
      <button class="delete-idea" title="Eliminar">🗑️</button>
    `;
    item.querySelector('.delete-idea').addEventListener('click', () => {
      if (!confirm('¿Eliminar esta idea?')) return;
      data.ideas = data.ideas.filter(x => x.id !== i.id);
      renderIdeas();
      save();
    });
    ideasList.appendChild(item);
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ====== NOTAS ======
const notesListContainer = document.createElement('div');
notesListContainer.id = 'notesList';
noteArea.parentNode.insertBefore(notesListContainer, saveNoteBtn.nextSibling);

saveNoteBtn.addEventListener('click', () => {
  const text = noteArea.value.trim();
  if (!text) return;

  const note = {
    id: Date.now(),
    text,
    date: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
  };

  data.notesList.unshift(note);
  noteArea.value = '';
  noteArea.focus();

  renderNotes();
  save();
});

function renderNotes() {
  notesListContainer.innerHTML = '';
  const notes = data.notesList || [];

  if (notes.length === 0) {
    notesListContainer.innerHTML = '<p style="opacity:0.6;">(Todavía no hay notas guardadas)</p>';
    return;
  }

  notes.forEach(note => {
    const div = document.createElement('div');
    div.className = 'note-item fade-in';
    div.innerHTML = `
      <p>${escapeHtml(note.text)}</p>
      <small>🕓 ${note.date}</small>
      <button class="delete-note">🗑️</button>
    `;
    div.querySelector('.delete-note').addEventListener('click', () => {
      if (!confirm('¿Eliminar esta nota?')) return;
      data.notesList = data.notesList.filter(n => n.id !== note.id);
      renderNotes();
      save();
    });
    notesListContainer.appendChild(div);
  });
}

// ====== INIT ======
load();
renderIdeas();
renderTasks();
renderNotes();
initCalendar();
