import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CartError } from '../domain/cart.js';
import { calculateQuote, PricingError } from '../domain/pricing.js';
import { isValidEmail } from '../domain/validators.js';
import { Store } from './store.js';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const MAX_SEARCH_LENGTH = 100;

interface AuthedRequest extends Request {
  userId: string;
  token: string;
}

export function createApp(): express.Express {
  const app = express();
  const store = new Store();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'self'",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    });
    next();
  });

  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    const userId = store.authenticate(token);
    if (!userId || !token) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    (req as AuthedRequest).userId = userId;
    (req as AuthedRequest).token = token;
    next();
  };

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body ?? {};
    if (!isValidEmail(email) || typeof password !== 'string' || password.length === 0) {
      res.status(400).json({ error: 'malformed_credentials' });
      return;
    }
    const result = store.login(email, password);
    if (result === 'locked') {
      res.status(429).set('Retry-After', '60').json({ error: 'too_many_attempts' });
      return;
    }
    if (result === 'invalid') {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }
    res.json({ token: result.token });
  });

  app.get('/api/products', (req, res) => {
    const q = req.query.q;
    if (q === undefined) {
      res.json(store.searchProducts(''));
      return;
    }
    if (typeof q !== 'string' || q.length > MAX_SEARCH_LENGTH) {
      res.status(400).json({ error: 'invalid_query' });
      return;
    }
    res.json(store.searchProducts(q));
  });

  app.get('/api/products/:id', (req, res) => {
    const product = store.findProduct(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json(product);
  });

  app.get('/api/cart', requireAuth, (req, res) => {
    res.json({ items: store.cartFor((req as AuthedRequest).token).items });
  });

  app.post('/api/cart', requireAuth, (req, res) => {
    const { productId, quantity } = req.body ?? {};
    const product = typeof productId === 'string' ? store.findProduct(productId) : undefined;
    if (!product) {
      res.status(404).json({ error: 'product_not_found' });
      return;
    }
    try {
      store.cartFor((req as AuthedRequest).token).add(product, quantity);
    } catch (err) {
      if (err instanceof CartError) {
        res.status(422).json({ error: err.code.toLowerCase() });
        return;
      }
      throw err;
    }
    res.status(201).json({ items: store.cartFor((req as AuthedRequest).token).items });
  });

  app.patch('/api/cart/:productId', requireAuth, (req, res) => {
    const cart = store.cartFor((req as AuthedRequest).token);
    try {
      cart.setQuantity(req.params.productId, req.body?.quantity);
    } catch (err) {
      if (err instanceof CartError) {
        const status = err.code === 'NOT_IN_CART' ? 404 : 422;
        res.status(status).json({ error: err.code.toLowerCase() });
        return;
      }
      throw err;
    }
    res.json({ items: cart.items });
  });

  app.delete('/api/cart/:productId', requireAuth, (req, res) => {
    store.cartFor((req as AuthedRequest).token).remove(req.params.productId);
    res.status(204).end();
  });

  app.post('/api/checkout', requireAuth, (req, res) => {
    const { userId, token } = req as AuthedRequest;
    const cart = store.cartFor(token);
    const couponCode = req.body?.coupon;
    if (couponCode !== undefined && typeof couponCode !== 'string') {
      res.status(400).json({ error: 'malformed_coupon' });
      return;
    }
    try {
      const quote = calculateQuote(
        cart.items.map((i) => ({ productId: i.productId, unitPriceCents: i.unitPriceCents, quantity: i.quantity })),
        couponCode,
      );
      const order = store.saveOrder({
        ...quote,
        userId,
        items: cart.items,
        couponCode: couponCode?.trim().toUpperCase() ?? null,
      });
      cart.clear();
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof PricingError) {
        res.status(422).json({ error: err.code.toLowerCase() });
        return;
      }
      throw err;
    }
  });

  app.get('/api/orders/:id', requireAuth, (req, res) => {
    const order = store.findOrder(req.params.id, (req as AuthedRequest).userId);
    if (!order) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json(order);
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'not_found' });
  });

  app.use(express.static(PUBLIC_DIR));

  app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    const status = 'type' in err && err.type === 'entity.too.large' ? 413 : 400;
    res.status(status).json({ error: status === 413 ? 'payload_too_large' : 'bad_request' });
  });

  return app;
}
