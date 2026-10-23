const API_BASE = '/api';
let extendingKeyFull = null;
let currentKey = '';

function switchTab(tabName) {
  const views = { getKey: 'tabGetKeyView', history: 'tabHistoryView', buyKey: 'tabBuyKeyView' };
  const navs = { getKey: 'navGetKey', history: 'navHistory', buyKey: 'navBuyKey' };
  Object.values(views).forEach(id => document.getElementById(id).classList.add('hidden'));
  Object.values(navs).forEach(id => document.getElementById(id).classList.remove('active', 'active-buy'));
  document.getElementById(views[tabName]).classList.remove('hidden');
  document.getElementById(navs[tabName]).classList.add(tabName === 'buyKey' ? 'active-buy' : 'active');
  if (tabName === 'history') fetchFreeHistory();
  if (tabName === 'buyKey') fetchVipHistory();
}
function generateRandom9Chars() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(9); crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}
function generateLink4M() {
  const link = `https://link4m.com/kubo_1day_${generateRandom9Chars()}`;
  const el = document.getElementById('link4mUrl'); el.textContent = link; el.href = link;
  document.getElementById('generatedLinkBox').classList.remove('hidden');
}
async function copyText(value) {
  try { await navigator.clipboard.writeText(value); alert('Đã sao chép!'); }
  catch (_) { window.prompt('Sao chép nội dung này:', value); }
}
function copyGeneratedLink() { copyText(document.getElementById('link4mUrl').textContent); }
async function verifyAndGenerateKey() {
  const input = document.getElementById('linkInput').value.trim();
  const errorMsg = document.getElementById('errorMessage');
  errorMsg.classList.add('hidden');
  let parsed; try { parsed = new URL(input); } catch (_) {}
  if (!parsed || parsed.protocol !== 'https:' || !/(^|\.)link4m\.com$/i.test(parsed.hostname)) {
    document.getElementById('errorText').textContent = 'Link xác minh không hợp lệ!'; errorMsg.classList.remove('hidden'); return;
  }
  showCheckModal();
  try {
    const response = await fetch(`${API_BASE}/verify-and-generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ link4mUrl: input, isExtend: extendingKeyFull !== null, oldKey: extendingKeyFull }) });
    const data = await response.json();
    document.getElementById('modalCheckingState').classList.add('hidden');
    if (!response.ok || !data.success) { closeModal(); alert(`Lỗi: ${data.error || 'Không thể tạo key.'}`); return; }
    currentKey = data.key; document.getElementById('createdKeyDisplay').textContent = currentKey;
    document.getElementById('modalCompletedState').classList.remove('hidden');
    extendingKeyFull = null; document.getElementById('extendBanner').classList.add('hidden');
  } catch (_) { closeModal(); alert('Lỗi kết nối máy chủ. Kiểm tra server và cấu hình database.'); }
}
async function fetchFreeHistory() {
  const table = document.getElementById('historyTable');
  try {
    const res = await fetch(`${API_BASE}/free-keys-history`); const result = await res.json();
    if (!res.ok || !result.success) throw new Error('API error');
    document.getElementById('historyCount').textContent = `${result.data.length} Key`;
    if (!result.data.length) { table.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-500">Chưa có lịch sử key.</td></tr>'; return; }
    table.innerHTML = result.data.map(item => `<tr class="hover:bg-white/5"><td class="p-2"><div class="font-bold text-cyber-cyan">${escapeHtml(item.key_code)}</div><div class="text-[10px] text-gray-400">IP: ${escapeHtml(item.ip_address || 'Không rõ')}</div></td><td class="p-2 text-gray-400">${new Date(item.updated_at).toLocaleString('vi-VN')}</td><td class="p-2 text-right space-x-1"><button data-copy="${escapeHtml(item.key_code)}" class="copy-row text-xs bg-cyber-border px-2 py-1 rounded">Copy</button><button data-extend="${escapeHtml(item.key_code)}" class="extend-row text-xs bg-cyber-purple/40 text-cyber-pink px-2 py-1 rounded">Gia hạn</button></td></tr>`).join('');
    table.querySelectorAll('.copy-row').forEach(b => b.onclick = () => copyText(b.dataset.copy));
    table.querySelectorAll('.extend-row').forEach(b => b.onclick = () => triggerExtendFlow(b.dataset.extend));
  } catch (_) { table.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-cyber-red">Không tải được lịch sử. Kiểm tra database.</td></tr>'; }
}
async function processBuyInfinityKey() {
  if (!confirm('Tạo key VIP? Chức năng này chưa thu tiền và không xác minh thanh toán.')) return;
  try {
    const res = await fetch(`${API_BASE}/buy-infinity-key`, { method: 'POST' }); const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi giao dịch');
    alert(`Key VIP được tạo (chưa xác minh thanh toán): ${data.key}`); fetchVipHistory();
  } catch (e) { alert(e.message || 'Lỗi kết nối máy chủ.'); }
}
async function fetchVipHistory() {
  const table = document.getElementById('buyHistoryTable');
  try {
    const res = await fetch(`${API_BASE}/vip-keys-history`); const result = await res.json();
    if (!res.ok || !result.success) throw new Error('API error');
    document.getElementById('buyHistoryCount').textContent = `${result.data.length} Giao dịch`;
    if (!result.data.length) { table.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-500">Chưa có lịch sử.</td></tr>'; return; }
    table.innerHTML = result.data.map(item => `<tr><td class="p-2 font-bold text-cyber-gold">${escapeHtml(item.key_code)}</td><td class="p-2 text-gray-400">${new Date(item.created_at).toLocaleDateString('vi-VN')}</td><td class="p-2 text-cyber-green">${escapeHtml(item.status)}</td></tr>`).join('');
  } catch (_) { table.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-cyber-red">Không tải được lịch sử VIP.</td></tr>'; }
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
function showCheckModal() { const modal = document.getElementById('checkModal'); modal.classList.remove('hidden'); modal.classList.add('flex'); document.getElementById('modalCheckingState').classList.remove('hidden'); document.getElementById('modalCompletedState').classList.add('hidden'); }
function closeModal() { const modal = document.getElementById('checkModal'); modal.classList.add('hidden'); modal.classList.remove('flex'); }
function triggerExtendFlow(key) { extendingKeyFull = key; document.getElementById('extendTargetKey').textContent = key; document.getElementById('extendBanner').classList.remove('hidden'); switchTab('getKey'); }
function cancelExtend() { extendingKeyFull = null; document.getElementById('extendBanner').classList.add('hidden'); }
function getCreatedKeyAction() { copyText(currentKey); closeModal(); }
function extendCreatedKeyAction() { closeModal(); triggerExtendFlow(currentKey); }
function copyCreatedKey() { copyText(currentKey); }
