const $ = (id) => document.getElementById(id);
const money = (cents) => `$${(cents / 100).toFixed(2)}`;

const state = { token: localStorage.getItem('token'), email: localStorage.getItem('email') };

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(path, { ...options, headers });
  if (res.status === 401 && state.token) {
    endSession();
    throw new Error('session_expired');
  }
  const body = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new Error(body?.error ?? 'request_failed');
  return body;
}

function showError(message) {
  const el = $('app-error');
  el.textContent = message;
  el.hidden = false;
}

function clearError() {
  $('app-error').hidden = true;
}

function show(viewId) {
  clearError();
  for (const id of ['login-view', 'catalog-view', 'checkout-view', 'confirmation-view']) {
    $(id).hidden = id !== viewId;
  }
  $('session-bar').hidden = viewId === 'login-view';
}

function endSession() {
  state.token = null;
  state.email = null;
  localStorage.clear();
  show('login-view');
}

async function loadProducts(query = '') {
  const products = await api(`/api/products${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  const list = $('product-list');
  list.innerHTML = '';
  for (const p of products) {
    const li = document.createElement('li');
    li.dataset.testid = 'product-card';
    li.dataset.productId = p.id;
    li.innerHTML = `
      <span data-testid="product-name">${p.name}</span>
      <span data-testid="product-price">${money(p.priceCents)}</span>
      <button data-testid="add-to-cart">Add to cart</button>`;
    li.querySelector('button').addEventListener('click', () => addToCart(p.id));
    list.appendChild(li);
  }
}

async function refreshCart() {
  const { items } = await api('/api/cart');
  const list = $('cart-items');
  list.innerHTML = '';
  let subtotal = 0;
  let count = 0;
  for (const item of items) {
    subtotal += item.unitPriceCents * item.quantity;
    count += item.quantity;
    const li = document.createElement('li');
    li.dataset.testid = 'cart-item';
    li.dataset.productId = item.productId;
    li.innerHTML = `
      <span>${item.name}</span>
      <span class="qty-controls">
        <button data-testid="qty-decrease" aria-label="Decrease quantity of ${item.name}">−</button>
        <span data-testid="qty-value">${item.quantity}</span>
        <button data-testid="qty-increase" aria-label="Increase quantity of ${item.name}">+</button>
      </span>
      <button class="link" data-testid="remove-item" aria-label="Remove ${item.name}">Remove</button>`;
    li.querySelector('[data-testid="qty-decrease"]').addEventListener('click', () => setQuantity(item, item.quantity - 1));
    li.querySelector('[data-testid="qty-increase"]').addEventListener('click', () => setQuantity(item, item.quantity + 1));
    li.querySelector('[data-testid="remove-item"]').addEventListener('click', () => removeItem(item.productId));
    list.appendChild(li);
  }
  $('cart-badge').textContent = String(count);
  $('cart-subtotal').textContent = money(subtotal);
  $('checkout-button').disabled = items.length === 0;
  return items;
}

async function addToCart(productId) {
  clearError();
  try {
    await api('/api/cart', { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) });
    await refreshCart();
  } catch (err) {
    showError(errorMessage(err.message));
  }
}

async function setQuantity(item, quantity) {
  clearError();
  if (quantity < 1) {
    await removeItem(item.productId);
    return;
  }
  try {
    await api(`/api/cart/${item.productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
    await refreshCart();
  } catch (err) {
    showError(errorMessage(err.message));
  }
}

async function removeItem(productId) {
  await api(`/api/cart/${productId}`, { method: 'DELETE' });
  await refreshCart();
}

function errorMessage(code) {
  const messages = {
    invalid_credentials: 'Invalid email or password.',
    too_many_attempts: 'Too many attempts. Try again in a minute.',
    quantity_limit: 'Maximum of 10 units per product.',
    invalid_quantity: 'Quantity must be between 1 and 10.',
    coupon_invalid: 'This coupon code is not valid.',
    coupon_expired: 'This coupon has expired.',
    empty_cart: 'Your cart is empty.',
  };
  return messages[code] ?? 'Something went wrong. Please try again.';
}

async function renderCheckout() {
  const items = await refreshCart();
  const list = $('checkout-items');
  list.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.dataset.testid = 'checkout-line';
    li.innerHTML = `<span>${item.quantity} × ${item.name}</span><span>${money(item.unitPriceCents * item.quantity)}</span>`;
    list.appendChild(li);
  }
  $('coupon').value = '';
  show('checkout-view');
}

async function placeOrder() {
  clearError();
  const coupon = $('coupon').value.trim();
  try {
    const order = await api('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(coupon ? { coupon } : {}),
    });
    $('order-id').textContent = order.id;
    $('order-subtotal').textContent = money(order.subtotalCents);
    $('order-discount').textContent = `−${money(order.discountCents)} (${order.discountSource})`;
    $('order-shipping').textContent = order.shippingCents === 0 ? 'Free' : money(order.shippingCents);
    $('order-total').textContent = money(order.totalCents);
    show('confirmation-view');
    await refreshCart();
  } catch (err) {
    showError(errorMessage(err.message));
  }
}

async function enterCatalog() {
  $('user-email').textContent = state.email;
  show('catalog-view');
  await Promise.all([loadProducts(), refreshCart()]);
}

$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();
  try {
    const { token } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: $('email').value, password: $('password').value }),
    });
    state.token = token;
    state.email = $('email').value;
    localStorage.setItem('token', token);
    localStorage.setItem('email', state.email);
    await enterCatalog();
  } catch (err) {
    if (err.message !== 'session_expired') showError(errorMessage(err.message));
  }
});

$('search').addEventListener('input', (event) => loadProducts(event.target.value));
$('checkout-button').addEventListener('click', renderCheckout);
$('back-to-catalog').addEventListener('click', () => show('catalog-view'));
$('place-order-button').addEventListener('click', placeOrder);
$('new-order-button').addEventListener('click', enterCatalog);
$('logout-button').addEventListener('click', endSession);

if (state.token) {
  enterCatalog().catch(() => endSession());
} else {
  show('login-view');
}
