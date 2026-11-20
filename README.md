# SA Summary

Aplikasi pencatatan dan pemantauan performa tim Student Advisor: produksi harian, closing, target bulanan, laporan MTD, dan laporan WhatsApp harian. Data disimpan lokal di perangkat (SQLite via sql.js), jadi bisa dipakai tanpa internet.

## Fitur

- Dashboard MTD: target, gross, achievement, proyeksi akhir bulan, funnel konversi
- Produksi harian (leads, appointment, show, interview) per anggota
- Closing Dues dan Private dengan status Actual / Delay / Decom
- Target bulanan per akademi dan per anggota
- COED dan log cancellation
- Laporan WhatsApp harian, export PDF dan Excel
- Backup / restore JSON dengan mode Merge atau Replace
- Tema terang, gelap, atau ikut sistem

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, sql.js, Recharts, Capacitor (Android)

## Menjalankan

```bash
npm install
npm run dev
```

Build APK:

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```
