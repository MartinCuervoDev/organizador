// db.js
(function () {
  const DB_NAME = 'organizadorDB';
  const DB_VERSION = 3; // subimos versión para evitar conflictos antiguos
  let dbRef;

  // --- Abrir o crear la base de datos ---
  function openDB() {
    return new Promise((resolve, reject) => {
      if (dbRef) return resolve(dbRef);

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        // ===== TAREAS =====
        if (!db.objectStoreNames.contains('tasks')) {
          const store = db.createObjectStore('tasks', { keyPath: 'id' });
          store.createIndex('byDate', 'date', { unique: false });
        }

        // ===== IDEAS =====
        if (!db.objectStoreNames.contains('ideas')) {
          db.createObjectStore('ideas', { keyPath: 'id' });
        }

        // ===== NOTAS (múltiples) =====
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
      };

      req.onsuccess = (e) => {
        dbRef = e.target.result;
        // cierre limpio si hay cambio de versión
        dbRef.onversionchange = () => dbRef.close();
        resolve(dbRef);
      };

      req.onerror = (e) => {
        console.error('Error al abrir DB:', e.target.error);
        reject(e.target.error);
      };
    });
  }

  // --- Helpers ---
  function txStore(storeName, mode = 'readonly') {
    return openDB().then(db => db.transaction(storeName, mode).objectStore(storeName));
  }

  function getAll(storeName) {
    return txStore(storeName).then(store => {
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    });
  }

  function put(storeName, value) {
    if (!value.id) value.id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    return txStore(storeName, 'readwrite').then(store => {
      return new Promise((resolve, reject) => {
        const req = store.put(value);
        req.onsuccess = () => resolve(value);
        req.onerror = () => reject(req.error);
      });
    });
  }

  function bulkPut(storeName, arr) {
    return txStore(storeName, 'readwrite').then(store => {
      const tx = store.transaction;
      return Promise.all(arr.map(v => {
        if (!v.id) v.id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
        return new Promise((resolve, reject) => {
          const req = store.put(v);
          req.onsuccess = () => resolve(v);
          req.onerror = () => reject(req.error);
        });
      })).finally(() => tx.commit?.());
    });
  }

  function remove(storeName, key) {
    return txStore(storeName, 'readwrite').then(store => {
      return new Promise((resolve, reject) => {
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  }

  // --- API pública ---
  window.DB = {
    // ===== TAREAS =====
    async getAllTasks() { return getAll('tasks'); },
    async addTask(o) { return put('tasks', o); },
    async updateTask(o) { return put('tasks', o); },
    async removeTask(id) { return remove('tasks', id); },
    async addTasksBulk(arr) { return bulkPut('tasks', arr); },

    // ===== IDEAS =====
    async getAllIdeas() { return getAll('ideas'); },
    async addIdea(o) { return put('ideas', o); },
    async removeIdea(id) { return remove('ideas', id); },

    // ===== NOTAS =====
    async getAllNotes() { return getAll('notes'); },
    async addNote(o) { return put('notes', o); },
    async removeNote(id) { return remove('notes', id); },

    // ===== EXPORT / IMPORT =====
    async exportAll() {
      const [tasks, ideas, notes] = await Promise.all([
        this.getAllTasks(), this.getAllIdeas(), this.getAllNotes()
      ]);
      return { tasks, ideas, notes };
    },

    async importAll(data) {
      try {
        if (Array.isArray(data.tasks)) await this.addTasksBulk(data.tasks);
        if (Array.isArray(data.ideas)) for (const i of data.ideas) await this.addIdea(i);
        if (Array.isArray(data.notes)) for (const n of data.notes) await this.addNote(n);
      } catch (err) {
        console.error('Error al importar datos:', err);
      }
    }
  };
})();
