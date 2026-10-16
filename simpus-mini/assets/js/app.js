/* =====================================================================
   SIMPUS-Mini — app.js (dimuat di semua halaman)
   Jobsheet 5: hamburger, validasi form, filter tabel, konfirmasi hapus
   Jobsheet 6: helper bersama untuk fetch (dipakai buku.js & anggota.js)
   ===================================================================== */

/* ---------- Hamburger menu (toggle class lewat JS) ---------- */
function initNavToggle() {
    const tombol = document.getElementById("nav-toggle-btn");
    const nav = document.getElementById("menu-utama");
    if (!tombol || !nav) return;

    tombol.addEventListener("click", function () {
        const terbuka = nav.classList.toggle("nav-open");
        tombol.setAttribute("aria-expanded", String(terbuka));
        tombol.setAttribute("aria-label", terbuka ? "Tutup menu" : "Buka menu");
    });
}

/* ---------- Konfirmasi hapus (front-end saja) ----------
   Memakai event delegation: baris tabel dibuat dinamis oleh fetch (Jobsheet 6),
   jadi tombol .btn-hapus belum ada saat DOMContentLoaded. */
function initHapusConfirm() {
    document.addEventListener("click", function (e) {
        const tombol = e.target.closest(".btn-hapus");
        if (!tombol) return;

        const baris = tombol.closest("tr");
        const sel = baris ? baris.querySelector("td") : null;
        const nama = sel ? sel.textContent : "data ini";
        if (confirm('Yakin ingin menghapus "' + nama + '"?')) {
            if (window.SimpusHapus) window.SimpusHapus(baris); // simpan penghapusan (localStorage)
            baris.remove();
            perbaruiPesanKosong();
        }
    });
}

/* ---------- Filter tabel real-time (keyup + style.display) ----------
   Kolom yang dicari ditentukan atribut data-kolom pada input
   (0 = Judul pada Daftar Buku, 1 = Nama pada Daftar Anggota). */
function terapkanFilter() {
    const input = document.getElementById("search-input");
    const tabel = document.querySelector(".table-responsive table");
    if (!input || !tabel) return;

    const kolom = parseInt(input.dataset.kolom || "0", 10);
    const kata = input.value.trim().toLowerCase();

    tabel.querySelectorAll("tbody tr").forEach(function (baris) {
        const sel = baris.cells[kolom];
        const teks = sel ? sel.textContent.toLowerCase() : "";
        baris.style.display = teks.includes(kata) ? "" : "none";
    });
    perbaruiPesanKosong();
}

function perbaruiPesanKosong() {
    const pesan = document.getElementById("pesan-kosong");
    const tabel = document.querySelector(".table-responsive table");
    if (!pesan || !tabel) return;

    const baris = tabel.querySelectorAll("tbody tr");
    const tampil = Array.from(baris).filter(function (b) {
        return b.style.display !== "none";
    });
    // Jangan tampilkan "tidak ada data" saat tabel memang belum terisi (masih loading / error)
    pesan.hidden = baris.length === 0 || tampil.length > 0;
}

function initTableFilter() {
    const input = document.getElementById("search-input");
    if (!input) return;
    input.addEventListener("keyup", terapkanFilter);
    input.addEventListener("input", terapkanFilter); // juga menangani tombol "x" pada input search
}

/* ---------- Validasi form (client-side, tanpa reload) ----------
   Aturan per field memakai atribut name — sama dengan name yang akan dipakai di PHP. */
const TAHUN_MIN = 1900;
const TAHUN_MAX = new Date().getFullYear();

const ATURAN = {
    judul:      { wajib: "Judul wajib diisi." },
    pengarang:  { wajib: "Pengarang wajib diisi." },
    tahun: {
        wajib: "Tahun terbit wajib diisi.",
        cek: function (v) {
            const n = Number(v);
            if (!Number.isInteger(n) || n < TAHUN_MIN || n > TAHUN_MAX) {
                return "Tahun harus antara " + TAHUN_MIN + " dan " + TAHUN_MAX + ".";
            }
        }
    },
    stok: {
        wajib: "Stok wajib diisi.",
        cek: function (v) {
            const n = Number(v);
            if (!Number.isInteger(n) || n < 0) return "Stok harus bilangan bulat tidak negatif.";
        }
    },
    nama:       { wajib: "Nama wajib diisi." },
    no_anggota: { wajib: "No. anggota wajib diisi." },
    no_hp: {
        cek: function (v) {
            if (v !== "" && !/^[0-9+\-\s]{8,15}$/.test(v)) return "No. HP tidak valid (8-15 digit).";
        }
    },
    username:   { wajib: "Username wajib diisi." },
    password: {
        wajib: "Password wajib diisi.",
        cek: function (v) {
            if (v.length < 6) return "Password minimal 6 karakter.";
        }
    }
};

function hapusError(input) {
    const berikut = input.nextElementSibling;
    if (berikut && berikut.classList.contains("error")) berikut.remove();
    input.classList.remove("input-error");
    input.removeAttribute("aria-invalid");
}

function tampilkanError(input, pesan) {
    hapusError(input);
    const span = document.createElement("span");
    span.className = "error";
    span.textContent = pesan;
    input.classList.add("input-error");
    input.setAttribute("aria-invalid", "true");
    input.insertAdjacentElement("afterend", span);
}

function validasiField(input) {
    const aturan = ATURAN[input.name];
    if (!aturan) return true;

    const nilai = input.value.trim();
    let pesan = "";
    if (aturan.wajib && nilai === "") {
        pesan = aturan.wajib;
    } else if (aturan.cek) {
        pesan = aturan.cek(nilai) || "";
    }

    if (pesan) {
        tampilkanError(input, pesan);
        return false;
    }
    hapusError(input);
    return true;
}

function initValidasiForm() {
    const form = document.getElementById("form-tambah");
    if (!form) return;

    // Batas tahun pada atribut HTML mengikuti tahun berjalan
    const tahun = form.querySelector("[name='tahun']");
    if (tahun) tahun.max = TAHUN_MAX;

    // Hilangkan pesan error segera setelah pengguna memperbaiki isian
    form.addEventListener("input", function (e) {
        if (e.target.name in ATURAN && e.target.classList.contains("input-error")) {
            validasiField(e.target);
        }
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const lama = form.querySelector(".notif-sukses");
        if (lama) lama.remove();

        let valid = true;
        form.querySelectorAll("input, select").forEach(function (el) {
            if (!validasiField(el)) valid = false;
        });

        if (!valid) {
            const pertama = form.querySelector(".input-error");
            if (pertama) pertama.focus();
            return;
        }

        // Hook simpus-data.js: login & simpan data ke localStorage (tanpa database)
        if (window.SimpusForm && window.SimpusForm.tangani(form)) return;

        // Belum ada server: data belum disimpan. Pada jobsheet back-end,
        // bagian ini diganti dengan pengiriman form ke PHP (method="post" action="...").
        const notif = document.createElement("p");
        notif.className = "notif-sukses";
        notif.setAttribute("role", "status");
        notif.textContent = "Data valid. (Belum disimpan ke database — back-end dibuat pada jobsheet berikutnya.)";
        form.appendChild(notif);
        form.reset();
    });
}

/* ---------- Helper fetch (Jobsheet 6) ---------- */
function tunda(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function tampilkanLoading(aktif) {
    const el = document.getElementById("loading-indicator");
    if (el) el.hidden = !aktif;
}

// Membuat <td> berisi teks (textContent => aman dari injeksi HTML)
function buatSel(teks, kelas) {
    const td = document.createElement("td");
    td.textContent = teks;
    if (kelas) td.className = kelas;
    return td;
}

function buatTombolAksi() {
    const td = document.createElement("td");
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "btn btn-edit";
    edit.textContent = "Edit"; // belum berfungsi
    const hapus = document.createElement("button");
    hapus.type = "button";
    hapus.className = "btn btn-hapus";
    hapus.textContent = "Hapus";
    td.append(edit, " ", hapus);
    return td;
}

function tampilkanPesanTabel(pesan, jumlahKolom) {
    const tbody = document.querySelector(".table-responsive table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = jumlahKolom;
    td.className = "pesan-error";
    td.textContent = pesan;
    tr.appendChild(td);
    tbody.appendChild(tr);
}

/* Bila halaman dibuka lewat file:// browser memblokir fetch().
   Hanya pada kondisi itu, pakai data cadangan (assets/js/data-cadangan.js)
   dan beri tahu pengguna. Lewat http:// (server lokal) error fetch tetap
   ditampilkan apa adanya — jadi uji "salah ketik nama file" bekerja normal. */
function ambilCadangan(kunci, galat) {
    const bolehCadangan = location.protocol === "file:" &&
        window.DATA_CADANGAN && Array.isArray(window.DATA_CADANGAN[kunci]);
    if (!bolehCadangan) throw galat;

    const info = document.getElementById("info-cadangan");
    if (info) {
        info.textContent = "Halaman dibuka lewat file://, jadi fetch() diblokir browser. " +
            "Menampilkan data cadangan. Jalankan lewat server lokal (lihat README) untuk memakai data/" + kunci + ".json.";
        info.hidden = false;
    }
    return window.DATA_CADANGAN[kunci];
}

document.addEventListener("DOMContentLoaded", function () {
    initNavToggle();
    initHapusConfirm();
    initTableFilter();
    initValidasiForm();
});
