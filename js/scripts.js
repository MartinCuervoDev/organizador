// ===============================
// 📘 Organizador v1.6 – Desktop Enhanced
// ===============================
(() => {
  const STORAGE_KEY = 'organizador_data_v1';
  let data = { tasks: [], notesList: [], ideas: [] };

  // ===== Persistencia =====
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      data.tasks = parsed.tasks || [];
      data.notesList = parsed.notesList || [];
      data.ideas = parsed.ideas || [];
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const taskDate = document.getElementById('taskDate');
    taskDate.addEventListener('click', () => {
      taskDate.showPicker?.(); // fuerza abrir el selector de fecha
    });
    const taskList = document.getElementById('taskList');
    const addTaskBtn = document.getElementById('addTask');
    const duplicateBtn = document.getElementById('duplicateTasks');
    const noteArea = document.getElementById('noteArea');
    const saveNoteBtn = document.getElementById('saveNote');
    const ideaArea = document.getElementById('ideaArea');
    const addIdeaBtn = document.getElementById('addIdea');
    const ideasList = document.getElementById('ideasList');
    const calendarEl = document.getElementById('calendarContainer');

    // ===== Cargar datos =====
    load();

    // === Fecha por defecto: hoy ===
      const hoy = new Date();
      const yyyy = hoy.getFullYear();
      const mm = String(hoy.getMonth() + 1).padStart(2, '0');
      const dd = String(hoy.getDate()).padStart(2, '0');
      const formatoISO = `${yyyy}-${mm}-${dd}`;
      taskDate.value = formatoISO;


    // ===== TAREAS =====
      // === RENDER SOLO TAREAS DEL DÍA SELECCIONADO ===
function renderTasks() {
  taskList.innerHTML = '';

  const selectedDate = taskDate.value; // yyyy-mm-dd (valor del input type="date")

  // Si no hay fecha seleccionada, no mostramos nada
  if (!selectedDate) {
    taskList.innerHTML = '<p class="no-tasks">🗓️ Seleccioná una fecha para ver sus tareas.</p>';
    return;
  }

  // Filtrar SOLO las tareas de ese día
  const tareasFiltradas = data.tasks.filter(t => t.date === selectedDate);

  if (tareasFiltradas.length === 0) {
    taskList.innerHTML = '<p class="no-tasks">🗓️ No hay tareas para esta fecha.</p>';
    return;
  }

  // Pintar tareas del día seleccionado
  tareasFiltradas.forEach(t => {
    const li = document.createElement('li');
    li.className = t.done ? 'done' : '';

    const left = document.createElement('div');
    left.className = 'item-left';

    // === Cuadrado check a la izquierda ===
    const check = document.createElement('div');
    check.className = 'check';
    if (t.done) check.classList.add('checked');
    check.onclick = () => {
      t.done = !t.done;
      save();
      renderTasks();
      updateCalendar();
    };
    left.appendChild(check);

    const span = document.createElement('span');
    span.textContent = t.text;
    left.appendChild(span);

    if (t.date) {
      const small = document.createElement('small');
      small.className = 'meta';

      // 🔹 Convertir formato yyyy-mm-dd → dd/mm/yyyy (solo visual)
      const [y, m, d] = t.date.split('-');
      const fechaFormateada = `${d}/${m}/${y}`;

      small.textContent = `📅 ${fechaFormateada}`;
      left.appendChild(small);
    }

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const edit = document.createElement('button');
    edit.className = 'icon';
    edit.textContent = '✏️';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'icon hidden';
    saveBtn.textContent = '💾';

    const del = document.createElement('button');
    del.className = 'icon';
    del.textContent = '🗑️';
    del.onclick = () => {
      if (confirm('¿Eliminar esta tarea?')) {
        // Borramos por id (asegurate que todas las tareas tengan id)
        data.tasks = data.tasks.filter(x => x.id !== t.id);
        save();
        renderTasks();
        updateCalendar();
      }
    };

    edit.onclick = () => {
      const input = document.createElement('input');
      input.value = t.text;
      left.replaceChild(input, span);
      edit.classList.add('hidden');
      saveBtn.classList.remove('hidden');
      input.focus();
      input.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn.click(); });
      saveBtn.onclick = () => {
        const val = input.value.trim();
        if (!val) return;
        t.text = val;
        save();
        renderTasks();
        updateCalendar();
      };
    };

    actions.append(edit, saveBtn, del);
    li.append(left, actions);
    taskList.appendChild(li);
  });
}

// === AGREGAR TAREA (manteniendo la fecha seleccionada para no "perder" la vista) ===
function addTask() {
  const text = taskInput.value.trim();
  const date = taskDate.value.trim(); // yyyy-mm-dd
  if (!text) return;
  if (!date) {
    alert('Por favor seleccioná una fecha antes de agregar la tarea.');
    taskDate.classList.add('error');
    taskDate.focus();
    setTimeout(() => taskDate.classList.remove('error'), 1200);
    return;
  }

  data.tasks.push({ id: Date.now() + Math.random(), text, date, done: false });
  save();

  taskInput.value = '';
  // 🔸 IMPORTANTE: NO vaciamos taskDate.value, así seguimos viendo el mismo día
  // Si vos sí querés limpiarla, entonces después de limpiar re-asignala a 'date':
  // taskDate.value = date;

  renderTasks();
  updateCalendar();
}

// === EVENTOS EXISTENTES ===
addTaskBtn.onclick = addTask;
taskInput.onkeydown = e => { if (e.key === 'Enter') addTask(); };
taskDate.onkeydown = e => { if (e.key === 'Enter') addTask(); };
taskDate.onchange = () => taskDate.classList.remove('error');

// 🔁 Al cambiar la fecha, actualizamos la lista y el calendario
taskDate.addEventListener('change', () => {
  renderTasks();
  updateCalendar();
});

// Limitar a hoy en adelante (si así lo querés)
taskDate.min = new Date().toISOString().split('T')[0];

// === DUPLICAR TAREAS (acepta dd-mm-aaaa y asegura id en duplicadas) ===
duplicateBtn.addEventListener('click', () => {
  const fromDate = prompt("📅 Ingresá la fecha desde donde duplicar (formato: dd-mm-aaaa)");
  const toDate = prompt("📅 Ingresá la fecha destino (formato: dd-mm-aaaa)");
  if (!fromDate || !toDate) return alert("⚠️ Debes ingresar ambas fechas.");

  // 🧩 Conversión de dd-mm-aaaa a aaaa-mm-dd
  function toISO(dateStr) {
    const [d, m, y] = dateStr.split('-');
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }

  const fromISO = toISO(fromDate);
  const toISODate = toISO(toDate);

  // 📋 Filtrar tareas del día origen
  const tareasOrigen = data.tasks.filter(t => t.date === fromISO);

  if (tareasOrigen.length === 0) {
    alert(`No hay tareas en la fecha ${fromDate} para duplicar.`);
    return;
  }

  // 🧱 Crear copias con la nueva fecha (con id nuevo)
  const duplicadas = tareasOrigen.map(t => ({
    id: Date.now() + Math.random(),
    text: t.text,
    date: toISODate,
    done: false
  }));

  // 💾 Guardar y renderizar
  data.tasks.push(...duplicadas);
  save();

  // Si estás parado en la fecha destino, las vas a ver al toque:
  if (taskDate.value === toISODate) {
    renderTasks();
  }
  updateCalendar();

  alert(`✅ ${duplicadas.length} tareas duplicadas de ${fromDate} a ${toDate}`);
});

// === INICIALIZACIÓN: mostrar HOY por defecto si no hay fecha seleccionada ===
    document.addEventListener('DOMContentLoaded', () => {
  // Asegurarnos de que el input exista antes de usarlo
  const taskDate = document.getElementById('taskDate');
  if (!taskDate) return;

  // 🗓️ Obtener fecha actual
  const hoy = new Date();

  // Armar formato ISO (para <input type="date">)
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const formatoISO = `${yyyy}-${mm}-${dd}`;

  // ✅ Establecer la fecha actual en el input
  taskDate.value = formatoISO;

  // 🔁 Renderizar las tareas y el calendario automáticamente
  renderTasks();
  updateCalendar();
});





    // ===== IDEAS =====
    function renderIdeas() {
      ideasList.innerHTML = '';
      if (!data.ideas.length) {
        ideasList.innerHTML = '<p style="opacity:.6;">(Todavía no agregaste ideas)</p>';
        return;
      }
      data.ideas.forEach(i => {
        const div = document.createElement('div');
        div.className = 'idea-item';
        const left = document.createElement('div');
        left.className = 'item-left';
        const p = document.createElement('p');
        p.textContent = i.text;
        const meta = document.createElement('small');
        meta.className = 'meta';
        meta.textContent = `🕓 ${i.createdAt}`;
        left.append(p, meta);

        const actions = document.createElement('div');
        actions.className = 'item-actions';
        const edit = document.createElement('button');
        edit.className = 'icon';
        edit.textContent = '✏️';
        const saveBtn = document.createElement('button');
        saveBtn.className = 'icon hidden';
        saveBtn.textContent = '💾';
        const del = document.createElement('button');
        del.className = 'icon';
        del.textContent = '🗑️';
        del.onclick = () => {
          if (confirm('¿Eliminar esta idea?')) {
            data.ideas = data.ideas.filter(x => x.id !== i.id);
            save(); renderIdeas();
          }
        };
        edit.onclick = () => {
          const ta = document.createElement('textarea');
          ta.value = i.text;
          left.replaceChild(ta, p);
          edit.classList.add('hidden');
          saveBtn.classList.remove('hidden');
          ta.focus();
          saveBtn.onclick = () => {
            const val = ta.value.trim();
            if (!val) return;
            i.text = val;
            save(); renderIdeas();
          };
        };
        actions.append(edit, saveBtn, del);
        div.append(left, actions);
        ideasList.appendChild(div);
      });
    }
    addIdeaBtn.onclick = () => {
      const text = ideaArea.value.trim();
      if (!text) return;
      data.ideas.unshift({
        id: Date.now(),
        text,
        createdAt: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
      });
      ideaArea.value = '';
      save(); renderIdeas();
    };

    // ===== NOTAS =====
    const notesListContainer = document.createElement('div');
    notesListContainer.id = 'notesList';
    saveNoteBtn.parentNode.insertBefore(notesListContainer, saveNoteBtn.nextSibling);

    function renderNotes() {
      notesListContainer.innerHTML = '';
      if (!data.notesList.length) {
        notesListContainer.innerHTML = '<p style="opacity:.6;">(Todavía no hay notas guardadas)</p>';
        return;
      }
      data.notesList.forEach(n => {
        const div = document.createElement('div');
        div.className = 'note-item';
        const left = document.createElement('div');
        left.className = 'item-left';
        const p = document.createElement('p');
        p.textContent = n.text;
        const meta = document.createElement('small');
        meta.className = 'meta';
        meta.textContent = `🕓 ${n.date}`;
        left.append(p, meta);

        const actions = document.createElement('div');
        actions.className = 'item-actions';
        const edit = document.createElement('button');
        edit.className = 'icon';
        edit.textContent = '✏️';
        const saveBtn = document.createElement('button');
        saveBtn.className = 'icon hidden';
        saveBtn.textContent = '💾';
        const del = document.createElement('button');
        del.className = 'icon';
        del.textContent = '🗑️';
        del.onclick = () => {
          if (confirm('¿Eliminar esta nota?')) {
            data.notesList = data.notesList.filter(x => x.id !== n.id);
            save(); renderNotes();
          }
        };
        edit.onclick = () => {
          const ta = document.createElement('textarea');
          ta.value = n.text;
          left.replaceChild(ta, p);
          edit.classList.add('hidden');
          saveBtn.classList.remove('hidden');
          ta.focus();
          saveBtn.onclick = () => {
            const val = ta.value.trim();
            if (!val) return;
            n.text = val;
            save(); renderNotes();
          };
        };
        actions.append(edit, saveBtn, del);
        div.append(left, actions);
        notesListContainer.appendChild(div);
      });
    }
    saveNoteBtn.onclick = () => {
      const text = noteArea.value.trim();
      if (!text) return;
      data.notesList.unshift({
        id: Date.now(),
        text,
        date: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
      });
      noteArea.value = '';
      save(); renderNotes();
    };

    // ===== CALENDARIO PRINCIPAL =====
    let calendar;
    function initCalendar() {
      calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        height: 'auto',
        headerToolbar: { left: 'title', right: 'prev,next today' },
        titleFormat: { year: 'numeric', month: 'long' },
        events: data.tasks.map(t => ({
          title: t.text,
          start: t.date,
          className: t.done ? 'event-done' : 'event-pending'
        })),
        dateClick: info => { taskDate.value = info.dateStr; }
      });
      calendar.render();
    }
    function updateCalendar() {
      if (!calendar) return;
      calendar.removeAllEvents();

      data.tasks.forEach(t => {
        calendar.addEvent({
          title: t.text,
          start: t.date,
          className: t.done ? 'event-done' : 'event-pending'
        });
      });
    }

    
    // ===== Inicialización =====
    renderTasks();
    renderIdeas();
    renderNotes();
    initCalendar();
  });
})();
