const supabaseClient = window.supabaseClient;

const formTransaksi = document.getElementById("formTransaksi");
const tombolSimpan = document.getElementById("tombolSimpan");
const tombolBatalEdit = document.getElementById("tombolBatalEdit");
const tombolTransaksiBaru = document.getElementById("tombolTransaksiBaru");
const tombolLihatSemua = document.getElementById("tombolLihatSemua");
const pilihanKategori = document.getElementById("jenisKas");
formTransaksi.id = "formPanel";
document.getElementById("dashboardFormSlot").append(formTransaksi);
const formatRupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
});

let pegawai = [];
let pelanggan = [];
let jenisKas = [];
let transaksiData = [];
let transaksiSedangDiedit = null;
let transaksiLaporan = [];
let laporanRentangAktif = false;
const kategoriTetap = {
    Masuk: ["Layanan Cukur", "Penjualan Produk", "Modal Pemilik", "Lainnya"],
    Keluar: ["Gaji Barber", "Sewa Tempat", "Perlengkapan Cukur", "Operasional", "Listrik & Internet", "Lainnya"]
};

function tampilkanHalaman(namaHalaman) {
    const halaman = namaHalaman === "transaksi" ? "dashboard" : namaHalaman;
    document.getElementById("dashboardView").hidden = halaman !== "dashboard";
    document.getElementById("transaksiView").hidden = halaman !== "riwayat";
    document.getElementById("laporanView").hidden = halaman !== "laporan";

    const judul = {
        dashboard: "Kas Barbershop",
        transaksi: "Tambah Transaksi",
        riwayat: "Riwayat Transaksi",
        laporan: "Laporan Kas"
    };
    document.getElementById("judulHalaman").textContent = judul[namaHalaman] || judul.dashboard;

    document.querySelectorAll(".side-link").forEach((button) => {
        const aktif = button.dataset.view === namaHalaman;
        button.classList.toggle("aktif", aktif);
        if (aktif) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
    });

    if (namaHalaman === "transaksi") {
        document.getElementById("formPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function tanggalHariIni() {
    const sekarang = new Date();
    const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
    const hari = String(sekarang.getDate()).padStart(2, "0");
    return `${sekarang.getFullYear()}-${bulan}-${hari}`;
}

function tampilkanError(error) {
    console.error(error);
    alert(`Terjadi kesalahan: ${error.message || error}`);
}

async function muatDataReferensi() {
    const [hasilPegawai, hasilPelanggan, hasilJenisKas] = await Promise.all([
        supabaseClient.from("pegawai").select("id_pegawai,nama_pegawai,jabatan").order("nama_pegawai"),
        supabaseClient.from("pelanggan").select("id_pelanggan,nama_pelanggan,no_hp").order("nama_pelanggan"),
        supabaseClient.from("jenis_kas").select("id_jenis_kas,nama_jenis,tipe").order("nama_jenis")
    ]);

    if (hasilPegawai.error) throw hasilPegawai.error;
    if (hasilPelanggan.error) throw hasilPelanggan.error;
    if (hasilJenisKas.error) throw hasilJenisKas.error;

    pegawai = hasilPegawai.data;
    pelanggan = hasilPelanggan.data;
    jenisKas = hasilJenisKas.data;
    isiPilihanKategori();
    isiFilterKategori();
}

function tipeKasTerpilih() {
    return document.querySelector('input[name="tipeKas"]:checked')?.value || "Masuk";
}

function isiPilihanKategori(terpilih = "") {
    const tipe = tipeKasTerpilih();
    pilihanKategori.replaceChildren(new Option("-- Pilih Kategori --", ""));
    kategoriTetap[tipe].forEach((nama) => {
        const tersimpan = jenisKas.find((item) => item.tipe === tipe && item.nama_jenis === nama);
        pilihanKategori.add(new Option(nama, tersimpan?.id_jenis_kas ?? nama));
    });
    pilihanKategori.value = terpilih;
}

function isiFilterKategori() {
    const filter = document.getElementById("filterKategori");
    const pilihanSebelumnya = filter.value;
    filter.replaceChildren(new Option("Semua Kategori", ""));
    jenisKas.forEach((item) => filter.add(new Option(`${item.nama_jenis} (${item.tipe})`, item.id_jenis_kas)));
    filter.value = pilihanSebelumnya;
}

async function dapatkanAtauBuatPegawai(nama, jabatan) {
    const { data: pegawaiAda, error: errorCari } = await supabaseClient
        .from("pegawai")
        .select("id_pegawai,nama_pegawai,jabatan")
        .eq("nama_pegawai", nama)
        .eq("jabatan", jabatan)
        .limit(1)
        .maybeSingle();

    if (errorCari) throw errorCari;
    if (pegawaiAda) return pegawaiAda.id_pegawai;

    const { data: pegawaiBaru, error: errorTambah } = await supabaseClient
        .from("pegawai")
        .insert({ nama_pegawai: nama, jabatan })
        .select("id_pegawai,nama_pegawai,jabatan")
        .single();

    if (errorTambah) throw errorTambah;
    pegawai.push(pegawaiBaru);
    return pegawaiBaru.id_pegawai;
}

async function dapatkanAtauBuatPelanggan(nama, noHp) {
    if (!nama) return null;

    let pencarian = supabaseClient
        .from("pelanggan")
        .select("id_pelanggan,nama_pelanggan,no_hp")
        .eq("nama_pelanggan", nama);

    if (noHp) pencarian = pencarian.eq("no_hp", noHp);

    const { data: pelangganAda, error: errorCari } = await pencarian.limit(1).maybeSingle();
    if (errorCari) throw errorCari;
    if (pelangganAda) return pelangganAda.id_pelanggan;

    const { data: pelangganBaru, error: errorTambah } = await supabaseClient
        .from("pelanggan")
        .insert({ nama_pelanggan: nama, no_hp: noHp || null })
        .select("id_pelanggan,nama_pelanggan,no_hp")
        .single();

    if (errorTambah) throw errorTambah;
    pelanggan.push(pelangganBaru);
    return pelangganBaru.id_pelanggan;
}

async function dapatkanAtauBuatJenisKas(nama, tipe) {
    const { data: jenisAda, error: errorCari } = await supabaseClient
        .from("jenis_kas")
        .select("id_jenis_kas,nama_jenis,tipe")
        .eq("nama_jenis", nama)
        .eq("tipe", tipe)
        .limit(1)
        .maybeSingle();

    if (errorCari) throw errorCari;
    if (jenisAda) return jenisAda.id_jenis_kas;

    const { data: jenisBaru, error: errorTambah } = await supabaseClient
        .from("jenis_kas")
        .insert({ nama_jenis: nama, tipe })
        .select("id_jenis_kas,nama_jenis,tipe")
        .single();

    if (errorTambah) throw errorTambah;
    jenisKas.push(jenisBaru);
    isiFilterKategori();
    return jenisBaru.id_jenis_kas;
}

function buatSel(nilai) {
    const cell = document.createElement("td");
    cell.textContent = nilai ?? "-";
    return cell;
}

async function muatTransaksi() {
    const { data, error } = await supabaseClient
        .from("transaksi")
        .select("id_transaksi,tanggal,id_pegawai,id_pelanggan,id_jenis_kas,keterangan,jumlah")
        .order("tanggal", { ascending: false })
        .order("id_transaksi", { ascending: false });

    if (error) throw error;

    transaksiData = data;
    const pegawaiById = new Map(pegawai.map((row) => [row.id_pegawai, row.nama_pegawai]));
    const pelangganById = new Map(pelanggan.map((row) => [row.id_pelanggan, row.nama_pelanggan]));
    const jenisKasById = new Map(jenisKas.map((row) => [row.id_jenis_kas, row]));
    const tbody = document.getElementById("tabelTransaksi");
    const tbodyTerbaru = document.getElementById("tabelTerbaru");
    const baris = document.createDocumentFragment();
    const barisTerbaru = document.createDocumentFragment();
    const pencarian = document.getElementById("cariTransaksi").value.trim().toLocaleLowerCase("id-ID");
    const tipeFilter = document.getElementById("filterTipe").value;
    const kategoriFilter = document.getElementById("filterKategori").value;
    const transaksiTampil = data.filter((transaksi) => {
        const jenis = jenisKasById.get(transaksi.id_jenis_kas);
        const pegawaiNama = pegawaiById.get(transaksi.id_pegawai) || "";
        const pelangganNama = pelangganById.get(transaksi.id_pelanggan) || "";
        const teks = `${transaksi.keterangan || ""} ${jenis?.nama_jenis || ""} ${pegawaiNama} ${pelangganNama}`.toLocaleLowerCase("id-ID");
        return (!pencarian || teks.includes(pencarian))
            && (!tipeFilter || jenis?.tipe === tipeFilter)
            && (!kategoriFilter || String(transaksi.id_jenis_kas) === kategoriFilter);
    });
    const idTampil = new Set(transaksiTampil.map((row) => row.id_transaksi));
    let kasMasuk = 0;
    let kasKeluar = 0;

    data.forEach((transaksi, index) => {
        const jenis = jenisKasById.get(transaksi.id_jenis_kas);
        const jumlah = Number(transaksi.jumlah);

        if (jenis?.tipe === "Masuk") kasMasuk += jumlah;
        if (jenis?.tipe === "Keluar") kasKeluar += jumlah;

        if (index < 5) {
            const recentRow = document.createElement("tr");
            [
                transaksi.tanggal,
                jenis ? `${jenis.nama_jenis} (${jenis.tipe})` : "-",
                transaksi.keterangan,
                formatRupiah.format(jumlah)
            ].forEach((value) => recentRow.append(buatSel(value)));
            barisTerbaru.append(recentRow);
        }

        if (!idTampil.has(transaksi.id_transaksi)) return;

        const row = document.createElement("tr");
        [
            index + 1,
            transaksi.tanggal,
            pegawaiById.get(transaksi.id_pegawai),
            pelangganById.get(transaksi.id_pelanggan),
            jenis ? `${jenis.nama_jenis} (${jenis.tipe})` : "-",
            transaksi.keterangan,
            formatRupiah.format(jumlah)
        ].forEach((value) => row.append(buatSel(value)));

        const actionCell = document.createElement("td");
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit";
        editButton.dataset.action = "edit";
        editButton.dataset.id = transaksi.id_transaksi;
        editButton.textContent = "Edit";
        actionCell.append(editButton);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "hapus";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = transaksi.id_transaksi;
        deleteButton.textContent = "Hapus";
        deleteButton.setAttribute("aria-label", `Hapus transaksi tanggal ${transaksi.tanggal}`);
        actionCell.append(deleteButton);
        row.append(actionCell);
        baris.append(row);
    });

    tbody.replaceChildren(baris);
    if (data.length === 0) {
        const emptyRow = document.createElement("tr");
        const emptyCell = buatSel("Belum ada transaksi");
        emptyCell.colSpan = 4;
        emptyRow.append(emptyCell);
        barisTerbaru.append(emptyRow);
    }
    tbodyTerbaru.replaceChildren(barisTerbaru);
    document.getElementById("kasMasuk").textContent = formatRupiah.format(kasMasuk);
    document.getElementById("kasKeluar").textContent = formatRupiah.format(kasKeluar);
    document.getElementById("saldo").textContent = formatRupiah.format(kasMasuk - kasKeluar);
    document.getElementById("jumlahTransaksi").textContent = data.length.toLocaleString("id-ID");
    document.getElementById("ringkasanMasuk").textContent = formatRupiah.format(kasMasuk);
    document.getElementById("ringkasanKeluar").textContent = formatRupiah.format(kasKeluar);
    const penggunaan = kasMasuk > 0 ? Math.min(100, Math.round((kasKeluar / kasMasuk) * 100)) : 0;
    document.getElementById("persentasePenggunaan").textContent = `${penggunaan}%`;
    document.getElementById("barPenggunaan").style.width = `${penggunaan}%`;
    document.getElementById("jumlahHasilRiwayat").textContent = `Menampilkan ${transaksiTampil.length} dari ${data.length} transaksi`;
    renderLaporan(data, laporanRentangAktif);
}

function renderLaporan(data, gunakanRentangTanggal = false) {
    const tanggalMulai = document.getElementById("tanggalMulai").value;
    const tanggalAkhir = document.getElementById("tanggalAkhir").value;
    transaksiLaporan = gunakanRentangTanggal
        ? data.filter((item) => (!tanggalMulai || item.tanggal >= tanggalMulai)
            && (!tanggalAkhir || item.tanggal <= tanggalAkhir))
        : [...data];

    const jenisKasById = new Map(jenisKas.map((row) => [row.id_jenis_kas, row]));
    let kasMasuk = 0;
    let kasKeluar = 0;
    const tbody = document.getElementById("tabelLaporan");
    const rows = document.createDocumentFragment();

    transaksiLaporan.forEach((item, index) => {
        const jenis = jenisKasById.get(item.id_jenis_kas);
        const jumlah = Number(item.jumlah);
        if (jenis?.tipe === "Masuk") kasMasuk += jumlah;
        if (jenis?.tipe === "Keluar") kasKeluar += jumlah;

        const row = document.createElement("tr");
        [index + 1, item.tanggal, jenis?.tipe || "-", jenis?.nama_jenis || "-", item.keterangan, formatRupiah.format(jumlah)]
            .forEach((value) => row.append(buatSel(value)));
        rows.append(row);
    });

    if (transaksiLaporan.length === 0) {
        const row = document.createElement("tr");
        const cell = buatSel("Belum ada data laporan");
        cell.colSpan = 6;
        row.append(cell);
        rows.append(row);
    }

    tbody.replaceChildren(rows);
    document.getElementById("laporanMasuk").textContent = formatRupiah.format(kasMasuk);
    document.getElementById("laporanKeluar").textContent = formatRupiah.format(kasKeluar);
    document.getElementById("laporanSaldo").textContent = formatRupiah.format(kasMasuk - kasKeluar);
    document.getElementById("laporanJumlah").textContent = transaksiLaporan.length.toLocaleString("id-ID");
}

function ubahRentangLaporan() {
    const tanggalMulai = document.getElementById("tanggalMulai").value;
    const tanggalAkhir = document.getElementById("tanggalAkhir").value;
    if (tanggalMulai && tanggalAkhir && tanggalMulai > tanggalAkhir) {
        alert("Tanggal mulai tidak boleh melewati tanggal akhir.");
        return;
    }
    laporanRentangAktif = true;
    renderLaporan(transaksiData, true);
}

function mulaiEditTransaksi(id) {
    const transaksi = transaksiData.find((row) => String(row.id_transaksi) === String(id));
    if (!transaksi) throw new Error("Transaksi tidak ditemukan. Muat ulang halaman.");

    const pegawaiTransaksi = pegawai.find((row) => row.id_pegawai === transaksi.id_pegawai);
    const pelangganTransaksi = pelanggan.find((row) => row.id_pelanggan === transaksi.id_pelanggan);
    const jenisTransaksi = jenisKas.find((row) => row.id_jenis_kas === transaksi.id_jenis_kas);

    document.getElementById("tanggal").value = transaksi.tanggal;
    document.getElementById("namaPegawai").value = pegawaiTransaksi?.nama_pegawai || "";
    document.getElementById("jabatanPegawai").value = pegawaiTransaksi?.jabatan || "";
    document.getElementById("namaPelanggan").value = pelangganTransaksi?.nama_pelanggan || "";
    document.getElementById("noHpPelanggan").value = pelangganTransaksi?.no_hp || "";
    document.querySelector(`input[name="tipeKas"][value="${jenisTransaksi?.tipe || "Masuk"}"]`).checked = true;
    isiPilihanKategori(String(transaksi.id_jenis_kas));
    document.getElementById("keterangan").value = transaksi.keterangan || "";
    document.getElementById("jumlah").value = transaksi.jumlah;

    transaksiSedangDiedit = transaksi.id_transaksi;
    tampilkanHalaman("transaksi");
    tombolSimpan.textContent = "Simpan Perubahan";
    tombolBatalEdit.hidden = false;
    formTransaksi.scrollIntoView({ behavior: "smooth", block: "start" });
}

function batalEditTransaksi() {
    transaksiSedangDiedit = null;
    formTransaksi.reset();
    document.querySelector('input[name="tipeKas"][value="Masuk"]').checked = true;
    isiPilihanKategori();
    document.getElementById("tanggal").value = tanggalHariIni();
    tombolSimpan.textContent = "Simpan Transaksi";
    tombolBatalEdit.hidden = true;
}

async function simpanTransaksi(event) {
    event.preventDefault();

    const fieldTidakValid = Array.from(formTransaksi.elements)
        .find((field) => field.id && !field.checkValidity());

    if (fieldTidakValid) {
        const namaField = {
            tanggal: "Tanggal",
            namaPegawai: "Nama Pegawai",
            jabatanPegawai: "Jabatan Pegawai",
            jenisKas: "Kategori",
            jumlah: "Jumlah"
        }[fieldTidakValid.id] || "Formulir";

        alert(`${namaField} wajib diisi dengan nilai yang valid.`);
        fieldTidakValid.focus();
        return;
    }

    tombolSimpan.disabled = true;

    try {
        const namaPegawai = document.getElementById("namaPegawai").value.trim();
        const jabatanPegawai = document.getElementById("jabatanPegawai").value.trim();
        const namaPelanggan = document.getElementById("namaPelanggan").value.trim();
        const noHpPelanggan = document.getElementById("noHpPelanggan").value.trim();
        const tipeKas = tipeKasTerpilih();
        const nilaiKategori = pilihanKategori.value;
        const kategoriTersimpan = jenisKas.find((item) =>
            String(item.id_jenis_kas) === nilaiKategori && item.tipe === tipeKas
        );
        const namaJenisKas = kategoriTersimpan?.nama_jenis || nilaiKategori;

        if (!namaPegawai || !jabatanPegawai) {
            throw new Error("Nama dan jabatan pegawai wajib diisi.");
        }
        if (!kategoriTetap[tipeKas].includes(namaJenisKas)) {
            throw new Error("Pilih salah satu kategori yang tersedia.");
        }

        const idPegawai = await dapatkanAtauBuatPegawai(namaPegawai, jabatanPegawai);
        const idPelanggan = await dapatkanAtauBuatPelanggan(namaPelanggan, noHpPelanggan);
        const idJenisKas = kategoriTersimpan
            ? kategoriTersimpan.id_jenis_kas
            : await dapatkanAtauBuatJenisKas(namaJenisKas, tipeKas);
        const payload = {
            tanggal: document.getElementById("tanggal").value,
            id_pegawai: idPegawai,
            id_pelanggan: idPelanggan,
            id_jenis_kas: idJenisKas,
            keterangan: document.getElementById("keterangan").value.trim() || null,
            jumlah: Number(document.getElementById("jumlah").value)
        };

        const permintaanSimpan = transaksiSedangDiedit === null
            ? supabaseClient.from("transaksi").insert(payload)
            : supabaseClient.from("transaksi").update(payload)
                .eq("id_transaksi", transaksiSedangDiedit);
        const { data: transaksiTersimpan, error } = await permintaanSimpan
            .select("id_transaksi")
            .single();

        if (error) throw error;
        if (!transaksiTersimpan) throw new Error("Transaksi tidak berhasil disimpan.");

        batalEditTransaksi();
        await muatTransaksi();
        tampilkanHalaman("dashboard");
    } catch (error) {
        tampilkanError(error);
    } finally {
        tombolSimpan.disabled = false;
    }
}

async function hapusTransaksi(id) {
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return false;

    const { data, error } = await supabaseClient
        .from("transaksi")
        .delete()
        .eq("id_transaksi", id)
        .select("id_transaksi")
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Transaksi tidak terhapus. Periksa izin DELETE di Supabase.");
    await muatTransaksi();
    return true;
}

formTransaksi.addEventListener("submit", simpanTransaksi);
document.getElementById("tabelTransaksi").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action][data-id]");
    if (!button) return;

    if (button.dataset.action === "edit") {
        try {
            mulaiEditTransaksi(button.dataset.id);
        } catch (error) {
            tampilkanError(error);
        }
        return;
    }

    button.disabled = true;
    try {
        const deleted = await hapusTransaksi(button.dataset.id);
        if (!deleted) button.disabled = false;
    } catch (error) {
        tampilkanError(error);
        button.disabled = false;
    }
});

tombolBatalEdit.addEventListener("click", batalEditTransaksi);
document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => tampilkanHalaman(button.dataset.view));
});
tombolTransaksiBaru.addEventListener("click", () => tampilkanHalaman("transaksi"));
document.getElementById("tombolLihatSemua").addEventListener("click", () => tampilkanHalaman("riwayat"));

document.querySelectorAll('input[name="tipeKas"]').forEach((radio) => {
    radio.addEventListener("change", () => isiPilihanKategori());
});
pilihanKategori.addEventListener("change", () => {
    if (!kategoriTetap[tipeKasTerpilih()].includes(pilihanKategori.value)
        && !/^\d+$/.test(pilihanKategori.value)) {
        pilihanKategori.value = "";
    }
});

let timerFilter;
function jadwalkanFilterRiwayat() {
    clearTimeout(timerFilter);
    timerFilter = setTimeout(() => muatTransaksi().catch(tampilkanError), 250);
}
document.getElementById("cariTransaksi").addEventListener("input", jadwalkanFilterRiwayat);
document.getElementById("filterTipe").addEventListener("change", jadwalkanFilterRiwayat);
document.getElementById("filterKategori").addEventListener("change", jadwalkanFilterRiwayat);

document.getElementById("tombolHapusSemua").addEventListener("click", async () => {
    if (transaksiData.length === 0) {
        alert("Belum ada transaksi untuk dihapus.");
        return;
    }
    if (!confirm(`Hapus semua ${transaksiData.length} transaksi? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
        const { error } = await supabaseClient
            .from("transaksi")
            .delete()
            .gt("id_transaksi", 0);
        if (error) throw error;
        await muatTransaksi();
    } catch (error) {
        tampilkanError(error);
    }
});

document.getElementById("tombolTampilkanLaporan").addEventListener("click", ubahRentangLaporan);
document.getElementById("tombolResetLaporan").addEventListener("click", () => {
    document.getElementById("tanggalMulai").value = "";
    document.getElementById("tanggalAkhir").value = "";
    laporanRentangAktif = false;
    renderLaporan(transaksiData);
});
document.getElementById("tombolCetak").addEventListener("click", () => {
    document.body.classList.add("cetak-laporan");
    window.print();
});
window.addEventListener("afterprint", () => document.body.classList.remove("cetak-laporan"));
document.getElementById("tombolExport").addEventListener("click", () => {
    if (!window.XLSX) {
        tampilkanError(new Error("Fitur Excel belum termuat. Periksa koneksi internet lalu muat ulang halaman."));
        return;
    }

    const jenisKasById = new Map(jenisKas.map((row) => [row.id_jenis_kas, row]));
    const rows = transaksiLaporan.map((item) => {
        const jenis = jenisKasById.get(item.id_jenis_kas);
        return {
            Tanggal: item.tanggal,
            Jenis: jenis?.tipe || "",
            Kategori: jenis?.nama_jenis || "",
            Keterangan: item.keterangan || "",
            Nominal: Number(item.jumlah)
        };
    });
    const workbook = window.XLSX.utils.book_new();
    const worksheet = window.XLSX.utils.json_to_sheet(rows);
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Kas");
    window.XLSX.writeFile(workbook, "laporan-kas-tiara.xlsx");
});

document.getElementById("tanggal").value = tanggalHariIni();
document.getElementById("tanggalHeader").textContent = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
});

async function mulaiAplikasi() {
    try {
        await muatDataReferensi();
        await muatTransaksi();
    } catch (error) {
        tampilkanError(error);
    }
}

mulaiAplikasi();