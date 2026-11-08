// Type Alias + Union Type
export type Priority = "Rendah" | "Sedang" | "Tinggi";
export type Status = "Belum Selesai" | "Selesai";
export type SortDirection = "asc" | "desc";

// Interface: struktur data satu tugas
export interface Task {
  id: string; // string
  name: string;
  course: string;
  description: string;
  deadline: string; // format YYYY-MM-DD
  priority: Priority;
  status: Status;
}

export type TaskInput = Omit<Task, "id">;

export interface Filters {
  query: string;
  status: Status | "Semua";
  priority: Priority | "Semua";
  sort: SortDirection;
}

export interface Stats {
  total: number; // number
  pending: number;
  done: number;
  percent: number;
  byPriority: Record<Priority, number>;
}
