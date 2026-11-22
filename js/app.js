// ==================== APP (UI & EVENT) ====================
// Menghubungkan tampilan (DOM) dengan service. Dimuat paling akhir.

// ---------- HELPER UI ----------
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${type}`;
  setTimeout(() => t.classList.add("hidden"), 3000);
}

function formatDate(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso) {
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatRupiah(angka) {
  return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}

// Mencegah XSS: semua teks input pengguna di-escape sebelum masuk innerHTML.
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const repo = new ReservasiRepository();
const service = new ReservasiService(repo);
const auth = new AuthService();

const LABEL_AKSI = { konfirmasi: "dikonfirmasi", batalkan: "dibatalkan", checkIn: "check-in", checkOut: "check-out" };

// ---------- AUTH UI ----------
function bukaLogin() {
  document.getElementById("login-modal").classList.remove("hidden");
  document.getElementById("login-error").classList.add("hidden");
  document.getElementById("login-form").reset();
}

function updateAuthUI() {
  const area = document.getElementById("auth-area");
  const adminBtns = document.querySelectorAll(".admin-only");
  const user = auth.getUser();
  if (user) {
    area.innerHTML = `<span class="auth-user">👤 <strong>${esc(user.name)}</strong> <small>(${esc(user.role)})</small></span>
      <button class="btn btn-sm btn-secondary" id="btn-logout">Logout</button>`;
    document.getElementById("btn-logout").addEventListener("click", () => {
      auth.logout();
      updateAuthUI();
      showToast("Berhasil logout", "success");
      if (document.getElementById("view-admin").classList.contains("active")) {
        document.querySelector('[data-view="dashboard"]').click();
      }
      renderTable();
    });
    adminBtns.forEach(b => b.classList.remove("hidden"));
  } else {
    area.innerHTML = `<button class="btn btn-sm btn-primary" id="btn-show-login">Login Admin</button>`;
    document.getElementById("btn-show-login").addEventListener("click", bukaLogin);
    adminBtns.forEach(b => b.classList.add("hidden"));
  }
}

document.getElementById("login-form").addEventListener("submit", e => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  if (auth.login(username, password)) {
    document.getElementById("login-modal").classList.add("hidden");
    updateAuthUI();
    showToast(`Selamat datang, ${auth.getUser().name}!`, "success");
    renderTable();
    document.querySelector('[data-view="admin"]').click();
  } else {
    document.getElementById("login-error").classList.remove("hidden");
  }
});
document.getElementById("login-modal-close").addEventListener("click", () => {
  document.getElementById("login-modal").classList.add("hidden");
});
document.getElementById("login-modal").addEventListener("click", e => {
  if (e.target.id === "login-modal") document.getElementById("login-modal").classList.add("hidden");
});

// ---------- NAVIGASI ----------
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.view === "admin" && !auth.isLoggedIn()) {
      showToast("Silakan login sebagai staf terlebih dahulu", "error");
      document.getElementById("login-modal").classList.remove("hidden");
      return;
    }
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`view-${btn.dataset.view}`).classList.add("active");
    if (btn.dataset.view === "list") renderTable();
    if (btn.dataset.view === "dashboard") updateStats();
    if (btn.dataset.view === "rooms") renderRooms();
    if (btn.dataset.view === "admin") renderAdminPanel();
  });
});

// ---------- FORM ----------
document.getElementById("metodeBayar").addEventListener("change", e => {
  document.getElementById("kartuGroup").style.display = e.target.value === "Kartu Kredit" ? "block" : "none";
});
const today = new Date().toISOString().slice(0, 10);
document.getElementById("checkin").min = today;
document.getElementById("checkout").min = today;

document.getElementById("reservation-form").addEventListener("submit", e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  try {
    const r = service.buatReservasi(data);
    showToast(`Reservasi ${r.id} berhasil dibuat!`, "success");
    e.target.reset();
    document.getElementById("kartuGroup").style.display = "none";
    updateStats();
    document.querySelector('[data-view="list"]').click();
  } catch (err) {
    showToast(err.message, "error");
  }
});
document.getElementById("btn-reset").addEventListener("click", () => {
  document.getElementById("reservation-form").reset();
  document.getElementById("kartuGroup").style.display = "none";
});

// ---------- TABEL RESERVASI ----------
document.getElementById("search").addEventListener("input", renderTable);
document.getElementById("filter-status").addEventListener("change", renderTable);

function tombolAksi(label, aksiNama, id, kelas) {
  return auth.can(aksiNama)
    ? `<button class="btn btn-sm ${kelas}" onclick="aksi('${aksiNama}','${id}')">${label}</button>`
    : "";
}

function renderTable() {
  const search = document.getElementById("search").value.toLowerCase();
  const statusFilter = document.getElementById("filter-status").value;
  let list = service.getAll();
  if (search) {
    list = list.filter(r =>
      r.id.toLowerCase().includes(search) ||
      r.tamu.nama.toLowerCase().includes(search) ||
      r.tamu.telepon.includes(search)
    );
  }
  if (statusFilter) list = list.filter(r => r.status === statusFilter);

  const tbody = document.getElementById("reservation-tbody");
  const user = auth.getUser();
  document.getElementById("list-subtitle").textContent = user
    ? `Anda login sebagai ${user.role} — aksi sesuai hak akses tersedia`
    : "Mode tamu — hanya bisa melihat. Login staf untuk kelola.";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#64748b;padding:32px;">Belum ada reservasi</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(r => {
    let actions = `<button class="btn btn-sm btn-outline" onclick="showDetail('${r.id}')">Detail</button>`;
    if (user) {
      if (r.status === "MENUNGGU") {
        actions += tombolAksi("Konfirmasi", "konfirmasi", r.id, "btn-success") + tombolAksi("Batal", "batalkan", r.id, "btn-danger");
      } else if (r.status === "DIKONFIRMASI") {
        actions += tombolAksi("Check-in", "checkIn", r.id, "btn-primary") + tombolAksi("Batal", "batalkan", r.id, "btn-danger");
      } else if (r.status === "CHECKIN") {
        actions += tombolAksi("Check-out", "checkOut", r.id, "btn-primary");
      }
    }
    return `<tr>
      <td><strong>${esc(r.id)}</strong></td>
      <td>${esc(r.tamu.nama)}<br><small style="color:#64748b">${esc(r.tamu.telepon)}</small></td>
      <td>${formatDate(r.checkin)}</td>
      <td>${formatDate(r.checkout)}</td>
      <td>${esc(r.tipeKamar)}${r.extraBed > 0 ? ` +${r.extraBed} bed` : ""}</td>
      <td><span class="status-badge status-${r.status}">${r.status}</span></td>
      <td><div class="action-btns">${actions}</div></td>
    </tr>`;
  }).join("");
}

function aksi(method, id) {
  if (!auth.isLoggedIn()) {
    showToast("Login staf diperlukan", "error");
    document.getElementById("login-modal").classList.remove("hidden");
    return;
  }
  if (!auth.can(method)) {
    showToast("Role Anda tidak memiliki izin untuk aksi ini", "error");
    return;
  }
  try {
    service[method](id);
    showToast(`Reservasi ${id} berhasil ${LABEL_AKSI[method]}`, "success");
    renderTable();
    updateStats();
    if (document.getElementById("view-admin").classList.contains("active")) renderAdminPanel();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function showDetail(id) {
  const r = service.getById(id);
  if (!r) return;
  document.getElementById("modal-body").innerHTML = `
    <h3 style="margin-bottom:4px;">Detail Reservasi</h3>
    <p style="color:#64748b;font-size:0.9rem;margin-bottom:16px;">${esc(r.id)} · <span class="status-badge status-${r.status}">${r.status}</span></p>
    <div class="detail-grid">
      <div class="detail-item"><label>Nama Tamu</label><span>${esc(r.tamu.nama)}</span></div>
      <div class="detail-item"><label>Telepon</label><span>${esc(r.tamu.telepon)}</span></div>
      <div class="detail-item"><label>Email</label><span>${esc(r.tamu.email)}</span></div>
      <div class="detail-item"><label>Alamat</label><span>${esc(r.tamu.alamat) || "-"}</span></div>
      <div class="detail-item"><label>Check-in</label><span>${formatDate(r.checkin)}</span></div>
      <div class="detail-item"><label>Check-out</label><span>${formatDate(r.checkout)} (${r.jumlahMalam} malam)</span></div>
      <div class="detail-item"><label>Tamu</label><span>${r.dewasa} dewasa, ${r.anak} anak</span></div>
      <div class="detail-item"><label>Tipe Kamar</label><span>${esc(r.tipeKamar)}${r.extraBed ? ` + ${r.extraBed} Extra Bed` : ""}</span></div>
      <div class="detail-item"><label>Preferensi</label><span>${esc(r.preferensiLokasi) || "-"}</span></div>
      <div class="detail-item"><label>Permintaan Khusus</label><span>${esc(r.permintaanKhusus) || "-"}</span></div>
      <div class="detail-item"><label>Metode Bayar</label><span>${esc(r.metodeBayar)}${r.noKartu ? ` (****${esc(r.noKartu)})` : ""}</span></div>
      <div class="detail-item"><label>Deposit</label><span>${formatRupiah(r.deposit)}</span></div>
      <div class="detail-item"><label>Estimasi Total</label><span>${formatRupiah(service.hitungEstimasi(r))}</span></div>
      <div class="detail-item"><label>Tujuan</label><span>${esc(r.tujuan)}</span></div>
      <div class="detail-item"><label>Sumber</label><span>${esc(r.sumber)}</span></div>
      <div class="detail-item"><label>Member ID</label><span>${esc(r.tamu.memberId) || "-"}</span></div>
      <div class="detail-item"><label>Poin</label><span>${r.tamu.poin}</span></div>
      <div class="detail-item" style="grid-column:1/-1"><label>Catatan</label><span>${esc(r.catatan) || "-"}</span></div>
    </div>`;
  document.getElementById("modal").classList.remove("hidden");
}
document.getElementById("modal-close").addEventListener("click", () => {
  document.getElementById("modal").classList.add("hidden");
});
document.getElementById("modal").addEventListener("click", e => {
  if (e.target.id === "modal") document.getElementById("modal").classList.add("hidden");
});

// ---------- KAMAR ----------
function renderRooms() {
  document.getElementById("rooms-grid").innerHTML = DAFTAR_KAMAR.map(k => `
    <div class="room-card">
      <div class="room-img">🛏️</div>
      <div class="room-body">
        <h4>${esc(k.tipe)} Room</h4>
        <p style="font-size:0.85rem;color:#64748b">Kapasitas: ${k.kapasitas} orang</p>
        <div class="room-price">${formatRupiah(k.harga)} <span>/ malam</span></div>
        <p style="font-size:0.75rem;color:#64748b;margin-bottom:6px">${esc(k.keterangan())}</p>
        <ul class="room-facilities">${k.fasilitas.map(f => "<li>" + esc(f) + "</li>").join("")}</ul>
      </div>
    </div>`).join("");
}

// ---------- STATISTIK & ADMIN PANEL ----------
function updateStats() {
  const list = service.getAll();
  document.getElementById("stat-total").textContent = list.length;
  document.getElementById("stat-confirmed").textContent = list.filter(r => ["DIKONFIRMASI", "CHECKIN", "CHECKOUT"].includes(r.status)).length;
  document.getElementById("stat-pending").textContent = list.filter(r => r.status === "MENUNGGU").length;
}

function renderAdminPanel() {
  if (!auth.isLoggedIn()) return;
  const list = service.getAll();
  document.getElementById("admin-total").textContent = list.length;
  document.getElementById("admin-pending").textContent = list.filter(r => r.status === "MENUNGGU").length;
  document.getElementById("admin-confirmed").textContent = list.filter(r => r.status === "DIKONFIRMASI").length;
  document.getElementById("admin-checkin").textContent = list.filter(r => r.status === "CHECKIN").length;

  const pending = list.filter(r => r.status === "MENUNGGU");
  const tbody = document.getElementById("admin-pending-tbody");
  if (pending.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#64748b;padding:20px;">Tidak ada reservasi menunggu</td></tr>`;
  } else {
    tbody.innerHTML = pending.map(r => `
      <tr>
        <td><strong>${esc(r.id)}</strong></td>
        <td>${esc(r.tamu.nama)}</td>
        <td>${formatDate(r.checkin)}</td>
        <td>${esc(r.tipeKamar)}</td>
        <td>${formatRupiah(r.deposit)}</td>
        <td>
          ${tombolAksi("Konfirmasi", "konfirmasi", r.id, "btn-success")}
          ${tombolAksi("Batal", "batalkan", r.id, "btn-danger")}
        </td>
      </tr>`).join("");
  }

  const activity = document.getElementById("admin-activity");
  const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
  activity.innerHTML = sorted.map(r => `
    <li>
      <span><strong>${esc(r.tamu.nama)}</strong> — ${esc(r.tipeKamar)} · <span class="status-badge status-${r.status}">${r.status}</span></span>
      <span class="activity-time">${formatTime(r.createdAt)}</span>
    </li>`).join("") || `<li style="color:#64748b">Belum ada aktivitas</li>`;
}

// ---------- INIT ----------
isiDataContoh(service);
updateAuthUI();
updateStats();
renderRooms();
