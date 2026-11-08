import "./style.css";
import { TaskManager, daysUntil } from "./taskManager";
import type { Filters, Priority, SortDirection, Status, Task, TaskInput } from "./types";

const APP_NAME: string = import.meta.env.VITE_APP_NAME ?? "My College Tasks";
const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? "1.0.0";

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function $<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error("Elemen tidak ditemukan: " + selector);
  return el;
}

const escapeMap: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => escapeMap[c] ?? c);

const formatDate = (d: string): string =>
  new Date(d + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

const manager = new TaskManager();
let editingId: string | null = null;
let deletingId: string | null = null;
const filters: Filters = { query: "", status: "Semua", priority: "Semua", sort: "asc" };

// ---------- Toast ----------
function toast(message: string, type: "success" | "error" = "success"): void {
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = message;
  $("#toast-container").appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ---------- Badge ----------
function deadlineBadge(task: Task): string {
  if (task.status === "Selesai") return "";
  const d: number = daysUntil(task.deadline);
  const late: boolean = d < 0;
  if (late) return `<span class="badge late">⚠ Terlambat ${Math.abs(d)} hari</span>`;
  if (d === 0) return `<span class="badge soon">⏰ Hari ini</span>`;
  if (d <= 3) return `<span class="badge soon">⏰ ${d} hari lagi</span>`;
  return "";
}

const priorityBadge = (p: Priority): string => `<span class="badge p-${p.toLowerCase()}">${p}</span>`;

// ---------- Dashboard ----------
function renderDashboard(): void {
  const s = manager.stats();
  $("#stat-total").textContent = String(s.total);
  $("#stat-pending").textContent = String(s.pending);
  $("#stat-done").textContent = String(s.done);
  $("#stat-percent").textContent = s.percent + "%";
  $("#progress-bar").style.width = s.percent + "%";

  $("#priority-summary").innerHTML = (["Tinggi", "Sedang", "Rendah"] as Priority[])
    .map((p) => `<div class="prio-row">${priorityBadge(p)}<strong>${s.byPriority[p]}</strong> tugas belum selesai</div>`)
    .join("");

  const upcoming = manager.upcoming(5);
  $("#upcoming-list").innerHTML =
    upcoming.length === 0
      ? `<p class="muted">Tidak ada tugas yang menunggu. 🎉</p>`
      : upcoming
          .map(
            (t) => `<div class="mini-task"><div><strong>${esc(t.name)}</strong>
              <div class="muted">${esc(t.course)} · ${formatDate(t.deadline)}</div></div>
              <div class="badges">${priorityBadge(t.priority)}${deadlineBadge(t)}</div></div>`
          )
          .join("");
}

// ---------- Daftar tugas ----------
function renderTasks(): void {
  const list = $("#task-list");
  const empty = $("#empty-state");
  const tasks = manager.filter(filters);
  const hasAny = manager.getAll().length > 0;

  empty.hidden = tasks.length > 0;
  $("#empty-title").textContent = hasAny ? "Tidak ada tugas yang cocok" : "Belum ada tugas";
  $("#empty-text").textContent = hasAny
    ? "Coba ubah kata kunci atau filter pencarian."
    : "Klik tombol “Tambah Tugas” untuk mulai mencatat tugas kuliahmu.";

  list.innerHTML = tasks
    .map((t) => {
      const done = t.status === "Selesai";
      return `<article class="card task ${done ? "is-done" : ""}">
        <button class="check" data-action="toggle" data-id="${t.id}" aria-label="Ubah status">${done ? "✓" : ""}</button>
        <div class="task-body">
          <h3>${esc(t.name)}</h3>
          <p class="muted">📚 ${esc(t.course)} · 📅 ${formatDate(t.deadline)}</p>
          ${t.description ? `<p>${esc(t.description)}</p>` : ""}
          <div class="badges">${priorityBadge(t.priority)}
            <span class="badge ${done ? "done" : "pending"}">${t.status}</span>${deadlineBadge(t)}</div>
        </div>
        <div class="task-actions">
          <button class="btn small" data-action="edit" data-id="${t.id}">✏️ Edit</button>
          <button class="btn small danger" data-action="delete" data-id="${t.id}">🗑 Hapus</button>
        </div></article>`;
    })
    .join("");
}

function renderAll(): void {
  renderDashboard();
  renderTasks();
}

// ---------- Navigasi ----------
function showView(name: string): void {
  document.querySelectorAll<HTMLElement>(".view").forEach((v) => (v.hidden = v.id !== "view-" + name));
  document.querySelectorAll<HTMLElement>("[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Form ----------
const taskDialog = $<HTMLDialogElement>("#task-dialog");
const confirmDialog = $<HTMLDialogElement>("#confirm-dialog");
const form = $<HTMLFormElement>("#task-form");
const field = (id: string): Field => $<Field>("#" + id);

function clearErrors(): void {
  document.querySelectorAll<HTMLElement>(".error").forEach((e) => (e.textContent = ""));
}

function openForm(task?: Task): void {
  clearErrors();
  form.reset();
  editingId = task ? task.id : null;
  $("#dialog-title").textContent = task ? "Edit Tugas" : "Tambah Tugas";
  if (task) {
    field("f-name").value = task.name;
    field("f-course").value = task.course;
    field("f-desc").value = task.description;
    field("f-deadline").value = task.deadline;
    field("f-priority").value = task.priority;
    field("f-status").value = task.status;
  }
  taskDialog.showModal();
}

function validate(data: TaskInput): boolean {
  clearErrors();
  let ok = true;
  const setError = (id: string, msg: string): void => {
    $("#err-" + id).textContent = msg;
    ok = false;
  };
  if (data.name.length < 3) setError("name", "Nama tugas minimal 3 karakter.");
  if (data.course.length < 2) setError("course", "Nama mata kuliah wajib diisi.");
  if (!data.deadline) setError("deadline", "Tanggal deadline wajib diisi.");
  return ok;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data: TaskInput = {
    name: field("f-name").value.trim(),
    course: field("f-course").value.trim(),
    description: field("f-desc").value.trim(),
    deadline: field("f-deadline").value,
    priority: field("f-priority").value as Priority,
    status: field("f-status").value as Status,
  };
  if (!validate(data)) return;
  if (editingId) {
    manager.update(editingId, data);
    toast("Tugas berhasil diperbarui.");
  } else {
    manager.add(data);
    toast("Tugas berhasil ditambahkan.");
  }
  taskDialog.close();
  renderAll();
});

// ---------- Event ----------
$("#task-list").addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!btn) return;
  const id = btn.dataset.id ?? "";
  const action = btn.dataset.action;
  if (action === "toggle") {
    const status = manager.toggle(id);
    if (status) toast(status === "Selesai" ? "Tugas ditandai selesai." : "Tugas ditandai belum selesai.");
    renderAll();
  } else if (action === "edit") {
    const task = manager.getById(id);
    if (task) openForm(task);
  } else if (action === "delete") {
    const task = manager.getById(id);
    if (!task) return;
    deletingId = id;
    $("#confirm-text").textContent = `Hapus tugas “${task.name}”? Tindakan ini tidak dapat dibatalkan.`;
    confirmDialog.showModal();
  }
});

$("#confirm-yes").addEventListener("click", () => {
  if (deletingId && manager.remove(deletingId)) toast("Tugas berhasil dihapus.");
  deletingId = null;
  confirmDialog.close();
  renderAll();
});
$("#confirm-no").addEventListener("click", () => confirmDialog.close());
$("#cancel-form").addEventListener("click", () => taskDialog.close());
document.querySelectorAll<HTMLElement>("[data-open-form]").forEach((b) => b.addEventListener("click", () => openForm()));
document.querySelectorAll<HTMLElement>("[data-view]").forEach((b) =>
  b.addEventListener("click", () => showView(b.dataset.view ?? "dashboard"))
);

$<HTMLInputElement>("#search").addEventListener("input", (e) => {
  filters.query = (e.target as HTMLInputElement).value;
  renderTasks();
});
$<HTMLSelectElement>("#filter-status").addEventListener("change", (e) => {
  filters.status = (e.target as HTMLSelectElement).value as Filters["status"];
  renderTasks();
});
$<HTMLSelectElement>("#filter-priority").addEventListener("change", (e) => {
  filters.priority = (e.target as HTMLSelectElement).value as Filters["priority"];
  renderTasks();
});
$<HTMLSelectElement>("#sort").addEventListener("change", (e) => {
  filters.sort = (e.target as HTMLSelectElement).value as SortDirection;
  renderTasks();
});

// ---------- Init ----------
document.title = APP_NAME;
$("#app-name").textContent = APP_NAME;
$("#app-version").textContent = "v" + APP_VERSION;
renderAll();
