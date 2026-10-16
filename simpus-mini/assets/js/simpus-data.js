/* =====================================================================
   SIMPUS-Mini — simpus-data.js  (login + penyimpanan tanpa database)
   Ditambahkan TANPA mengubah inti kode: app.js, buku.js, anggota.js
   hanya memanggil fungsi di sini lewat "hook" kecil.

   - Penyimpanan : localStorage browser (data tetap ada setelah refresh)
   - Sesi login  : sessionStorage (berakhir saat tab ditutup)
   - Data awal   : tetap dari data/*.json; data baru/terhapus disimpan
                   sebagai "lapisan tambahan" di atasnya.
   CATATAN: akun di bawah hanya untuk demo front-end. Kode di browser
   tidak bisa menyimpan password dengan aman; login sungguhan butuh server.
   ===================================================================== */
(function () {
    "use strict";

    /* ---------- Akun demo ---------- */
    var AKUN = [
        { username: "admin",   password: "admin123",   nama: "Administrator" },
        { username: "petugas", password: "petugas123", nama: "Petugas Perpustakaan" }
    ];

    var KUNCI_TAMBAH = { buku: "simpus_buku_tambah",   anggota: "simpus_anggota_tambah" };
    var KUNCI_HAPUS  = { buku: "simpus_buku_hapus",    anggota: "simpus_anggota_hapus" };
    var KUNCI_SESI   = "simpus_sesi";
    var KUNCI_NEXT   = "simpus_next";

    /* ---------- Wrapper storage (aman bila storage diblokir) ---------- */
    function buatStorage(nama) {
        var cadangan = {};
        var asli = null;
        try { asli = window[nama]; asli.setItem("__t", "1"); asli.removeItem("__t"); }
        catch (e) { asli = null; }
        return {
            get: function (k) { return asli ? asli.getItem(k) : (k in cadangan ? cadangan[k] : null); },
            set: function (k, v) { if (asli) asli.setItem(k, v); else cadangan[k] = v; },
            del: function (k) { if (asli) asli.removeItem(k); else delete cadangan[k]; }
        };
    }
    var lokal = buatStorage("localStorage");
    var sesi  = buatStorage("sessionStorage");

    function bacaJSON(store, kunci, awal) {
        try {
            var v = JSON.parse(store.get(kunci));
            return v === null || v === undefined ? awal : v;
        } catch (e) { return awal; }
    }

    /* ---------- Jenis halaman ---------- */
    function jenisHalaman() {
        var p = location.pathname;
        if (p.indexOf("/anggota/") !== -1) return "anggota";
        if (p.indexOf("/buku/") !== -1) return "buku";
        return null;
    }
    function kunciData(jenis, d) {
        return jenis === "buku" ? String(d.judul).trim().toLowerCase()
                                : String(d.no_anggota).trim().toLowerCase();
    }

    /* ---------- Penyimpanan data (lapisan tambahan di atas JSON) ---------- */
    var Store = {
        tambahan: function (jenis) { return bacaJSON(lokal, KUNCI_TAMBAH[jenis], []); },
        terhapus: function (jenis) { return bacaJSON(lokal, KUNCI_HAPUS[jenis], []); },

        // Gabungkan data dasar (JSON) + data tambahan - data terhapus
        gabung: function (jenis, dasar) {
            var hapus = Store.terhapus(jenis);
            var hasil = dasar.filter(function (d) { return hapus.indexOf(kunciData(jenis, d)) === -1; });
            return hasil.concat(Store.tambahan(jenis));
        },

        tambah: function (jenis, data) {
            var daftar = Store.tambahan(jenis);
            daftar.push(data);
            lokal.set(KUNCI_TAMBAH[jenis], JSON.stringify(daftar));
            // bila sebelumnya pernah dihapus, batalkan status terhapusnya
            var k = kunciData(jenis, data);
            var hapus = Store.terhapus(jenis).filter(function (x) { return x !== k; });
            lokal.set(KUNCI_HAPUS[jenis], JSON.stringify(hapus));
        },

        hapus: function (jenis, kunci) {
            kunci = String(kunci).trim().toLowerCase();
            var daftar = Store.tambahan(jenis);
            var sisa = daftar.filter(function (d) { return kunciData(jenis, d) !== kunci; });
            if (sisa.length !== daftar.length) {          // data buatan pengguna
                lokal.set(KUNCI_TAMBAH[jenis], JSON.stringify(sisa));
            } else {                                      // data bawaan JSON
                var hapus = Store.terhapus(jenis);
                if (hapus.indexOf(kunci) === -1) hapus.push(kunci);
                lokal.set(KUNCI_HAPUS[jenis], JSON.stringify(hapus));
            }
        },

        // Selisih jumlah terhadap data bawaan (untuk angka ringkasan Beranda)
        selisih: function (jenis) {
            return Store.tambahan(jenis).length - Store.terhapus(jenis).length;
        }
    };

    /* ---------- Sesi login ---------- */
    var Auth = {
        pengguna: function () { return bacaJSON(sesi, KUNCI_SESI, null); },
        masuk: function (username, password) {
            var u = username.trim().toLowerCase();
            for (var i = 0; i < AKUN.length; i++) {
                if (AKUN[i].username === u && AKUN[i].password === password) {
                    sesi.set(KUNCI_SESI, JSON.stringify({ username: AKUN[i].username, nama: AKUN[i].nama }));
                    return true;
                }
            }
            return false;
        },
        keluar: function () { sesi.del(KUNCI_SESI); }
    };

    /* ---------- Util DOM ---------- */
    function linkLogin() { return document.querySelector('#menu-utama a[href$="login.html"]'); }
    function linkBeranda() { return document.querySelector('#menu-utama a[href$="index.html"]'); }

    function notif(form, teks, galat) {
        var lama = form.querySelector(".notif-sukses");
        if (lama) lama.remove();
        var p = document.createElement("p");
        p.className = "notif-sukses";
        p.setAttribute("role", "status");
        if (galat) p.style.color = "#b00020";
        p.textContent = teks;
        form.appendChild(p);
    }

    /* ---------- Guard: halaman tambah wajib login ---------- */
    function jagaHalaman() {
        if (!/\/tambah\.html$/.test(location.pathname)) return;
        if (Auth.pengguna()) return;
        var tujuan = linkLogin();
        if (!tujuan) return;
        sesi.set(KUNCI_NEXT, location.href);
        location.replace(tujuan.getAttribute("href"));
    }

    /* ---------- Nav: Login <-> Logout ---------- */
    function perbaruiNav() {
        var a = linkLogin();
        var user = Auth.pengguna();
        if (!a || !user) return;
        a.textContent = "Logout (" + user.username + ")";
        a.removeAttribute("aria-current");
        a.addEventListener("click", function (e) {
            e.preventDefault();
            Auth.keluar();
            var beranda = linkBeranda();
            location.href = beranda ? beranda.getAttribute("href") : a.getAttribute("href");
        });
    }

    /* ---------- Info "sudah login" di halaman login ---------- */
    function infoSudahLogin() {
        var form = document.getElementById("form-tambah");
        if (!form || !form.querySelector("[name='username']")) return;
        var user = Auth.pengguna();
        if (user) notif(form, "Anda sudah login sebagai " + user.username + ".");
        else {
            var petunjuk = document.createElement("p");
            petunjuk.className = "intro";
            petunjuk.textContent = "Akun demo: admin / admin123  atau  petugas / petugas123.";
            form.insertAdjacentElement("beforebegin", petunjuk);
        }
    }

    /* ---------- Ambil data dasar (untuk cek duplikat) ---------- */
    function ambilDasar(jenis) {
        var url = "../data/" + jenis + ".json";
        return fetch(url)
            .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
            .catch(function () {
                var c = window.DATA_CADANGAN && window.DATA_CADANGAN[jenis];
                return Array.isArray(c) ? c : [];
            });
    }

    function nilai(form, nama) {
        var el = form.querySelector("[name='" + nama + "']");
        return el ? el.value.trim() : "";
    }

    /* ---------- Hook dari app.js: dipanggil setelah validasi lolos ----------
       Return true  = form sudah ditangani di sini (app.js tidak perlu apa-apa).
       Return false = bukan form yang dikenal -> perilaku asli app.js. */
    function tanganiForm(form) {
        // --- LOGIN ---
        if (form.querySelector("[name='username']")) {
            var inUser = form.querySelector("[name='username']");
            var inPass = form.querySelector("[name='password']");
            if (!Auth.masuk(inUser.value, inPass.value)) {
                tampilkanError(inPass, "Username atau password salah.");
                inPass.focus();
                return true;
            }
            notif(form, "Login berhasil. Mengalihkan...");
            var next = sesi.get(KUNCI_NEXT);
            sesi.del(KUNCI_NEXT);
            var beranda = linkBeranda();
            var tujuan = next || (beranda ? beranda.getAttribute("href") : "index.html");
            setTimeout(function () { location.href = tujuan; }, 600);
            return true;
        }

        // --- TAMBAH BUKU / ANGGOTA ---
        var jenis = form.querySelector("[name='judul']") ? "buku"
                  : form.querySelector("[name='no_anggota']") ? "anggota" : null;
        if (!jenis) return false;

        if (!Auth.pengguna()) { jagaHalaman(); notif(form, "Silakan login terlebih dahulu.", true); return true; }

        var data, inputKunci;
        if (jenis === "buku") {
            data = {
                judul: nilai(form, "judul"),
                pengarang: nilai(form, "pengarang"),
                tahun: Number(nilai(form, "tahun")),
                stok: Number(nilai(form, "stok")),
                isbn: nilai(form, "isbn"),
                kategori: nilai(form, "kategori")
            };
            inputKunci = form.querySelector("[name='judul']");
        } else {
            data = {
                no_anggota: nilai(form, "no_anggota"),
                nama: nilai(form, "nama"),
                alamat: nilai(form, "alamat"),
                no_hp: nilai(form, "no_hp")
            };
            inputKunci = form.querySelector("[name='no_anggota']");
        }

        ambilDasar(jenis).then(function (dasar) {
            var ada = Store.gabung(jenis, dasar).some(function (d) {
                return kunciData(jenis, d) === kunciData(jenis, data);
            });
            if (ada) {
                tampilkanError(inputKunci, jenis === "buku"
                    ? "Buku dengan judul ini sudah ada."
                    : "No. anggota sudah terdaftar.");
                inputKunci.focus();
                return;
            }
            Store.tambah(jenis, data);
            form.reset();
            notif(form, (jenis === "buku" ? "Buku" : "Anggota") + " \"" +
                (jenis === "buku" ? data.judul : data.nama) + "\" berhasil disimpan.");
        });
        return true;
    }

    /* ---------- Angka ringkasan Beranda ---------- */
    function perbaruiBeranda() {
        var kartu = document.querySelectorAll(".stat-grid .card p");
        if (kartu.length < 2) return;
        [["buku", 0], ["anggota", 1]].forEach(function (x) {
            var n = parseInt(kartu[x[1]].textContent, 10);
            if (!isNaN(n)) kartu[x[1]].textContent = Math.max(0, n + Store.selisih(x[0]));
        });
    }

    /* ---------- Publik ---------- */
    window.SimpusStore = Store;
    window.SimpusAuth = Auth;
    window.SimpusForm = { tangani: tanganiForm };
    window.SimpusHapus = function (baris) {          // dipanggil app.js saat hapus dikonfirmasi
        var jenis = jenisHalaman();
        var sel = baris && baris.querySelector("td");
        if (jenis && sel) Store.hapus(jenis, sel.textContent);
    };
    window.SimpusGabung = function (jenis, daftar) { return Store.gabung(jenis, daftar); };

    jagaHalaman();
    document.addEventListener("DOMContentLoaded", function () {
        perbaruiNav();
        infoSudahLogin();
        perbaruiBeranda();
    });
})();
