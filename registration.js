// registration.js
document.addEventListener('DOMContentLoaded', function () {
  const webAppUrl = 'https://script.google.com/macros/s/AKfycbweCiWPNnEEHkQc1n__81RUDzqAbDRqbXrXTFeko891fvZ-53Ks0-wqwycuX67_ulPvZg/exec';

  const FILTER_TABLE_BY_KHOI = true;

  const modal               = document.getElementById('registrationModal');
  const showBtn             = document.getElementById('showRegistrationList');
  const closeBtn            = document.querySelector('.close-button');
  const reloadButton        = document.getElementById('reloadButton');
  const scrollToTopButton   = document.getElementById('scrollToTopButton');
  const listContainer       = document.getElementById('registrationList');
  const searchInput         = document.getElementById('searchInput');

  modal.classList.remove('active');

  let khoiSelect = null;  
  let statsMeta  = null;   
  let chipsBox   = null;   

  (function ensureStatsUI () {
    const header = document.querySelector('.modal-header');
    if (!header) return;

    let headerLeft = header.querySelector('.header-left');
    if (!headerLeft) {
      headerLeft = document.createElement('div');
      headerLeft.className = 'header-left';
      header.insertBefore(headerLeft, header.firstElementChild);
    }

    const title = header.querySelector('h2');
    if (title && title.parentElement !== headerLeft) headerLeft.appendChild(title);

    if (!document.getElementById('statsContainer')) {
      const stats = document.createElement('div');
      stats.id = 'statsContainer';
      stats.className = 'stats-card';
      stats.innerHTML = `
        <div class="stats-controls">
          <label for="khoiSelect" style="color:#fff; margin-right:8px;">Khối:</label>
          <select id="khoiSelect">
            <option value="">Tất cả</option>
          </select>
          <div class="stats-meta">Tổng: 0 bản ghi</div>
        </div>
        <div class="stats-chips"></div>
      `;
      headerLeft.appendChild(stats);
    }

    khoiSelect = document.getElementById('khoiSelect');
    statsMeta  = document.querySelector('#statsContainer .stats-meta');
    chipsBox   = document.querySelector('#statsContainer .stats-chips');
  })();

  const state = {
    data: [],         
    searchTerm: '',    
    khoi: '',          
    classFilter: null, 
  };

  let worker = null;

  function initWorker () {
    worker = new Worker('data-worker.js');
    worker.postMessage({ action: 'setUrl', url: webAppUrl });

    worker.onmessage = (e) => {
      if (e.data.action === 'dataLoaded') {
        const prevLen = state.data.length;
        const data = e.data.data;

        if (!Array.isArray(data)) {
          renderError('Dữ liệu nhận được không đúng định dạng.');
          reloadButton.classList.remove('loading');
          return;
        }

        state.data = data;
        if (e.data.isFreshData) showNotification('Dữ liệu đã được cập nhật!');

        buildKhoiOptions(state.data);
        applyFiltersAndRender();

        if (e.data.isFreshData || state.data.length > prevLen) scrollToBottom();

        reloadButton.classList.remove('loading');
      } else if (e.data.action === 'error') {
        renderError(e.data.error || 'Lỗi tải dữ liệu');
        reloadButton.classList.remove('loading');
      }
    };

    worker.onerror = () => {
      renderError('Không thể khởi tạo worker');
      reloadButton.classList.remove('loading');
    };
  }

  function renderError (message) {
    listContainer.innerHTML = `
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>Lỗi tải dữ liệu</h3>
        <p>${escapeHtml(message)}</p>
        <button class="retry-button" onclick="loadRegistrationData()">Thử lại</button>
      </div>`;
  }

  function showNotification (message) {
    const n = document.createElement('div');
    n.className = 'notification';
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => n.classList.add('show'), 10);
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 3000);
  }

  function preventBodyScroll () { document.body.style.overflow = 'hidden'; }
  function enableBodyScroll ()  { document.body.style.overflow = 'auto'; }

  function updateScrollButtonVisibility () {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    if (modalBody.scrollTop > 100) scrollToTopButton.classList.add('visible');
    else scrollToTopButton.classList.remove('visible');
  }

  function loadRegistrationData () {
    listContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Đang tải dữ liệu...</div>
        <div class="progress-bar"><div class="progress-fill"></div></div>
      </div>`;
    if (!worker) initWorker();
    setTimeout(() => worker.postMessage({ action: 'preloadData' }), 300);
  }

  function loadFreshData () {
    listContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Đang tải dữ liệu mới nhất...</div>
        <div class="progress-bar"><div class="progress-fill"></div></div>
      </div>`;
    if (!worker) initWorker();
    setTimeout(() => worker.postMessage({ action: 'loadData' }), 300);
  }

  function scrollToBottom () {
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) modalBody.scrollTop = modalBody.scrollHeight;
  }

  function toInt (v) { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  function escapeHtml (s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function escapeHtmlAttr (s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

  function getKhoi (row) {
    return (row['Khối đăng ký'] || row.registrationGroup || '').toString().trim();
  }
  function getClassKey (row) {
    return (row['Lớp đăng ký'] || row.classRegistration || '').toString().trim();
  }

  function classOrderKey (k) {
    const m = String(k).match(/(\d+)\s*([A-Za-zÀ-ỹ])$/);
    if (!m) return [999, String(k)];
    return [parseInt(m[1], 10), m[2].toUpperCase()];
  }

  function prettyClassLabel (name) {
    if (state.khoi) {
      return String(name).replace(new RegExp(`^${state.khoi}\\s*`, 'i'), '').trim();
    }
    return String(name);
  }

  function buildKhoiOptions (data) {
    if (!khoiSelect) return;
    const set = new Set();
    data.forEach(r => { const k = getKhoi(r); if (k) set.add(k); });

    const favOrder = ['Khai Tâm', 'Xưng Tội', 'Thêm Sức', 'Sống Đạo', 'Vào Đời'];
    const sorted = [...set].sort((a, b) => {
      const ia = favOrder.indexOf(a), ib = favOrder.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1) - (ib === -1) || ia - ib;
      return a.localeCompare(b, 'vi');
    });

    const cur = khoiSelect.value;
    khoiSelect.innerHTML = `<option value="">Tất cả</option>` +
      sorted.map(k => `<option value="${escapeHtmlAttr(k)}" ${k===cur?'selected':''}>${escapeHtml(k)}</option>`).join('');
  }

  function renderStats (baseData) {
    if (!khoiSelect || !statsMeta || !chipsBox) return;

    const subset = state.khoi ? baseData.filter(r => getKhoi(r) === state.khoi) : baseData;

    const map = new Map();
    subset.forEach(r => {
      const cls = getClassKey(r);
      if (!cls) return;
      map.set(cls, (map.get(cls) || 0) + 1);
    });

    const items = [...map.entries()].sort((a, b) => {
      const ka = classOrderKey(a[0]), kb = classOrderKey(b[0]);
      return ka[0] - kb[0] || ('' + ka[1]).localeCompare(kb[1]);
    });

    statsMeta.textContent = `Tổng: ${subset.length} bản ghi`;

    chipsBox.innerHTML = items.length
      ? items.map(([fullName, cnt]) => {
          const active = state.classFilter === fullName ? 'active' : '';
          const label  = prettyClassLabel(fullName);
          return `
            <button type="button"
                    class="chip ${active}"
                    data-class="${escapeHtmlAttr(fullName)}">
              ${escapeHtml(label)}: <b>${cnt}</b>
            </button>`;
        }).join('')
      : `<em style="opacity:.9">Không có lớp nào</em>`;
  }

  function displayRegistrationData (data) {
    if (!data || data.length === 0) {
      listContainer.innerHTML = '<p>Không có dữ liệu đăng ký.</p>';
      return;
    }
    const ordered = [...data].sort((a, b) => toInt(a['STT']) - toInt(b['STT']));
    const headers = Object.keys(ordered[0] || {});

    let html = `
      <div class="table-container">
        <table class="registration-table">
          <thead><tr>`;
    headers.forEach((h, i) => {
      html += `<th ${i<4?'class="sticky-column"':''}>${escapeHtml(h)}</th>`;
    });
    html += `</tr></thead><tbody>`;

    ordered.forEach(row => {
      html += `<tr>`;
      headers.forEach((h, i) => {
        const v = row[h] == null ? '' : row[h];
        html += `<td ${i<4?'class="sticky-column"':''}>${escapeHtml(v)}</td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    listContainer.innerHTML = html;

    const modalBody = document.querySelector('.modal-body');
    if (modalBody) modalBody.addEventListener('scroll', updateScrollButtonVisibility, { passive: true });
  }

  function applyFiltersAndRender () {
    let view = state.data.filter(row =>
      Object.values(row).some(v => String(v ?? '').toLowerCase().includes(state.searchTerm))
    );

    const byKhoi = (FILTER_TABLE_BY_KHOI && state.khoi)
      ? view.filter(r => getKhoi(r) === state.khoi)
      : view;

    const byClass = state.classFilter
      ? byKhoi.filter(r => getClassKey(r) === state.classFilter)
      : byKhoi;

    displayRegistrationData(byClass);
    renderStats(view); 
  }

  showBtn.addEventListener('click', () => {
    modal.classList.add('active');
    preventBodyScroll();
    loadRegistrationData();
  });
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    enableBodyScroll();
  });
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      enableBodyScroll();
    }
  });

  reloadButton.addEventListener('click', () => {
    reloadButton.classList.add('loading');
    loadFreshData();
  });

  scrollToTopButton.addEventListener('click', () => {
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' });
  });

  searchInput.addEventListener('keyup', function () {
    state.searchTerm = this.value.toLowerCase();
    applyFiltersAndRender();
  });

  if (khoiSelect) {
    khoiSelect.addEventListener('change', function () {
      state.khoi = this.value;
      state.classFilter = null;
      applyFiltersAndRender();
    });
  }

  if (chipsBox) {
    chipsBox.addEventListener('click', function (e) {
      const chip = e.target.closest('.chip');
      if (!chip || !chip.dataset.class) return;
      const clicked = chip.dataset.class;
      state.classFilter = (state.classFilter === clicked) ? null : clicked;
      applyFiltersAndRender();

      const modalBody = document.querySelector('.modal-body');
      if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const observer = new MutationObserver(muts => {
    muts.forEach(m => {
      if (m.type === 'attributes' && m.attributeName === 'class') {
        if (modal.classList.contains('active')) {
          const modalBody = document.querySelector('.modal-body');
          if (modalBody) modalBody.addEventListener('scroll', updateScrollButtonVisibility, { passive: true });

          if (state.data.length) {
            applyFiltersAndRender();
            scrollToBottom();
          }
        }
      }
    });
  });
  observer.observe(modal, { attributes: true });

  setTimeout(() => {
    if (!worker) initWorker();
    worker.postMessage({ action: 'preloadData' });
  }, 800);
});
