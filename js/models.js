// ==================== DOMAIN MODEL ====================
// Berisi class-class domain: User (Admin, Resepsionis), Tamu, Kamar (turunannya), Reservasi.

const StatusReservasi = Object.freeze({
  MENUNGGU: "MENUNGGU", DIKONFIRMASI: "DIKONFIRMASI", DIBATALKAN: "DIBATALKAN",
  CHECKIN: "CHECKIN", CHECKOUT: "CHECKOUT"
});

// ---------- USER (Inheritance + Polymorphism + Encapsulation) ----------
class User {
  #password; // private field: tidak bisa diakses dari luar class

  constructor({ username, nama, password, role = "tamu" }) {
    this._username = username;
    this._nama = nama;
    this._role = role;
    this.#password = password;
  }
  get username() { return this._username; }
  get nama() { return this._nama; }
  get role() { return this._role; }

  verifikasiPassword(input) { return this.#password === input; }

  // Daftar aksi yang boleh dilakukan. Di-override oleh subclass (polymorphism).
  izin() { return []; }
  bolehMelakukan(aksi) { return this.izin().includes(aksi); }

  toSession() {
    return { username: this._username, name: this._nama, role: this._role, loginAt: new Date().toISOString() };
  }
}

class Admin extends User {
  constructor({ username, nama, password }) {
    super({ username, nama, password, role: "admin" });
  }
  izin() { return ["konfirmasi", "batalkan", "checkIn", "checkOut"]; }
}

class Resepsionis extends User {
  constructor({ username, nama, password }) {
    super({ username, nama, password, role: "resepsionis" });
  }
  // Resepsionis tidak boleh membatalkan reservasi.
  izin() { return ["konfirmasi", "checkIn", "checkOut"]; }
}

// ---------- TAMU ----------
class Tamu {
  constructor({ nama, telepon, email, alamat = "", memberId = "", poin = 0 }) {
    this._nama = nama; this._telepon = telepon; this._email = email;
    this._alamat = alamat; this._memberId = memberId; this._poin = Number(poin) || 0;
  }
  get nama() { return this._nama; }
  get telepon() { return this._telepon; }
  get email() { return this._email; }
  get alamat() { return this._alamat; }
  get memberId() { return this._memberId; }
  get poin() { return this._poin; }
  toJSON() {
    return { nama: this._nama, telepon: this._telepon, email: this._email, alamat: this._alamat, memberId: this._memberId, poin: this._poin };
  }
  static fromJSON(d) { return new Tamu(d); }
}

// ---------- KAMAR (Inheritance + Polymorphism) ----------
class Kamar {
  constructor({ tipe, harga, kapasitas, fasilitas = [] }) {
    this._tipe = tipe; this._harga = harga; this._kapasitas = kapasitas; this._fasilitas = fasilitas;
  }
  get tipe() { return this._tipe; }
  get harga() { return this._harga; }
  get kapasitas() { return this._kapasitas; }
  get fasilitas() { return this._fasilitas; }

  // Harga total untuk sejumlah malam. Subclass boleh mengubah aturannya.
  hitungHarga(malam) { return this._harga * malam; }
  keterangan() { return "Tanpa biaya tambahan"; }
}

class KamarSuite extends Kamar {
  static BIAYA_LAYANAN = 0.10;
  hitungHarga(malam) { return Math.round(super.hitungHarga(malam) * (1 + KamarSuite.BIAYA_LAYANAN)); }
  keterangan() { return "Termasuk biaya layanan 10%"; }
}

class KamarPresidential extends Kamar {
  static BIAYA_BUTLER_PER_MALAM = 500000;
  hitungHarga(malam) { return super.hitungHarga(malam) + KamarPresidential.BIAYA_BUTLER_PER_MALAM * malam; }
  keterangan() { return "Termasuk Butler Service Rp 500.000/malam"; }
}

// ---------- RESERVASI ----------
class Reservasi {
  constructor(data) {
    this._id = data.id;
    this._tamu = data.tamu instanceof Tamu ? data.tamu : new Tamu(data.tamu);
    this._checkin = data.checkin; this._checkout = data.checkout;
    this._dewasa = Number(data.dewasa); this._anak = Number(data.anak || 0);
    this._tipeKamar = data.tipeKamar; this._extraBed = Number(data.extraBed || 0);
    this._preferensiLokasi = data.preferensiLokasi || ""; this._permintaanKhusus = data.permintaanKhusus || "";
    this._metodeBayar = data.metodeBayar; this._deposit = Number(data.deposit || 0);
    this._noKartu = data.noKartu || ""; this._tujuan = data.tujuan || "Liburan";
    this._catatan = data.catatan || ""; this._sumber = data.sumber;
    this._status = data.status || StatusReservasi.MENUNGGU;
    this._createdAt = data.createdAt || new Date().toISOString();
  }
  get id() { return this._id; }
  get tamu() { return this._tamu; }
  get checkin() { return this._checkin; }
  get checkout() { return this._checkout; }
  get dewasa() { return this._dewasa; }
  get anak() { return this._anak; }
  get tipeKamar() { return this._tipeKamar; }
  get extraBed() { return this._extraBed; }
  get preferensiLokasi() { return this._preferensiLokasi; }
  get permintaanKhusus() { return this._permintaanKhusus; }
  get metodeBayar() { return this._metodeBayar; }
  get deposit() { return this._deposit; }
  get noKartu() { return this._noKartu; }
  get tujuan() { return this._tujuan; }
  get catatan() { return this._catatan; }
  get sumber() { return this._sumber; }
  get status() { return this._status; }
  get createdAt() { return this._createdAt; }

  get jumlahMalam() {
    const selisih = (new Date(this._checkout) - new Date(this._checkin)) / 86400000;
    return Math.max(1, Math.round(selisih));
  }

  konfirmasi() {
    if (this._status !== StatusReservasi.MENUNGGU) throw new Error("Hanya reservasi MENUNGGU yang bisa dikonfirmasi.");
    this._status = StatusReservasi.DIKONFIRMASI;
  }
  batalkan() {
    if ([StatusReservasi.CHECKIN, StatusReservasi.CHECKOUT].includes(this._status)) throw new Error("Tidak bisa membatalkan yang sudah check-in/out.");
    this._status = StatusReservasi.DIBATALKAN;
  }
  checkIn() {
    if (this._status !== StatusReservasi.DIKONFIRMASI) throw new Error("Hanya yang sudah dikonfirmasi yang bisa check-in.");
    this._status = StatusReservasi.CHECKIN;
  }
  checkOut() {
    if (this._status !== StatusReservasi.CHECKIN) throw new Error("Hanya yang sudah check-in yang bisa check-out.");
    this._status = StatusReservasi.CHECKOUT;
  }
  toJSON() {
    return {
      id: this._id, tamu: this._tamu.toJSON(), checkin: this._checkin, checkout: this._checkout,
      dewasa: this._dewasa, anak: this._anak, tipeKamar: this._tipeKamar, extraBed: this._extraBed,
      preferensiLokasi: this._preferensiLokasi, permintaanKhusus: this._permintaanKhusus,
      metodeBayar: this._metodeBayar, deposit: this._deposit, noKartu: this._noKartu,
      tujuan: this._tujuan, catatan: this._catatan, sumber: this._sumber,
      status: this._status, createdAt: this._createdAt
    };
  }
  static fromJSON(d) { return new Reservasi({ ...d, tamu: Tamu.fromJSON(d.tamu) }); }
}

// ---------- DATA KAMAR ----------
const DAFTAR_KAMAR = [
  new Kamar({ tipe: "Standard", harga: 450000, kapasitas: 2, fasilitas: ["AC", "TV", "WiFi", "Kamar Mandi Dalam"] }),
  new Kamar({ tipe: "Deluxe", harga: 750000, kapasitas: 2, fasilitas: ["AC", "TV 43\"", "WiFi", "Mini Bar", "Bathtub"] }),
  new KamarSuite({ tipe: "Suite", harga: 1200000, kapasitas: 3, fasilitas: ["AC", "TV 55\"", "WiFi", "Living Room", "Jacuzzi"] }),
  new Kamar({ tipe: "Family", harga: 950000, kapasitas: 4, fasilitas: ["AC", "TV", "WiFi", "2 Bed", "Sofa Bed"] }),
  new KamarPresidential({ tipe: "Presidential", harga: 3500000, kapasitas: 4, fasilitas: ["AC", "TV 65\"", "WiFi", "Private Pool", "Butler Service"] })
];
