(function () {
  'use strict';

  let pw = null;
  let bar = null;

  function init() {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        toggle();
      }
    });
    if (new URLSearchParams(location.search).has('edit')) activate();
  }

  function toggle() {
    document.body.classList.contains('cms-edit') ? deactivate() : activate();
  }

  function activate() {
    pw = sessionStorage.getItem('_cms');
    if (!pw) {
      pw = prompt('Password:');
      if (!pw) return;
      sessionStorage.setItem('_cms', pw);
    }
    document.body.classList.add('cms-edit');

    document.querySelectorAll('[data-cms][data-cms-path]').forEach((el) => {
      el.contentEditable = 'true';
      el.spellcheck = false;
      el.addEventListener('click', stopBubble);
      el.addEventListener('mousedown', stopBubble);
    });

    document.addEventListener('click', blockLinks, true);

    document.querySelectorAll('[data-cms-href]').forEach((el) => {
      const input = document.createElement('input');
      input.className = 'cms-url-input';
      input.type = 'text';
      input.value = el.href;
      input.dataset.cms = el.dataset.cms;
      input.dataset.cmsUrlPath = el.dataset.cmsHref;
      el.after(input);
    });

    injectStyles();
    showBar();
  }

  function deactivate() {
    document.body.classList.remove('cms-edit');
    document.querySelectorAll('[data-cms][data-cms-path]').forEach((el) => {
      el.contentEditable = 'inherit';
      el.removeEventListener('click', stopBubble);
      el.removeEventListener('mousedown', stopBubble);
    });
    document.removeEventListener('click', blockLinks, true);
    document.querySelectorAll('.cms-url-input').forEach((el) => el.remove());
    if (bar) { bar.remove(); bar = null; }
    const s = document.getElementById('_cms_styles');
    if (s) s.remove();
  }

  function stopBubble(e) {
    if (document.body.classList.contains('cms-edit')) e.stopPropagation();
  }

  function blockLinks(e) {
    if (!document.body.classList.contains('cms-edit')) return;
    const a = e.target.closest('a');
    if (a && !a.closest('.cms-toolbar')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function showBar() {
    bar = document.createElement('div');
    bar.className = 'cms-toolbar';
    bar.innerHTML =
      '<span class="cms-label">EDIT MODE</span>' +
      '<span class="cms-status"></span>' +
      '<div class="cms-actions">' +
      '<button class="cms-btn" id="_cms_cancel">Cancel</button>' +
      '<button class="cms-btn cms-btn-save" id="_cms_save">Save</button>' +
      '</div>';
    document.body.appendChild(bar);
    document.getElementById('_cms_save').addEventListener('click', doSave);
    document.getElementById('_cms_cancel').addEventListener('click', () => {
      location.href = location.pathname;
    });
  }

  function status(msg) {
    const el = bar && bar.querySelector('.cms-status');
    if (el) el.textContent = msg;
  }

  async function doSave() {
    status('Saving...');

    const edits = {};
    const files = new Set();

    document.querySelectorAll('[data-cms][data-cms-path]').forEach((el) => {
      const f = el.dataset.cms;
      const p = el.dataset.cmsPath;
      files.add(f);
      const k = f + '::' + p;
      if (!edits[k]) edits[k] = [];
      edits[k].push(el.textContent.trim());
    });

    document.querySelectorAll('.cms-url-input').forEach((input) => {
      const f = input.dataset.cms;
      const p = input.dataset.cmsUrlPath;
      files.add(f);
      edits[f + '::' + p] = [input.value.trim()];
    });

    for (const file of files) {
      const src = window.__cms && window.__cms[file];
      if (!src) { status('Missing source data for ' + file); return; }

      const data = structuredClone(src);
      for (const [key, vals] of Object.entries(edits)) {
        const [f, path] = key.split('::');
        if (f !== file) continue;
        setPath(data, path, vals.length > 1 ? vals.filter(Boolean).join(', ') : vals[0]);
      }

      try {
        const res = await fetch('/api/cms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-cms-password': pw },
          body: JSON.stringify({ file, data }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          status(err.error || 'Save failed');
          if (res.status === 401) { sessionStorage.removeItem('_cms'); pw = null; }
          return;
        }
      } catch (e) {
        status('Network error');
        return;
      }
    }

    status('Saved — rebuilding (~30s)');
    const saveBtn = document.getElementById('_cms_save');
    if (saveBtn) saveBtn.disabled = true;
  }

  function setPath(obj, path, val) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      cur = cur[isNaN(keys[i]) ? keys[i] : +keys[i]];
    }
    const last = keys.at(-1);
    cur[isNaN(last) ? last : +last] = val;
  }

  function injectStyles() {
    if (document.getElementById('_cms_styles')) return;
    const s = document.createElement('style');
    s.id = '_cms_styles';
    s.textContent =
      'body.cms-edit { padding-bottom: 60px !important; }' +
      'body.cms-edit .contact-link { bottom: 64px; }' +

      '.cms-edit [data-cms][data-cms-path] {' +
      '  outline: 1px dashed rgba(76,175,124,0.25);' +
      '  outline-offset: 4px;' +
      '  cursor: text;' +
      '  transition: outline-color 200ms;' +
      '  border-radius: 2px;' +
      '}' +
      '.cms-edit [data-cms][data-cms-path]:hover {' +
      '  outline-color: rgba(76,175,124,0.5);' +
      '}' +
      '.cms-edit [data-cms][data-cms-path]:focus {' +
      '  outline: 1px solid #4CAF7C;' +
      '  outline-offset: 4px;' +
      '}' +

      '.cms-url-input {' +
      '  display: block;' +
      '  width: 100%;' +
      '  font-family: "IBM Plex Mono", monospace;' +
      '  font-size: 11px;' +
      '  color: #4CAF7C;' +
      '  background: transparent;' +
      '  border: none;' +
      '  border-bottom: 1px dashed rgba(76,175,124,0.3);' +
      '  padding: 4px 0;' +
      '  margin-top: 4px;' +
      '  outline: none;' +
      '}' +
      '.cms-url-input:focus {' +
      '  border-bottom-color: #4CAF7C;' +
      '  border-bottom-style: solid;' +
      '}' +

      '.cms-toolbar {' +
      '  position: fixed;' +
      '  bottom: 0; left: 0; right: 0;' +
      '  height: 48px;' +
      '  background: #111;' +
      '  color: #ccc;' +
      '  display: flex;' +
      '  align-items: center;' +
      '  padding: 0 24px;' +
      '  font-family: "IBM Plex Mono", monospace;' +
      '  font-size: 11px;' +
      '  letter-spacing: 0.12em;' +
      '  text-transform: uppercase;' +
      '  z-index: 99999;' +
      '  gap: 16px;' +
      '}' +
      '.cms-label { color: #4CAF7C; font-weight: 500; }' +
      '.cms-status { flex: 1; color: #888; }' +
      '.cms-actions { display: flex; gap: 8px; }' +
      '.cms-btn {' +
      '  background: none;' +
      '  border: 1px solid #333;' +
      '  color: #ccc;' +
      '  font-family: inherit;' +
      '  font-size: 11px;' +
      '  letter-spacing: 0.12em;' +
      '  text-transform: uppercase;' +
      '  padding: 6px 16px;' +
      '  cursor: pointer;' +
      '  transition: all 150ms;' +
      '}' +
      '.cms-btn:hover { border-color: #666; color: #fff; }' +
      '.cms-btn-save {' +
      '  background: #4CAF7C;' +
      '  border-color: #4CAF7C;' +
      '  color: #111;' +
      '}' +
      '.cms-btn-save:hover { background: #5cc08d; border-color: #5cc08d; }' +
      '.cms-btn-save:disabled { opacity: 0.5; cursor: default; }';
    document.head.appendChild(s);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
