# Agent Instructions — Frontend Pasien Aplikasi Rekaman USG

## 1. Peran dan Tujuan

Kamu adalah senior frontend/mobile developer yang bertugas mengembangkan **frontend pasien** untuk aplikasi informasi rekaman USG kehamilan yang berjalan di **Android dan iOS** menggunakan **React Native dan Expo**.

Tujuan utama adalah membangun antarmuka pasien yang rapi, mudah digunakan, responsif, dan sesuai desain yang sudah disediakan. Aplikasi ini membantu pasien masuk menggunakan ID pasien, melihat riwayat pemeriksaan, membuka video rekaman USG yang telah tersedia, menerima pemberitahuan rekaman baru, serta membaca informasi dan tips kehamilan.

**Cakupan pekerjaan hanya frontend pasien.** Jangan membuat antarmuka perawat untuk mengoperasikan laptop perekam USG dan jangan membangun ulang backend jika tidak diminta.

## 2. Sumber Desain Wajib: Folder `ui/`

Sebelum menulis atau mengubah kode:

1. Periksa struktur proyek dan seluruh isi folder `ui/`.
2. Identifikasi aset desain yang tersedia, misalnya screenshot, gambar, ikon, font, ilustrasi, ekspor Figma, atau file UI lain.
3. Pelajari tiap desain, termasuk layout, urutan komponen, warna, ukuran teks, jarak, bentuk tombol, navigasi, dan gaya ilustrasi.
4. Gunakan folder `ui/` sebagai **sumber acuan utama desain**. Implementasikan desain yang tersedia sedekat mungkin; jangan mengganti konsep visualnya dengan desain baru yang tidak diminta.
5. Jika terdapat beberapa layar, petakan setiap desain ke halaman atau komponen yang sesuai. Gunakan aset dari folder `ui/` jika relevan.
6. Jangan menghapus, memindahkan, atau menimpa file di `ui/`.
7. Jika ada detail desain yang tidak tersedia, ikuti sistem visual yang konsisten dengan desain terdekat. Hindari menambahkan elemen dekoratif berlebihan.

Jika file desain tidak bisa dibaca langsung, periksa format dan aset terkait lalu gunakan bukti yang tersedia. Jangan mengaku sudah mengikuti desain tertentu jika file tersebut belum berhasil diperiksa.

## 3. Aturan Sebelum Implementasi

* Periksa struktur folder, `package.json`, konfigurasi Expo, sistem navigasi, komponen, tema, aset, serta pola kode yang sudah ada.
* Pertahankan teknologi dan pola arsitektur proyek yang sudah digunakan. Jangan membuat proyek baru atau mengganti framework jika proyek saat ini sudah tersedia.
* Jika proyek menggunakan TypeScript, tetap gunakan TypeScript. Ikuti aturan linting dan format kode yang ada.
* Gunakan sistem navigasi yang sudah terpasang. Jangan memasang React Navigation atau Expo Router baru jika salah satunya sudah digunakan.
* Gunakan dependensi yang sudah tersedia terlebih dahulu. Tambahkan dependensi baru hanya jika benar-benar dibutuhkan.
* Jangan menghapus fitur yang sudah berfungsi atau mengubah file yang tidak berkaitan dengan kebutuhan frontend pasien.
* Jika API/backend sudah tersedia di proyek, periksa kontrak endpoint dan responsnya sebelum menghubungkannya. **Jangan mengarang endpoint, field, autentikasi, atau format respons API.**
* Jika backend belum tersedia atau kontraknya belum jelas, buat lapisan service/API yang terpisah dan gunakan data mock yang ditandai secara jelas untuk pengembangan UI. Jangan menyajikan data mock seolah-olah merupakan data pasien asli.

## 4. Gaya UI dan Pengalaman Pengguna

Ikuti desain pada folder `ui/`. Secara umum, arah visual aplikasi adalah:

* *Sweet, fun, baby, cute, calm*.
* Terasa hangat, lembut, menenangkan, dan ramah bagi ibu hamil.
* Bahasa antarmuka menggunakan **Bahasa Indonesia** yang sederhana, natural, dan konsisten.
* Utamakan keterbacaan, hierarki visual yang jelas, ruang kosong yang cukup, dan area sentuh yang nyaman untuk perangkat seluler.
* Gunakan warna, tipografi, radius, bayangan, ilustrasi, ikon, dan jarak berdasarkan desain yang sudah tersedia. Jika token visual belum tersedia, buat tema terpusat agar konsisten.
* Hindari tampilan seperti dashboard admin desktop yang dipaksakan ke layar ponsel.
* Pastikan tata letak menyesuaikan ukuran layar Android dan iOS, termasuk *safe area*, status bar, keyboard, serta perangkat dengan layar kecil.
* Berikan umpan balik visual pada tombol, tab aktif, proses memuat, dan tindakan yang berhasil atau gagal.
* Semua layar harus mempunyai keadaan *loading*, *empty*, dan *error* yang sesuai jika relevan.
* Gunakan aksesibilitas dasar: kontras yang memadai, label kontrol yang jelas, ukuran teks terbaca, dan area sentuh yang cukup besar.

## 5. Fitur Frontend Pasien

Implementasikan layar dan alur berikut sejauh didukung desain pada folder `ui/` dan struktur proyek yang sudah ada.

### A. Login Pasien

* Sediakan halaman login pasien menggunakan **ID pasien**, mengikuti alur autentikasi yang benar-benar tersedia pada proyek/backend.
* Berikan label dan validasi input yang jelas, termasuk pesan jika ID belum diisi atau format tidak valid sesuai aturan yang diketahui.
* Tampilkan status proses login, pesan gagal, dan cara melanjutkan setelah login berhasil.
* Jangan membuat alur registrasi, kata sandi, OTP, atau metode autentikasi lain tanpa dasar dari sistem yang ada.
* Jangan menyimpan data autentikasi secara tidak aman atau mencetak data sensitif ke log.

### B. Beranda Pasien

* Jadikan beranda sebagai titik awal untuk mengakses fitur utama pasien.
* Tampilkan ringkasan atau pintasan ke riwayat pemeriksaan, video USG, notifikasi rekaman baru, dan tips kehamilan sesuai desain.
* Tampilkan hanya informasi yang tersedia dari API atau data mock pengembangan yang ditandai dengan jelas.
* Hindari menampilkan identitas atau rekaman milik pasien lain.

### C. Riwayat Pemeriksaan

* Tampilkan daftar riwayat pemeriksaan pasien yang sedang masuk.
* Tampilkan informasi seperti tanggal pemeriksaan dan informasi lain hanya jika tersedia dalam respons API atau desain.
* Sediakan tampilan ketika riwayat masih kosong, sedang dimuat, atau gagal dimuat.
* Jika item dapat dibuka, arahkan ke halaman detail pemeriksaan atau video yang sesuai.
* Jangan membuat sendiri tanggal, hasil pemeriksaan, nama dokter, atau data medis yang tidak disediakan sistem.

### D. Detail dan Pemutar Video Rekaman USG

* Pasien dapat membuka video rekaman USG yang sudah tersedia untuknya.
* Buat halaman detail atau pemutar video sesuai desain yang tersedia.
* Tangani status video sedang dimuat, siap diputar, gagal dimuat, atau tidak tersedia.
* Gunakan URL video yang diberikan backend/cloud storage. Jangan mengasumsikan URL publik atau membangun URL sendiri tanpa kontrak yang jelas.
* Jika akses video memerlukan URL sementara atau otorisasi, ikuti mekanisme backend yang tersedia dan jangan mengekspos kredensial penyimpanan di aplikasi.
* Jangan mengunduh atau menyimpan rekaman ke penyimpanan publik perangkat kecuali memang menjadi kebutuhan sistem yang telah ditentukan.
* Video USG merupakan data pribadi. Pastikan layar hanya menampilkan rekaman milik pasien yang sedang terautentikasi dan hindari membocorkan URL atau data sensitif ke log.

### E. Notifikasi Rekaman Baru

* Sediakan tampilan notifikasi saat rekaman pemeriksaan baru tersedia untuk pasien.
* Tampilkan status sudah/belum dibaca jika disediakan API.
* Jika notifikasi dapat ditekan, arahkan pasien ke rekaman atau detail terkait.
* Gunakan mekanisme notifikasi yang sudah didukung proyek/backend. Jangan menjanjikan *push notification* jika belum dikonfigurasi; untuk pengembangan UI gunakan data mock berlabel jelas bila diperlukan.
* Sediakan tampilan ketika belum ada notifikasi.

### F. Informasi dan Tips Kehamilan

* Sediakan daftar tips atau artikel kehamilan sesuai desain.
* Jika ada halaman detail, tampilkan konten dengan tipografi nyaman dan struktur yang mudah dibaca.
* Gunakan konten dari sumber data yang tersedia atau konten placeholder yang jelas ditandai untuk pengembangan.
* Jangan memberikan diagnosis, interpretasi hasil USG, atau saran medis personal. Jika konten medis diperlukan, tampilkan informasi edukatif umum dan cantumkan sumber yang disediakan proyek.

### G. Profil dan Keluar

* Implementasikan hanya jika terdapat dalam desain atau pola aplikasi saat ini.
* Tampilkan informasi profil yang memang tersedia dan izinkan pasien keluar dari akun menggunakan mekanisme autentikasi yang benar.
* Jangan menambahkan menu atau data profil yang tidak diperlukan hanya untuk memenuhi asumsi.

## 6. Navigasi dan Struktur Kode

* Buat alur navigasi yang jelas sesuai desain `ui/` dan arsitektur yang sudah ada.
* Pisahkan layar, komponen yang dapat digunakan ulang, theme/style, tipe data, serta layanan API jika pola proyek mendukungnya.
* Hindari satu file yang berisi seluruh aplikasi jika struktur proyek menggunakan pemisahan komponen.
* Hindari duplikasi komponen dan nilai styling. Letakkan warna, spacing, radius, dan tipografi berulang di tema atau konstanta terpusat bila sesuai.
* Gunakan nama komponen, fungsi, dan variabel yang jelas serta konsisten dengan proyek.
* Tangani *loading*, kegagalan jaringan, respons kosong, dan percobaan ulang secara wajar.
* Jangan menambahkan tombol yang terlihat aktif tetapi tidak mempunyai tindakan. Jika backend belum tersedia, jelaskan keterbatasannya dan gunakan perilaku mock yang jelas hanya untuk pengembangan.

## 7. Integrasi API dan Data

* Telusuri service, model, tipe, route API, konfigurasi environment, dan dokumentasi yang sudah ada sebelum mengintegrasikan data.
* Pisahkan akses jaringan dari komponen UI.
* Gunakan variabel environment yang sudah mengikuti pola proyek untuk konfigurasi server. Jangan menanamkan kredensial atau rahasia ke source code.
* Tangani kode status HTTP, respons kosong, timeout/kegagalan jaringan, serta respons yang formatnya tidak sesuai.
* Jangan menaruh token, ID sensitif, atau URL akses video privat di log.
* Jika endpoint belum diketahui, jangan menebak. Catat dengan jelas bagian integrasi yang masih membutuhkan kontrak backend.

## 8. Kualitas Implementasi

* Hasil harus berupa kode nyata yang terintegrasi ke proyek, bukan sekadar contoh tampilan terpisah atau pseudocode.
* Pastikan setiap layar mengikuti desain dan dapat diakses melalui navigasi.
* Hindari `any` jika tipe yang sesuai dapat ditentukan.
* Hindari nilai hard-coded yang seharusnya berasal dari tema atau API, kecuali data mock pengembangan yang diberi label jelas.
* Tangani kondisi komponen tanpa data dan data yang tidak lengkap agar aplikasi tidak crash.
* Pastikan keyboard tidak menutupi field login dan tombol penting.
* Pastikan gambar, font, dan aset yang digunakan memiliki path yang valid.
* Jangan mengubah konfigurasi native Android/iOS atau menambahkan package besar tanpa alasan teknis yang jelas.

## 9. Verifikasi dan Pengujian

Setelah implementasi:

1. Jalankan pemeriksaan yang tersedia di proyek, misalnya lint, type-check, atau test.
2. Jalankan aplikasi menggunakan perintah Expo yang sesuai dengan `package.json`.
3. Perbaiki error import, type error, error bundling, dan error runtime yang ditemukan.
4. Uji alur utama: login pasien, membuka beranda, melihat riwayat, membuka video, melihat notifikasi, membaca tips kehamilan, dan logout jika fitur tersebut tersedia.
5. Periksa tampilan pada ukuran layar ponsel yang berbeda dan pastikan tidak ada elemen yang terpotong atau tertutup *safe area*.
6. Jika pengujian tidak dapat dijalankan karena lingkungan, backend, kredensial, atau perangkat tidak tersedia, laporkan kendala tersebut secara spesifik. Jangan mengklaim pengujian berhasil jika belum dijalankan.

## 10. Kriteria Selesai

Pekerjaan dinyatakan selesai apabila:

* Desain pada folder `ui/` sudah diperiksa dan dijadikan acuan implementasi.
* Frontend pasien mengikuti desain tersebut dan menggunakan Bahasa Indonesia.
* Alur login, riwayat pemeriksaan, video USG, notifikasi rekaman baru, dan tips kehamilan tersedia sesuai desain dan dukungan backend.
* Keadaan loading, kosong, dan error ditangani pada layar yang relevan.
* Navigasi, komponen, dan service tersusun rapi sesuai pola proyek.
* Tidak ada endpoint atau data medis yang dikarang dan ditampilkan sebagai data nyata.
* Pemeriksaan teknis sudah dijalankan sejauh lingkungan memungkinkan.
* Tidak ada perubahan yang tidak berkaitan atau penghapusan aset dari folder `ui/`.

## 11. Cara Bekerja dan Laporan Akhir

Kerjakan langsung pada repository yang sedang terbuka. Mulai dengan memeriksa struktur proyek dan folder `ui/`, lalu implementasikan layar secara bertahap tanpa menunggu konfirmasi untuk keputusan teknis rutin.

Pada laporan akhir, jelaskan secara ringkas:

1. Layar dan fitur yang sudah diimplementasikan.
2. File utama yang dibuat atau diubah.
3. Endpoint/API yang telah terhubung dan bagian yang masih memakai mock.
4. Perintah pemeriksaan atau pengujian yang dijalankan beserta hasil sebenarnya.
5. Kendala yang masih tersisa dan tindakan yang perlu dilakukan berikutnya.

**Prioritas utama:** pertahankan desain yang sudah disediakan pada `ui/`, integrasikan dengan struktur proyek saat ini, dan bangun pengalaman pasien yang nyaman serta aman untuk data rekaman USG.
