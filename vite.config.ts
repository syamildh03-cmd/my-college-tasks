import { defineConfig } from "vite";

// base "./" membuat semua aset (CSS/JS) memakai path relatif,
// sehingga aman di GitHub Pages dengan nama repository apa pun.
export default defineConfig({
  base: "./",
});
