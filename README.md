# Multi-Tenant SaaS Mini Project Management (Fullstack)

Sistem SaaS Multi-Tenant Mini Project Management (Asana / Trello mini version) yang dibangun dengan **NestJS (Backend)**, **Next.js (Frontend)**, **PostgreSQL (Database)**, **Prisma ORM**, dan **BullMQ (Async Job Queue)**.

---

## 🚀 Quick Start & Cara Menjalankan

### Opsi A: Menggunakan Docker Compose (Rekomendasi / Paling Praktis)

Cukup satu perintah untuk menjalankan PostgreSQL, Redis, NestJS Backend (beserta auto migration & seeding), serta Next.js Frontend:

```bash
docker-compose up --build
```

- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend REST API:** [http://localhost:3001](http://localhost:3001)
- **Swagger API Docs:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

### Opsi B: Pengerjaan Manual (Development Mode)

#### 1. Pre-requisite
Pastikan PostgreSQL dan Redis server sudah berjalan di lokal Anda.

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Setup Environment (.env sudah disediakan default fallback)
# Pastikan DATABASE_URL sesuai dengan PostgreSQL lokal Anda

# Push Prisma Schema & Generate Client
npx prisma db push

# Seed Database Fixtures (Perusahaan A & B beserta user & task)
npm run seed

# Run Development Server
npm run start:dev
```

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Run Development Server
npm run dev
```

---

## 🧪 Menjalankan Automated Testing (E2E)

Sesuai requirement, E2E Test suite membuktikan **Isolasi Tenant** dan **RBAC** secara ketat:

```bash
cd backend
npm run test:e2e
```

### Hasil Test Assertions:
1. **Tenant Isolation:** User Perusahaan B yang mencoba mengakses `GET /api/v1/projects/:idCompanyA` mendapatkan `404 Not Found` (Bukan 200).
2. **RBAC Enforcement:** User bertipe `MEMBER` yang mencoba `DELETE /api/v1/projects/:id` mendapatkan `403 Forbidden`.
3. **Task Modification Scoping:** User `MEMBER` hanya bisa mengubah task yang di-assign ke dirinya. Mengubah task member lain menghasilkan `403 Forbidden`.

---

## 🔐 Strategi Multi-Tenancy & Trade-Offs

Strategi yang dipilih: **Row-Level Scoping (Column `company_id` Scoping)** dengan Shared Database & Shared Schema.

### Alasan Pemilihan:
- **Low Overhead & Speed:** Tidak memerlukan dynamic connection pooling atau DDL migration berulang per-tenant seperti *Database-per-tenant* atau *Schema-per-tenant*.
- **Pragmatis & Scalable:** Sangat ideal untuk aplikasi SaaS skala menengah, di mana query di-scope secara eksplisit via relational column index (`@@index([companyId])`).
- **Keamanan Terjamin di Level Application:** Resolusi tenant dilakukan **100% dari JWT Payload (`req.user.companyId`)**, bukan dari parameter URL atau Body request. User tidak bisa membobol data tenant lain meskipun menebak ID resource.

### Trade-Offs:
- **Disiplin Developer (Human Error Risk):** Harus memastikan setiap query database menyertakan filter `where: { companyId }`.
  - *Mitigasi di Project ini:* Menggunakan custom NestJS Interceptors & Service Wrapper yang selalu menginjeksikan `companyId` dari JWT Context.

---

## 👥 Preset Akun Seeding untuk Demo / Evaluation

| Tenant Company | Role | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- | :--- |
| **Acme Corp** | `ADMIN` | `admin@acme.com` | `password123` | Full CRUD Project & Task Acme |
| **Acme Corp** | `MEMBER` | `member@acme.com` | `password123` | Read Project Acme, Edit task sendiri |
| **Stark Industries** | `ADMIN` | `admin@stark.com` | `password123` | Full CRUD Project & Task Stark |
| **Stark Industries** | `MEMBER` | `member@stark.com` | `password123` | Read Project Stark, Edit task sendiri |

---

## ⏭️ Apa yang Di-skip / Dikorbankan & Rencana Peningkatan

1. **Row-Level Security (RLS) di Level PostgreSQL Engine:**
   - *Dikurbankan:* Saat ini scoping di-enforce di Application Level (NestJS/Prisma).
   - *Jika ada waktu lebih:* Menambahkan PostgreSQL Native RLS (`SET LOCAL app.current_tenant_id`) untuk proteksi lapis ganda di DB level.
2. **Audit Logging Persistent Table:**
   - *Dikurbankan:* Log perubahan data dan job async notifikasi saat ini di-log ke console/BullMQ.
   - *Jika ada waktu lebih:* Menyimpan tabel `AuditTrail` (`userId`, `action`, `resourceId`, `timestamp`) untuk pelacakan compliance.

---

## 🤔 Keputusan Teknis yang Diragu-ragukan

**Keputusan Return Status Code untuk Resource Tenant Lain (`404 Not Found` vs `403 Forbidden`):**
- *Keraguan:* Apakah sebaiknya me-return `403 Forbidden` atau `404 Not Found` ketika User Tenant B menebak ID Project milik Tenant A?
- *Keputusan & Alasan:* Diputuskan me-return **`404 Not Found`**. Hal ini sengaja dilakukan demi keamanan (*Information Disclosure Prevention*); me-return `403` secara tidak langsung memberitahu attacker bahwa ID resource tersebut memang ada di sistem. Dengan `404`, resource tenant lain terisolasi seolah-olah tidak ada sama sekali.
