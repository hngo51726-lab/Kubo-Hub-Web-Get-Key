require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', true);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createPool({
  host: process.env.DB_HOST || 'sql300.infinityfree.com',
  user: process.env.DB_USER || 'if0_3xxxxxxx',
  password: process.env.DB_PASSWORD || 'your_password',
  database: process.env.DB_NAME || 'if0_3xxxxxxx_kubo_db',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function initTable(sql, name) {
  db.query(sql, err => { if (err) console.error(`Khởi tạo bảng ${name}:`, err.message); });
}
initTable(`CREATE TABLE IF NOT EXISTS free_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  key_code VARCHAR(100) UNIQUE NOT NULL,
  base_code VARCHAR(50) NOT NULL,
  days_count INT DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`, 'free_keys');
initTable(`CREATE TABLE IF NOT EXISTS vip_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_code VARCHAR(100) UNIQUE NOT NULL,
  price VARCHAR(50) DEFAULT '50.000 VNĐ',
  status VARCHAR(50) DEFAULT 'Đã Kích Hoạt',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, 'vip_keys');

function randomCode() { return crypto.randomBytes(8).toString('hex').slice(0, 9).toUpperCase(); }
function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.socket.remoteAddress || '127.0.0.1';
  return raw.split(',')[0].trim().slice(0, 45);
}

app.post('/api/verify-and-generate', (req, res) => {
  const { link4mUrl, isExtend, oldKey } = req.body || {};
  let parsed;
  try { parsed = new URL(link4mUrl); } catch (_) {}
  // This checks URL format only. For real Link4M verification, validate a signed callback/API response here.
  if (!parsed || parsed.protocol !== 'https:' || !/(^|\.)link4m\.com$/i.test(parsed.hostname)) {
    return res.status(400).json({ success: false, error: 'Link4M không hợp lệ.' });
  }
  const ip = clientIp(req);
  if (isExtend && oldKey) {
    const match = /^KUBO_(\d+)DAY_([A-Z0-9]{9})$/.exec(oldKey);
    if (!match) return res.status(400).json({ success: false, error: 'Key gia hạn không hợp lệ.' });
    const days = Number(match[1]) + 1;
    const base = match[2];
    const key = `KUBO_${days}DAY_${base}`;
    db.query('UPDATE free_keys SET key_code = ?, days_count = ?, ip_address = ? WHERE base_code = ?', [key, days, ip, base], (err, result) => {
      if (err) return res.status(500).json({ success: false, error: 'Lỗi cập nhật key.' });
      if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Không tìm thấy key để gia hạn.' });
      res.json({ success: true, key, ip, isExtend: true });
    });
  } else {
    const base = randomCode();
    const key = `KUBO_1DAY_${base}`;
    db.query('INSERT INTO free_keys (ip_address, key_code, base_code, days_count) VALUES (?, ?, ?, 1)', [ip, key, base], err => {
      if (err) return res.status(500).json({ success: false, error: 'Không thể tạo key. Kiểm tra cấu hình database.' });
      res.json({ success: true, key, ip, isExtend: false });
    });
  }
});

app.get('/api/free-keys-history', (req, res) => {
  db.query('SELECT key_code, ip_address, updated_at FROM free_keys ORDER BY updated_at DESC LIMIT 20', (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: 'Không tải được lịch sử key.' });
    res.json({ success: true, data: rows });
  });
});
app.post('/api/buy-infinity-key', (req, res) => {
  // This endpoint creates a record only; it does NOT process or verify payment.
  const key = `KUBO_INFINITY_${randomCode()}`;
  db.query('INSERT INTO vip_keys (key_code) VALUES (?)', [key], err => {
    if (err) return res.status(500).json({ success: false, error: 'Không thể tạo key VIP.' });
    res.json({ success: true, key, price: '50.000 VNĐ', status: 'Chưa xác minh thanh toán' });
  });
});
app.get('/api/vip-keys-history', (req, res) => {
  db.query('SELECT key_code, created_at, status FROM vip_keys ORDER BY created_at DESC LIMIT 20', (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: 'Không tải được lịch sử VIP.' });
    res.json({ success: true, data: rows });
  });
});
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`Kubo Hub server chạy tại cổng ${PORT}`));
