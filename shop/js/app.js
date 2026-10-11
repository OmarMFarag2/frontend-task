const app = document.getElementById('app');

const views = {
  'login': viewLogin,
  'register': viewRegister,
  'products': viewProducts,
  'wishlist': viewWishlist,
  'cart': viewCart,
  'orders': viewOrders,
  'admin/products': viewAdminProducts,
  'admin/categories': viewAdminCategories,
  'admin/orders': viewAdminOrders,
  'admin/admins': viewAdminAdmins
};

const forms = { ...authForms, ...adminForms };

const actions = {
  ...customerActions,
  ...adminActions,
  logout() {
    Auth.logout();
    state.filters = { search: '', category: '', min: '', max: '', sort: '', stock: false };
    state.editProduct = null;
    state.editCategory = null;
    toast('You have been logged out');
    location.hash = '#/login';
  }
};

function renderNav() {
  const nav = document.getElementById('nav');
  const u = Auth.current();
  const path = location.hash.replace(/^#\//, '');
  const link = (p, label) => `<a href="#/${p}" class="${path === p ? 'on' : ''}">${label}</a>`;
  if (!u) {
    nav.innerHTML = `<a class="brand" href="#/login">ShopEase</a><nav>${link('login', 'Login')}${link('register', 'Register')}</nav>`;
    return;
  }
  let links;
  if (u.role === 'admin') {
    links = link('admin/products', 'Products') + link('admin/categories', 'Categories') + link('admin/orders', 'Orders') + link('admin/admins', 'Admins');
  } else {
    const cartCount = Data.cart(u.id).reduce((s, c) => s + c.qty, 0);
    links = link('products', 'Shop') + link('wishlist', 'Wishlist (' + Data.wish(u.id).length + ')') + link('cart', 'Cart (' + cartCount + ')') + link('orders', 'My orders');
  }
  nav.innerHTML = `<a class="brand" href="#/${u.role === 'admin' ? 'admin/products' : 'products'}">ShopEase</a>
    <nav>${links}</nav>
    <div class="user"><span>${esc(u.name)} <small>${u.role}</small></span><button class="btn light sm" data-action="logout">Logout</button></div>`;
}

function route() {
  const u = Auth.current();
  const path = location.hash.replace(/^#\//, '');
  if (!u) {
    if (path !== 'login' && path !== 'register') { location.hash = '#/login'; return; }
  } else if (u.role === 'admin') {
    if (!path.startsWith('admin/') || !views[path]) { location.hash = '#/admin/products'; return; }
  } else if (!['products', 'wishlist', 'cart', 'orders'].includes(path)) {
    location.hash = '#/products';
    return;
  }
  renderNav();
  views[path]();
}

window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (fn) fn(el.dataset.id ? +el.dataset.id : null, el);
});

document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]');
  if (!f) return;
  e.preventDefault();
  forms[f.dataset.form](f, Object.fromEntries(new FormData(f)));
});

function onFilter(e) {
  const el = e.target.closest('[data-filter]');
  if (!el) return;
  state.filters[el.dataset.filter] = el.type === 'checkbox' ? el.checked : el.value;
  renderGrid();
}

document.addEventListener('input', e => {
  onFilter(e);
  const el = e.target.closest('[data-img="url"]');
  if (el) {
    state.imgData = el.value.trim();
    updatePreview();
  }
});

document.addEventListener('change', e => {
  onFilter(e);
  const el = e.target.closest('[data-img="file"]');
  if (!el) return;
  const err = el.parentElement.querySelector('.err');
  err.textContent = '';
  const file = el.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    err.textContent = 'Selected file is not an image';
    el.value = '';
    return;
  }
  if (file.size > 300 * 1024) {
    err.textContent = 'Image is too large. Maximum size is 300 KB';
    el.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    state.imgData = reader.result;
    document.getElementById('f_imageUrl').value = '';
    updatePreview();
  };
  reader.readAsDataURL(file);
});

seed();
route();
