const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function toast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + (type || 'ok');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.className = ''; }, 3000);
}

const DB = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      toast('Storage is full. Try a smaller image.', 'err');
      return false;
    }
  },
  nextId(key) {
    const n = DB.get('seq_' + key, 0) + 1;
    DB.set('seq_' + key, n);
    return n;
  }
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function money(n) {
  return '$' + Number(n).toFixed(2);
}

function placeholder(text) {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#e5e7eb'/><text x='50%' y='50%' fill='#6b7280' font-family='Arial' font-size='22' text-anchor='middle' dominant-baseline='middle'>" + esc(text) + "</text></svg>";
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function field(label, name, type, value, attrs) {
  return `<div class="fg"><label for="f_${name}">${label}</label><input id="f_${name}" name="${name}" type="${type || 'text'}" value="${esc(value || '')}" ${attrs || ''}><small class="err" data-for="${name}"></small></div>`;
}

function setErrors(form, errs) {
  form.querySelectorAll('.err').forEach(e => { e.textContent = ''; });
  form.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
  const keys = Object.keys(errs);
  keys.forEach(k => {
    const el = form.querySelector(`.err[data-for="${k}"]`);
    if (el) el.textContent = errs[k];
    const input = form.querySelector(`[name="${k}"]`);
    if (input) input.classList.add('invalid');
  });
  if (keys.length) {
    const first = form.querySelector('.invalid');
    if (first) first.focus();
  }
  return keys.length === 0;
}

function badge(status) {
  return `<span class="badge ${status}">${status}</span>`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}
