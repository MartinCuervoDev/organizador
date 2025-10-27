// db.js
(function () {
  const DB_NAME = 'organizadorDB';
  const DB_VERSION = 3; // si ya usabas 2, pasar a 3 evita conflictos
  let dbRef;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (dbRef) return resolve(dbRef);

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        // tasks
        if (!db.objectStoreNames.contains('tasks')) {
          const store = db.createObjectStore('tasks', { keyPath: 'id' });
          store.createIndex('byDate', 'date', { unique: false });
        }

        // ideas
        if (!db.objectStoreNames.contains('ideas')) {
          db.createObjectStore('ideas', { keyPath: 'id' });
        }

        // notes (múltiples notas individuales)
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
      };

      req.onsuccess = (e) => {
        dbRef = e.target.result;
        dbRef.onversionchange = () => {
          // cerrar conexión vieja si alguna vez actualizamos versión
          dbRef.close();
        };
        resolve(dbRef);
      };

      req.onerror = (e) => {
        console.error('Error al abrir IndexedDB:', e.target.error);
        reject(e.target.error);
      };
    });
  }

  function txStore(storeName, mode = 'readonly') {
    return openDB().then(db =>
      db.transaction(storeName, mode).objectStore(storeName)
    );
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
    // aseguramos id
    if (!value.id) {
      value.id = (crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36));
    }

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
      return Promise.all(
        arr.map(v => {
          if (!v.id) {
            v.id = (crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).slice(2) + Date.now().toString(36));
          }
          return new Promise((resolve, reject) => {
            const req = store.put(v);
            req.onsuccess = () => resolve(v);
            req.onerror = () => reject(req.error);
          });
        })
      ).finally(() => {
        // algunos navegadores soportan commit manual
        if (tx && typeof tx.commit === 'function') {
          tx.commit();
        }
      });
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

  // API pública
  window.DB = {
    // tareas
    async getAllTasks() {
      return getAll('tasks');
    },
    async addTask(taskObj) {
      return put('tasks', taskObj);
    },
    async updateTask(taskObj) {
      return put('tasks', taskObj);
    },
    async removeTask(id) {
      return remove('tasks', id);
    },
    async addTasksBulk(arr) {
      return bulkPut('tasks', arr);
    },

    // ideas
    async getAllIdeas() {
      return getAll('ideas');
    },
    async addIdea(ideaObj) {
      return put('ideas', ideaObj);
    },
    async removeIdea(id) {
      return remove('ideas', id);
    },

    // notas
    async getAllNotes() {
      return getAll('notes');
    },
    async addNote(noteObj) {
      return put('notes', noteObj);
    },
    async removeNote(id) {
      return remove('notes', id);
    },

    // export / import
    async exportAll() {
    const [tasks, ideas, notes] = await Promise.all([
      this.getAllTasks(),
      this.getAllIdeas(),
      this.getAllNotes()
    ]);

    const data = { tasks, ideas, notes };
    
    // ⚡ Guardamos en caché localStorage para carga instantánea
    try {
      localStorage.setItem('organizadorCache', JSON.stringify(data));
    } catch (err) {
      console.warn('No se pudo guardar el cache local:', err);
    }

    return data;
  },


    async importAll(data) {
      if (Array.isArray(data.tasks)) {
        await this.addTasksBulk(data.tasks);
      }
      if (Array.isArray(data.ideas)) {
        for (const i of data.ideas) {
          await this.addIdea(i);
        }
      }
      if (Array.isArray(data.notes)) {
        for (const n of data.notes) {
          await this.addNote(n);
        }
      }
    }
  };
})();
