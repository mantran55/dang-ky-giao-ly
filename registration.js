const scrollToTopButton = document.getElementById('scrollToTopButton');
scrollToTopButton.addEventListener('click', function() {
  const modalBody = document.querySelector('.modal-body');
  if (modalBody) {
    modalBody.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
});

function updateScrollButtonVisibility() {
  const modalBody = document.querySelector('.modal-body');
  if (modalBody) {
    if (modalBody.scrollTop > 100) {
      scrollToTopButton.classList.add('visible');
    } else {
      scrollToTopButton.classList.remove('visible');
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('registrationModal');
  const showBtn = document.getElementById('showRegistrationList');
  const closeBtn = document.querySelector('.close-button');
  const reloadButton = document.getElementById('reloadButton');
  const listContainer = document.getElementById('registrationList');
  
  const webAppUrl = 'https://script.google.com/macros/s/AKfycbyQBdZV5E1pAyRv_0KALwn7FuqpIqXivf1NPCK-5l1id3V4rxl89si8rUpYjjShyxJU/exec';
  
  const searchInput = document.getElementById('searchInput');
  let originalData = [];
  let worker = null;
  
  modal.classList.remove('active');
  
  function initWorker() {
    worker = new Worker('data-worker.js');
    
    worker.postMessage({
      action: 'setUrl',
      url: webAppUrl
    });
    
    worker.onmessage = function(e) {
      if (e.data.action === 'dataLoaded') {
        originalData = e.data.data;
        
        if (e.data.isFreshData) {
          showNotification('Dữ liệu đã được cập nhật!');
        }
        
        displayRegistrationData(originalData);
        
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
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  function preventBodyScroll() {
    document.body.style.overflow = 'hidden';
  }
  
  function enableBodyScroll() {
    document.body.style.overflow = 'auto';
  }
  
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
  
  function loadRegistrationData() {
    listContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Đang tải dữ liệu...</div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
    `;
    
    if (!worker) {
      initWorker();
    }
    
    setTimeout(() => {
      worker.postMessage({
        action: 'preloadData'
      });
    }, 300);
  }
  
  function loadFreshData() {
    listContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Đang tải dữ liệu mới nhất...</div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
    `;
    
    if (!worker) {
      initWorker();
    }
    
    setTimeout(() => {
      worker.postMessage({
        action: 'loadData'
      });
    }, 300);
  }
  
  searchInput.addEventListener('keyup', function() {
    const searchTerm = this.value.toLowerCase();
    const filteredData = originalData.filter(row => {
      return Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm)
      );
    });
    displayRegistrationData(filteredData);
  });
  
  function displayRegistrationData(data) {
  if (!data || data.length === 0) {
    listContainer.innerHTML = '<p>Không có dữ liệu đăng ký.</p>';
    return;
  }
  
  // Lấy tên các cột từ phần tử đầu tiên
  const headers = Object.keys(data[0]);
  
  // Tạo bảng với cấu trúc đúng cho sticky header và column
  let table = `
    <div class="table-container">
      <table class="registration-table">
        <thead>
          <tr>
  `;
  
  // Tạo header
  headers.forEach((header, index) => {
    // Thêm class đặc biệt cho 4 cột đầu tiên
    const isFirstFour = index < 4;
    const className = isFirstFour ? 'class="sticky-column"' : '';
    table += `<th ${className}>${header}</th>`;
  });
  
  table += `
          </tr>
        </thead>
        <tbody>
  `;
  
  // Tạo các dòng dữ liệu
  data.forEach(row => {
    table += '<tr>';
    headers.forEach((header, index) => {
      // Thêm class đặc biệt cho 4 cột đầu tiên
      const isFirstFour = index < 4;
      const className = isFirstFour ? 'class="sticky-column"' : '';
      table += `<td ${className}>${row[header]}</td>`;
    });
    table += '</tr>';
  });
  
  table += `
        </tbody>
      </table>
    </div>
  `;
  
  // Hiển thị bảng
  listContainer.innerHTML = table;
  
  // Tự động cuộn xuống dưới cùng sau khi render
  setTimeout(() => {
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
      modalBody.scrollTop = modalBody.scrollHeight;
    }
  }, 100);
}
    
    setTimeout(() => {
      if (!worker) {
        initWorker();
      }
      worker.postMessage({
        action: 'preloadData'
      });
    }, 2000);

    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (modal.classList.contains('active')) {
            const modalBody = document.querySelector('.modal-body');
            if (modalBody) {
              modalBody.addEventListener('scroll', updateScrollButtonVisibility);
            }
          }
        }
      });
    });
    
    observer.observe(modal, { attributes: true });
});