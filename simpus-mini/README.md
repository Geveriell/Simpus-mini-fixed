# SIMPUS-Mini — Proyek Gabungan Jobsheet 1–6

Satu proyek utuh (hasil penyatuan Jobsheet 1–6, termasuk perbaikan). Ekstrak, lalu **double-click `index.html`**.

## Cara menjalankan
- **Langsung (double-click)**: semua halaman jalan. Karena browser memblokir `fetch()` ke file lokal, Daftar Buku/Anggota otomatis memakai data cadangan (`assets/js/data-cadangan.js`) dan menampilkan pemberitahuan kuning.
- **Server lokal (disarankan untuk Jobsheet 6)**: data benar-benar diambil dari `data/*.json`.
  ```bash
  python -m http.server 8000     # atau: php -S localhost:8000  /  VS Code "Live Server"
  ```
  lalu buka http://localhost:8000
- Uji error handling: ubah `URL_BUKU` di `assets/js/buku.js` jadi nama salah (mis. `bukux.json`) dan buka lewat **server lokal** → muncul "Gagal memuat data".

## Struktur
```
index.html  login.html
buku/       list.html  tambah.html
anggota/    list.html  tambah.html
assets/css/ style.css
assets/js/  app.js  buku.js  anggota.js  data-cadangan.js
data/       buku.json  anggota.json
docs/       wireframe.md  Infografis.png   (Jobsheet 4)
```

## Pemetaan ke jobsheet
| JS | Wujud di proyek |
|----|-----------------|
| 1 | HTML semantic (header/nav/main/section/article/footer), nav berisi Beranda, Daftar Buku, Tambah Buku, **Login**; `name` field konsisten (`judul`, `no_anggota`, `no_hp`, …); tugas mandiri: halaman Anggota |
| 2 | `style.css`: box model, Flexbox (navbar), Grid (`.stat-grid` + `.card`), zebra-stripe, hover, label di atas input; kelas yang sama dipakai halaman Anggota |
| 3 | Mobile-first (`min-width`), meta viewport, hamburger <768px, tabel `overflow-x: auto`, kartu 1 kolom → 3 kolom |
| 4 | `docs/wireframe.md` + halaman Login sesuai wireframe (Dashboard/Peminjaman belum diimplementasikan, sesuai jobsheet) |
| 5 | `app.js`: hamburger via toggle class, validasi inline (`<span class="error">`), filter real-time, `confirm()` hapus |
| 6 | `buku.js` (fetch + `.then()`), `anggota.js` (fetch + `async/await`), loading indicator (`setTimeout`), `catch` → "Gagal memuat data" |

## Yang diperbaiki dari kode asli
1. **Navbar tidak konsisten**: halaman Anggota tidak punya "Tambah Buku", halaman Buku tidak punya "Tambah Anggota", dan link **Login** (syarat JS 1) hilang. Kini semua halaman memakai nav yang sama + `aria-current`.
2. **Breakpoint hamburger salah**: kode lama baru aktif di ≤480px, padahal jobsheet 3 meminta <768px (di 481–767px menu meluber). Kini CSS mobile-first dengan breakpoint 768px & 1024px.
3. **Validasi tidak pernah tampil**: atribut `required`/`min`/`max` membuat browser memblokir submit lebih dulu. Ditambah `novalidate`; validasi kini aturan per-`name`, mencakup Buku, Anggota (`no_anggota`, `no_hp`), dan Login; tahun mengikuti tahun berjalan, bukan hardcode 2026.
4. **Filter** kini mencari hanya di kolom judul/nama (sebelumnya seluruh teks baris, termasuk tulisan "Edit/Hapus"); ada pesan "tidak ada data yang cocok".
5. **Render baris tabel** memakai `createElement`/`textContent` (aman dari injeksi HTML), bukan string `innerHTML`.
6. **Pola fetch sesuai jobsheet 6**: satu fungsi memakai `.then()` (buku) dan satu memakai `async/await` (anggota); kode lama hanya async/await.
7. **Angka ringkasan Beranda** disamakan dengan data (10 buku, 4 anggota; sebelumnya 12 dan 8).
8. Selector rapuh `section:nth-of-type(2)` diganti kelas `.stat-grid`/`.card`; tombol memakai kelas `.btn-edit`/`.btn-hapus`; `style="display:none"` inline diganti atribut `hidden`; stok 0 diberi tanda merah (edge case "stok habis" dari Jobsheet 4).
9. Dokumentasi per-jobsheet yang saling menumpuk digantikan README ini; Bootstrap (JS 3 opsional) tidak dicampur agar tidak bentrok dengan `style.css`.

## Login & simpan data tanpa database (tambahan)
File baru: `assets/js/simpus-data.js` (+ hook kecil di `app.js`, `buku.js`, `anggota.js`, dan tag `<script>` di tiap halaman).
- **Login**: akun demo `admin / admin123` atau `petugas / petugas123`. Sesi memakai `sessionStorage`; menu *Login* berubah menjadi *Logout (username)*. Halaman **Tambah Buku/Anggota** mewajibkan login.
- **Tambah data**: disimpan di `localStorage` browser sebagai lapisan di atas `data/*.json` (tetap ada setelah refresh). Ada cek duplikat (judul buku / no. anggota).
- **Hapus**: kini tersimpan juga (tidak muncul lagi setelah refresh). Angka ringkasan Beranda ikut menyesuaikan.
- **Reset data**: hapus data situs di browser (atau `localStorage.clear()` di Console).
- Catatan: akun ada di kode sisi-klien, jadi ini hanya untuk latihan; keamanan login sungguhan butuh server.
