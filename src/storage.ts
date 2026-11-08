// Fungsi generics: T ditentukan saat dipanggil, mis. loadData<Task[]>(...)
export function loadData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveData<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}
