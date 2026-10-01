# Tiara Heritage Barbershop — Sistem Kas

## Skema Database

```mermaid
erDiagram
    PEGAWAI ||--o{ TRANSAKSI : mencatat
    PELANGGAN o|--o{ TRANSAKSI : terkait
    JENIS_KAS ||--o{ TRANSAKSI : mengelompokkan

    PEGAWAI {
        int id_pegawai PK
        varchar nama_pegawai
        varchar jabatan
    }
    PELANGGAN {
        int id_pelanggan PK
        varchar nama_pelanggan
        varchar no_hp
    }
    JENIS_KAS {
        int id_jenis_kas PK
        varchar nama_jenis
        varchar tipe "Masuk atau Keluar"
    }
    TRANSAKSI {
        int id_transaksi PK
        date tanggal
        int id_pegawai FK
        int id_pelanggan FK "nullable"
        int id_jenis_kas FK
        varchar keterangan
        numeric jumlah
    }
```

## Tentang

Aplikasi pencatatan kas masuk dan keluar Tiara Heritage Barbershop. Frontend menggunakan HTML, CSS, dan JavaScript biasa; Supabase menyediakan database PostgreSQL dan REST API.

Fitur utama: dashboard saldo, input transaksi, riwayat dengan pencarian/filter, edit dan hapus transaksi, laporan periode, cetak/PDF, serta ekspor Excel.

## Menjalankan

1. Siapkan proyek Supabase dan masukkan Project URL serta publishable/anon key ke `backend/supabase/config.js`.
2. Jalankan `database/database.sql` melalui Supabase SQL Editor.
3. Buka `frontend/index.html` langsung dari folder atau sajikan folder repo melalui web server.

Detail instalasi, alur CRUD, skema, deployment, dan keamanan ada di [Panduan Sistem](docs/panduan-sistem.md).

> SQL saat ini mengaktifkan akses `anon` tanpa login untuk demo. Jangan gunakan kebijakan tersebut untuk pencatatan keuangan produksi tanpa menambahkan autentikasi dan membatasi akses.
