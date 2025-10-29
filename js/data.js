const API_URL = "http://localhost:3000";

// ---------- TAREAS ----------
export async function getTasks() {
  const res = await fetch(`${API_URL}/tasks`);
  if (!res.ok) throw new Error("Error al obtener tareas");
  return await res.json();
}

export async function addTask(task) {
  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task)
  });
  if (!res.ok) throw new Error("Error al agregar tarea");
  return await res.json(); // { id: ... }
}

export async function updateTask(id, task) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task)
  });
  if (!res.ok) throw new Error("Error al actualizar tarea");
  return await res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Error al eliminar tarea");
  return await res.json();
}


// ---------- IDEAS ----------
export async function getIdeas() {
  const res = await fetch(`${API_URL}/ideas`);
  if (!res.ok) throw new Error("Error al obtener ideas");
  return await res.json();
}

export async function addIdea(idea) {
  const res = await fetch(`${API_URL}/ideas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(idea)
  });
  if (!res.ok) throw new Error("Error al agregar idea");
  return await res.json(); // { id: ... }
}

export async function updateIdea(id, idea) {
  const res = await fetch(`${API_URL}/ideas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(idea)
  });
  if (!res.ok) throw new Error("Error al actualizar idea");
  return await res.json();
}

export async function deleteIdea(id) {
  const res = await fetch(`${API_URL}/ideas/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Error al eliminar idea");
  return await res.json();
}


// ---------- NOTAS ----------
export async function getNotes() {
  const res = await fetch(`${API_URL}/notes`);
  if (!res.ok) throw new Error("Error al obtener notas");
  return await res.json();
}

export async function addNote(note) {
  const res = await fetch(`${API_URL}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note)
  });
  if (!res.ok) throw new Error("Error al agregar nota");
  return await res.json(); // { id: ... }
}

export async function updateNote(id, note) {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note)
  });
  if (!res.ok) throw new Error("Error al actualizar nota");
  return await res.json();
}

export async function deleteNote(id) {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Error al eliminar nota");
  return await res.json();
}
