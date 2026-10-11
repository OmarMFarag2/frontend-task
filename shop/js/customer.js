const state = {
  filters: { search: '', category: '', min: '', max: '', sort: '', stock: false },
  editProduct: null,
  editCategory: null,
  orderFilter: 'all',
  imgData: ''
};

function productCard(p, uid) {
  const wished = Data.wish(uid).includes(p.id);
  const out = p.stock < 1;
  return `<article class="card">
    <img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src=placeholder(this.alt)">
    <div class="card-body">
      <span class="tag">${esc(Data.catName(p.category))}</span>
      <h3>${esc(p.name)}</h3>
      <p class="desc">${esc(p.description)}</p>
      <div class="row"><strong class="price">${money(p.price)}</strong><span class="stock ${out ? 'out' : ''}">${out ? 'Out of stock' : p.stock + ' in stock'}</span></div>
      <div class="row">
        <button class="btn" data-action="add-cart" data-id="${p.id}" ${out ? 'disabled' : ''}>Add to cart</button>
        <button class="btn light ${wished ? 'active' : ''}" data-action="toggle-wish" data-id="${p.id}">${wished ? 'Saved' : 'Save'}</button>
      </div>
    </div>
  </article>`;
}

function viewProducts() {
  const f = state.filters;
  const cats = Data.categories();
  app.innerHTML = `<h1>Shop</h1>
  <section class="filters">
    <input data-filter="search" placeholder="Search by name" value="${esc(f.search)}">
    <select data-filter="category">
      <option value="">All categories</option>
      ${cats.map(c => `<option value="${c.id}" ${String(c.id) === String(f.category) ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
    </select>
    <input data-filter="min" type="number" min="0" placeholder="Min price" value="${esc(f.min)}">
    <input data-filter="max" type="number" min="0" placeholder="Max price" value="${esc(f.max)}">
    <select data-filter="sort">
      <option value="">Sort by</option>
      <option value="asc" ${f.sort === 'asc' ? 'selected' : ''}>Price: low to high</option>
      <option value="desc" ${f.sort === 'desc' ? 'selected' : ''}>Price: high to low</option>
      <option value="name" ${f.sort === 'name' ? 'selected' : ''}>Name A to Z</option>
    </select>
    <label class="chk"><input type="checkbox" data-filter="stock" ${f.stock ? 'checked' : ''}> In stock only</label>
    <button class="btn light" data-action="clear-filters">Clear</button>
  </section>
  <p class="muted" id="count"></p>
  <div id="grid" class="grid"></div>`;
  renderGrid();
}

function renderGrid() {
  const f = state.filters;
  const u = Auth.current();
  let list = Data.products().filter(p => {
    if (f.search && !p.name.toLowerCase().includes(f.search.trim().toLowerCase())) return false;
    if (f.category && String(p.category) !== String(f.category)) return false;
    if (f.min !== '' && p.price < parseFloat(f.min)) return false;
    if (f.max !== '' && p.price > parseFloat(f.max)) return false;
    if (f.stock && p.stock < 1) return false;
    return true;
  });
  if (f.sort === 'asc') list.sort((a, b) => a.price - b.price);
  if (f.sort === 'desc') list.sort((a, b) => b.price - a.price);
  if (f.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  document.getElementById('count').textContent = list.length + (list.length === 1 ? ' product found' : ' products found');
  document.getElementById('grid').innerHTML = list.length
    ? list.map(p => productCard(p, u.id)).join('')
    : '<div class="empty">No products match your filters. Try clearing them.</div>';
}

function viewWishlist() {
  const u = Auth.current();
  const ids = Data.wish(u.id);
  const list = Data.products().filter(p => ids.includes(p.id));
  app.innerHTML = `<h1>Wishlist</h1>` + (list.length
    ? `<div class="grid">${list.map(p => productCard(p, u.id)).join('')}</div>`
    : `<div class="empty">Your wishlist is empty. <a href="#/products">Browse products</a> and save the ones you like.</div>`);
}

function cartItems(u) {
  const products = Data.products();
  const raw = Data.cart(u.id);
  const clean = raw.filter(c => products.some(p => p.id === c.productId));
  if (clean.length !== raw.length) DB.set('cart_' + u.id, clean);
  return clean.map(c => ({ ...c, product: products.find(p => p.id === c.productId) }));
}

function viewCart() {
  const u = Auth.current();
  const items = cartItems(u);
  if (!items.length) {
    app.innerHTML = `<h1>Shopping cart</h1><div class="empty">Your cart is empty. <a href="#/products">Start shopping</a></div>`;
    return;
  }
  const total = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  app.innerHTML = `<h1>Shopping cart</h1>
  <div class="table-wrap"><table>
    <thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th></th></tr></thead>
    <tbody>${items.map(i => `<tr>
      <td><div class="prod-cell"><img src="${esc(i.product.image)}" alt="" onerror="this.onerror=null;this.src=placeholder('')"><span>${esc(i.product.name)}</span></div></td>
      <td>${money(i.product.price)}</td>
      <td><div class="qty">
        <button class="btn light sm" data-action="cart-dec" data-id="${i.productId}">-</button>
        <span>${i.qty}</span>
        <button class="btn light sm" data-action="cart-inc" data-id="${i.productId}">+</button>
      </div>${i.qty > i.product.stock ? `<small class="err show">Only ${i.product.stock} available</small>` : ''}</td>
      <td>${money(i.product.price * i.qty)}</td>
      <td><button class="btn danger sm" data-action="cart-remove" data-id="${i.productId}">Remove</button></td>
    </tr>`).join('')}</tbody>
  </table></div>
  <div class="summary"><span>Total</span><strong>${money(total)}</strong><button class="btn" data-action="place-order">Place order</button></div>`;
}

function orderItemsHtml(o) {
  return o.items.map(i => `<li>${esc(i.name)} x ${i.qty} <span class="muted">(${money(i.price)} each)</span></li>`).join('');
}

function viewOrders() {
  const u = Auth.current();
  const list = Data.orders().filter(o => o.userId === u.id).sort((a, b) => b.id - a.id);
  app.innerHTML = `<h1>My orders</h1>` + (list.length
    ? list.map(o => `<article class="order">
        <div class="row"><strong>Order #${o.id}</strong>${badge(o.status)}</div>
        <p class="muted">${formatDate(o.date)}</p>
        <ul>${orderItemsHtml(o)}</ul>
        <div class="row"><span>Total</span><strong>${money(o.total)}</strong></div>
        ${o.status === 'pending' ? '<p class="hint">Waiting for admin confirmation.</p>' : ''}
      </article>`).join('')
    : `<div class="empty">You have not placed any orders yet. <a href="#/products">Browse products</a></div>`);
}

const customerActions = {
  'toggle-wish'(id) {
    const u = Auth.current();
    let w = Data.wish(u.id);
    if (w.includes(id)) {
      w = w.filter(x => x !== id);
      toast('Removed from wishlist');
    } else {
      w.push(id);
      toast('Added to wishlist');
    }
    DB.set('wish_' + u.id, w);
    route();
  },
  'add-cart'(id) {
    const u = Auth.current();
    const p = Data.products().find(p => p.id === id);
    if (!p) return toast('This product no longer exists', 'err');
    const cart = Data.cart(u.id);
    const line = cart.find(c => c.productId === id);
    const qty = line ? line.qty : 0;
    if (qty + 1 > p.stock) return toast('Only ' + p.stock + ' of this item available', 'err');
    if (line) line.qty++;
    else cart.push({ productId: id, qty: 1 });
    DB.set('cart_' + u.id, cart);
    toast('Added to cart');
    renderNav();
  },
  'cart-inc'(id) {
    const u = Auth.current();
    const p = Data.products().find(p => p.id === id);
    const cart = Data.cart(u.id);
    const line = cart.find(c => c.productId === id);
    if (!line || !p) return;
    if (line.qty + 1 > p.stock) return toast('Only ' + p.stock + ' available in stock', 'err');
    line.qty++;
    DB.set('cart_' + u.id, cart);
    route();
  },
  'cart-dec'(id) {
    const u = Auth.current();
    let cart = Data.cart(u.id);
    const line = cart.find(c => c.productId === id);
    if (!line) return;
    line.qty--;
    if (line.qty < 1) cart = cart.filter(c => c.productId !== id);
    DB.set('cart_' + u.id, cart);
    route();
  },
  'cart-remove'(id) {
    const u = Auth.current();
    DB.set('cart_' + u.id, Data.cart(u.id).filter(c => c.productId !== id));
    route();
  },
  'clear-filters'() {
    state.filters = { search: '', category: '', min: '', max: '', sort: '', stock: false };
    route();
  },
  'place-order'() {
    const u = Auth.current();
    const items = cartItems(u);
    if (!items.length) return toast('Your cart is empty', 'err');
    for (const i of items) {
      if (i.qty > i.product.stock) return toast('Only ' + i.product.stock + ' of "' + i.product.name + '" left in stock', 'err');
    }
    const products = Data.products();
    const lines = items.map(i => {
      const p = products.find(p => p.id === i.productId);
      p.stock -= i.qty;
      return { productId: p.id, name: p.name, price: p.price, qty: i.qty };
    });
    DB.set('products', products);
    const orders = Data.orders();
    orders.push({
      id: DB.nextId('orders'),
      userId: u.id,
      customerName: u.name,
      items: lines,
      total: lines.reduce((s, l) => s + l.price * l.qty, 0),
      status: 'pending',
      date: new Date().toISOString()
    });
    DB.set('orders', orders);
    DB.set('cart_' + u.id, []);
    toast('Order placed. It is pending admin confirmation');
    location.hash = '#/orders';
  }
};
