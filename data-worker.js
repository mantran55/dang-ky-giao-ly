let webAppUrl = '';

self.onmessage = function(e) {
  if (e.data.action === 'setUrl') {
    webAppUrl = e.data.url;
  } else if (e.data.action === 'loadData') {
    loadData(true);   // luôn lấy mới
  } else if (e.data.action === 'preloadData') {
    loadData(false);  // preload (có thể dùng cache phía GAS nếu có)
  }
};

function loadData(clearCache = false) {
  const timestamp = Date.now();
  let url = `${webAppUrl}?t=${timestamp}`;
  if (clearCache) url += '&clearCache=true';

  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('Network error');
      return response.json();
    })
    .then(data => {
      const processedData = processData(data);
      self.postMessage({
        action: 'dataLoaded',
        data: processedData,
        isFreshData: clearCache
      });
    })
    .catch(error => {
      self.postMessage({ action: 'error', error: error.message });
    });
}

function processData(data) {
  if (!Array.isArray(data)) {
    // Cho phép server trả {data:[...]} hoặc {rows:[...]}
    if (Array.isArray(data?.data)) data = data.data;
    else if (Array.isArray(data?.rows)) data = data.rows;
  }
  if (!Array.isArray(data) || data.length === 0) return data || [];

  return data.map(row => {
    const out = {};
    Object.keys(row).forEach(key => {
      let value = row[key] ?? '';

      // Bóc dấu ' ở số điện thoại
      if ((key.includes('Số điện thoại') || key.toLowerCase().includes('điện thoại'))
          && typeof value === 'string' && value.startsWith("'")) {
        value = value.substring(1);
      }

      // Ngày giờ
      if (key.includes('Ngày') || key.includes('Thời gian')) {
        const withTime = key.toLowerCase().includes('thời gian');
        value = formatDateVN(value, withTime);
      }

      out[key] = value;
    });
    return out;
  });
}

// Đổi mọi kiểu ngày về VN: dd.MM.yyyy hoặc dd.MM.yyyy HH:mm:ss
function formatDateVN(input, withTime = false) {
  if (!input) return '';
  if (typeof input !== 'string') {
    // Nếu nhận Date object serialize lạ, thử ép chuỗi
    input = String(input);
  }

  // Giữ nguyên nếu đã chuẩn
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(input)) return input;
  if (/^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(input)) return input;

  // ISO UTC: 2025-08-24T01:18:42.000Z hoặc 2025-08-24T01:18:42Z
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(input)) {
    const d = new Date(input); // UTC
    const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000); // +07:00
    const dd = String(vn.getUTCDate()).padStart(2, '0');
    const mm = String(vn.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = vn.getUTCFullYear();
    if (!withTime) return `${dd}.${mm}.${yyyy}`;
    const hh = String(vn.getUTCHours()).padStart(2, '0');
    const mi = String(vn.getUTCMinutes()).padStart(2, '0');
    const ss = String(vn.getUTCSeconds()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}:${ss}`;
  }

  // yyyy-mm-dd -> dd.MM.yyyy
  const ymd = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return `${ymd[3]}.${ymd[2]}.${ymd[1]}`;

  // dd/mm/yyyy, dd-mm-yyyy, 01012003 -> dd.MM.yyyy
  const onlyDigits = input.replace(/[^\d]/g, '');
  if (onlyDigits.length === 8) {
    const dd = onlyDigits.slice(0,2);
    const mm = onlyDigits.slice(2,4);
    const yyyy = onlyDigits.slice(4);
    return `${dd.padStart(2,'0')}.${mm.padStart(2,'0')}.${yyyy}`;
  }
  const parts = input.split(/[.\-/]/).map(s=>s.trim()).filter(Boolean);
  if (parts.length === 3) {
    const [d,m,y] = parts;
    return `${String(d).padStart(2,'0')}.${String(m).padStart(2,'0')}.${y}`;
  }

  return input; // không đổi nếu không nhận diện được
}
