import * as API from './data.js';

const DB_NAME = 'organizador_offline';
const STORE_NAMES = ['tasks', 'ideas', 'notes'];
let db;

// --- Abrir / crear la base offline ---
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = e => {
      db = e.target.result;
      STORE_NAMES.forEach(name => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
        }
      });
    };
    request.onsuccess = e => { db = e.target.result; resolve(db); };
    request.onerror = e => reject(e);
  });
}

async function ensureDB() {
  if (!db) await openDB();
  return db;
}

async function addOffline(store, item) {
  const db = await ensureDB();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).add({ ...item, __pending: true });
}

async function getAllOffline(store) {
  const db = await ensureDB();
  return new Promise(resolve => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
}

async function clearOffline(store) {
  const db = await ensureDB();
  db.transaction(store, 'readwrite').objectStore(store).clear();
}

// --- Wrapper seguro con fallback a modo offline ---
async function safeCall(fn, store, ...args) {
  try {
    const result = await fn(...args);
    window.toast?.('✅ Guardado en servidor', 'success');
    return result;
  } catch (err) {
    console.warn(`⚠️ Backend no disponible, guardando en ${store} offline`, err);
    const data = args[0];
    await addOffline(store, data);
    window.toast?.('💾 Guardado localmente (modo offline)', 'warning');
    return { offline: true, ...data };
  }
}

// --- Función principal de sincronización ---
async function syncAll() {
  const db = await ensureDB();
  let totalSincronizados = 0;

  for (const store of STORE_NAMES) {
    const pending = await getAllOffline(store);
    const toSync = pending.filter(i => i.__pending);

    for (const item of toSync) {
      try {
        const capitalized = store.charAt(0).toUpperCase() + store.slice(1, -1);
        const addFn = API[`add${capitalized}`];
        if (addFn) {
          await addFn(item);
          totalSincronizados++;
        }
      } catch (err) {
        console.warn(`❌ Error sincronizando ${store}`, err);
      }
    }

    // Limpieza de los que ya fueron enviados
    if (toSync.length > 0) await clearOffline(store);
  }

  if (totalSincronizados > 0) {
    window.toast?.(`✅ ${totalSincronizados} elementos sincronizados`, 'success');
  }
}

// --- Escucha automática de reconexión ---
window.addEventListener('online', async () => {
  window.toast?.('🌐 Conexión restaurada, sincronizando...', 'info');
  try {
    await syncAll();
  } catch {
    window.toast?.('⚠️ Error al sincronizar datos', 'error');
  }
});

window.addEventListener('offline', () => {
  window.toast?.('📴 Modo offline activado', 'warning');
});

// --- API combinada (online + offline) ---
export const Storage = {
  // tareas
  async getTasks() {
    try {
      return await API.getTasks();
    } catch {
      return await getAllOffline('tasks');
    }
  },
  async addTask(task) {
    return await safeCall(API.addTask, 'tasks', task);
  },
  async updateTask(id, task) {
    return await safeCall(API.updateTask, 'tasks', id, task);
  },
  async deleteTask(id) {
    try { return await API.deleteTask(id); } catch { await addOffline('tasks', { id, __delete: true }); }
  },

  // ideas
  async getIdeas() {
    try { return await API.getIdeas(); }
    catch { return await getAllOffline('ideas'); }
  },
  async addIdea(idea) {
    return await safeCall(API.addIdea, 'ideas', idea);
  },
  async updateIdea(id, idea) {
    return await safeCall(API.updateIdea, 'ideas', id, idea);
  },
  async deleteIdea(id) {
    try { return await API.deleteIdea(id); } catch { await addOffline('ideas', { id, __delete: true }); }
  },

  // notas
  async getNotes() {
    try { return await API.getNotes(); }
    catch { return await getAllOffline('notes'); }
  },
  async addNote(note) {
    return await safeCall(API.addNote, 'notes', note);
  },
  async updateNote(id, note) {
    return await safeCall(API.updateNote, 'notes', id, note);
  },
  async deleteNote(id) {
    try { return await API.deleteNote(id); } catch { await addOffline('notes', { id, __delete: true }); }
  },

  // sincronizar manualmente
  async syncAll() {
    await syncAll();
  }
};
