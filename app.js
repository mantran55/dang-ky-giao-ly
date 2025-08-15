document.addEventListener('DOMContentLoaded', function() {
  // ====== CẤU HÌNH BACKEND ======
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlaNRO-wF12xFs6EjoI5ufgAfSpIIDCqd0gzkmIAKXe7N7JY2B2nEF0dyQs2Qhyz3svA/exec";

  // ===== DỮ LIỆU TĨNH =====
  const provinces = ["An Giang","Bà Rịa - Vũng Tàu","Bắc Giang","Bắc Kạn","Bạc Liêu","Bắc Ninh","Bến Tre","Bình Định","Bình Dương","Bình Phước","Bình Thuận","Cà Mau","Cao Bằng","Đắk Lắk","Đắk Nông","Điện Biên","Đồng Tháp","Gia Lai","Hà Giang","Hà Nam","Hà Tĩnh","Hải Dương","Hậu Giang","Hòa Bình","Hưng Yên","Khánh Hòa","Kiên Giang","Kon Tum","Lai Châu","Lâm Đồng","Lạng Sơn","Lào Cai","Long An","Nam Định","Nghệ An","Ninh Bình","Ninh Thuận","Phú Thọ","Quảng Bình","Quảng Nam","Quảng Ngãi","Quảng Ninh","Quảng Trị","Sóc Trăng","Sơn La","Tây Ninh","Thái Bình","Thái Nguyên","Thanh Hóa","Thừa Thiên Huế","Tiền Giang","Trà Vinh","Tuyên Quang","Vĩnh Long","Vĩnh Phúc","Yên Bái","Phú Yên","Cần Thơ","Đà Nẵng","Hà Nội","Hải Phòng"];
  const khaiTamClasses = ["Khai Tâm 1A","Khai Tâm 1B","Khai Tâm 1C","Khai Tâm 1D","Khai Tâm 1E","Khai Tâm 2A","Khai Tâm 2B","Khai Tâm 2C","Khai Tâm 2D","Khai Tâm 2E"];
  const xungToiClasses = ["Xưng Tội 1A","Xưng Tội 1B","Xưng Tội 1C","Xưng Tội 1D","Xưng Tội 1E","Xưng Tội 2A","Xưng Tội 2B","Xưng Tội 2C","Xưng Tội 2D"];

  // ===== HELPERS =====
  function formatName(name){
    if (!name) return '';
    return name.toLowerCase().replace(/(^|\s)\p{L}/gu, m => m.toUpperCase());
  }
  function formatDate(dateStr){
    let clean = (dateStr || '').replace(/\D/g,'');
    if (clean.length === 8) return `${clean.slice(0,2)}.${clean.slice(2,4)}.${clean.slice(4,8)}`;
    let parts = (dateStr || '').split(/[\/\-\.]/);
    if (parts.length === 3) return `${parts[0].padStart(2,'0')}.${parts[1].padStart(2,'0')}.${parts[2]}`;
    return dateStr || '';
  }
  function formatPhone(p){
    const d = (p || '').replace(/\D/g,'');
    if (!d) return '';
    if (d.length === 10) return `${d.slice(0,4)}.${d.slice(4,7)}.${d.slice(7,10)}`;
    return p || ''; // luôn có return
  }
  function showMessage(text, type){
    const el = document.getElementById('message');
    el.textContent = text; el.className = 'message ' + type; el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  }

  // ===== AUTOCOMPLETE NƠI SINH =====
  const birthPlaceInput = document.getElementById('birthPlaceOther');
  const suggestionsContainer = document.getElementById('birthPlaceSuggestions');
  let currentFocus = -1;

  birthPlaceInput.addEventListener('input', function(){
    const value = this.value.toLowerCase();
    suggestionsContainer.innerHTML = '';
    currentFocus = -1;
    if (!value){ suggestionsContainer.style.display = 'none'; return; }
    const filtered = provinces.filter(p => p.toLowerCase().includes(value));
    if (filtered.length){
      suggestionsContainer.style.display = 'block';
      filtered.forEach(p => {
        const item = document.createElement('div');
        item.classList.add('autocomplete-suggestion');
        item.textContent = p;
        item.addEventListener('click', function(){
          birthPlaceInput.value = p;
          suggestionsContainer.style.display = 'none';
          document.querySelectorAll('input[name="birthPlace"]').forEach(cb => cb.checked = false);
        });
        suggestionsContainer.appendChild(item);
      });
    } else {
      suggestionsContainer.style.display = 'none';
    }
  });
  birthPlaceInput.addEventListener('keydown', function(e){
    const items = suggestionsContainer.getElementsByClassName('autocomplete-suggestion');
    if (e.key === 'ArrowDown'){ currentFocus++; addActive(items); }
    else if (e.key === 'ArrowUp'){ currentFocus--; addActive(items); }
    else if (e.key === 'Enter'){ e.preventDefault(); if (currentFocus > -1) items[currentFocus].click(); }
  });
  function addActive(items){ if (!items) return; removeActive(items); if (currentFocus >= items.length) currentFocus = 0; if (currentFocus < 0) currentFocus = items.length - 1; items[currentFocus].classList.add('selected'); }
  function removeActive(items){ for (let i=0;i<items.length;i++) items[i].classList.remove('selected'); }
  document.addEventListener('click', e => { if (e.target !== birthPlaceInput) suggestionsContainer.style.display = 'none'; });

  // ===== FORMAT & RÀNG BUỘC UI =====
  document.getElementById('name').addEventListener('blur', function(){ this.value = formatName(this.value); });
  document.getElementById('fatherName').addEventListener('blur', function(){ this.value = formatName(this.value); });
  document.getElementById('motherName').addEventListener('blur', function(){ this.value = formatName(this.value); });
  document.getElementById('dob').addEventListener('blur', function(){ this.value = formatDate(this.value); });
  document.getElementById('baptismDate').addEventListener('blur', function(){ this.value = formatDate(this.value); });
  document.getElementById('fatherPhone').addEventListener('blur', function(){ this.value = formatPhone(this.value); });
  document.getElementById('motherPhone').addEventListener('blur', function(){ this.value = formatPhone(this.value); });

  const khaiTamCheckbox = document.getElementById('khaiTam');
  const xungToiCheckbox = document.getElementById('xungToiRuocLe') || document.getElementById('xungToiRướcLễ');
  const classSelect = document.getElementById('classRegistration');

  // ===== Modal Giáo họ =====
const parishDetailLink = document.getElementById('parishDetailLink');
const parishModal = document.getElementById('parishModal');
const parishModalClose = parishModal.querySelector('.modal-close');
const parishModalBox = parishModal.querySelector('.modal');

// Mở modal
parishDetailLink.addEventListener('click', (e) => {
  e.preventDefault();
  parishModal.classList.add('open');
  parishModal.setAttribute('aria-hidden', 'false');
});

// Đóng modal khi bấm nút ×
parishModalClose.addEventListener('click', () => closeParishModal());

// Đóng modal khi click ra ngoài hộp (click vào overlay)
parishModal.addEventListener('click', (e) => {
  if (!parishModalBox.contains(e.target)) closeParishModal();
});

// Đóng modal bằng phím Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && parishModal.classList.contains('open')) {
    closeParishModal();
  }
});

function closeParishModal(){
  parishModal.classList.remove('open');
  parishModal.setAttribute('aria-hidden', 'true');
}


  function updateClassOptions(){
    const kt = !!(khaiTamCheckbox && khaiTamCheckbox.checked);
    const xt = !!(xungToiCheckbox && xungToiCheckbox.checked);
    classSelect.innerHTML = '';
    if (!kt && !xt){
      classSelect.disabled = true;
      const option = document.createElement('option');
      option.value = ''; option.textContent = 'Vui lòng chọn khối đăng ký trước';
      classSelect.appendChild(option);
    } else {
      classSelect.disabled = false;
      const defaultOption = document.createElement('option');
      defaultOption.value = ''; defaultOption.textContent = '-- Chọn lớp --';
      classSelect.appendChild(defaultOption);
      if (kt){
        const g = document.createElement('optgroup'); g.label = 'Khai Tâm';
        khaiTamClasses.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; g.appendChild(o); });
        classSelect.appendChild(g);
      }
      if (xt){
        const g = document.createElement('optgroup'); g.label = 'Xưng Tội Rước Lễ';
        xungToiClasses.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; g.appendChild(o); });
        classSelect.appendChild(g);
      }
    }
  }
  if (khaiTamCheckbox) khaiTamCheckbox.addEventListener('change', updateClassOptions);
  if (xungToiCheckbox) xungToiCheckbox.addEventListener('change', updateClassOptions);
  updateClassOptions(); // chạy lần đầu

  // “Chưa rửa tội” → khóa/mở các ô liên quan
  document.getElementById('notBaptized').addEventListener('change', function(){
    const baptismDate = document.getElementById('baptismDate');
    const baptismBookNot = document.getElementById('baptismBookNot');
    const baptismBook = document.getElementById('baptismBook');
    const baptismPlaceNot = document.getElementById('baptismPlaceNot');
    const baptismPlaceBienHoa = document.getElementById('baptismPlaceBienHoa');
    const baptismPlaceOther = document.getElementById('baptismPlaceOther');
    if (this.checked){
      baptismDate.disabled = true; baptismDate.value=''; baptismDate.classList.add('disabled');
      baptismBookNot.checked = true; baptismPlaceNot.checked = true;
      baptismBookNot.disabled = true; baptismBook.disabled = true; baptismBook.value=''; baptismBook.classList.add('disabled');
      baptismPlaceNot.disabled = true; baptismPlaceBienHoa.disabled = true; baptismPlaceBienHoa.checked = false;
      baptismPlaceOther.disabled = true; baptismPlaceOther.value=''; baptismPlaceOther.classList.add('disabled');
    } else {
      baptismDate.disabled = false; baptismDate.classList.remove('disabled');
      baptismBookNot.checked = false; baptismPlaceNot.checked = false;
      baptismBookNot.disabled = false; baptismBook.disabled = false; baptismBook.classList.remove('disabled');
      baptismPlaceNot.disabled = false; baptismPlaceBienHoa.disabled = false; baptismPlaceOther.disabled = false; baptismPlaceOther.classList.remove('disabled');
    }
  });

  // “Giáo Xứ Biên Hoà” → khóa ô khác
  document.getElementById('baptismPlaceBienHoa').addEventListener('change', function(){
    const other = document.getElementById('baptismPlaceOther');
    if (this.checked){ other.disabled = true; other.value=''; other.classList.add('disabled'); }
    else { other.disabled = false; other.classList.remove('disabled'); }
  });

  // Checkbox nơi sinh ↔ ô text nơi sinh
  document.querySelectorAll('input[name="birthPlace"]').forEach(cb => {
    cb.addEventListener('change', function(){
      const other = document.getElementById('birthPlaceOther');
      if (this.checked){
        other.disabled = true; other.value=''; other.classList.add('disabled'); suggestionsContainer.style.display='none';
        document.querySelectorAll('input[name="birthPlace"]').forEach(x => { if (x !== this) x.checked = false; });
      } else {
        const any = Array.from(document.querySelectorAll('input[name="birthPlace"]')).some(x => x.checked);
        other.disabled = any; if (!any) other.classList.remove('disabled');
      }
    });
  });
  birthPlaceInput.addEventListener('input', function(){
    if (this.value.trim() !== ''){
      document.querySelectorAll('input[name="birthPlace"]').forEach(cb => cb.checked = false);
      this.classList.remove('disabled');
    }
  });

  // ===== HÀM RESET “BÍ TÍCH” & READY =====
  function resetBaptismUI(){
    const notB = document.getElementById('notBaptized');
    if (notB) notB.checked = false;
    ['baptismDate','baptismBook','baptismPlaceOther','baptismPlaceBienHoa','baptismPlaceNot','baptismBookNot'].forEach(id=>{
      const el = document.getElementById(id);
      if (!el) return;
      el.disabled = false;
      el.classList.remove('disabled');
      if (el.type === 'checkbox') el.checked = false;
      else el.value = '';
    });
  }
  function resetAndReady(){
    document.getElementById('registrationForm').reset();
    resetBaptismUI();
    updateClassOptions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('name').focus();
  }
  document.getElementById('registrationForm').addEventListener('reset', () => {
    setTimeout(() => { resetBaptismUI(); updateClassOptions(); }, 0);
  });

  // ===== SUBMIT → Apps Script (fetch ưu tiên, fallback google.script.run) =====
  document.getElementById('registrationForm').addEventListener('submit', async function(e){
    e.preventDefault();

    const genderEl = document.querySelector('input[name="gender"]:checked');
    const regGroupEl = document.querySelector('input[name="registrationGroup"]:checked');
    if (!regGroupEl){ showMessage('Vui lòng chọn KHỐI đăng ký.', 'error'); return; }
    if (!genderEl){ showMessage('Vui lòng chọn GIỚI TÍNH.', 'error'); return; }

    const notBaptized = !!document.getElementById('notBaptized').checked;

    const formData = {
      name: document.getElementById('name').value || '',
      dob: document.getElementById('dob').value || '',
      birthPlace: getBirthPlace(),
      gender: genderEl.value,
      registrationGroup: regGroupEl.value,
      classRegistration: document.getElementById('classRegistration').value || '',
      notBaptized,
      baptismDate: notBaptized ? 'Chưa rửa tội' : (document.getElementById('baptismDate').value || ''),
      baptismBook: notBaptized ? 'Chưa rửa tội' : getBaptismBook(),
      baptismPlace: notBaptized ? 'Chưa rửa tội' : getBaptismPlace(),
      fatherName: document.getElementById('fatherName').value || '',
      motherName: document.getElementById('motherName').value || '',
      parish: document.getElementById('parish').value || '',
      fatherPhone: document.getElementById('fatherPhone').value || '',
      motherPhone: document.getElementById('motherPhone').value || '',
      address: document.getElementById('address').value || '',
      nameGLV: document.getElementById('nameGLV').value || '',
      notes: document.getElementById('notes').value || ''
    };

    const btn = document.querySelector('.btn-submit');
    const oldBtnText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
    showMessage('Đang gửi...', 'success');

    try {
      if (!(window.google && google.script && google.script.run)) {
        const controller = new AbortController();
        const timeoutMs = 10000;
        const to = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(formData),
          signal: controller.signal
        }).finally(() => clearTimeout(to));

        const json = await res.json().catch(()=>null);
        if (json && json.ok) {
          showMessage('Đăng ký thành công! Dữ liệu đã lưu vào Google Sheet.', 'success');
          resetAndReady();
        } else {
          showMessage('Có lỗi khi lưu dữ liệu. Vui lòng thử lại.', 'error');
        }
        return;
      }

      google.script.run
        .withSuccessHandler(res => {
          if (res && res.ok){
            showMessage('Đăng ký thành công! Dữ liệu đã lưu vào Google Sheet.', 'success');
            resetAndReady();
          } else {
            showMessage('Có lỗi khi lưu dữ liệu. Vui lòng thử lại.', 'error');
          }
        })
        .withFailureHandler(err => {
          showMessage('Lỗi: ' + (err && err.message ? err.message : err), 'error');
        })
        .saveToSheet(formData);

    } catch (err) {
      if (err.name === 'AbortError') showMessage('Hệ thống bận (quá 10 giây). Vui lòng gửi lại.', 'error');
      else showMessage('Lỗi khi gửi: ' + err, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldBtnText;
    }
  });

  // ===== Helpers lấy giá trị =====
  function getBirthPlace(){
    const checked = document.querySelector('input[name="birthPlace"]:checked');
    return checked ? checked.value : (document.getElementById('birthPlaceOther').value || '');
  }
  function getBaptismBook(){
    return document.getElementById('baptismBookNot').checked ? 'Chưa rửa tội' : (document.getElementById('baptismBook').value || '');
  }
  function getBaptismPlace(){
    if (document.getElementById('baptismPlaceNot').checked) return 'Chưa rửa tội';
    if (document.getElementById('baptismPlaceBienHoa').checked) return 'Giáo Xứ Biên Hoà';
    const other = (document.getElementById('baptismPlaceOther').value || '').trim();
    return other ? ('Giáo Xứ ' + other) : '';
  }
});