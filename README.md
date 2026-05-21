# 🏴‍☠️ Panduan Deployment MonopoliWeb ke GitHub Pages

Jika Anda mengalami error seperti **`GET https://ultramilk001.github.io/src/main.tsx net::ERR_ABORTED 404 (Not Found)`** atau tidak dapat menemukan workflow deployment yang berjalan di tab **Actions**, berikut adalah penjelasan penyebab dan solusi akuratnya.

---

## 🔍 Penyebab Error 404 (`/src/main.tsx`)
Aplikasi **React + Vite** Anda ditulis menggunakan **TypeScript (`.tsx`)**. Browser secara bawaan tidak dapat membaca file `.tsx` secara langsung. File-file tersebut harus dikompilasi terlebih dahulu menjadi file JavaScript standar (`.js`) di dalam folder `dist/` lewat proses build (`npm run build`).

Error ini terjadi karena pengaturan **GitHub Pages** di repositori Anda masih disetel menggunakan **"Deploy from a branch"** (mengambil file mentah dari cabang `main`/`master` langsung). Akibatnya, GitHub Pages menyajikan file mentah Anda, dan browser mencoba memuat `/src/main.tsx` tanpa dikompilasi terlebih dahulu, sehingga memicu error 404.

---

## 🚀 Solusi: Mengaktifkan GitHub Actions (Deploy Otomatis)

Saya sudah membuat dan menyempurnakan konfigurasi otomatisasi di dalam file `.github/workflows/deploy.yml`. Untuk menjalankannya secara sempurna, silakan ubah pengaturan di akun GitHub Anda dengan langkah mudah berikut:

1. **Buka Repositori GitHub Anda** di browser.
2. Masuk ke tab **⚙️ Settings** (terletak di bilah menu bagian atas repositori).
3. Di bilah sisi sebelah kiri, gulung ke bawah hingga bagian **Code and automation**, lalu klik **Pages**.
4. Cari opsi **Build and deployment**. Di bawah tulisan **Source**, klik tombol pilihan (*dropdown*) yang saat ini bernilai **"Deploy from a branch"**.
5. Ubah nilainya menjadi **"GitHub Actions"**.
6. **Selesai!** 

---

## 🔄 Bagaimana Cara Memicu Build dan Deployment?
Setelah mengubah pengaturan di atas menjadi **GitHub Actions**:
- Setiap kali Anda melakukan perubahan atau push kode baru ke repositori ini, GitHub Actions akan **otomatis** mendeteksi perubahan tersebut.
- Workflow akan meng-compile aplikasi Anda dengan aman (menghasilkan folder `dist/` yang bersih) dan langsung mempublikasikannya ke halaman **https://ultramilk001.github.io/MonopoliWeb/**.

### Cara Memantau atau Menjalankan Skenario Deployment secara Manual:
1. Klik tab **Actions** di bilah menu atas repositori GitHub Anda.
2. Anda sekarang akan melihat workflow bernama **"Deploy static content to Pages"** di sisi kiri.
3. Klik nama workflow tersebut.
4. Jika Anda ingin memicu deployment ulang secara manual, klik tombol dropdown **"Run workflow"** di bagian kanan atas, lalu klik tombol hijau **"Run workflow"** sekali lagi.
5. Tunggu ikon berwarna kuning berputar berubah menjadi warna **hijau centang (Success)**.
6. Klik tautan tautan yang diberikan di bagian akhir proses untuk membuka permainan monopoli bajak laut Anda yang bekerja 100% tanpa error!
