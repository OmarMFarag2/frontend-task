const Data = {
  users: () => DB.get('users', []),
  categories: () => DB.get('categories', []),
  products: () => DB.get('products', []),
  orders: () => DB.get('orders', []),
  cart: uid => DB.get('cart_' + uid, []),
  wish: uid => DB.get('wish_' + uid, []),
  catName(id) {
    const c = Data.categories().find(c => c.id === id);
    return c ? c.name : 'Uncategorized';
  }
};

function seed() {
  if (DB.get('seeded', false)) return;
  DB.set('users', [{ id: DB.nextId('users'), name: 'Main Admin', email: 'admin@shop.com', password: 'Admin@123', role: 'admin' }]);
  const cats = ['Electronics', 'Clothing', 'Books', 'Home'].map(n => ({ id: DB.nextId('categories'), name: n }));
  DB.set('categories', cats);
  const items = [
    ['Wireless Headphones', 0, 59.99, 25, 'Over-ear bluetooth headphones with deep bass and 30 hours of battery life.'],
    ['Smart Watch', 0, 129.5, 12, 'Fitness tracking watch with heart rate monitor and water resistance.'],
    ['Cotton T-Shirt', 1, 14.99, 60, 'Soft everyday t-shirt made from 100 percent combed cotton.'],
    ['Denim Jacket', 1, 49.0, 8, 'Classic denim jacket with a relaxed fit and button front.'],
    ['JavaScript Handbook', 2, 24.75, 30, 'A practical guide to modern JavaScript with real world examples.'],
    ['Science Fiction Novel', 2, 11.2, 0, 'A gripping space adventure about the last colony ship leaving Earth.'],
    ['Ceramic Mug Set', 3, 18.0, 40, 'Set of four hand glazed ceramic mugs, dishwasher safe.'],
    ['Desk Lamp', 3, 32.4, 15, 'Adjustable LED desk lamp with three brightness levels and USB port.']
  ];
  DB.set('products', items.map(i => ({
    id: DB.nextId('products'),
    name: i[0],
    image: placeholder(i[0]),
    category: cats[i[1]].id,
    price: i[2],
    stock: i[3],
    description: i[4]
  })));
  DB.set('seeded', true);
}
