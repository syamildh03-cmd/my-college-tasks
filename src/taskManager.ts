import { loadData, saveData } from "./storage";
import type { Filters, Priority, SortDirection, Stats, Status, Task, TaskInput } from "./types";

const STORAGE_KEY = "my-college-tasks:v1";

// Generics: mengurutkan array apa pun berdasarkan kunci string
export function sortBy<T>(items: T[], getKey: (item: T) => string, direction: SortDirection): T[] {
  const sorted = [...items].sort((a, b) => getKey(a).localeCompare(getKey(b)));
  return direction === "asc" ? sorted : sorted.reverse();
}

// Selisih hari antara hari ini dan deadline (negatif = terlambat)
export function daysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deadline + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export class TaskManager {
  private tasks: Task[] = loadData<Task[]>(STORAGE_KEY, []); // Array of Task

  private save(): void {
    saveData<Task[]>(STORAGE_KEY, this.tasks);
  }

  getAll(): Task[] {
    return [...this.tasks];
  }

  getById(id: string): Task | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  add(input: TaskInput): Task {
    const task: Task = { id: generateId(), ...input };
    this.tasks.push(task);
    this.save();
    return task;
  }

  update(id: string, input: TaskInput): boolean {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.tasks[index] = { id, ...input };
    this.save();
    return true;
  }

  remove(id: string): boolean {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.save();
    return this.tasks.length < before;
  }

  toggle(id: string): Status | null {
    const task = this.getById(id);
    if (!task) return null;
    task.status = task.status === "Selesai" ? "Belum Selesai" : "Selesai";
    this.save();
    return task.status;
  }

  filter(f: Filters): Task[] {
    const q = f.query.trim().toLowerCase();
    const result = this.tasks.filter((t) => {
      const matchQuery =
        q === "" ||
        t.name.toLowerCase().includes(q) ||
        t.course.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);
      const matchStatus = f.status === "Semua" || t.status === f.status;
      const matchPriority = f.priority === "Semua" || t.priority === f.priority;
      return matchQuery && matchStatus && matchPriority;
    });
    return sortBy<Task>(result, (t) => t.deadline, f.sort);
  }

  stats(): Stats {
    const total = this.tasks.length;
    const done = this.tasks.filter((t) => t.status === "Selesai").length;
    const byPriority: Record<Priority, number> = { Rendah: 0, Sedang: 0, Tinggi: 0 };
    this.tasks.forEach((t) => {
      if (t.status === "Belum Selesai") byPriority[t.priority] += 1;
    });
    return {
      total,
      done,
      pending: total - done,
      percent: total === 0 ? 0 : Math.round((done / total) * 100),
      byPriority,
    };
  }

  upcoming(limit = 5): Task[] {
    const pending = this.tasks.filter((t) => t.status === "Belum Selesai");
    return sortBy<Task>(pending, (t) => t.deadline, "asc").slice(0, limit);
  }
}
