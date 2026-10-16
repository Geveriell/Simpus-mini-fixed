/* Daftar Anggota — Jobsheet 6 (tugas mandiri)
   Pola yang sama dengan buku.js, tetapi memakai async/await. */

const URL_ANGGOTA = "../data/anggota.json";

function renderAnggota(daftar) {
    const tbody = document.querySelector(".table-responsive table tbody");
    tbody.innerHTML = "";
    if (window.SimpusGabung) daftar = window.SimpusGabung("anggota", daftar); // + data tambahan

    daftar.forEach(function (anggota) {
        const tr = document.createElement("tr");
        tr.append(
            buatSel(anggota.no_anggota),
            buatSel(anggota.nama),
            buatSel(anggota.alamat),
            buatSel(anggota.no_hp),
            buatTombolAksi()
        );
        tbody.appendChild(tr);
    });
    terapkanFilter();
}

async function muatDaftarAnggota() {
    if (!document.querySelector(".table-responsive table tbody")) return;

    tampilkanLoading(true);
    try {
        await tunda(600); // simulasi delay jaringan

        let daftar;
        try {
            const res = await fetch(URL_ANGGOTA);
            if (!res.ok) throw new Error("status " + res.status);
            daftar = await res.json();
        } catch (err) {
            daftar = ambilCadangan("anggota", err);
        }
        renderAnggota(daftar);
    } catch (err) {
        tampilkanPesanTabel("Gagal memuat data (" + err.message + ").", 5);
    } finally {
        tampilkanLoading(false);
    }
}

document.addEventListener("DOMContentLoaded", muatDaftarAnggota);
