# Turnamen 5 Varian — best-game-01 (16 Nov 2026, 04:42 WIB)

## Bedah papan atas live (dari leaderboard API, 2.340 submission, 1.941 di papan)
- #1 SUNWRIGHT 92,27% [90,6–94,0] — mirror-and-sunbeam tower defense, "the sun moves every wave", 1,13 MB
- #2 TIDEGLASS 89,69% — "light is the only weapon", 761 KB
- #3 Gravity Harbor 89,38% — 1,21 MB
- #4 Lanternfin 89,34% — "a descent into the deep", 531 KB
- #5 Kazemichi 86,33% — "The Wind Road"
- #6 Deep Signal II 85,86% — "sonar salvage against the warden"
- #7 Emberline 85,39% — lantern-line tower defence, 40 waves
- #8 HEAT SHEET 84,08% — "direct the tournament, rig the bracket"
- #9 Thousandwing 84,02% — "lead the murmuration south"
- #10 EMBERFALL 83,58%
- Garis 10 besar: ~83,6%. Garis 3 besar: ~89,4%.
- Pola pemenang: (a) SATU metafora visual kuat (cahaya/lentera, pasang, angin, gravitasi, laut dalam);
  (b) mekanik bernama di judul; (c) genre beragam tapi tower defense 2x di 7 besar;
  (d) cahaya/gelap mendominasi (5 dari 10 besar bertema cahaya/lentera/ember).
- Juri menilai dari contact sheet screenshot + outline source. Screenshot menentukan hampir
  segalanya: harus terbaca sekilas saat diperkecil, harus menunjukkan loop lengkap
  (start, main dengan HUD, menang/kalah + restart).

## Lima varian (skor 1–10 per kriteria juri, urut bobot juri)
Kriteria: 1 Kelengkapan | 2 Fun & kedalaman | 3 Feel & polish | 4 Tampilan & orisinalitas | 5 Struktur

### V1 GLOWPATH — "Carry the last light home" (puzzle-platformer cahaya)
Kamu ngengat-kunang Lumen. Dunia gelap; cahayamu adalah nyawamu. Nyalakan lentera
untuk membuka jalan dan membakar wisps bayangan; kumpulkan star-shard; capai Dawn Gate
sebelum cahayamu padam. Sumber daya inti: radius cahaya (habis di gelap, isi di lentera).
Flare (klik mouse) membakar wisps + menyalakan lentera, bayar cahaya. 6 malam, makin sulit.
Menang: tamatkan malam 6. Kalah: cahaya 0 di kegelapan.
Skor: 1=9, 2=8, 3=8, 4=9, 5=9 → **43**

### V2 ECHODEPTH — sonar maze (CHALLENGER)
Kapal selam buta di air hitam; ping sonar menyingkap peta sesaat; kumpulkan core, hindari
ranjau dan warden. Visual cincin sonar di hitam pekat.
Skor: 1=8, 2=7, 3=7, 4=7, 5=9 → **38**
Kalah dari juara karena: screenshot berisiko tampak kosong/gelap saat diperkecil; Deep Signal II
(#6, sonar salvage) sudah menduduki niche ini; labirin sulit dibaca dari gambar statis.

### V3 TIDEBOUND — puzzle pasang surut
Naik-turunkan air pasang untuk mengapungkan peti dan membuka gerbang.
Skor: 1=8, 2=6, 3=6, 4=6, 5=8 → **34**
Dibunuh karena: rendering air sulit terbaca di thumbnail; mekanik lambat, loop tidak langsung
kelihatan "seru" dari screenshot.

### V4 WINDGLIDER — glider kertas di arus angin
Tunggangi arus angin, kumpulkan updraft, balapan melawan badai.
Skor: 1=8, 2=6, 3=7, 4=7, 5=8 → **36**
Dibunuh karena: screenshot langit + glider terlihat sepi; kedalaman tipis (kebanyakan setir);
Kazemichi (#5, The Wind Road) sudah memiliki angin.

### V5 FOLDLIGHT — puzzle lipat origami
Lipat peta untuk menyambungkan jalan.
Skor: 1=7, 2=6, 3=5, 4=6, 5=8 → **32**
Dibunuh karena: mekanik lipat hampir mustahil dibaca dari screenshot statis; juri tidak bisa
"melihat" loop-nya.

## Vonis turnamen
**Juara: V1 GLOWPATH (43). Penantang: V2 ECHODEPTH (38) — kalah di tampilan thumbnail dan
niche sudah terisi.** V3/V4/V5 dibunuh dengan alasan tertulis di atas.
Klausul mulai-ulang: TIDAK dipicu. GLOWPATH bukan "lumayan": ia menarget langsung selera
juri yang terbukti (cahaya/gelap) dengan genre BERBEDA dari pemuncak (puzzle-platformer,
bukan tower defense/shooter), kontras tinggi yang terbaca di thumbnail, loop lengkap yang
terlihat di screenshot. Risiko yang diakui: tema cahaya ramai di papan — pembedanya adalah
genre dan mekanik sumber-daya cahaya, bukan menara.

## Sudut pandang juri (sebelum klaim siap)
Dari mata juri: game ini dinilai dari 4 gambar kecil + beberapa baris nama fungsi. Kekuatan
yang harus terlihat: (1) layar judul yang jelas, (2) gameplay dengan HUD lengkap dan cahaya
kuning hangat di atas biru gelap, (3) layar kemenangan "Dawn" yang terang, (4) nama file/fungsi
yang menjelaskan pekerjaan tiap file. Kelemahan yang harus diakui: platformer 2D adalah genre
paling umum di antara 2.340 entry — orisinalitas harus datang dari mekanik cahaya-sebagai-nyawa
dan visualnya, bukan dari genre. Posisi jujur vs papan: menarget 83–89% (zona 3–10 besar),
bukan klaim #1.

## Ronde 3 — audit pra-submit adversarial (16 Nov 2026, dalam sesi ini)
Audit sebagai juri yang ingin menolak entry. Temuan dan perbaikan:

1. **Autopilot tidak bisa menamatkan malam 3 & 6** (shot `end` gagal, layar game-over).
   Akar masalah, tiga lapis, semuanya di `game/src/shots.js`:
   - Deadlock: target tepat di atas ngengat di bawah platform → gerak 0, headroom tertutup,
     diam selamanya (jejak: x=170 selama 150 dtk, 0 shard).
   - Osilasi detour lentera tanpa hysteresis (cahaya 29–31) melawan gerbang yang sudah terbuka.
   - Pilihan pijakan diganti di tengah lompatan (pijakan (980,430) mencuri pijakan (1140,540)),
     lalu osilasi −1/+1 di tepi deadzone di atas gerbang (x=1160,2 ↔ 1165,2 selamanya).
   Perbaikan: titik lompat di samping platform + arah udara ke platform pijak (bukan ke shard);
   hysteresis lentera 25/60 + gerbang terbuka didahulukan (kecuali cahaya <12); pijakan dikunci
   saat lepas landas; drop dari tepi platform bersifat sticky sampai mendarat di level lain.
   **Hasil: autopilot kini menamatkan keenam malam (skor akhir 6400, cahaya 90,9).**
   Shot `play`/`play2` ikut diperbaiki: berhenti saat 2 shard terkumpul (bukan sesudah clear),
   lewat helper `playUntil` — play = malam 2 (2/4 shard), play2 = malam 4 (2/5 shard).
2. **Tiang lentera menembus teks judul** (shot 1: tiang melintasi "SPACE jump"). Pill 0,55 →
   0,72 → 0,88 masih tembus samar; akhir: kartu solid `#050814`. Judul kini bersih.
3. **Main sungguhan diuji di Chrome** (keyboard + klik, tanpa error konsol):
   Enter mulai game; panah + lompat mengumpulkan 2 shard dan menyalakan lentera (skor 225);
   P = pause (panel "ENTER restarts this night"); P lagi = lanjut; klik = flare.
   Kondisi kalah terverifikasi live: diam di gelap ~115 dtk → "The light went out"
   (skor 25, best 25) → Enter → malam 1 mulai lagi (skor 0, best 25 tersimpan).
   Catatan jujur: restart dari layar kemenangan (WIN→PLAY) TIDAK diuji live — mode `?shot=`
   tidak menjalankan loop game, jadi Enter di sana memang tidak berpengaruh (bukan bug);
   jalurnya berbagi kode persis dengan TITLE→PLAY yang sudah terbukti live.
4. **Gate (diperiksa lokal):** game_files 9 file / 56.665 byte, index.html 766 byte ✓;
   references: tanpa http/https, semua import relatif di dalam game/ ✓; screenshots 4 JPEG
   1280×720, 49,4 / 34,3 / 33,0 / 36,1 KB (≤256 KiB) ✓; dossier_matches: main.ts 2×
   → byte-identik, dossier ~264 KB (≤1,5 MiB), teks ~57 KB (≤160 KiB) ✓; js_parses:
   8 file .js lolos `node --check` ✓. Kuota saat audit: 0 entry dibuat, 5/5 hari ini,
   bisa submit — tapi kit salinan ini level 15, situs level 16: **finisher wajib unduh kit
   baru sebelum submit**. Catatan run record: penerimaan akan lewat 17 Nov 00:00 UTC,
   jadi bundle harus membawa run record (bundle yang menulisnya).
5. **Yang masih kurang (bukan tugas builder):** repo GitHub kosong manual oleh Ragil
   (dibuat setelah buka 15 Nov 18:00Z) + submit oleh finisher (bundle sesi mentah builder,
   `--no-discover --no-family`, `--muse-usage`, cek penuh, verifikasi ID submission penuh,
   tunggu ≥15 menit untuk skor dev).
