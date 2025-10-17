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
    const taskList = document.getElementById('taskList');
    const addTaskBtn = document.getElementById('addTask');
    const noteArea = document.getElementById('noteArea');
    const saveNoteBtn = document.getElementById('saveNote');
    const ideaArea = document.getElementById('ideaArea');
    const addIdeaBtn = document.getElementById('addIdea');
    const ideasList = document.getElementById('ideasList');
    const weatherBox = document.getElementById('weatherWidget');
    const calendarEl = document.getElementById('calendarContainer');
    const miniCalEl = document.getElementById('miniCalendar');

    // ===== Cargar datos =====
    load();

    // ===== TAREAS =====
    function renderTasks() {
      taskList.innerHTML = '';
      data.tasks.forEach(t => {
        const li = document.createElement('li');
        li.className = t.done ? 'done' : '';

        const left = document.createElement('div');
        left.className = 'item-left';
        const span = document.createElement('span');
        span.textContent = t.text;
        left.appendChild(span);
        if (t.date) {
          const small = document.createElement('small');
          small.className = 'meta';
          small.textContent = `📅 ${t.date}`;
          left.appendChild(small);
        }

        const actions = document.createElement('div');
        actions.className = 'item-actions';
        const ok = document.createElement('button');
        ok.className = 'icon';
        ok.textContent = '✔';
        ok.onclick = () => { t.done = !t.done; save(); renderTasks(); };

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
        actions.append(ok, edit, saveBtn, del);
        li.append(left, actions);
        taskList.appendChild(li);
      });
    }

    function addTask() {
      const text = taskInput.value.trim();
      const date = taskDate.value.trim();
      if (!text) return;
      if (!date) {
        alert('Por favor seleccioná una fecha antes de agregar la tarea.');
        taskDate.classList.add('error');
        taskDate.focus();
        setTimeout(() => taskDate.classList.remove('error'), 1200);
        return;
      }
      data.tasks.push({ id: Date.now(), text, date, done: false });
      save();
      taskInput.value = '';
      taskDate.value = '';
      renderTasks();
      updateCalendar();
    }
    addTaskBtn.onclick = addTask;
    taskInput.onkeydown = e => { if (e.key === 'Enter') addTask(); };
    taskDate.onkeydown = e => { if (e.key === 'Enter') addTask(); };
    taskDate.onchange = () => taskDate.classList.remove('error');
    taskDate.min = new Date().toISOString().split('T')[0];

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
        events: data.tasks.map(t => ({ title: t.text, start: t.date })),
        dateClick: info => { taskDate.value = info.dateStr; }
      });
      calendar.render();
    }
    function updateCalendar() {
      if (!calendar) return;
      calendar.removeAllEvents();
      data.tasks.forEach(t => calendar.addEvent({ title: t.text, start: t.date }));
    }

    // ===== MINI CALENDARIO =====
    function initMiniCalendar() {
      const mini = new FullCalendar.Calendar(miniCalEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        headerToolbar: { left: 'title', right: 'prev,next' },
        titleFormat: { year: 'numeric', month: 'long' },
        height: 260
      });
      mini.render();
    }

    // ===== CLIMA =====
    async function loadWeather() {
      const API_KEY = ''; // ← tu key aquí
      const CITY = 'Cordoba,AR'; // ← cambiá tu ciudad
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`);
        if (!res.ok) throw new Error();
        const d = await res.json();
        const c = Math.round(d.main.temp);
        const f = Math.round((c * 9) / 5 + 32);
        const icon = d.weather[0].icon;
        weatherBox.innerHTML = `
          <img src="https://openweathermap.org/img/wn/${icon}.png" width="30" alt="">
          <span>${c}°C / ${f}°F</span>
          <small>${CITY.replace(',',' / ')}</small>
        `;
      } catch {
        weatherBox.innerHTML = '<small>⚠️ Clima no disponible</small>';
      }
    }

    // ===== Inicialización =====
    renderTasks();
    renderIdeas();
    renderNotes();
    initCalendar();
    initMiniCalendar();
    loadWeather();
  });
})();
