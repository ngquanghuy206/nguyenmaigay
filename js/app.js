/**
 * app.js
 * Logic chính của tool lọc mail theo domain.
 * Yêu cầu đăng nhập (storage.js guard).
 */

document.addEventListener('DOMContentLoaded', () => {
  // ---- Auth guard ----
  const user = Storage.requireAuth('login.html');
  if (!user) return;

  // ---- Hiển thị user info ----
  const avatarEl = document.getElementById('userAvatar');
  const nameEl   = document.getElementById('userName');
  if (avatarEl) {
    avatarEl.textContent = '';
    avatarEl.textContent = user.username.charAt(0).toUpperCase();
  }
  if (nameEl) nameEl.textContent = user.username;

  // ---- Logout ----
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    Storage.clearSession();
    window.location.href = 'login.html';
  });

  // ---- Clock ----
  startClock('clock');

  // ==================================
  //  MULTI-FILE STATE
  // ==================================
  let files = [];
  let activeFileIdx = -1;
  let rawLines = [];
  let domainMap = {};
  let selected = new Set();

  const dropZone   = document.getElementById('dropZone');
  const fileInput  = document.getElementById('fileInput');
  const pasteArea  = document.getElementById('pasteArea');
  const fileTabsEl = document.getElementById('fileTabs');
  const dedupRow   = document.getElementById('dedupRow');

  // ---- Drop zone ----
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('over');
    addFiles(Array.from(e.dataTransfer.files));
  });
  fileInput.addEventListener('change', () => {
    addFiles(Array.from(fileInput.files));
    fileInput.value = '';
  });

  // ---- Add files ----
  function addFiles(newFiles) {
    newFiles.forEach(file => {
      if (!file.name.endsWith('.txt')) return;
      const reader = new FileReader();
      reader.onload = e => {
        const idx = files.findIndex(f => f.name === file.name);
        if (idx >= 0) files[idx].content = e.target.result;
        else files.push({ name: file.name, content: e.target.result });
        renderFileTabs();
        switchTab(files.length - 1);
      };
      reader.readAsText(file, 'utf-8');
    });
  }

  // ---- Render tabs ----
  function renderFileTabs() {
    if (files.length === 0) {
      fileTabsEl.style.display = 'none';
      dedupRow.style.display = 'none';
      return;
    }
    fileTabsEl.style.display = 'flex';
    dedupRow.style.display = files.length > 1 ? 'flex' : 'none';
    fileTabsEl.innerHTML = '';
    files.forEach((f, i) => {
      const tab = document.createElement('div');
      tab.className = 'file-tab' + (i === activeFileIdx ? ' active' : '');
      tab.innerHTML = `<span onclick="switchTab(${i})">${f.name}</span>
        <span class="tab-remove" onclick="removeFile(${i})" title="Xoá file">
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

  // expose to inline onclick
  window.switchTab = function(idx) {
    if (activeFileIdx >= 0 && activeFileIdx < files.length)
      files[activeFileIdx].content = pasteArea.value;
    activeFileIdx = idx;
    pasteArea.value = files[idx].content;
    renderFileTabs();
  };

  window.removeFile = function(idx) {
    files.splice(idx, 1);
    if (activeFileIdx >= files.length) activeFileIdx = files.length - 1;
    if (files.length > 0) {
      window.switchTab(activeFileIdx < 0 ? 0 : activeFileIdx);
    } else {
      activeFileIdx = -1;
      pasteArea.value = '';
      renderFileTabs();
    }
  };

  // ==================================
  //  PARSE
  // ==================================
  window.parseData = function() {
    const errMsg = document.getElementById('errMsg');
    errMsg.style.display = 'none';

    if (activeFileIdx >= 0 && activeFileIdx < files.length)
      files[activeFileIdx].content = pasteArea.value;

    let sources = [];
    if (files.length > 0) {
      files.forEach(f => sources.push({ name: f.name, text: f.content }));
    } else {
      const t = pasteArea.value.trim();
      if (!t) { errMsg.textContent = 'Chưa có data.'; errMsg.style.display = 'block'; return; }
      sources.push({ name: 'paste', text: t });
    }

    const crossDedup = document.getElementById('crossDedup').checked;
    const emailRegex = /([a-zA-Z0-9._%+\-]+@([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}))/;

    const globalSeenLines  = new Set();
    const globalSeenEmails = new Set();
    rawLines = [];
    domainMap = {};
    let totalDups = 0, totalMails = 0;

    sources.forEach((src, srcIdx) => {
      const allLines = src.text.split('\n').map(l => l.trim()).filter(l => l);
      const localSeen = new Set();

      allLines.forEach(line => {
        if (localSeen.has(line)) { totalDups++; return; }
        localSeen.add(line);
        if (crossDedup && globalSeenLines.has(line)) { totalDups++; return; }
        globalSeenLines.add(line);
        rawLines.push(line);

        const m = line.match(emailRegex);
        if (m) {
          const email  = m[1].toLowerCase();
          const domain = m[2].toLowerCase();
          if (crossDedup && globalSeenEmails.has(email)) return;
          globalSeenEmails.add(email);
          if (!domainMap[domain]) domainMap[domain] = [];
          domainMap[domain].push({ line, srcIdx, srcName: src.name });
          totalMails++;
        }
      });
    });

    const domains = Object.keys(domainMap);
    if (domains.length === 0) {
      errMsg.textContent = 'Không tìm thấy email nào.';
      errMsg.style.display = 'block';
      return;
    }

    document.getElementById('totalLines').textContent   = rawLines.length;
    document.getElementById('totalMails').textContent   = totalMails;
    document.getElementById('totalDomains').textContent = domains.length;
    document.getElementById('totalDups').textContent    = totalDups;
    document.getElementById('statsCard').style.display  = 'block';

    selected.clear();
    renderDomains(domains);
    document.getElementById('domainCard').style.display  = 'block';
    document.getElementById('exportCard').style.display  = 'block';
    document.getElementById('resultBox').style.display   = 'none';
    document.getElementById('fileList').innerHTML = '';
  };

  // ==================================
  //  DOMAIN LIST
  // ==================================
  function renderDomains(domains) {
    const grid = document.getElementById('domainGrid');
    grid.innerHTML = '';
    domains.sort().forEach(domain => {
      const entries  = domainMap[domain];
      const srcNames = [...new Set(entries.map(e => e.srcName))];
      const div = document.createElement('div');
      div.className = 'domain-btn' + (selected.has(domain) ? ' selected' : '');
      div.dataset.domain = domain;

      const srcHtml = files.length > 1
        ? `<div class="src-tags">${srcNames.map(s => `<span class="src-tag">${s}</span>`).join('')}</div>`
        : '';

      div.innerHTML = `<label style="display:flex;align-items:center;cursor:pointer;flex:1">
        <input type="checkbox" class="chk" ${selected.has(domain) ? 'checked' : ''}
          onchange="toggleDomain('${domain}', this.checked)">
        <div><span class="name">${domain}</span>${srcHtml}</div>
      </label>
      <span class="badge">${entries.length} mail</span>`;

      div.onclick = e => {
        if (e.target.tagName === 'INPUT') return;
        const cb = div.querySelector('input');
        cb.checked = !cb.checked;
        toggleDomain(domain, cb.checked);
      };
      grid.appendChild(div);
    });
  }

  window.toggleDomain = function(domain, checked) {
    if (checked) selected.add(domain); else selected.delete(domain);
    document.querySelectorAll('.domain-btn').forEach(btn => {
      if (btn.dataset.domain === domain) btn.classList.toggle('selected', checked);
    });
  };

  window.selectAll = function() {
    Object.keys(domainMap).forEach(d => selected.add(d));
    document.querySelectorAll('.domain-btn').forEach(btn => {
      btn.classList.add('selected');
      btn.querySelector('input').checked = true;
    });
  };

  window.clearAll = function() {
    selected.clear();
    document.querySelectorAll('.domain-btn').forEach(btn => {
      btn.classList.remove('selected');
      btn.querySelector('input').checked = false;
    });
  };

  // ==================================
  //  EXPORT
  // ==================================
  window.exportFiles = function() {
    if (selected.size === 0) { showToast('Chưa chọn domain nào', 'err'); return; }

    const removedLines = new Set();
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    let delay = 0;

    selected.forEach(domain => {
      const entries = domainMap[domain];
      entries.forEach(e => removedLines.add(e.line));
      const content  = entries.map(e => e.line).join('\n') + '\n';
      const filename = 'dzi_' + domain + '.txt';
      setTimeout(() => downloadText(content, filename), delay);
      delay += 200;

      const item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML = `
        <span class="fname">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          ${filename}
        </span>
        <span class="fcount">${entries.length} mail</span>`;
      fileList.appendChild(item);
    });

    const remaining = rawLines.filter(l => !removedLines.has(l));
    setTimeout(() => downloadText(remaining.join('\n') + '\n', 'file_goc_con_lai.txt'), delay);

    const rimItem = document.createElement('div');
    rimItem.className = 'file-item';
    rimItem.style.marginTop = '8px';
    rimItem.innerHTML = `
      <span class="fname" style="color:#e67e22">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e67e22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        file_goc_con_lai.txt
      </span>
      <span class="fcount">${remaining.length} dòng còn lại (xoá ${rawLines.length - remaining.length})</span>`;
    fileList.appendChild(rimItem);

    document.getElementById('resultBox').style.display = 'block';
    showToast('Xuất file thành công!', 'ok');
  };

  function downloadText(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
});
