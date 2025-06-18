# Blueprint Proyek: Sistem Antrian RS v2.0

Dokumen ini adalah cetak biru teknis untuk pembangunan aplikasi Sistem Antrian Rumah Sakit. Proyek dibagi menjadi beberapa Milestone, dan setiap Milestone terdiri dari Tugas-tugas spesifik dengan kriteria yang jelas.

## Milestone 1: Fondasi dan Arsitektur Backend

**Tujuan**: Membangun tulang punggung sistem yang kuat dan menyiapkan semua kebutuhan dasar server dan database.

### Tugas 1.1: Penyiapan Lingkungan Server

**Deskripsi**: Mengkonfigurasi komputer server fisik atau virtual untuk menjalankan aplikasi.

**Infrastruktur**:
- 1x Komputer Server (Spesifikasi min: CPU 2-core, RAM 4GB, SSD 128GB)
- Sistem Operasi: Linux (rekomendasi: Ubuntu Server) atau Windows Server
- Instalasi Node.js (versi LTS terbaru)
- Instalasi Git untuk kontrol versi

**UI/UX**: (Tidak berlaku untuk tugas ini)

**Penanganan Eror**:
- Dokumentasikan setiap langkah instalasi untuk memudahkan pemulihan jika terjadi kegagalan
- Pastikan semua port yang dibutuhkan (misal: port untuk aplikasi web) terbuka dan tidak konflik

**Kriteria Selesai**: Server dapat menjalankan skrip Node.js sederhana.

### Tugas 1.2: Desain dan Inisialisasi Database

**Deskripsi**: Merancang struktur tabel database sesuai kebutuhan dan menginisialisasinya.

**Infrastruktur**:
- Sistem Database: SQLite (untuk kemudahan) atau MySQL/PostgreSQL (untuk skala besar)
- Buat skema database yang mencakup tabel: poli, dokter, users, antrian, settings

**UI/UX**: (Tidak berlaku untuk tugas ini)

**Penanganan Eror**:
- Gunakan migration script untuk membuat tabel agar perubahan struktur tercatat dan dapat diulang
- Pastikan relasi antar tabel (Foreign Key) didefinisikan dengan benar untuk menjaga integritas data

**Kriteria Selesai**: Database dan semua tabel berhasil dibuat. Aplikasi Node.js dapat terhubung ke database.

## Milestone 2: Otak Sistem - API dan Logika Inti

**Tujuan**: Membuat layanan backend yang akan menjadi otak dari semua operasi, dari manajemen data hingga komunikasi real-time.

### Tugas 2.1: Pembuatan Endpoint API (CRUD)

**Deskripsi**: Membangun API (Application Programming Interface) untuk semua operasi data (Create, Read, Update, Delete).

**Infrastruktur**:
- Framework Backend: Express.js
- Rute API yang harus dibuat: `/api/poli`, `/api/dokter`, `/api/users`, `/api/antrian`, `/api/settings`

**UI/UX**: (Tidak berlaku untuk tugas ini, namun desain API harus logis dan mudah dipahami oleh tim frontend)

**Penanganan Eror**:
- Setiap respons API harus memiliki format yang konsisten, baik untuk sukses (status code 2xx) maupun eror (status code 4xx atau 5xx)
- Contoh respons eror: `{ "status": "gagal", "pesan": "Poli dengan ID tersebut tidak ditemukan." }`
- Lakukan validasi input untuk setiap permintaan yang masuk ke API

**Kriteria Selesai**: Semua endpoint API berfungsi dan dapat diuji menggunakan alat seperti Postman atau Insomnia.

### Tugas 2.2: Implementasi Server Komunikasi Real-time

**Deskripsi**: Mengintegrasikan WebSocket agar terjadi pembaruan instan pada klien (misal: display antrian).

**Infrastruktur**:
- Library: Socket.IO
- Event yang harus dibuat: `antrian_baru_pendaftaran`, `update_antrian_poli`, `panggil_pasien`

**UI/UX**: (Tidak berlaku untuk tugas ini, namun akan sangat memengaruhi pengalaman pengguna di frontend)

**Penanganan Eror**:
- Implementasikan logika reconnect jika koneksi WebSocket dari klien terputus
- Kirim pesan eror melalui WebSocket jika ada permintaan yang tidak valid dari klien

**Kriteria Selesai**: Server dapat mengirim dan menerima pesan melalui WebSocket. Klien dapat menerima pembaruan data secara langsung.

### Tugas 2.3: Logika Autentikasi dan Manajemen Sesi

**Deskripsi**: Membuat sistem login yang aman untuk Admin dan Petugas.

**Infrastruktur**:
- Gunakan library bcrypt untuk hashing password
- Gunakan jsonwebtoken (JWT) atau sistem sesi berbasis cookie untuk mengelola status login

**UI/UX**: (Tidak berlaku untuk tugas ini)

**Penanganan Eror**:
- Berikan pesan yang jelas saat login gagal (misal: "Username atau password salah"), tanpa memberi tahu mana yang salah demi keamanan
- Pastikan endpoint yang aman tidak dapat diakses tanpa token/sesi yang valid

**Kriteria Selesai**: Admin dan Petugas dapat login, dan sistem dapat membedakan hak akses mereka.

## Milestone 3: Modul Inti - Panel Admin

**Tujuan**: Membangun antarmuka yang lengkap bagi Admin untuk mengelola seluruh sistem.

### Tugas 3.1: Pengembangan Frontend Panel Admin

**Deskripsi**: Membangun semua halaman antarmuka untuk Admin berdasarkan desain UI/UX.

**Infrastruktur**:
- Frontend: HTML, CSS, JavaScript (Vanilla JS)

**UI/UX**:
- Desain harus bersih, intuitif, dan responsif (dapat diakses di tablet)
- Gunakan tabel untuk menampilkan data, dilengkapi dengan tombol Edit dan Hapus
- Gunakan formulir (form) yang jelas untuk menambah atau mengedit data

**Penanganan Eror**:
- Tampilkan notifikasi yang ramah pengguna saat operasi berhasil (misal: "Data Poli berhasil disimpan.") atau gagal
- Validasi formulir di sisi klien (misal: kolom tidak boleh kosong) sebelum dikirim ke server

**Kriteria Selesai**: Semua halaman Panel Admin (Manajemen Poli, Dokter, User, Pengaturan) selesai dan terhubung dengan API.

## Milestone 4: Modul Operasional - Petugas, Kios, dan Display

**Tujuan**: Membangun antarmuka untuk operasional sehari-hari: Kios untuk pasien, Dashboard untuk petugas, dan Layar Display untuk ruang tunggu.

### Tugas 4.1: Pengembangan Modul Kios

**Deskripsi**: Membangun antarmuka untuk mesin Kios tempat pasien mengambil nomor antrian.

**Infrastruktur**:
- Frontend: HTML, CSS, JavaScript
- (Opsional) Integrasi dengan printer thermal untuk mencetak tiket

**UI/UX**:
- Tombol harus sangat besar dan jelas
- Alur harus sesederhana mungkin (maksimal 2-3 kali klik)
- Tampilan harus beradaptasi dengan mode Pendaftaran Mandiri (On/Off)

**Penanganan Eror**:
- Tampilkan pesan yang jelas jika Kios gagal terhubung ke server atau jika antrian poli sudah penuh

**Kriteria Selesai**: Pasien dapat mengambil nomor antrian dari Kios, dan data masuk ke sistem.

### Tugas 4.2: Pengembangan Modul Petugas

**Deskripsi**: Membangun antarmuka bagi petugas untuk login, memilih sesi, dan memanggil antrian.

**Infrastruktur**:
- Frontend: HTML, CSS, JavaScript

**UI/UX**:
- Halaman pemilihan sesi harus menampilkan daftar Poli dan Dokter yang aktif
- Dashboard panggilan harus jelas menampilkan: Nomor Sedang Dipanggil, Daftar Menunggu, Daftar Terlewat
- Tombol Panggil Berikutnya, Panggil Ulang, Panggil Prioritas harus mudah diakses

**Penanganan Eror**:
- Beri peringatan jika petugas mencoba memanggil antrian sementara tidak ada pasien yang menunggu
- Beri notifikasi visual jika koneksi ke server WebSocket terputus

**Kriteria Selesai**: Petugas dapat melakukan seluruh siklus panggilan pasien.

### Tugas 4.3: Pengembangan Modul Display

**Deskripsi**: Membangun tampilan untuk layar TV di ruang tunggu.

**Infrastruktur**:
- Frontend: HTML, CSS, JavaScript

**UI/UX**:
- Gunakan ukuran font yang sangat besar dan kontras warna yang tinggi agar mudah dibaca dari jauh
- Saat ada panggilan baru, berikan efek visual (misal: berkedip) dan suara (jika memungkinkan) untuk menarik perhatian

**Penanganan Eror**:
- Tampilkan pesan status koneksi (misal: ikon kecil berwarna hijau/merah) untuk teknisi jika display gagal terhubung ke server

**Kriteria Selesai**: Layar display menampilkan pembaruan antrian secara real-time.

## Milestone 5: Finalisasi, Pengujian, dan Deployment

**Tujuan**: Memastikan semua modul bekerja sama dengan baik, bebas dari bug kritis, dan siap untuk digunakan di lingkungan rumah sakit.

### Tugas 5.1: Pengujian End-to-End

**Deskripsi**: Melakukan pengujian menyeluruh pada seluruh alur sistem.

**Infrastruktur**: Jaringan lokal yang sama dengan lingkungan produksi.

**UI/UX**: Kumpulkan masukan dari calon pengguna (admin, petugas) mengenai kemudahan penggunaan aplikasi.

**Penanganan Eror**: Catat semua bug dan eror yang ditemukan dalam sebuah issue tracker.

**Kriteria Selesai**: Skenario pengujian (misal: dari pasien ambil nomor hingga selesai dilayani) berhasil tanpa eror kritis.

### Tugas 5.2: Deployment dan Dokumentasi

**Deskripsi**: Memasang aplikasi di server produksi dan membuat dokumentasi.

**Infrastruktur**: Server produksi.

**UI/UX**: (Tidak berlaku)

**Penanganan Eror**: Siapkan rencana pemulihan (backup & restore) jika terjadi kegagalan sistem setelah deployment.

**Kriteria Selesai**: Aplikasi berjalan di server produksi dan tersedia dokumentasi cara penggunaan serta pemeliharaan dasar.