# Sistem Reservasi Hotel — Novotel Manado

Aplikasi web untuk mengelola reservasi kamar hotel: tamu dapat membuat reservasi, sedangkan staf hotel (Admin / Resepsionis) dapat mengonfirmasi, membatalkan, serta memproses check-in dan check-out. Dibuat untuk projek Mata Kuliah **Pemrograman Berorientasi Objek** dengan pendekatan *Unified Process*.

## 🔗 Live Demo

**https://USERNAME.github.io/hotel-reservasi/** *(ganti USERNAME dengan username GitHub Anda setelah langkah 5)*

Repositori: https://github.com/USERNAME/hotel-reservasi *(ganti USERNAME dengan username GitHub Anda)*

## 🔐 Akun Uji Coba

| Role | Username | Password | Hak akses |
|---|---|---|---|
| Admin | `admin` | `admin123` | Konfirmasi, batalkan, check-in, check-out |
| Resepsionis | `resepsionis` | `resepsionis123` | Konfirmasi, check-in, check-out (**tidak** bisa membatalkan) |
| Tamu | — (tanpa login) | — | Membuat reservasi dan melihat daftar/kamar |

Klik **Login Admin** di pojok kanan atas, lalu masukkan akun di atas.

## ✨ Fitur Utama

- **Dashboard** — ringkasan jumlah reservasi (total, terkonfirmasi, menunggu).
- **Buat Reservasi** — form lengkap: data tamu, tanggal, jumlah tamu, tipe kamar, extra bed, pembayaran, dan permintaan khusus.
- **Daftar Reservasi** — pencarian (ID/nama/telepon), filter status, dan modal detail beserta estimasi total biaya.
- **Katalog Kamar** — 5 tipe kamar dengan harga, kapasitas, dan fasilitas.
- **Admin Panel** — statistik, antrean reservasi menunggu, dan log aktivitas terbaru.
- **Login berbasis role** — hak akses Admin dan Resepsionis berbeda.
- **Alur status reservasi** — `MENUNGGU → DIKONFIRMASI → CHECKIN → CHECKOUT` (atau `DIBATALKAN`), dengan validasi transisi.
- **Data contoh otomatis** — 6 reservasi contoh dibuat saat aplikasi pertama kali dibuka.

## 🧱 Penerapan Konsep OOP

| Konsep | Penerapan |
|---|---|
| **Encapsulation** | Properti `_privat` + getter pada `Tamu`, `Kamar`, `Reservasi`; `#password` (private field) pada `User` |
| **Inheritance** | `Admin` dan `Resepsionis` mewarisi `User`; `KamarSuite` dan `KamarPresidential` mewarisi `Kamar` |
| **Polymorphism** | `izin()` di-override tiap role; `hitungHarga()` di-override tiap tipe kamar |
| **Abstraction / Separation of concerns** | `ReservasiRepository` (penyimpanan), `ReservasiService` (logika bisnis), `AuthService` (autentikasi), `app.js` (UI) |
| **State handling** | Method `konfirmasi()`, `batalkan()`, `checkIn()`, `checkOut()` pada `Reservasi` memvalidasi transisi status |

## 🛠️ Teknologi

- HTML5, CSS3
- JavaScript (ES2022, class-based OOP) tanpa framework
- `localStorage` / `sessionStorage` untuk penyimpanan data dan sesi
- Google Fonts (Inter)

## 📁 Struktur Folder

```
hotel-reservasi/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── models.js         # User, Admin, Resepsionis, Tamu, Kamar (+turunan), Reservasi
│   ├── repository.js     # ReservasiRepository (localStorage)
│   ├── services.js       # AuthService, ReservasiService, data contoh
│   └── app.js            # helper UI, render tabel, event handler
├── .env.example
├── .gitignore
├── README.md
└── laporan.pdf
```

## 💻 Instalasi Lokal

Tidak ada dependensi yang perlu di-install.

```bash
# 1. Clone repositori
git clone https://github.com/USERNAME/hotel-reservasi.git
cd hotel-reservasi

# 2. (Opsional) salin template environment — projek ini tidak membutuhkannya
cp .env.example .env

# 3. Jalankan
# Cara A: buka index.html langsung di browser
# Cara B: jalankan server lokal
npx serve .
# atau: python3 -m http.server 8000   → buka http://localhost:8000
```

## 🚀 Deploy ke GitHub Pages

1. Push ke GitHub (branch `main`).
2. Buka **Settings → Pages**.
3. Pada *Source* pilih branch `main` dan folder `/ (root)`, lalu **Save**.
4. Tunggu 1–2 menit; link akan muncul di halaman yang sama.

## ⚠️ Batasan

- Data tersimpan di `localStorage`, sehingga **bersifat lokal per browser/perangkat**. Reservasi yang dibuat di satu perangkat tidak muncul di perangkat lain.
- Autentikasi dilakukan di sisi klien dan akun uji coba ditulis langsung di kode karena tidak ada backend. Untuk produksi perlu backend dan password ter-hash.
- Untuk mengembalikan data contoh: buka DevTools → Application → Local Storage → hapus key `hotel_reservasi`, lalu muat ulang halaman.

## 📄 Laporan

Laporan singkat (latar belakang, fitur, user flow, screenshot, akun uji coba, dan kontribusi) ada di [`laporan.pdf`](laporan.pdf).

## 👥 Anggota Kelompok

| Nama | NIM | Kontribusi |
|---|---|---|
| Putra Martinus Tafonao | 25210128 | Perancangan kelas, models.js, repository.js |
| Jefri Glen Rembaen | 25210062 | Antarmuka, app.js, style.css |
| Putra Josua Luwunaung | 25210064 | Services.js, pengujian, deploy, laporan |
