import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const JSON_PARAMS = { headers: { 'Content-Type': 'application/json' } };

export function browse() {
  const list = http.get(`${BASE_URL}/api/products`, { tags: { name: 'GET /api/products' } });
  check(list, { 'product list is 200': (r) => r.status === 200 });

  const detail = http.get(`${BASE_URL}/api/products/p1`, { tags: { name: 'GET /api/products/:id' } });
  check(detail, { 'product detail is 200': (r) => r.status === 200 });
}

export function purchase() {
  const login = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: 'alice.qa@example.com', password: 'S3curePass!' }),
    { ...JSON_PARAMS, tags: { name: 'POST /api/auth/login' } },
  );
  const ok = check(login, { 'login is 200': (r) => r.status === 200 });
  if (!ok) return;

  const token = login.json('token');
  const authed = {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  };

  const add = http.post(
    `${BASE_URL}/api/cart`,
    JSON.stringify({ productId: 'p2', quantity: 1 }),
    { ...authed, tags: { name: 'POST /api/cart' } },
  );
  check(add, { 'add to cart is 201': (r) => r.status === 201 });

  const order = http.post(`${BASE_URL}/api/checkout`, JSON.stringify({}), {
    ...authed,
    tags: { name: 'POST /api/checkout' },
  });
  check(order, { 'checkout is 201': (r) => r.status === 201 });
}
