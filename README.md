# RSUD Queue System v2.0

Sistem Antrian Rumah Sakit berbasis Node.js dan MySQL yang dirancang untuk mengelola antrian pasien secara efisien dan real-time.

## 📋 Deskripsi Proyek

Aplikasi ini adalah sistem manajemen antrian untuk rumah sakit yang terdiri dari beberapa modul:
- **Panel Admin**: Untuk mengelola poli, dokter, dan pengaturan sistem
- **Kios Mandiri**: Untuk pasien mengambil nomor antrian
- **Dashboard Petugas**: Untuk petugas memanggil dan mengelola antrian
- **Display Antrian**: Layar untuk menampilkan informasi antrian di ruang tunggu

## 🏗️ Arsitektur Sistem

```
├── Backend (Node.js + Express.js)
├── Database (MySQL)
├── Frontend (HTML + CSS + JavaScript)
└── Real-time Communication (Socket.IO)
```

## 🚀 Milestone 1: Fondasi dan Arsitektur Backend

Status: ✅ **SELESAI**

### ✅ Tugas yang Telah Diselesaikan:

1. **Penyiapan Lingkungan Server**
   - ✅ Inisialisasi proyek Node.js
   - ✅ Konfigurasi Express.js
   - ✅ Setup environment variables
   - ✅ Konfigurasi development tools

2. **Desain dan Implementasi Database**
   - ✅ Desain skema database (5 tabel utama)
   - ✅ Implementasi migration scripts
   - ✅ Setup koneksi MySQL
   - ✅ Seed data untuk testing

## 📊 Struktur Database

### Tabel Utama:
1. **poli** - Data poliklinik/ruang pelayanan
2. **dokter** - Data dokter dan spesialisasi
3. **users** - Data pengguna sistem (admin/petugas)
4. **antrian** - Data antrian pasien
5. **settings** - Pengaturan aplikasi

### Relasi Database:
- `dokter` → `poli` (Many-to-One)
- `antrian` → `poli` (Many-to-One)
- `antrian` → `dokter` (Many-to-One)

## 🛠️ Instalasi dan Setup

### Prasyarat:
- Node.js (versi LTS terbaru)
- MySQL Server
- Git

### Langkah Instalasi:

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd RSUD-Queue-System
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Konfigurasi environment:**
   ```bash
   cp .env.example .env
   # Edit file .env sesuai konfigurasi database Anda
   ```

4. **Setup database:**
   ```bash
   # Jalankan migrasi untuk membuat tabel
   npm run migrate
   
   # Jalankan seed untuk data sampel
   npm run seed
   ```

5. **Test setup:**
   ```bash
   # Test koneksi database
   npm test
   ```

6. **Jalankan server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📝 Konfigurasi Environment

Buat file `.env` dengan konfigurasi berikut:

```env
# Environment Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=rsud_queue_system

# Application Configuration
APP_NAME=RSUD Queue System
APP_VERSION=1.0.0
```

## 🔧 Scripts NPM

```json
{
  "start": "node server.js",              // Jalankan server production
  "dev": "nodemon server.js",             // Jalankan server development
  "migrate": "node src/migrations/migrate.js",  // Jalankan migrasi database
  "seed": "node src/migrations/seed.js",         // Jalankan seed data
  "test": "node tests/database.test.js"          // Test koneksi database
}
```

## 📡 API Endpoints

### Base URL: `http://localhost:3000`

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET    | `/`      | Halaman utama API |
| GET    | `/health` | Health check server dan database |
| GET    | `/api`   | Informasi API |

## 🧪 Testing

Jalankan test untuk memastikan setup berhasil:

```bash
# Test koneksi database
npm test

# Test server
curl http://localhost:3000/health
```

## 📁 Struktur Proyek

```
RSUD-Queue-System/
├── src/
│   ├── config/
│   │   ├── database.js      # Konfigurasi database
│   │   └── env.js          # Konfigurasi environment
│   ├── migrations/
│   │   ├── 001_create_poli_table.js
│   │   ├── 002_create_dokter_table.js
│   │   ├── 003_create_users_table.js
│   │   ├── 004_create_antrian_table.js
│   │   ├── 005_create_settings_table.js
│   │   ├── migrate.js      # Script migrasi
│   │   └── seed.js         # Script seed data
│   ├── models/            # (Milestone 2)
│   ├── routes/            # (Milestone 2)
│   ├── controllers/       # (Milestone 2)
│   └── app.js            # Aplikasi Express
├── tests/
│   └── database.test.js   # Test database
├── .env                   # Environment variables
├── .gitignore
├── package.json
├── server.js             # Entry point
└── README.md
```

## 🔄 Langkah Selanjutnya (Milestone 2)

1. **Pembuatan Endpoint API (CRUD)**
   - Implementasi REST API untuk semua entitas
   - Validasi input dan error handling
   - Authentication middleware

2. **Server Komunikasi Real-time**
   - Implementasi WebSocket dengan Socket.IO
   - Event handling untuk update antrian
   - Real-time notifications

3. **Logika Autentikasi dan Manajemen Sesi**
   - Sistem login dengan JWT/Session
   - Role-based access control
   - Password hashing dengan bcrypt

## 🐛 Troubleshooting

### Error Database Connection:
1. Pastikan MySQL server berjalan
2. Periksa kredensial database di file `.env`
3. Pastikan database `rsud_queue_system` sudah dibuat

### Error Port Already in Use:
1. Ubah PORT di file `.env`
2. Atau hentikan proses yang menggunakan port tersebut

### Error Dependencies:
1. Jalankan `npm install` ulang
2. Hapus folder `node_modules` dan `package-lock.json`, lalu install ulang

## 👥 Tim Pengembang

- **Backend Developer**: Sistem database dan API
- **Frontend Developer**: Antarmuka pengguna
- **System Administrator**: Deployment dan maintenance

## 📄 Lisensi

ISC License - Internal use only

---

**Status Milestone 1**: ✅ SELESAI  
**Next Milestone**: Milestone 2 - API dan Logika Inti  
**Last Updated**: 15 Juni 2025