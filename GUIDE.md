# Panduan My College Tasks (Bahasa Indonesia)

## 1. Persiapan
Install **Node.js LTS** (nodejs.org) dan **Git** (git-scm.com). Cek di terminal VS Code (Ctrl + `):
```bash
node -v && npm -v && git --version
```

## 2. Menjalankan proyek
Buka folder `my-college-tasks` di VS Code (File > Open Folder), lalu:
```bash
npm install        # membuat node_modules dan package-lock.json
npm run dev        # buka http://localhost:5173
npm run build      # cek TypeScript + build ke folder dist
npm run preview    # coba hasil build
```
- `dependencies`: dibutuhkan saat aplikasi berjalan (proyek ini kosong).
- `devDependencies`: alat pengembangan (`typescript`, `vite`).
- Semantic versioning `MAJOR.MINOR.PATCH`: `^5.4.8` = boleh naik MINOR/PATCH, tidak MAJOR.

## 3. Git & GitHub (salin berurutan)
Buat repository kosong di github.com bernama `my-college-tasks` (tanpa README). Ganti `USERNAME`.

```bash
git config --global user.name "Nama Kamu"
git config --global user.email "emailgithub@contoh.com"

git init
git branch -M main
git add .
git commit -m "chore: inisialisasi proyek Vite TypeScript"        # commit 1
git remote add origin https://github.com/USERNAME/my-college-tasks.git
git push -u origin main                                             # push pertama

# --- Branch 1: fitur manajemen tugas
git switch -c feature/task-management
git add src/taskManager.ts src/storage.ts src/types.ts
git commit -m "feat: tambah CRUD tugas dan penyimpanan LocalStorage"   # commit 2
git push -u origin feature/task-management

# --- Branch 2: fitur dashboard
git switch main
git switch -c feature/dashboard
git add src/main.ts src/style.css index.html
git commit -m "feat: tambah dashboard statistik dan deadline terdekat"  # commit 3
git push -u origin feature/dashboard
```
> Jika `git add`/commit terasa kosong karena semua file sudah ter-commit di commit 1, ubah sedikit file dulu (mis. komentar) agar tiap branch punya commit sendiri.

### Merge
```bash
git switch main
git merge feature/task-management
git merge feature/dashboard
git push origin main
git log --oneline --graph --all      # verifikasi riwayat merge
```

### Simulasi merge conflict
```bash
git switch main
git switch -c feature/judul-a
# Edit index.html: ubah isi <h1>Dashboard</h1> menjadi <h1>Dashboard Utama</h1>
git commit -am "feat: ubah judul dashboard (A)"                     # commit 4
git switch main
git switch -c feature/judul-b
# Edit BARIS YANG SAMA: <h1>Dashboard</h1> menjadi <h1>Ringkasan Tugas</h1>
git commit -am "feat: ubah judul dashboard (B)"                     # commit 5
git switch main
git merge feature/judul-a            # berhasil
git merge feature/judul-b            # CONFLICT!
```
Selesaikan: buka `index.html`, cari tanda ini lalu pilih/gabungkan isinya dan hapus semua tandanya.
```
<<<<<<< HEAD
<h1>Dashboard Utama</h1>
=======
<h1>Ringkasan Tugas</h1>
>>>>>>> feature/judul-b
```
Setelah dirapikan menjadi satu baris `<h1>Dashboard</h1>` (atau judul pilihanmu):
```bash
git add index.html
git commit -m "merge: selesaikan konflik judul dashboard"          # commit 6
git push origin main
git status                            # harus "nothing to commit"
```

### Pull
```bash
git pull origin main
```
(Untuk latihan: edit file langsung di github.com, lalu jalankan perintah di atas.)

### Pull Request
```bash
git switch -c feature/readme
# edit/ buat README.md
git add README.md
git commit -m "docs: tambah README"
git push -u origin feature/readme
```
Di GitHub klik **Compare & pull request** > isi judul/deskripsi > **Create pull request** > **Merge pull request**. Lalu `git switch main && git pull origin main`.

## 4. Deploy ke GitHub Pages
`vite.config.ts` sudah memakai `base: "./"` sehingga CSS/JS/gambar berfungsi di repo mana pun (jika ingin eksplisit, ganti jadi `base: "/my-college-tasks/"`).
File `.github/workflows/deploy.yml` sudah disiapkan.
1. Pastikan `package-lock.json` ikut di-commit dan sudah di-push ke `main`.
2. GitHub > repository > **Settings > Pages > Build and deployment > Source: GitHub Actions**.
3. Tab **Actions**: tunggu workflow "Deploy ke GitHub Pages" berwarna hijau.
4. URL: `https://USERNAME.github.io/my-college-tasks/`

## 5. Checklist ketentuan dosen
- [ ] Repository GitHub dibuat
- [ ] Minimal 5 commit
- [ ] Minimal 2 branch (`feature/task-management`, `feature/dashboard`)
- [ ] Merge ke `main`
- [ ] Simulasi + penyelesaian merge conflict
- [ ] Push dan pull
- [ ] Minimal 1 Pull Request
- [ ] `.gitignore` berisi `.env`; `.env.example` ter-upload
- [ ] `npm run build` sukses
- [ ] Website online dan URL dicatat

<<<<<<< HEAD
## Riwayat Pengembangan

Pengembangan fitur pengelolaan tugas dilakukan menggunakan Git
dengan branch feature/task-management.
=======
## Pengembangan Dashboard
Fitur dashboard dikembangkan untuk menampilkan statistik
jumlah tugas, progres pengerjaan, prioritas, dan tenggat waktu.
>>>>>>> feature/dashboard
