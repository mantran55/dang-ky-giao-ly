// data-worker.js
let webAppUrl = '';

self.onmessage = function(e) {
  if (e.data.action === 'setUrl') {
    webAppUrl = e.data.url;
  } else if (e.data.action === 'loadData') {
    // Luôn xóa cache khi tải dữ liệu
    loadData(true);
  } else if (e.data.action === 'preloadData') {
    // Preload không xóa cache
    loadData(false);
  }
};

function loadData(clearCache = false) {
  // Thêm timestamp để tránh cache trình duyệt
  const timestamp = new Date().getTime();
  let url = `${webAppUrl}?t=${timestamp}`;
  
  if (clearCache) {
    url += '&clearCache=true';
  }
  
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('Network error');
      return response.json();
    })
    .then(data => {
      // Xử lý dữ liệu trước khi gửi về main thread
      const processedData = processData(data);
      self.postMessage({
        action: 'dataLoaded',
        data: processedData,
        isFreshData: clearCache
      });
    })
    .catch(error => {
      self.postMessage({
        action: 'error',
        error: error.message
      });
    });
}

function processData(data) {
  if (!data || data.length === 0) return data;
  
  // Xử lý định dạng ngày tháng
  return data.map(row => {
    const processedRow = {};
    
    Object.keys(row).forEach(key => {
      let value = row[key] || '';
      
      // Xử lý số điện thoại
      if (key.includes('Số điện thoại') && value.startsWith("'")) {
        value = value.substring(1);
      }
      
      // Xử lý ngày tháng
      if (key.includes('Ngày') || key.includes('Thời gian')) {
        value = formatDate(value);
      }
      
      processedRow[key] = value;
    });
    
    return processedRow;
  });
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  // Nếu đã là định dạng dd.mm.yyyy thì trả về luôn
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch (e) {
    return dateString;
  }
}