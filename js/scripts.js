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

  // === DUPLICAR TAREAS (versión mejorada, móvil + escritorio) ===

// Referencias a los elementos del panel (deben existir en el HTML)
const duplicatePanel = document.getElementById('duplicatePanel');
const fromInput = document.getElementById('fromDate');
const toInput = document.getElementById('toDate');
const confirmDuplicateBtn = document.getElementById('confirmDuplicate');

// Mostrar u ocultar el panel al tocar 📄 Duplicar
duplicateBtn.addEventListener('click', () => {
  duplicatePanel.classList.toggle('hidden');
});

// Confirmar duplicado al presionar el botón ✅
confirmDuplicateBtn.addEventListener('click', () => {
  const fromDate = fromInput.value;
  const toDate = toInput.value;

  if (!fromDate || !toDate) {
    alert("⚠️ Debes seleccionar ambas fechas para duplicar.");
    return;
  }

  // 🧩 Convertir de formato ISO (input date) a formato visual argentino (dd-mm-aaaa)
  function toArg(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  }

  // 🧩 Y al revés (por compatibilidad con tu código viejo)
  function toISO(dateStr) {
    const [d, m, y] = dateStr.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Si el usuario pone las fechas desde el selector <input type="date">
  // ya vienen en formato ISO (2025-10-23), así que las usamos directo
  const fromISO = fromDate.includes('-') && fromDate.length === 10 && fromDate[4] === '-'
    ? fromDate
    : toISO(fromDate);
  const toISODate = toDate.includes('-') && toDate.length === 10 && toDate[4] === '-'
    ? toDate
    : toISO(toDate);

  // 📋 Filtrar tareas del día origen
  const tareasOrigen = data.tasks.filter(t => t.date === fromISO);
  if (tareasOrigen.length === 0) {
    alert(`No hay tareas en la fecha ${toArg(fromISO)} para duplicar.`);
    return;
  }

  // 🧱 Crear copias con id nuevo
  const duplicadas = tareasOrigen.map(t => ({
    id: Date.now() + Math.random(),
    text: t.text,
    date: toISODate,
    done: false
  }));

  // 💾 Guardar y renderizar
  data.tasks.push(...duplicadas);
  save();

  // Si estás parado en la fecha destino, actualizá la vista
  if (taskDate.value === toISODate) {
    renderTasks();
  }
  updateCalendar();

  alert(`✅ ${duplicadas.length} tareas duplicadas de ${toArg(fromISO)} a ${toArg(toISODate)}`);

  // Ocultar el panel nuevamente
  duplicatePanel.classList.add('hidden');
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

      // === EXPORTAR / IMPORTAR DATOS ===
      const exportBtn = document.getElementById('exportData');
      const importInput = document.getElementById('importData');

      // 💾 Exportar datos actuales a un archivo .json (compatible con móviles)
            exportBtn.addEventListener('click', () => {
              const jsonData = JSON.stringify(data, null, 2);

              const esMovil = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
              if (esMovil) {
                // En móviles mostramos el texto para copiar manualmente
                const nuevaVentana = window.open("", "_blank");
                nuevaVentana.document.write("<pre>" + jsonData + "</pre>");
                nuevaVentana.document.title = "Backup Organizador";
                alert("📱 En celular no se puede descargar directo. Se abrió una ventana con el backup: copiá y guardalo.");
                return;
              }

              // En escritorio sí descargamos el archivo normalmente
              const blob = new Blob([jsonData], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `organizador_backup_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
              alert('✅ Datos exportados correctamente.');
            });


// 📂 Importar datos desde un archivo .json
        importInput.addEventListener('change', event => {
          const file = event.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = e => {
            try {
              const imported = JSON.parse(e.target.result);
              if (!imported.tasks) throw new Error("Archivo inválido");

              // Confirmación antes de sobrescribir
              if (!confirm("⚠️ Esto reemplazará los datos actuales. ¿Continuar?")) return;

              data.tasks = imported.tasks || [];
              data.notesList = imported.notesList || [];
              data.ideas = imported.ideas || [];

              save();
              renderTasks();
              renderIdeas();
              renderNotes();
              updateCalendar();

              alert("✅ Datos importados con éxito.");
            } catch (err) {
              alert("❌ Archivo no válido o dañado.");
              console.error(err);
            }
          };
          reader.readAsText(file);
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
        dateClick: info => {
            // ✅ Establecer la fecha clickeada en el input principal
            taskDate.value = info.dateStr;

            // 🧠 Preguntar el texto de la tarea (solo en escritorio)
            const esMovil = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
            
            if (esMovil) {
              // En móvil, abrimos el input normal de arriba para escribir la tarea
              alert(`📅 Día seleccionado: ${info.dateStr}. Escribí tu tarea arriba y tocá ➕ Agregar.`);
              taskInput.focus();
            } else {
              // En PC, mostramos un prompt directo para agregar rápido
              const nuevaTarea = prompt(`📅 Nueva tarea para el ${info.dateStr}:`);
              if (nuevaTarea && nuevaTarea.trim() !== '') {
                data.tasks.push({
                  id: Date.now() + Math.random(),
                  text: nuevaTarea.trim(),
                  date: info.dateStr,
                  done: false
                });
                save();
                renderTasks();
                updateCalendar();
              }
            }
          }

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
