# RSUD Queue System v2.0 - API Documentation

**Base URL**: `http://localhost:3000/api`  
**Version**: 2.0.0  
**Authentication**: Bearer Token (JWT)  

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Test Credentials
- **Admin**: username=`admin`, password=`Admin123!`
- **Petugas**: username=`petugas1`, password=`Petugas123!`

## 📋 Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation description",
  "statusCode": 200,
  "data": {
    // Actual data or null
  }
}
```

### Error Response
```json
{
  "status": "error", 
  "message": "Error description",
  "statusCode": 400,
  "errors": [
    // Array of detailed errors (optional)
  ]
}
```

### Paginated Response
```json
{
  "status": "success",
  "message": "Data retrieved successfully",
  "statusCode": 200,
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

## 🔑 Authentication Endpoints

### POST /auth/login
Login user dan dapatkan JWT token.

**Body:**
```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "nama_lengkap": "Administrator",
      "role": "admin",
      "aktif": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

**Rate Limit:** 5 requests per 15 minutes per IP

---

### POST /auth/logout
Logout user (invalidate session).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": "success",
  "message": "Logout berhasil"
}
```

---

### GET /auth/profile
Mendapatkan profil user yang sedang login.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": "success",
  "message": "Data profile berhasil diambil",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "nama_lengkap": "Administrator",
      "role": "admin",
      "aktif": true,
      "created_at": "2025-06-15T02:30:00.000Z",
      "updated_at": "2025-06-15T02:30:00.000Z"
    }
  }
}
```

---

### PUT /auth/profile
Update profil user yang sedang login.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "nama_lengkap": "Administrator Updated"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Profile berhasil diperbarui",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "nama_lengkap": "Administrator Updated",
      "role": "admin",
      "aktif": true,
      "updated_at": "2025-06-15T02:35:00.000Z"
    }
  }
}
```

---

### PUT /auth/change-password
Ubah password user yang sedang login.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "oldPassword": "Admin123!",
  "newPassword": "NewAdmin123!",
  "confirmPassword": "NewAdmin123!"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Password berhasil diubah"
}
```

---

### POST /auth/refresh
Refresh JWT token menggunakan refresh token.

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Token berhasil di-refresh",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "nama_lengkap": "Administrator",
      "role": "admin"
    },
    "token": "new_jwt_token...",
    "refreshToken": "new_refresh_token...",
    "expiresIn": "24h"
  }
}
```

---

### GET /auth/verify
Verifikasi validitas token.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": "success",
  "message": "Token valid",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "nama_lengkap": "Administrator",
      "role": "admin",
      "aktif": true
    }
  }
}
```

---

### GET /auth/status
Cek status autentikasi (public endpoint).

**Response:**
```json
{
  "status": "success",
  "message": "Status autentikasi",
  "data": {
    "isAuthenticated": true,
    "user": {
      "id": 1,
      "username": "admin",
      "nama_lengkap": "Administrator", 
      "role": "admin"
    }
  }
}
```

## 🏥 Poli Management Endpoints

### GET /poli
Mendapatkan semua data poli.

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin, Petugas

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `active_only` (optional): Only active poli (true/false)
- `with_stats` (optional): Include statistics (true/false)

**Response:**
```json
{
  "status": "success",
  "message": "Data poli berhasil diambil",
  "data": [
    {
      "id": 1,
      "nama_poli": "Poli Umum",
      "kode_poli": "UMUM",
      "aktif": true,
      "created_at": "2025-06-15T02:30:00.000Z",
      "updated_at": "2025-06-15T02:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10
  }
}
```

---

### GET /poli/:id
Mendapatkan data poli berdasarkan ID.

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin, Petugas

**Response:**
```json
{
  "status": "success",
  "message": "Data poli berhasil diambil",
  "data": {
    "poli": {
      "id": 1,
      "nama_poli": "Poli Umum",
      "kode_poli": "UMUM",
      "aktif": true,
      "created_at": "2025-06-15T02:30:00.000Z",
      "updated_at": "2025-06-15T02:30:00.000Z"
    }
  }
}
```

---

### POST /poli
Membuat poli baru.

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin Only

**Body:**
```json
{
  "nama_poli": "Poli Jantung",
  "kode_poli": "JANTUNG",
  "aktif": true
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Poli berhasil dibuat",
  "statusCode": 201,
  "data": {
    "poli": {
      "id": 2,
      "nama_poli": "Poli Jantung",
      "kode_poli": "JANTUNG",
      "aktif": true,
      "created_at": "2025-06-15T02:35:00.000Z",
      "updated_at": "2025-06-15T02:35:00.000Z"
    }
  }
}
```

**Rate Limit:** 20 requests per 5 minutes per IP

---

### PUT /poli/:id
Update data poli.

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin Only

**Body:**
```json
{
  "nama_poli": "Poli Jantung Updated",
  "aktif": false
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Poli berhasil diperbarui",
  "data": {
    "poli": {
      "id": 2,
      "nama_poli": "Poli Jantung Updated",
      "kode_poli": "JANTUNG",
      "aktif": false,
      "created_at": "2025-06-15T02:35:00.000Z",
      "updated_at": "2025-06-15T02:40:00.000Z"
    }
  }
}
```

---

### DELETE /poli/:id
Hapus poli (dengan pengecekan dependencies).

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin Only

**Response:**
```json
{
  "status": "success",
  "message": "Poli berhasil dihapus"
}
```

**Error Response (if has dependencies):**
```json
{
  "status": "error",
  "message": "Poli tidak dapat dihapus karena masih memiliki dokter atau antrian",
  "statusCode": 400
}
```

---

### GET /poli/active
Mendapatkan semua poli yang aktif.

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin, Petugas

**Query Parameters:**
- `with_dokter_count` (optional): Include dokter count (true/false)

**Response:**
```json
{
  "status": "success",
  "message": "Data poli aktif berhasil diambil",
  "data": {
    "poli": [
      {
        "id": 1,
        "nama_poli": "Poli Umum",
        "kode_poli": "UMUM",
        "aktif": true,
        "jumlah_dokter": 3
      }
    ]
  }
}
```

---

### GET /poli/search
Pencarian poli berdasarkan nama.

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin, Petugas

**Query Parameters:**
- `q` (required): Search query
- `active_only` (optional): Only search active poli (true/false)

**Response:**
```json
{
  "status": "success",
  "message": "Pencarian poli selesai",
  "data": {
    "results": [
      {
        "id": 1,
        "nama_poli": "Poli Umum",
        "kode_poli": "UMUM",
        "aktif": true
      }
    ],
    "query": "umum",
    "total": 1
  }
}
```

---

### GET /poli/statistics
Mendapatkan statistik poli.

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin Only

**Response:**
```json
{
  "status": "success",
  "message": "Statistik poli berhasil diambil",
  "data": {
    "statistics": {
      "total": 5,
      "active": 4,
      "inactive": 1
    }
  }
}
```

---

### GET /poli/with-antrian-count
Mendapatkan poli dengan jumlah antrian hari ini.

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin, Petugas

**Response:**
```json
{
  "status": "success",
  "message": "Data poli dengan jumlah antrian berhasil diambil",
  "data": {
    "poli": [
      {
        "id": 1,
        "nama_poli": "Poli Umum",
        "kode_poli": "UMUM",
        "aktif": true,
        "antrian_hari_ini": 15
      }
    ]
  }
}
```

---

### GET /poli/code/:kode
Mendapatkan poli berdasarkan kode.

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin, Petugas

**Response:**
```json
{
  "status": "success",
  "message": "Data poli berhasil diambil",
  "data": {
    "poli": {
      "id": 1,
      "nama_poli": "Poli Umum",
      "kode_poli": "UMUM",
      "aktif": true
    }
  }
}
```

---

### GET /poli/:id/can-delete
Cek apakah poli dapat dihapus.

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin Only

**Response:**
```json
{
  "status": "success",
  "message": "Pengecekan selesai",
  "data": {
    "canDelete": true,
    "message": "Poli dapat dihapus"
  }
}
```

---

### PATCH /poli/:id/toggle-status
Toggle status aktif/tidak aktif poli.

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin Only

**Response:**
```json
{
  "status": "success",
  "message": "Poli berhasil dinonaktifkan",
  "data": {
    "poli": {
      "id": 1,
      "nama_poli": "Poli Umum",
      "kode_poli": "UMUM",
      "aktif": false,
      "updated_at": "2025-06-15T02:45:00.000Z"
    }
  }
}
```

## 🔧 Utility Endpoints

### GET /
API welcome message.

**Response:**
```json
{
  "status": "success",
  "message": "Selamat datang di RSUD Queue System API v2.0",
  "version": "2.0.0",
  "environment": "development",
  "timestamp": "2025-06-15T02:30:00.000Z",
  "documentation": {
    "api": "/api",
    "health": "/health"
  }
}
```

---

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-15T02:30:00.000Z",
  "uptime": 3600.123,
  "environment": "development",
  "version": "2.0.0",
  "database": {
    "status": "connected",
    "responseTime": "5ms",
    "host": "localhost",
    "database": "rsud_queue_system"
  },
  "memory": {
    "used": 45,
    "total": 64,
    "external": 12
  }
}
```

---

### GET /api
API documentation and endpoint list.

**Response:**
```json
{
  "status": "success",
  "message": "RSUD Queue System API v2.0",
  "version": "2.0.0",
  "documentation": "/api/docs",
  "endpoints": {
    "auth": {
      "base": "/api/auth",
      "endpoints": [
        "POST /login - User login",
        "POST /logout - User logout",
        // ... more endpoints
      ]
    },
    "poli": {
      "base": "/api/poli", 
      "endpoints": [
        "GET / - Get all poli",
        "POST / - Create poli (Admin)",
        // ... more endpoints
      ]
    }
  }
}
```

## 📝 Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid input data atau validation error |
| 401 | Unauthorized | Token tidak ada, invalid, atau expired |
| 403 | Forbidden | User tidak memiliki akses ke resource |
| 404 | Not Found | Resource tidak ditemukan |
| 409 | Conflict | Data sudah ada (duplicate) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## 🧪 Testing dengan cURL

### Login dan Simpan Token
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123!"}'

# Simpan token dari response, lalu gunakan untuk requests berikutnya
export TOKEN="your_jwt_token_here"
```

### Test Poli Endpoints
```bash
# Get all poli
curl -X GET http://localhost:3000/api/poli \
  -H "Authorization: Bearer $TOKEN"

# Create poli
curl -X POST http://localhost:3000/api/poli \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nama_poli": "Poli Test", "kode_poli": "TEST"}'

# Get poli by ID
curl -X GET http://localhost:3000/api/poli/1 \
  -H "Authorization: Bearer $TOKEN"

# Update poli
curl -X PUT http://localhost:3000/api/poli/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nama_poli": "Poli Test Updated"}'

# Search poli
curl -X GET "http://localhost:3000/api/poli/search?q=test" \
  -H "Authorization: Bearer $TOKEN"
```

## 🔄 Rate Limiting

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Global | 200 requests | 1 minute |
| Login | 5 requests | 15 minutes |
| API General | 100 requests | 15 minutes |
| Create Operations | 20 requests | 5 minutes |

Rate limit headers included in response:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time

---

**Dokumentasi ini akan terus diupdate seiring development Milestone selanjutnya.**