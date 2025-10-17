// ===============================
// 🧠 TickLite v1.5 — Smart Edition (dark)
// ===============================
(() => {
  const STORAGE_KEY = 'ticklite_data_v1';
  let data = { tasks: [], notes: '', ideas: [], notesList: [] };

  // ===== Persistencia =====
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch(e){ console.warn('No se pudo guardar en localStorage:', e); }
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) || {};
      data.tasks     = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      data.ideas     = Array.isArray(parsed.ideas) ? parsed.ideas : [];
      data.notesList = Array.isArray(parsed.notesList) ? parsed.notesList : [];
      data.notes     = typeof parsed.notes === 'string' ? parsed.notes : '';
    } catch(e){ console.warn('No se pudo cargar localStorage:', e); }
  }

  // ===== Utils =====
  function escapeHtml(s='') {
    const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
    return String(s).replace(/[&<>"']/g, c => map[c]);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // ===== DOM =====
    const taskInput   = document.getElementById('taskInput');
    const taskDate    = document.getElementById('taskDate');
    const taskList    = document.getElementById('taskList');
    const addTaskBtn  = document.getElementById('addTask');
    const noteArea    = document.getElementById('noteArea');
    const saveNoteBtn = document.getElementById('saveNote');
    const calendarEl  = document.getElementById('calendarContainer');
    const ideaArea    = document.getElementById('ideaArea');
    const addIdeaBtn  = document.getElementById('addIdea');
    const ideasList   = document.getElementById('ideasList');
    const weatherBox  = document.getElementById('weatherWidget');
    const miniCalEl   = document.getElementById('miniCalendar');

    if (!taskList || !ideasList || !calendarEl) {
      console.error('Faltan elementos clave del DOM. Verificá el HTML.');
      return;
    }

    // ===== Carga estado =====
    load();

    // ===== Calendario principal =====
    let calendar = null;
    function initCalendar() {
      if (!window.FullCalendar) { console.error('FullCalendar no está disponible.'); return; }
      calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        buttonText: { today: 'hoy' },
        height: 'auto',
        events: (data.tasks || [])
          .filter(t => t && t.date)
          .map(t => ({ title: t.text, start: t.date })),
        dateClick(info) { if (taskDate) taskDate.value = info.dateStr; },
        // Quitamos “de” del título cuando cambian fechas
        datesSet() {
          const titleEl = calendarEl.querySelector('.fc-toolbar-title');
          if (titleEl) titleEl.textContent = titleEl.textContent.replace(/\sde\s/gi, ' ');
        }
      });
      calendar.render();
      // Ajuste inicial del “de”
      const titleEl = calendarEl.querySelector('.fc-toolbar-title');
      if (titleEl) titleEl.textContent = titleEl.textContent.replace(/\sde\s/gi, ' ');
    }
    function updateCalendarEvents() {
      if (!calendar) return;
      calendar.removeAllEvents();
      (data.tasks || []).forEach(t => {
        if (t && t.date) calendar.addEvent({ title: t.text, start: t.date });
      });
    }

    // ===== Mini Calendario (sin eventos) =====
    function initMiniCalendar() {
      if (!window.FullCalendar || !miniCalEl) return;
      const mini = new FullCalendar.Calendar(miniCalEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        height: 200,
        headerToolbar: { left: 'title', center: '', right: 'prev,next' },
        datesSet() {
          const t = miniCalEl.querySelector('.fc-toolbar-title');
          if (t) t.textContent = t.textContent.replace(/\sde\s/gi, ' ');
        }
      });
      mini.render();
      const t = miniCalEl.querySelector('.fc-toolbar-title');
      if (t) t.textContent = t.textContent.replace(/\sde\s/gi, ' ');
    }

    // ===== TAREAS =====
    function renderTasks() {
      taskList.innerHTML = '';
      (data.tasks || []).forEach(t => {
        const li = document.createElement('li');
        li.className = (t.done ? 'done ' : '') + 'fade-in';

        const left = document.createElement('div');
        left.className = 'item-left';
        const span = document.createElement('span');
        span.textContent = t.text;
        left.appendChild(span);
        if (t.date) {
          const sm = document.createElement('small');
          sm.className = 'meta';
          sm.textContent = `📅 ${t.date}`;
          left.appendChild(sm);
        }

        const actions = document.createElement('div');
        actions.className = 'item-actions';
        const okBtn   = Object.assign(document.createElement('button'), { className:'icon', textContent:'✔', title:'Completar' });
        const editBtn = Object.assign(document.createElement('button'), { className:'icon', textContent:'✏️', title:'Editar' });
        const saveBtn = Object.assign(document.createElement('button'), { className:'icon hidden', textContent:'💾', title:'Guardar' });
        const delBtn  = Object.assign(document.createElement('button'), { className:'icon', textContent:'🗑️', title:'Eliminar' });

        // Toggle done
        okBtn.addEventListener('click', () => { t.done = !t.done; save(); renderTasks(); });

        // Editar inline
        editBtn.addEventListener('click', () => {
          const input = document.createElement('input');
          input.type = 'text';
          input.value = t.text;
          input.style.width = '100%';
          left.replaceChild(input, span);
          editBtn.classList.add('hidden');
          saveBtn.classList.remove('hidden');
          input.focus();
          input.addEventListener('keydown', e => { if(e.key==='Enter') saveBtn.click(); });
        });

        // Guardar edición
        saveBtn.addEventListener('click', () => {
          const input = left.querySelector('input[type="text"]');
          const newVal = (input?.value || '').trim();
          if (!newVal) return;
          t.text = newVal;
          save(); renderTasks();
        });

        // Eliminar
        delBtn.addEventListener('click', () => {
          if (!confirm('¿Seguro que querés eliminar esta tarea?')) return;
          data.tasks = (data.tasks || []).filter(x => x.id !== t.id);
          save(); renderTasks();
        });

        actions.append(okBtn, editBtn, saveBtn, delBtn);
        li.append(left, actions);
        taskList.appendChild(li);
      });
      updateCalendarEvents();
    }

    function addTask() {
      const text = (taskInput?.value || '').trim();
      const date = (taskDate?.value || '').trim();
      if (!text) return;
      if (!date) {
        alert('Por favor seleccioná una fecha antes de agregar la tarea.');
        taskDate?.classList.add('error');
        taskDate?.focus();
        setTimeout(() => taskDate?.classList.remove('error'), 1200);
        return;
      }
      data.tasks.unshift({ id: Date.now(), text, done:false, date });
      taskInput.value=''; taskDate.value='';
      taskInput?.focus();
      save(); renderTasks();
    }

    addTaskBtn?.addEventListener('click', addTask);
    taskInput?.addEventListener('keydown', e => { if(e.key==='Enter') addTask(); });
    taskDate?.addEventListener('keydown', e => { if(e.key==='Enter') addTask(); });

    // ===== IDEAS =====
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

        const left = document.createElement('div');
        left.className = 'item-left';
        const p = document.createElement('p');
        p.innerHTML = escapeHtml(i.text);
        const meta = document.createElement('small');
        meta.className = 'meta';
        meta.textContent = `🕓 ${i.createdAt || ''}`;
        left.append(p, meta);

        const actions = document.createElement('div');
        actions.className = 'item-actions';
        const editBtn = Object.assign(document.createElement('button'), { className:'icon', textContent:'✏️', title:'Editar' });
        const saveBtn = Object.assign(document.createElement('button'), { className:'icon hidden', textContent:'💾', title:'Guardar' });
        const delBtn  = Object.assign(document.createElement('button'), { className:'icon', textContent:'🗑️', title:'Eliminar' });

        editBtn.addEventListener('click', () => {
          const ta = document.createElement('textarea');
          ta.value = i.text;
          left.replaceChild(ta, p);
          editBtn.classList.add('hidden');
          saveBtn.classList.remove('hidden');
          ta.focus();
        });

        saveBtn.addEventListener('click', () => {
          const ta = left.querySelector('textarea');
          const nv = (ta?.value || '').trim();
          if (!nv) return;
          i.text = nv;
          save(); renderIdeas();
        });

        delBtn.addEventListener('click', () => {
          if (!confirm('¿Eliminar esta idea?')) return;
          data.ideas = (data.ideas || []).filter(x => x.id !== i.id);
          save(); renderIdeas();
        });

        actions.append(editBtn, saveBtn, delBtn);
        item.append(left, actions);
        ideasList.appendChild(item);
      });
    }

    addIdeaBtn?.addEventListener('click', e => {
      e.preventDefault();
      const text = (ideaArea?.value || '').trim();
      if (!text) return;
      (data.ideas ||= []);
      data.ideas.unshift({
        id: Date.now(),
        text,
        createdAt: new Date().toLocaleString('es-AR', { dateStyle:'short', timeStyle:'short' })
      });
      ideaArea.value = ''; ideaArea.focus();
      save(); renderIdeas();
    });

    // ===== NOTAS =====
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

        const left = document.createElement('div');
        left.className = 'item-left';
        const p = document.createElement('p');
        p.innerHTML = escapeHtml(note.text);
        const meta = document.createElement('small');
        meta.className = 'meta';
        meta.textContent = `🕓 ${note.date || ''}`;
        left.append(p, meta);

        const actions = document.createElement('div');
        actions.className = 'item-actions';
        const editBtn = Object.assign(document.createElement('button'), { className:'icon', textContent:'✏️', title:'Editar' });
        const saveBtn = Object.assign(document.createElement('button'), { className:'icon hidden', textContent:'💾', title:'Guardar' });
        const delBtn  = Object.assign(document.createElement('button'), { className:'icon', textContent:'🗑️', title:'Eliminar' });

        editBtn.addEventListener('click', () => {
          const ta = document.createElement('textarea');
          ta.value = note.text;
          left.replaceChild(ta, p);
          editBtn.classList.add('hidden');
          saveBtn.classList.remove('hidden');
          ta.focus();
        });
        saveBtn.addEventListener('click', () => {
          const ta = left.querySelector('textarea');
          const nv = (ta?.value || '').trim();
          if (!nv) return;
          note.text = nv;
          save(); renderNotes();
        });
        delBtn.addEventListener('click', () => {
          if (!confirm('¿Eliminar esta nota?')) return;
          data.notesList = (data.notesList || []).filter(n => n.id !== note.id);
          save(); renderNotes();
        });

        actions.append(editBtn, saveBtn, delBtn);
        div.append(left, actions);
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
      noteArea.value = ''; noteArea.focus();
      save(); renderNotes();
    });

    // ===== Clima =====
    (function initWeather(){
      if (!weatherBox) return;
      const API_KEY = ''; // ← PONÉ TU API KEY DE OpenWeatherMap (gratis)
      const CITY = 'Cordoba,AR'; // cambialo si querés
      if (!API_KEY) {
        weatherBox.innerHTML = 'Clima: agregá tu API key de OpenWeatherMap';
        return;
      }
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`)
        .then(r => r.json())
        .then(d => {
          if (!d || !d.main) { weatherBox.textContent = 'Clima no disponible'; return; }
          const temp = Math.round(d.main.temp);
          const icon = d.weather?.[0]?.icon || '01d';
          weatherBox.innerHTML = `
            <span>${temp}°C</span>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="" width="32" height="32">
            <small>${CITY.replace(',',' / ')}</small>
          `;
        })
        .catch(() => weatherBox.textContent = 'Clima no disponible');
    })();

    // ===== Boot =====
    renderIdeas();
    renderTasks();
    renderNotes();
    initCalendar();
    initMiniCalendar();
  });
})();
