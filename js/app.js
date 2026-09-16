document.addEventListener('DOMContentLoaded', () => {

  
  const user = Storage.requireAuth('login.html');
  if (!user) return;

  
  startClock('clock');

  
  function loadUserUI() {
    const u = Storage.getSession();
    if (!u) return;

    const initial = (u.username || u.email || '?').charAt(0).toUpperCase();
    const photoURL = u.photoURL || null;

    
    const topAvatar = document.getElementById('topbarAvatar');
    if (topAvatar) {
      if (photoURL) topAvatar.innerHTML = `<img src="${photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      else topAvatar.textContent = initial;
    }

    
    const sideAvatar = document.getElementById('sidebarAvatar');
    if (sideAvatar) {
      if (photoURL) sideAvatar.innerHTML = `<img src="${photoURL}">`;
      else sideAvatar.textContent = initial;
    }
    const sideNameEl = document.getElementById('sidebarName');
    const sideEmailEl = document.getElementById('sidebarEmail');
    if (sideNameEl) sideNameEl.textContent = u.username || '';
    if (sideEmailEl) sideEmailEl.textContent = u.email || '';

    
    const setAvatar = document.getElementById('settingsAvatar');
    if (setAvatar) {
      if (photoURL) setAvatar.innerHTML = `<img src="${photoURL}">`;
      else setAvatar.textContent = initial;
    }
    const setName = document.getElementById('settingsName');
    const setEmail = document.getElementById('settingsEmail');
    const setProv = document.getElementById('settingsProvider');
    if (setName) setName.textContent = u.username || '';
    if (setEmail) setEmail.textContent = u.email || '';
    if (setProv) {
      const provLabel = u.provider === 'google.com' ? 'Google Account' : 'Email / Password';
      const provIcon = u.provider === 'google.com'
        ? '<svg width="12" height="12" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>'
        : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
      setProv.innerHTML = provIcon + provLabel;
    }

    
    const pwCard = document.getElementById('changePwCard');
    if (pwCard) pwCard.style.display = (u.provider === 'google.com') ? 'none' : 'block';

    
    const nameInput = document.getElementById('newDisplayName');
    if (nameInput) nameInput.value = u.username || '';
  }

  loadUserUI();

  
  
  
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const mainContent = document.getElementById('mainContent');
  let sidebarOpen = window.innerWidth > 768;

  function setSidebar(open) {
    sidebarOpen = open;
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('open', open);
      overlay.classList.toggle('show', open);
    } else {
      sidebar.classList.toggle('collapsed', !open);
      mainContent.classList.toggle('expanded', !open);
    }
  }

  window.toggleSidebar = () => setSidebar(!sidebarOpen);

  overlay.addEventListener('click', () => setSidebar(false));

  
  if (window.innerWidth <= 768) {
    setSidebar(false);
  }

  window.switchPage = function(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + page)?.classList.add('active');
    document.getElementById('nav-' + page)?.classList.add('active');
    const titles = { mail: 'Lọc Mail', settings: 'Cài Đặt' };
    document.getElementById('topbarTitle').textContent = titles[page] || '';
    if (window.innerWidth <= 768) setSidebar(false);
  };

  
  
  
  window.closeModal = (id) => document.getElementById(id).classList.remove('show');
  window.confirmLogout = () => document.getElementById('modalLogout').classList.add('show');
  window.confirmDeleteAccount = () => {
    document.getElementById('deletePwConfirm').value = '';
    document.getElementById('modalDelete').classList.add('show');
  };

  window.doLogout = () => {
    Storage.clearSession();
    window.location.href = 'login.html';
  };

  window.doDeleteAccount = async () => {
    const u = Storage.getSession();
    if (!u) return;
    const pw = document.getElementById('deletePwConfirm').value;

    try {
      const auth = firebase.auth();
      const fbUser = auth.currentUser;
      if (!fbUser) { showToast('Phiên đã hết hạn, vui lòng đăng nhập lại.', 'err'); return; }

      if (u.provider !== 'google.com') {
        
        const cred = firebase.auth.EmailAuthProvider.credential(u.email, pw);
        await fbUser.reauthenticateWithCredential(cred);
      }
      await fbUser.delete();
      Storage.clearSession();
      showToast('Tài khoản đã bị xoá.', 'ok');
      setTimeout(() => window.location.href = 'login.html', 1200);
    } catch(e) {
      const msgs = {
        'auth/wrong-password': 'Mật khẩu không đúng.',
        'auth/invalid-credential': 'Mật khẩu không đúng.',
        'auth/requires-recent-login': 'Phiên hết hạn, vui lòng đăng nhập lại.',
      };
      showToast(msgs[e.code] || 'Xoá thất bại: ' + e.message, 'err');
    }
  };

  
  
  
  window.togglePw = (inputId, btn) => {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.querySelector('.ico-eye').style.display = input.type === 'password' ? '' : 'none';
    btn.querySelector('.ico-eye-off').style.display = input.type === 'password' ? 'none' : '';
  };

  window.saveDisplayName = async () => {
    const newName = document.getElementById('newDisplayName').value.trim();
    if (!newName) { showToast('Vui lòng nhập tên mới', 'err'); return; }
    try {
      const fbUser = firebase.auth().currentUser;
      if (fbUser) await fbUser.updateProfile({ displayName: newName });
      const session = Storage.getSession();
      session.username = newName;
      sessionStorage.setItem('nkhn_session_v1', JSON.stringify(session));
      loadUserUI();
      showToast('Đã lưu tên mới!', 'ok');
    } catch(e) { showToast('Lỗi: ' + e.message, 'err'); }
  };

  window.changePassword = async () => {
    const cur = document.getElementById('currentPw').value;
    const nw  = document.getElementById('newPw').value;
    const cnf = document.getElementById('confirmPw').value;
    if (!cur || !nw || !cnf) { showToast('Vui lòng nhập đầy đủ', 'err'); return; }
    if (nw.length < 6)       { showToast('Mật khẩu mới tối thiểu 6 ký tự', 'err'); return; }
    if (nw !== cnf)           { showToast('Mật khẩu mới không khớp', 'err'); return; }
    try {
      const u = Storage.getSession();
      const fbUser = firebase.auth().currentUser;
      const cred = firebase.auth.EmailAuthProvider.credential(u.email, cur);
      await fbUser.reauthenticateWithCredential(cred);
      await fbUser.updatePassword(nw);
      document.getElementById('currentPw').value = '';
      document.getElementById('newPw').value = '';
      document.getElementById('confirmPw').value = '';
      showToast('Đã đổi mật khẩu thành công!', 'ok');
    } catch(e) {
      const msgs = {
        'auth/wrong-password': 'Mật khẩu hiện tại không đúng.',
        'auth/invalid-credential': 'Mật khẩu hiện tại không đúng.',
        'auth/weak-password': 'Mật khẩu mới quá yếu.',
      };
      showToast(msgs[e.code] || e.message, 'err');
    }
  };

  
  // ---- CROP AVATAR ----
  let _cropState = { img: null, x: 0, y: 0, scale: 1, dragging: false, startX: 0, startY: 0, imgNW: 0, imgNH: 0 };

  function openCropModal(src) {
    const modal = document.getElementById('modalCrop');
    const img = document.getElementById('cropImg');
    const container = document.getElementById('cropContainer');
    modal.style.display = 'flex';
    img.src = src;
    img.onload = () => {
      const cw = container.offsetWidth;
      const ch = container.offsetHeight;
      const nat = img.naturalWidth / img.naturalHeight;
      let iw, ih;
      if (nat > 1) { iw = cw; ih = cw / nat; }
      else { ih = ch; iw = ch * nat; }
      _cropState = { img, x: (cw - iw) / 2, y: (ch - ih) / 2, scale: 1, dragging: false, startX: 0, startY: 0, imgNW: iw, imgNH: ih };
      updateCropTransform();
      // draw crop circle
      const r = cw * 0.42;
      const cx = cw / 2, cy = ch / 2;
      document.getElementById('cropCircle').setAttribute('cx', cx);
      document.getElementById('cropCircle').setAttribute('cy', cy);
      document.getElementById('cropCircle').setAttribute('r', r);
      document.getElementById('cropCircleBorder').setAttribute('cx', cx);
      document.getElementById('cropCircleBorder').setAttribute('cy', cy);
      document.getElementById('cropCircleBorder').setAttribute('r', r);
    };
    // zoom
    const zoom = document.getElementById('cropZoom');
    zoom.value = 1;
    zoom.oninput = () => {
      _cropState.scale = parseFloat(zoom.value);
      updateCropTransform();
    };
    // drag
    container.onpointerdown = e => {
      _cropState.dragging = true;
      _cropState.startX = e.clientX - _cropState.x;
      _cropState.startY = e.clientY - _cropState.y;
      container.setPointerCapture(e.pointerId);
    };
    container.onpointermove = e => {
      if (!_cropState.dragging) return;
      _cropState.x = e.clientX - _cropState.startX;
      _cropState.y = e.clientY - _cropState.startY;
      updateCropTransform();
    };
    container.onpointerup = () => { _cropState.dragging = false; };
  }

  function updateCropTransform() {
    const { img, x, y, scale, imgNW, imgNH } = _cropState;
    if (!img) return;
    const sw = imgNW * scale, sh = imgNH * scale;
    const ox = x - (sw - imgNW) / 2;
    const oy = y - (sh - imgNH) / 2;
    img.style.width = sw + 'px';
    img.style.height = sh + 'px';
    img.style.left = ox + 'px';
    img.style.top = oy + 'px';
  }

  window.closeCropModal = () => {
    document.getElementById('modalCrop').style.display = 'none';
    document.getElementById('avatarFile').value = '';
  };

  window.confirmCrop = async () => {
    const container = document.getElementById('cropContainer');
    const img = document.getElementById('cropImg');
    const cw = container.offsetWidth;
    const r = cw * 0.42;
    const cx = cw / 2, cy = cw / 2;
    const size = Math.round(r * 2);
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.clip();
    const rect = img.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    const sx = (cRect.left + cx - r) - rect.left;
    const sy = (cRect.top  + cy - r) - rect.top;
    const ratio = img.naturalWidth / rect.width;
    ctx.drawImage(img, sx * ratio, sy * ratio, size * ratio, size * ratio, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    document.getElementById('modalCrop').style.display = 'none';
    try {
      const fbUser = firebase.auth().currentUser;
      if (fbUser) await fbUser.updateProfile({ photoURL: dataUrl });
      const session = Storage.getSession();
      session.photoURL = dataUrl;
      sessionStorage.setItem('nkhn_session_v1', JSON.stringify(session));
      loadUserUI();
      showToast('Đã cập nhật ảnh đại diện!', 'ok');
    } catch(e) { showToast('Lỗi cập nhật ảnh: ' + e.message, 'err'); }
    document.getElementById('avatarFile').value = '';
  };

  document.getElementById('avatarFile')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('Ảnh quá lớn (tối đa 10MB)', 'err'); return; }
    const reader = new FileReader();
    reader.onload = ev => openCropModal(ev.target.result);
    reader.readAsDataURL(file);
  });

  
  
  
  let files = [], activeFileIdx = -1, rawLines = [], domainMap = {}, selected = new Set();

  const dropZone  = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const pasteArea = document.getElementById('pasteArea');
  const fileTabsEl = document.getElementById('fileTabs');
  const dedupRow   = document.getElementById('dedupRow');

  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));
  dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('over'); addFiles(Array.from(e.dataTransfer.files)); });
  fileInput.addEventListener('change', () => { addFiles(Array.from(fileInput.files)); fileInput.value = ''; });

  function addFiles(newFiles) {
    newFiles.forEach(file => {
      if (!file.name.endsWith('.txt')) return;
      const reader = new FileReader();
      reader.onload = e => {
        const idx = files.findIndex(f => f.name === file.name);
        if (idx >= 0) files[idx].content = e.target.result;
        else files.push({ name: file.name, content: e.target.result });
        renderFileTabs(); switchTab(files.length - 1);
      };
      reader.readAsText(file, 'utf-8');
    });
  }

  function renderFileTabs() {
    if (!files.length) { fileTabsEl.style.display = 'none'; dedupRow.style.display = 'none'; return; }
    fileTabsEl.style.display = 'flex';
    dedupRow.style.display = files.length > 1 ? 'flex' : 'none';
    fileTabsEl.innerHTML = '';
    files.forEach((f, i) => {
      const tab = document.createElement('div');
      tab.className = 'file-tab' + (i === activeFileIdx ? ' active' : '');
      tab.innerHTML = `<span onclick="switchTab(${i})">${f.name}</span>
        <span class="tab-remove" onclick="removeFile(${i})">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </span>`;
      fileTabsEl.appendChild(tab);
    });
    const addBtn = document.createElement('div');
    addBtn.className = 'add-file-btn';
    addBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Thêm file`;
    addBtn.onclick = () => fileInput.click();
    fileTabsEl.appendChild(addBtn);
  }

  window.switchTab = (idx) => {
    if (activeFileIdx >= 0 && activeFileIdx < files.length) files[activeFileIdx].content = pasteArea.value;
    activeFileIdx = idx; pasteArea.value = files[idx].content; renderFileTabs();
  };
  window.removeFile = (idx) => {
    files.splice(idx, 1);
    if (activeFileIdx >= files.length) activeFileIdx = files.length - 1;
    if (files.length > 0) window.switchTab(activeFileIdx < 0 ? 0 : activeFileIdx);
    else { activeFileIdx = -1; pasteArea.value = ''; renderFileTabs(); }
  };

  window.parseData = () => {
    const errMsg = document.getElementById('errMsg');
    errMsg.style.display = 'none';
    if (activeFileIdx >= 0 && activeFileIdx < files.length) files[activeFileIdx].content = pasteArea.value;

    let sources = files.length > 0
      ? files.map(f => ({ name: f.name, text: f.content }))
      : [{ name: 'paste', text: pasteArea.value.trim() }];

    if (!sources[0].text) { errMsg.textContent = 'Chưa có data.'; errMsg.style.display = 'block'; return; }

    const crossDedup = document.getElementById('crossDedup').checked;
    const emailRegex = /([a-zA-Z0-9._%+\-]+@([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}))/;
    const globalSeenLines = new Set(), globalSeenEmails = new Set();
    rawLines = []; domainMap = {};
    let totalDups = 0, totalMails = 0;

    sources.forEach((src, srcIdx) => {
      const localSeen = new Set();
      src.text.split('\n').map(l => l.trim()).filter(l => l).forEach(line => {
        if (localSeen.has(line)) { totalDups++; return; }
        localSeen.add(line);
        if (crossDedup && globalSeenLines.has(line)) { totalDups++; return; }
        globalSeenLines.add(line); rawLines.push(line);
        const m = line.match(emailRegex);
        if (m) {
          const email = m[1].toLowerCase(), domain = m[2].toLowerCase();
          if (crossDedup && globalSeenEmails.has(email)) return;
          globalSeenEmails.add(email);
          if (!domainMap[domain]) domainMap[domain] = [];
          domainMap[domain].push({ line, srcIdx, srcName: src.name });
          totalMails++;
        }
      });
    });

    const domains = Object.keys(domainMap);
    if (!domains.length) { errMsg.textContent = 'Không tìm thấy email nào.'; errMsg.style.display = 'block'; return; }

    document.getElementById('totalLines').textContent   = rawLines.length;
    document.getElementById('totalMails').textContent   = totalMails;
    document.getElementById('totalDomains').textContent = domains.length;
    document.getElementById('totalDups').textContent    = totalDups;
    document.getElementById('statsCard').style.display  = 'block';
    selected.clear(); renderDomains(domains);
    document.getElementById('domainCard').style.display  = 'block';
    document.getElementById('exportCard').style.display  = 'block';
    document.getElementById('resultBox').style.display   = 'none';
    document.getElementById('fileList').innerHTML = '';
  };

  function renderDomains(domains) {
    const grid = document.getElementById('domainGrid');
    grid.innerHTML = '';
    domains.sort().forEach(domain => {
      const entries = domainMap[domain];
      const srcNames = [...new Set(entries.map(e => e.srcName))];
      const div = document.createElement('div');
      div.className = 'domain-btn' + (selected.has(domain) ? ' selected' : '');
      div.dataset.domain = domain;
      const srcHtml = files.length > 1
        ? `<div class="src-tags">${srcNames.map(s => `<span class="src-tag">${s}</span>`).join('')}</div>` : '';
      div.innerHTML = `<label style="display:flex;align-items:center;cursor:pointer;flex:1">
        <input type="checkbox" class="chk" ${selected.has(domain) ? 'checked' : ''} onchange="toggleDomain('${domain}',this.checked)">
        <div><span class="name">${domain}</span>${srcHtml}</div>
      </label><span class="badge">${entries.length} mail</span>`;
      div.onclick = e => { if (e.target.tagName === 'INPUT') return; const cb = div.querySelector('input'); cb.checked = !cb.checked; toggleDomain(domain, cb.checked); };
      grid.appendChild(div);
    });
  }

  window.toggleDomain = (domain, checked) => {
    if (checked) selected.add(domain); else selected.delete(domain);
    document.querySelectorAll('.domain-btn').forEach(b => { if (b.dataset.domain === domain) b.classList.toggle('selected', checked); });
  };
  window.selectAll = () => { Object.keys(domainMap).forEach(d => selected.add(d)); document.querySelectorAll('.domain-btn').forEach(b => { b.classList.add('selected'); b.querySelector('input').checked = true; }); };
  window.clearAll = () => { selected.clear(); document.querySelectorAll('.domain-btn').forEach(b => { b.classList.remove('selected'); b.querySelector('input').checked = false; }); };

  window.exportFiles = () => {
    if (!selected.size) { showToast('Chưa chọn domain nào', 'err'); return; }
    const removedLines = new Set();
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    let delay = 0;
    selected.forEach(domain => {
      const entries = domainMap[domain];
      entries.forEach(e => removedLines.add(e.line));
      setTimeout(() => downloadText(entries.map(e => e.line).join('\n') + '\n', 'dzi_' + domain + '.txt'), delay);
      delay += 200;
      const item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML = `<span class="fname"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>dzi_${domain}.txt</span><span class="fcount">${entries.length} mail</span>`;
      fileList.appendChild(item);
    });
    const remaining = rawLines.filter(l => !removedLines.has(l));
    setTimeout(() => downloadText(remaining.join('\n') + '\n', 'file_goc_con_lai.txt'), delay);
    const rimItem = document.createElement('div');
    rimItem.className = 'file-item';
    rimItem.style.marginTop = '8px';
    rimItem.innerHTML = `<span class="fname" style="color:#d97706"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>file_goc_con_lai.txt</span><span class="fcount">${remaining.length} dòng còn lại (xoá ${rawLines.length - remaining.length})</span>`;
    fileList.appendChild(rimItem);
    document.getElementById('resultBox').style.display = 'block';
    showToast('Xuất file thành công!', 'ok');
  };

  function downloadText(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href);
  }

  
  firebase.auth().onAuthStateChanged(fbUser => {
    if (fbUser) {
      const session = Storage.getSession();
      if (session) {
        session.username = fbUser.displayName || session.username;
        session.photoURL = fbUser.photoURL || session.photoURL || null;
        sessionStorage.setItem('nkhn_session_v1', JSON.stringify(session));
        loadUserUI();
      }
    }
  });
});
