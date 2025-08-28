document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('registrationModal');
  const showBtn = document.getElementById('showRegistrationList');
  const closeBtn = document.querySelector('.close-button');
  const reloadButton = document.getElementById('reloadButton');
  const scrollToTopButton = document.getElementById('scrollToTopButton');
  const listContainer = document.getElementById('registrationList');

  // URL Web App của bạn
  const webAppUrl = 'https://script.google.com/macros/s/AKfycbweCiWPNnEEHkQc1n__81RUDzqAbDRqbXrXTFeko891fvZ-53Ks0-wqwycuX67_ulPvZg/exec';

  const searchInput = document.getElementById('searchInput');
  let originalData = [];
  let worker = null;

  // Ẩn modal khi tải trang
  modal.classList.remove('active');

  function initWorker() {
    worker = new Worker('data-worker.js');

    worker.postMessage({ action: 'setUrl', url: webAppUrl });

    worker.onmessage = function(e) {
      if (e.data.action === 'dataLoaded') {
        const prevCount = originalData.length;
        const data = e.data.data;

        // Bảo vệ: dữ liệu phải là mảng
        if (!Array.isArray(data)) {
          listContainer.innerHTML = `
            <div class="error-container">
              <div class="error-icon">⚠️</div>
              <h3>Lỗi dữ liệu</h3>
              <p>Dữ liệu nhận được không đúng định dạng.</p>
              <button class="retry-button" onclick="loadRegistrationData()">Thử lại</button>
            </div>
          `;
          reloadButton.classList.remove('loading');
          return;
        }

        originalData = data;

        if (e.data.isFreshData) showNotification('Dữ liệu đã được cập nhật!');

        // Hiển thị (đã sort theo STT trong hàm)
        displayRegistrationData(originalData);

        // Nếu là dữ liệu mới hoặc số dòng tăng ⇒ cuộn xuống cuối
        if (e.data.isFreshData || originalData.length > prevCount) {
          scrollToBottom();
        }

        reloadButton.classList.remove('loading');
      } else if (e.data.action === 'error') {
        listContainer.innerHTML = `
          <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h3>Lỗi tải dữ liệu</h3>
            <p>${e.data.error}</p>
            <button class="retry-button" onclick="loadRegistrationData()">Thử lại</button>
          </div>
        `;
        reloadButton.classList.remove('loading');
      }
    };

    worker.onerror = function(error) {
      console.error('Worker error:', error);
      listContainer.innerHTML = `
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h3>Lỗi Worker</h3>
          <p>Không thể khởi tạo worker</p>
          <button class="retry-button" onclick="loadRegistrationData()">Thử lại</button>
        </div>
      `;
      reloadButton.classList.remove('loading');
    };
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }

  function preventBodyScroll() { document.body.style.overflow = 'hidden'; }
  function enableBodyScroll() { document.body.style.overflow = 'auto'; }

  showBtn.addEventListener('click', function() {
    modal.classList.add('active');
    preventBodyScroll();
    loadRegistrationData();
  });

  closeBtn.addEventListener('click', function() {
    modal.classList.remove('active');
    enableBodyScroll();
  });

  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.classList.remove('active');
      enableBodyScroll();
    }
  });

  reloadButton.addEventListener('click', function() {
    reloadButton.classList.add('loading');
    loadFreshData();
  });

  scrollToTopButton.addEventListener('click', function() {
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function updateScrollButtonVisibility() {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    if (modalBody.scrollTop > 100) scrollToTopButton.classList.add('visible');
    else scrollToTopButton.classList.remove('visible');
  }

  function loadRegistrationData() {
    listContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Đang tải dữ liệu...</div>
        <div class="progress-bar"><div class="progress-fill"></div></div>
      </div>
    `;
    if (!worker) initWorker();
    setTimeout(() => worker.postMessage({ action: 'preloadData' }), 300);
  }

  function loadFreshData() {
    listContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Đang tải dữ liệu mới nhất...</div>
        <div class="progress-bar"><div class="progress-fill"></div></div>
      </div>
    `;
    if (!worker) initWorker();
    setTimeout(() => worker.postMessage({ action: 'loadData' }), 300);
  }

  // Tìm kiếm: lọc trực tiếp originalData và hiển thị
  searchInput.addEventListener('keyup', function() {
    const searchTerm = this.value.toLowerCase();
    const filteredData = originalData.filter(row =>
      Object.values(row).some(value => String(value).toLowerCase().includes(searchTerm))
    );
    displayRegistrationData(filteredData);
  });

  function toInt(v){ const n = parseInt(v,10); return isNaN(n)?0:n; }

  function displayRegistrationData(data) {
    if (!data || data.length === 0) {
      listContainer.innerHTML = '<p>Không có dữ liệu đăng ký.</p>';
      return;
    }

    // Sắp xếp theo STT tăng dần để bản ghi mới ở dưới
    const ordered = [...data].sort((a,b) => toInt(a['STT']) - toInt(b['STT']));
    const headers = Object.keys(ordered[0]);

    let table = `
      <div class="table-container">
        <table class="registration-table">
          <thead><tr>
    `;

    headers.forEach((header, index) => {
      const isFirstFour = index < 4;
      const className = isFirstFour ? 'class="sticky-column"' : '';
      table += `<th ${className}>${header}</th>`;
    });

    table += `
          </tr></thead>
          <tbody>
    `;

    ordered.forEach(row => {
      table += '<tr>';
      headers.forEach((header, index) => {
        const isFirstFour = index < 4;
        const className = isFirstFour ? 'class="sticky-column"' : '';
        table += `<td ${className}>${row[header] ?? ''}</td>`;
      });
      table += '</tr>';
    });

    table += `
          </tbody>
        </table>
      </div>
    `;

    listContainer.innerHTML = table;
    // KHÔNG kéo lên đầu nữa
    // Tự động hiện/ẩn nút scroll-to-top theo cuộn
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) modalBody.addEventListener('scroll', updateScrollButtonVisibility, { passive: true });
  }

  function scrollToBottom() {
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) modalBody.scrollTop = modalBody.scrollHeight;
  }

  // Quan sát mở modal để gắn listener cuộn
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        if (modal.classList.contains('active')) {
          const modalBody = document.querySelector('.modal-body');
          if (modalBody) modalBody.addEventListener('scroll', updateScrollButtonVisibility, { passive: true });
          // Khi mở modal lần đầu, kéo xuống cuối nếu đã có dữ liệu
          if (originalData.length) scrollToBottom();
        }
      }
    });
  });
  observer.observe(modal, { attributes: true });

  // Preload dữ liệu khi trang tải xong
  setTimeout(() => {
    if (!worker) initWorker();
    worker.postMessage({ action: 'preloadData' });
  }, 2000);
});
