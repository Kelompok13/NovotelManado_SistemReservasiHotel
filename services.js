// ==================== SERVICE ====================
// Logika bisnis: autentikasi, pengelolaan reservasi, dan data contoh.

class AuthService {
  constructor() {
    this._key = "hotel_admin_session";
    // Akun uji coba (tanpa backend, jadi didefinisikan di sini).
    this._users = [
      new Admin({ username: "admin", nama: "Administrator", password: "admin123" }),
      new Resepsionis({ username: "resepsionis", nama: "Resepsionis", password: "resepsionis123" })
    ];
  }
  login(username, password) {
    const user = this._users.find(u => u.username === username && u.verifikasiPassword(password));
    if (!user) return false;
    sessionStorage.setItem(this._key, JSON.stringify(user.toSession()));
    return true;
  }
  logout() { sessionStorage.removeItem(this._key); }
  isLoggedIn() { return !!sessionStorage.getItem(this._key); }
  getUser() {
    try { return JSON.parse(sessionStorage.getItem(this._key)); } catch { return null; }
  }
  // Cek izin berdasarkan object User yang sedang login (polymorphism: izin tiap role berbeda).
  can(aksi) {
    const sesi = this.getUser();
    if (!sesi) return false;
    const user = this._users.find(u => u.username === sesi.username);
    return !!user && user.bolehMelakukan(aksi);
  }
}

class ReservasiService {
  static BIAYA_EXTRA_BED = 150000; // per malam

  constructor(repo) { this._repo = repo; }

  buatReservasi(fd) {
    if (new Date(fd.checkout) <= new Date(fd.checkin)) throw new Error("Check-out harus setelah check-in.");
    const tamu = new Tamu({ nama: fd.nama, telepon: fd.telepon, email: fd.email, alamat: fd.alamat, memberId: fd.memberId, poin: fd.poin });
    const r = new Reservasi({
      id: this._repo.nextId(), tamu, checkin: fd.checkin, checkout: fd.checkout,
      dewasa: fd.dewasa, anak: fd.anak, tipeKamar: fd.tipeKamar, extraBed: fd.extraBed,
      preferensiLokasi: fd.preferensiLokasi, permintaanKhusus: fd.permintaanKhusus,
      metodeBayar: fd.metodeBayar, deposit: fd.deposit, noKartu: fd.noKartu,
      tujuan: fd.tujuan, catatan: fd.catatan, sumber: fd.sumber
    });
    this._repo.save(r);
    return r;
  }

  konfirmasi(id) { const r = this._mustGet(id); r.konfirmasi(); this._repo.save(r); return r; }
  batalkan(id) { const r = this._mustGet(id); r.batalkan(); this._repo.save(r); return r; }
  checkIn(id) { const r = this._mustGet(id); r.checkIn(); this._repo.save(r); return r; }
  checkOut(id) { const r = this._mustGet(id); r.checkOut(); this._repo.save(r); return r; }

  getAll() { return this._repo.getAll(); }
  getById(id) { return this._repo.getById(id); }

  // Estimasi biaya memanfaatkan polymorphism: tiap tipe kamar menghitung hargaannya sendiri.
  hitungEstimasi(r) {
    const kamar = DAFTAR_KAMAR.find(k => k.tipe === r.tipeKamar);
    if (!kamar) return 0;
    return kamar.hitungHarga(r.jumlahMalam) + r.extraBed * ReservasiService.BIAYA_EXTRA_BED * r.jumlahMalam;
  }

  _mustGet(id) {
    const r = this._repo.getById(id);
    if (!r) throw new Error("Reservasi tidak ditemukan.");
    return r;
  }
}

// ==================== DATA CONTOH ====================
// Diisi otomatis saat localStorage masih kosong, supaya aplikasi tidak tampil kosong
// ketika pertama kali dibuka (misalnya oleh dosen penguji). Tanggal dibuat relatif terhadap hari ini.

// Tanggal "hari ini + offset hari" dalam format YYYY-MM-DD (dipakai data contoh).
function tanggalOffset(offsetHari) {
  const d = new Date();
  d.setDate(d.getDate() + offsetHari);
  return d.toISOString().slice(0, 10);
}

function isiDataContoh(service) {
  if (service.getAll().length > 0) return;

  const data = [
    { nama: "Budi Santoso", telepon: "081234567890", email: "budi@email.com", alamat: "Jl. Sam Ratulangi No. 10, Manado",
      checkin: tanggalOffset(3), checkout: tanggalOffset(6), dewasa: 2, anak: 1, tipeKamar: "Deluxe", extraBed: 1,
      preferensiLokasi: "Pemandangan Laut", permintaanKhusus: "Kamar non-smoking", metodeBayar: "Transfer Bank", deposit: 500000,
      tujuan: "Liburan", catatan: "Merayakan anniversary", sumber: "Website Resmi", memberId: "GH-1001", poin: 250, aksi: [] },
    { nama: "Siti Aminah", telepon: "081298765432", email: "siti@email.com",
      checkin: tanggalOffset(4), checkout: tanggalOffset(5), dewasa: 1, anak: 0, tipeKamar: "Standard", extraBed: 0,
      metodeBayar: "Tunai", deposit: 200000, tujuan: "Bisnis", sumber: "Walk-in", aksi: [] },
    { nama: "Andi Pratama", telepon: "082111223344", email: "andi@email.com", alamat: "Jl. Piere Tendean, Manado",
      checkin: tanggalOffset(1), checkout: tanggalOffset(3), dewasa: 2, anak: 0, tipeKamar: "Suite", extraBed: 0,
      metodeBayar: "Kartu Kredit", noKartu: "4321", deposit: 1000000, tujuan: "Bisnis", sumber: "Telepon", aksi: ["konfirmasi"] },
    { nama: "Maria Lumentut", telepon: "085255667788", email: "maria@email.com",
      checkin: tanggalOffset(-1), checkout: tanggalOffset(2), dewasa: 2, anak: 2, tipeKamar: "Family", extraBed: 0,
      metodeBayar: "Transfer Bank", deposit: 800000, tujuan: "Liburan", sumber: "Website Resmi", aksi: ["konfirmasi", "checkIn"] },
    { nama: "Rudi Wenas", telepon: "081377889900", email: "rudi@email.com",
      checkin: tanggalOffset(-5), checkout: tanggalOffset(-3), dewasa: 2, anak: 0, tipeKamar: "Presidential", extraBed: 0,
      metodeBayar: "Kartu Kredit", noKartu: "9876", deposit: 3000000, tujuan: "Lainnya", sumber: "Agen Travel",
      aksi: ["konfirmasi", "checkIn", "checkOut"] },
    { nama: "Dewi Kawengian", telepon: "081911223355", email: "dewi@email.com",
      checkin: tanggalOffset(7), checkout: tanggalOffset(9), dewasa: 1, anak: 0, tipeKamar: "Standard", extraBed: 0,
      metodeBayar: "Tunai", deposit: 0, tujuan: "Liburan", sumber: "Walk-in", aksi: ["batalkan"] }
  ];

  data.forEach(({ aksi, ...fd }) => {
    try {
      const r = service.buatReservasi(fd);
      aksi.forEach(a => service[a](r.id));
    } catch (err) {
      console.warn("Gagal membuat data contoh:", err.message);
    }
  });
}
