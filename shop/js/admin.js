function viewAdminProducts() {
  const cats = Data.categories();
  const products = Data.products();
  const p = state.editProduct ? products.find(x => x.id === state.editProduct) : null;
  state.imgData = p ? p.image : '';
  const urlValue = p && !p.image.startsWith('data:') ? p.image : '';
  app.innerHTML = `<h1>Products</h1>
  <section class="panel">
    <h2>${p ? 'Edit product #' + p.id : 'Add a product'}</h2>
    ${cats.length ? '' : '<p class="err show">Add at least one category before creating products.</p>'}
    <form data-form="product" novalidate class="form-grid">
      ${field('Name', 'name', 'text', p ? p.name : '')}
      <div class="fg"><label for="f_category">Category</label>
        <select id="f_category" name="category">
          <option value="">Select a category</option>
          ${cats.map(c => `<option value="${c.id}" ${p && p.category === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
        </select><small class="err" data-for="category"></small></div>
      ${field('Price ($)', 'price', 'number', p ? p.price : '', 'step="0.01" min="0"')}
      ${field('Stock quantity', 'stock', 'number', p ? p.stock : '', 'step="1" min="0"')}
      <div class="fg wide"><label for="f_description">Description</label>
        <textarea id="f_description" name="description" rows="3">${p ? esc(p.description) : ''}</textarea>
        <small class="err" data-for="description"></small></div>
      <div class="fg"><label for="f_imageUrl">Image URL</label>
        <input id="f_imageUrl" name="imageUrl" type="text" data-img="url" value="${esc(urlValue)}" placeholder="https://...">
        <small class="err" data-for="imageUrl"></small></div>
      <div class="fg"><label for="f_imageFile">Or upload an image (max 300 KB)</label>
        <input id="f_imageFile" name="imageFile" type="file" accept="image/*" data-img="file">
        <small class="err" data-for="imageFile"></small></div>
      <div class="fg wide"><img id="preview" class="preview" src="${esc(state.imgData || placeholder('Preview'))}" alt="Preview">
        <small class="err" data-for="image"></small></div>
      <div class="wide row-start">
        <button class="btn" type="submit">${p ? 'Save changes' : 'Add product'}</button>
        ${p ? '<button class="btn light" type="button" data-action="cancel-product">Cancel</button>' : ''}
      </div>
    </form>
  </section>
  <div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
    <tbody>${products.length ? products.map(x => `<tr>
      <td>${x.id}</td>
      <td><img class="thumb" src="${esc(x.image)}" alt="" onerror="this.onerror=null;this.src=placeholder('')"></td>
      <td>${esc(x.name)}</td>
      <td>${esc(Data.catName(x.category))}</td>
      <td>${money(x.price)}</td>
      <td>${x.stock}</td>
      <td class="actions">
        <button class="btn light sm" data-action="edit-product" data-id="${x.id}">Edit</button>
        <button class="btn danger sm" data-action="delete-product" data-id="${x.id}">Delete</button>
      </td></tr>`).join('') : '<tr><td colspan="7" class="center muted">No products yet</td></tr>'}</tbody>
  </table></div>`;
}

function viewAdminCategories() {
  const cats = Data.categories();
  const products = Data.products();
  const c = state.editCategory ? cats.find(x => x.id === state.editCategory) : null;
  app.innerHTML = `<h1>Categories</h1>
  <section class="panel">
    <h2>${c ? 'Edit category #' + c.id : 'Add a category'}</h2>
    <form data-form="category" novalidate class="inline-form">
      ${field('Category name', 'name', 'text', c ? c.name : '')}
      <div class="row-start">
        <button class="btn" type="submit">${c ? 'Save changes' : 'Add category'}</button>
        ${c ? '<button class="btn light" type="button" data-action="cancel-category">Cancel</button>' : ''}
      </div>
    </form>
  </section>
  <div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Name</th><th>Products</th><th>Actions</th></tr></thead>
    <tbody>${cats.length ? cats.map(x => `<tr>
      <td>${x.id}</td><td>${esc(x.name)}</td>
      <td>${products.filter(p => p.category === x.id).length}</td>
      <td class="actions">
        <button class="btn light sm" data-action="edit-category" data-id="${x.id}">Edit</button>
        <button class="btn danger sm" data-action="delete-category" data-id="${x.id}">Delete</button>
      </td></tr>`).join('') : '<tr><td colspan="4" class="center muted">No categories yet</td></tr>'}</tbody>
  </table></div>`;
}

function viewAdminOrders() {
  const f = state.orderFilter;
  const all = Data.orders().sort((a, b) => b.id - a.id);
  const list = f === 'all' ? all : all.filter(o => o.status === f);
  const tabs = ['all', 'pending', 'confirmed', 'rejected'];
  app.innerHTML = `<h1>Orders</h1>
  <div class="tabs">${tabs.map(t => `<button class="tab ${f === t ? 'on' : ''}" data-action="order-filter" data-value="${t}">${t[0].toUpperCase() + t.slice(1)} (${t === 'all' ? all.length : all.filter(o => o.status === t).length})</button>`).join('')}</div>
  ${list.length ? list.map(o => `<article class="order">
    <div class="row"><strong>Order #${o.id} by ${esc(o.customerName)}</strong>${badge(o.status)}</div>
    <p class="muted">${formatDate(o.date)}</p>
    <ul>${orderItemsHtml(o)}</ul>
    <div class="row"><span>Total</span><strong>${money(o.total)}</strong></div>
    ${o.status === 'pending' ? `<div class="row-start">
      <button class="btn ok" data-action="confirm-order" data-id="${o.id}">Confirm</button>
      <button class="btn danger" data-action="reject-order" data-id="${o.id}">Reject</button>
    </div>` : ''}
  </article>`).join('') : '<div class="empty">No orders in this view.</div>'}`;
}

function viewAdminAdmins() {
  const admins = Data.users().filter(u => u.role === 'admin');
  app.innerHTML = `<h1>Admins</h1>
  <section class="panel">
    <h2>Add another admin</h2>
    <form data-form="admin" novalidate class="form-grid">
      ${field('Full name', 'name', 'text', '')}
      ${field('Email', 'email', 'email', '')}
      ${field('Password', 'password', 'password', '', 'autocomplete="new-password"')}
      ${field('Confirm password', 'confirm', 'password', '', 'autocomplete="new-password"')}
      <div class="wide"><button class="btn" type="submit">Add admin</button></div>
    </form>
  </section>
  <div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
    <tbody>${admins.map(a => `<tr><td>${a.id}</td><td>${esc(a.name)}</td><td>${esc(a.email)}</td></tr>`).join('')}</tbody>
  </table></div>`;
}

function updatePreview() {
  const img = document.getElementById('preview');
  if (img) img.src = state.imgData || placeholder('Preview');
}

const adminForms = {
  product(f, d) {
    const errs = {};
    const name = d.name.trim();
    const products = Data.products();
    if (!name) errs.name = 'Product name is required';
    else if (name.length < 3 || name.length > 60) errs.name = 'Name must be between 3 and 60 characters';
    else if (products.some(p => p.name.toLowerCase() === name.toLowerCase() && p.id !== state.editProduct)) errs.name = 'A product with this name already exists';

    if (!d.category) errs.category = 'Please select a category';
    else if (!Data.categories().some(c => c.id === +d.category)) errs.category = 'This category no longer exists';

    const price = parseFloat(d.price);
    if (d.price === '') errs.price = 'Price is required';
    else if (isNaN(price) || price <= 0) errs.price = 'Price must be a number greater than 0';
    else if (price > 1000000) errs.price = 'Price cannot exceed 1,000,000';

    if (d.stock === '') errs.stock = 'Stock quantity is required';
    else if (!/^\d+$/.test(d.stock)) errs.stock = 'Stock must be a whole number, 0 or more';
    else if (+d.stock > 100000) errs.stock = 'Stock cannot exceed 100,000';

    const desc = d.description.trim();
    if (!desc) errs.description = 'Description is required';
    else if (desc.length < 10) errs.description = 'Description must be at least 10 characters';
    else if (desc.length > 500) errs.description = 'Description cannot exceed 500 characters';

    if (!state.imgData) errs.image = 'Add an image by URL or upload a file';
    else if (!/^(https?:\/\/|data:image\/)/i.test(state.imgData)) errs.imageUrl = 'Image URL must start with http:// or https://';

    if (!setErrors(f, errs)) return;
    const item = { name, category: +d.category, price: Math.round(price * 100) / 100, stock: +d.stock, description: desc, image: state.imgData };
    if (state.editProduct) {
      const i = products.findIndex(p => p.id === state.editProduct);
      products[i] = { ...products[i], ...item };
      toast('Product updated');
    } else {
      products.push({ id: DB.nextId('products'), ...item });
      toast('Product added');
    }
    if (!DB.set('products', products)) return;
    state.editProduct = null;
    route();
  },
  category(f, d) {
    const errs = {};
    const name = d.name.trim();
    const cats = Data.categories();
    if (!name) errs.name = 'Category name is required';
    else if (name.length < 2 || name.length > 30) errs.name = 'Name must be between 2 and 30 characters';
    else if (cats.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== state.editCategory)) errs.name = 'A category with this name already exists';
    if (!setErrors(f, errs)) return;
    if (state.editCategory) {
      cats.find(c => c.id === state.editCategory).name = name;
      toast('Category updated');
    } else {
      cats.push({ id: DB.nextId('categories'), name });
      toast('Category added');
    }
    DB.set('categories', cats);
    state.editCategory = null;
    route();
  },
  admin(f, d) {
    if (!setErrors(f, Auth.validate(d))) return;
    Auth.create(d, 'admin');
    toast('New admin added');
    route();
  }
};

function changeOrder(id, status) {
  const orders = Data.orders();
  const o = orders.find(o => o.id === id);
  if (!o || o.status !== 'pending') return toast('This order was already processed', 'err');
  o.status = status;
  if (status === 'rejected') {
    const products = Data.products();
    o.items.forEach(i => {
      const p = products.find(p => p.id === i.productId);
      if (p) p.stock += i.qty;
    });
    DB.set('products', products);
  }
  DB.set('orders', orders);
  toast('Order #' + id + ' ' + status);
  route();
}

const adminActions = {
  'edit-product'(id) { state.editProduct = id; route(); window.scrollTo(0, 0); },
  'cancel-product'() { state.editProduct = null; route(); },
  'delete-product'(id) {
    const p = Data.products().find(p => p.id === id);
    if (!p || !confirm('Delete "' + p.name + '"? This cannot be undone.')) return;
    DB.set('products', Data.products().filter(x => x.id !== id));
    if (state.editProduct === id) state.editProduct = null;
    toast('Product deleted');
    route();
  },
  'edit-category'(id) { state.editCategory = id; route(); window.scrollTo(0, 0); },
  'cancel-category'() { state.editCategory = null; route(); },
  'delete-category'(id) {
    const c = Data.categories().find(c => c.id === id);
    if (!c) return;
    const used = Data.products().filter(p => p.category === id).length;
    if (used) return toast('Cannot delete "' + c.name + '" because ' + used + ' product(s) use it', 'err');
    if (!confirm('Delete category "' + c.name + '"?')) return;
    DB.set('categories', Data.categories().filter(x => x.id !== id));
    toast('Category deleted');
    route();
  },
  'confirm-order'(id) { changeOrder(id, 'confirmed'); },
  'reject-order'(id) {
    if (confirm('Reject this order? Stock will be returned.')) changeOrder(id, 'rejected');
  },
  'order-filter'(id, el) { state.orderFilter = el.dataset.value; route(); }
};
