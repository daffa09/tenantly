# Tenantly — Multi-Tenant Mini Project Management

Mini Asana/Trello untuk banyak perusahaan dalam satu instance. Setiap tenant (perusahaan) punya
project, task, dan user sendiri, dan **tidak pernah** bisa melihat data tenant lain.

Stack: **NestJS** (API) · **Next.js** (web) · **PostgreSQL + Prisma** · **BullMQ/Redis** (async job).

**Kenapa stack ini:** NestJS memberi struktur modul/guard/interceptor yang eksplisit, jadi aturan
tenant dan RBAC punya satu tempat yang jelas alih-alih tersebar di controller. Prisma memberi skema
tunggal yang bisa dibaca sebagai dokumentasi sekaligus migration yang ter-version. BullMQ dipilih
karena Redis sudah lazim ada di stack SaaS dan job-nya cukup satu baris untuk keluar dari request
cycle.

---

## Menjalankan

### Docker Compose (satu perintah)

```bash
docker compose up --build
```

Backend menjalankan `prisma migrate deploy` lalu seed otomatis saat start.

- Web: <http://localhost:3000>
- API: <http://localhost:3001>
- Swagger: <http://localhost:3001/api/docs>

### Manual (mode development)

Prasyarat: PostgreSQL dan Redis berjalan lokal.

```bash
cd backend
cp .env.example .env        # WAJIB: isi JWT_SECRET, app menolak start tanpa itu
npm install
npx prisma migrate deploy   # `npx prisma migrate dev` saat mengubah skema
npm run seed
npm run start:dev
```

```bash
cd frontend
npm install
npm run dev
```

### Test

```bash
cd backend
npm test           # unit — tidak butuh database
npm run test:e2e   # butuh PostgreSQL + Redis; suite ini MENGHAPUS isi database
```

`test:e2e` membuktikan tenant isolation dan RBAC (12 test). `npm test` menjaga perbaikan keamanan
registrasi tanpa perlu infrastruktur, sehingga tetap berjalan di CI.

---

## Akun Seed

| Tenant | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| Acme Corp | `ADMIN` | `admin@acme.com` | `password123` |
| Acme Corp | `MEMBER` | `member@acme.com` | `password123` |
| Stark Industries | `ADMIN` | `admin@stark.com` | `password123` |
| Stark Industries | `MEMBER` | `member@stark.com` | `password123` |

Login dua tenant berbeda di dua browser profile untuk melihat isolasinya. Halaman login juga
menyediakan tombol satu klik untuk akun-akun ini.

---

## Strategi Multi-Tenancy

**Row-level scoping** (shared database, shared schema): setiap tabel milik tenant membawa kolom
`companyId` yang ter-index.

**Alasan:** untuk jumlah tenant menengah, ini yang paling murah dioperasikan — satu connection pool,
satu migration, satu proses backup. Schema-per-tenant memaksa menjalankan ulang setiap migration
sebanyak jumlah tenant; database-per-tenant menambah pooling dinamis dan orkestrasi yang tidak
sebanding dengan ukuran produk ini.

**Aturan yang membuatnya aman:** tenant di-resolve **hanya dari sesi yang login**
(`req.user.companyId`), tidak pernah dari parameter URL atau body. Menebak ID resource milik tenant
lain menghasilkan `404`.

**Trade-off:** disiplin ada di level aplikasi. Satu query yang lupa `where: { companyId }` langsung
membocorkan data lintas tenant — database tidak akan menghentikannya. Mitigasi saat ini: semua akses
lewat service yang menerima `companyId` sebagai argumen wajib, plus e2e test yang menembak ID tenant
lain secara langsung. Mitigasi sebenarnya adalah PostgreSQL RLS (lihat daftar yang di-skip).

### Kenapa `404`, bukan `403`

Ketika tenant B menyentuh resource tenant A, API menjawab `404`. `403` secara implisit mengonfirmasi
bahwa ID tersebut ada, dan itu cukup untuk memetakan isi tenant lain lewat tebakan. Dengan `404`,
resource tenant lain benar-benar tidak ada dari sudut pandang pemanggil.

---

## Keputusan Keamanan

| Keputusan | Alasan |
| :--- | :--- |
| Registrasi **selalu membuat tenant baru** (`409` kalau nama sudah dipakai) | Sebelumnya registrasi memakai company yang namanya cocok, dan `role` diambil dari body — siapa pun bisa mendaftar dengan `{"companyName":"Acme Corp","role":"ADMIN"}` lalu menguasai data Acme. Satu lubang itu meniadakan seluruh scoping `companyId` di belakangnya. |
| Anggota baru hanya lewat `POST /api/v1/users` (ADMIN saja) | Konsekuensi dari poin di atas, sekaligus Requirement 4 "admin kelola user". `companyId` diambil dari JWT pemanggil, tidak pernah dari payload. |
| JWT di **cookie httpOnly + SameSite=Lax** | Token tidak bisa dibaca JavaScript, jadi satu bug XSS tidak menghasilkan kredensial yang valid seminggu. `Lax` + allowlist CORS ketat menutup CSRF di kasus ini karena `localhost:3000 → localhost:3001` masih same-site. |
| Boot **gagal** kalau `JWT_SECRET` kosong | Sebelumnya ada fallback secret yang tertulis di source code: kalau env lupa di-set di production, semua token bisa dipalsukan siapa pun yang pernah melihat repo. |
| Rate limit 5/menit di `login` dan `register` | Menutup brute force password. |
| `helmet` + CORS allowlist dari env | `origin: '*'` bersama `credentials: true` bahkan tidak valid menurut spec CORS. |
| Error non-HTTP tidak diteruskan ke client | Error Prisma membawa nama tabel dan constraint. Sekarang di-log untuk operator, client menerima pesan generik. |

---

## Async Job

Assign task → job masuk antrian BullMQ (`attempts: 3`, exponential backoff) dan diproses worker di
luar request cycle; pengiriman email di-mock ke log. Kalau Redis mati, service jatuh ke log inline
supaya request tetap berhasil — pilihan sadar, dengan catatan bahwa itu menyembunyikan Redis yang
sedang down.

---

## Yang Di-skip & Rencana Berikutnya

1. **PostgreSQL Row-Level Security.** Scoping masih murni di level aplikasi. Berikutnya:
   `SET LOCAL app.current_tenant_id` per request + policy RLS, sehingga query yang lupa filter pun
   tidak mengembalikan data tenant lain.
2. **Audit trail.** Belum ada tabel `AuditLog` (siapa mengubah apa, kapan); perubahan penting hanya
   terlihat di log aplikasi.
3. **Pagination.** `GET /projects` dan `/tasks` mengembalikan seluruh isi tenant. Cukup untuk ukuran
   sekarang, tidak untuk tenant besar.
4. **CSRF token.** Mengandalkan `SameSite=Lax` + allowlist CORS. Kalau nanti ada endpoint lintas
   site, perlu double-submit token.
5. **MEMBER masih bisa mengubah `assigneeId`** pada task miliknya, bukan hanya `status` — artinya ia
   bisa melempar tugasnya ke orang lain. Perlu dibatasi ke `status` saja.
6. **E2E belum jalan di CI.** Butuh service container Postgres + Redis di workflow; CI saat ini
   menjalankan lint, unit test, Trivy scan, dan build image.
7. **Race condition** belum ditangani eksplisit: dua orang yang memindahkan task yang sama akan
   menghasilkan "yang terakhir menang". Berikutnya: kolom `version` + update bersyarat (optimistic
   locking) supaya update kedua ditolak, bukan diam-diam menimpa.

---

## Keputusan yang Masih Saya Ragukan

**Cookie httpOnly vs token di header.** Cookie menutup pencurian token lewat XSS, tapi menukarnya
dengan permukaan CSRF dan membuat konsumen non-browser (mobile, service-to-service) lebih repot —
mereka harus ikut mengelola cookie jar. Untuk produk yang hari ini hanya punya satu frontend web,
saya menilai XSS lebih nyata daripada CSRF yang sudah tertutup `SameSite=Lax`. Kalau nanti ada klien
mobile, saya cenderung menambah alur bearer token terpisah untuk API non-browser, bukan
mengembalikan token ke `localStorage`.

Keraguan kedua: **`404` untuk resource tenant lain.** Ini menyembunyikan informasi dengan baik, tapi
membuat debugging produksi lebih sulit — "tidak ada" dan "bukan milikmu" jadi tidak terbedakan dari
log akses. Kompromi yang saya ambil: response tetap `404`, kejadiannya dicatat di log server.

---

## Migration

Migration tersimpan di `backend/prisma/migrations/` dan ikut ter-commit.

```bash
npx prisma migrate dev --name <nama>   # membuat migration baru saat skema berubah
npx prisma migrate deploy              # menerapkan di CI/production
```

Setiap migration disertai `down.sql` (dihasilkan dari `prisma migrate diff --to-empty`) untuk
rollback manual, karena Prisma tidak punya perintah `migrate down`. Rollback: jalankan `down.sql`,
lalu `prisma migrate resolve --rolled-back <migration>`.

---

## API

Semua endpoint ber-prefix `/api/v1` dan memakai envelope seragam:

```json
{ "success": true, "statusCode": 200, "message": "...", "data": {} }
```

| Method | Endpoint | Akses |
| :--- | :--- | :--- |
| POST | `/auth/register` | Publik — membuat tenant baru + admin pertamanya |
| POST | `/auth/login` · `/auth/logout` | Publik |
| GET | `/auth/me` | Terautentikasi |
| GET · POST | `/users` | `GET` semua anggota tenant · `POST` admin saja |
| GET | `/projects` · `/projects/:id` | Terautentikasi, ter-scope tenant |
| POST · PATCH · DELETE | `/projects` | Admin saja |
| GET | `/projects/:id/tasks` | Terautentikasi, ter-scope tenant |
| POST · DELETE | `/projects/:id/tasks` | Admin saja |
| PATCH | `/projects/:id/tasks/:taskId` | Admin, atau member yang menjadi assignee-nya |
