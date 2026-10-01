-- =========================================
-- 1. ENTITAS PEGAWAI
-- =========================================

CREATE TABLE IF NOT EXISTS pegawai (
    id_pegawai SERIAL PRIMARY KEY,
    nama_pegawai VARCHAR(100) NOT NULL,
    jabatan VARCHAR(50) NOT NULL
);


-- =========================================
-- 2. ENTITAS PELANGGAN
-- =========================================

CREATE TABLE IF NOT EXISTS pelanggan (
    id_pelanggan SERIAL PRIMARY KEY,
    nama_pelanggan VARCHAR(100) NOT NULL,
    no_hp VARCHAR(20)
);


-- =========================================
-- 3. ENTITAS JENIS KAS
-- =========================================

CREATE TABLE IF NOT EXISTS jenis_kas (
    id_jenis_kas SERIAL PRIMARY KEY,
    nama_jenis VARCHAR(100) NOT NULL,
    tipe VARCHAR(20) NOT NULL
        CHECK (tipe IN ('Masuk', 'Keluar'))
);

INSERT INTO jenis_kas (nama_jenis, tipe)
SELECT kategori.nama_jenis, kategori.tipe
FROM (VALUES
    ('Layanan Cukur', 'Masuk'),
    ('Penjualan Produk', 'Masuk'),
    ('Modal Pemilik', 'Masuk'),
    ('Lainnya', 'Masuk'),
    ('Gaji Barber', 'Keluar'),
    ('Sewa Tempat', 'Keluar'),
    ('Perlengkapan Cukur', 'Keluar'),
    ('Operasional', 'Keluar'),
    ('Listrik & Internet', 'Keluar'),
    ('Lainnya', 'Keluar')
) AS kategori(nama_jenis, tipe)
WHERE NOT EXISTS (
    SELECT 1
    FROM jenis_kas AS kategori_ada
    WHERE lower(kategori_ada.nama_jenis) = lower(kategori.nama_jenis)
      AND kategori_ada.tipe = kategori.tipe
);

DELETE FROM jenis_kas AS kategori_lama
WHERE lower(kategori_lama.nama_jenis) IN ('hdjhsdh', 'kas', 'bihwdgbh')
    AND NOT EXISTS (
            SELECT 1
            FROM transaksi
            WHERE transaksi.id_jenis_kas = kategori_lama.id_jenis_kas
    );


-- =========================================
-- 4. ENTITAS TRANSAKSI
-- =========================================

CREATE TABLE IF NOT EXISTS transaksi (
    id_transaksi SERIAL PRIMARY KEY,
    tanggal DATE NOT NULL,

    id_pegawai INTEGER NOT NULL,
    id_pelanggan INTEGER,
    id_jenis_kas INTEGER NOT NULL,

    keterangan VARCHAR(200),
    jumlah NUMERIC(15,2) NOT NULL
        CHECK (jumlah > 0),

    FOREIGN KEY (id_pegawai)
        REFERENCES pegawai(id_pegawai),

    FOREIGN KEY (id_pelanggan)
        REFERENCES pelanggan(id_pelanggan),

    FOREIGN KEY (id_jenis_kas)
        REFERENCES jenis_kas(id_jenis_kas)
);


-- Akses tanpa login untuk penggunaan demo.
ALTER TABLE pegawai ENABLE ROW LEVEL SECURITY;
ALTER TABLE pelanggan ENABLE ROW LEVEL SECURITY;
ALTER TABLE jenis_kas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_pegawai ON pegawai;
CREATE POLICY anon_select_pegawai ON pegawai
    FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS anon_insert_pegawai ON pegawai;
CREATE POLICY anon_insert_pegawai ON pegawai
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS anon_select_pelanggan ON pelanggan;
CREATE POLICY anon_select_pelanggan ON pelanggan
    FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS anon_insert_pelanggan ON pelanggan;
CREATE POLICY anon_insert_pelanggan ON pelanggan
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS anon_select_jenis_kas ON jenis_kas;
CREATE POLICY anon_select_jenis_kas ON jenis_kas
    FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS anon_insert_jenis_kas ON jenis_kas;
CREATE POLICY anon_insert_jenis_kas ON jenis_kas
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS anon_select_transaksi ON transaksi;
CREATE POLICY anon_select_transaksi ON transaksi
    FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS anon_insert_transaksi ON transaksi;
CREATE POLICY anon_insert_transaksi ON transaksi
    FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS anon_update_transaksi ON transaksi;
CREATE POLICY anon_update_transaksi ON transaksi
    FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS anon_delete_transaksi ON transaksi;
CREATE POLICY anon_delete_transaksi ON transaksi
    FOR DELETE TO anon USING (true);