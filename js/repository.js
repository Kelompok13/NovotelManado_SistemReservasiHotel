// ==================== REPOSITORY ====================
// Lapisan penyimpanan data. Saat ini memakai localStorage browser.
// Jika ingin pindah ke database (Firebase/Supabase), cukup ganti class ini.

class ReservasiRepository {
  constructor(key = "hotel_reservasi") { this._key = key; }

  _load() {
    try {
      const raw = localStorage.getItem(this._key);
      return raw ? JSON.parse(raw).map(d => Reservasi.fromJSON(d)) : [];
    } catch { return []; }
  }
  _save(list) { localStorage.setItem(this._key, JSON.stringify(list.map(r => r.toJSON()))); }

  getAll() { return this._load(); }
  getById(id) { return this._load().find(r => r.id === id) || null; }
  save(r) {
    const list = this._load();
    const i = list.findIndex(x => x.id === r.id);
    if (i >= 0) list[i] = r; else list.unshift(r);
    this._save(list);
  }
  nextId() {
    const n = this._load().length + 1;
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `RSV-${d}-${String(n).padStart(3, "0")}`;
  }
}
