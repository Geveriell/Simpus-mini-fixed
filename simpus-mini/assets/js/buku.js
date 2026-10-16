/* Daftar Buku — Jobsheet 6
   Mengambil data/buku.json dengan fetch + .then() (rantai Promise).
   Versi async/await dari pola yang sama ada di anggota.js. */

const URL_BUKU = "../data/buku.json";

function renderBuku(daftar) {
    const tbody = document.querySelector(".table-responsive table tbody");
    tbody.innerHTML = "";
    if (window.SimpusGabung) daftar = window.SimpusGabung("buku", daftar); // + data tambahan

    daftar.forEach(function (buku) {
        const tr = document.createElement("tr");
        tr.append(
            buatSel(buku.judul),
            buatSel(buku.pengarang),
            buatSel(buku.tahun),
            buatSel(buku.stok, buku.stok === 0 ? "stok-habis" : ""),
            buatTombolAksi()
        );
        tbody.appendChild(tr);
    });
    terapkanFilter(); // hormati kata kunci yang mungkin sudah diketik
}

function muatDaftarBuku() {
    if (!document.querySelector(".table-responsive table tbody")) return;

    tampilkanLoading(true);

    // tunda(600): simulasi delay jaringan agar loading indicator terlihat
    return tunda(600)
        .then(function () { return fetch(URL_BUKU); })
        .then(function (res) {
            if (!res.ok) throw new Error("status " + res.status);
            return res.json();
        })
        .catch(function (err) { return ambilCadangan("buku", err); })
        .then(renderBuku)
        .catch(function (err) {
            tampilkanPesanTabel("Gagal memuat data (" + err.message + ").", 5);
        })
        .finally(function () { tampilkanLoading(false); });
}

document.addEventListener("DOMContentLoaded", muatDaftarBuku);
