# Tutorial Deploy Monev App ke Vercel + Turso

## Overview

Aplikasi ini menggunakan:
- **Next.js** - Frontend & API Routes
- **Turso (libSQL)** - Database cloud (SQLite-compatible)
- **Vercel** - Hosting & Serverless Functions

---

## Langkah 1: Buat Database Turso

### Via Dashboard (Recommended untuk Windows)

1. Buka **https://turso.tech** lalu klik **Get Started**
2. Login dengan GitHub/Google
3. Klik **Create Database**
4. Isi:
   - **Name**: monev-app
   - **Location**: Pilih region terdekat (misal: ap-southeast-1 untuk Indonesia/Singapura)
5. Klik **Create**
6. Klik database yang baru dibuat
7. Copy **URL** (contoh: libsql://monev-app-username.turso.io)
8. Klik **Create Token** > beri nama vercel > copy token-nya

---

## Langkah 2: Deploy ke Vercel

### 1. Login ke Vercel
Buka https://vercel.com lalu login dengan GitHub

### 2. Import Repository
1. Klik **Add New** > **Project**
2. Cari repository **Zeroth09/pzimonev**
3. Klik **Import**

### 3. Configure
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: monev-app
- **Build Command**: next build (default)
- **Output Directory**: .next (default)

### 4. Environment Variables
Klik **Environment Variables** lalu tambahkan:

| Name | Value |
|------|-------|
| TURSO_DATABASE_URL | libsql://nama-db-anda.turso.io |
| TURSO_AUTH_TOKEN | token-dari-turso |

### 5. Deploy
Klik **Deploy** dan tunggu selesai.

---

## Langkah 3: Seed Data

Setelah deploy, buka terminal di folder monev-app:

1. Buat file .env.local:
   TURSO_DATABASE_URL=libsql://nama-db-anda.turso.io
   TURSO_AUTH_TOKEN=token-dari-turso

2. Jalankan seed:
   npm run seed

---

## Troubleshooting

### Error TURSO_DATABASE_URL is not defined
- Pastikan env vars sudah diisi di Vercel dashboard
- Redeploy setelah menambah env vars

### Error unauthorized
- Token Turso mungkin expired
- Buat token baru di Turso dashboard

### Database kosong
- Jalankan npm run seed dari lokal
- Atau seed via Turso dashboard > Shell
