// GET  /api/products          -> { setup, products }
// POST /api/products          -> { action: 'save' | 'delete' | 'reorder' | 'seed', ... }
import { randomUUID } from 'node:crypto';
import {
  hasStorage, isAuthed, readProducts, writeProducts, cleanProduct, deleteImage, send,
} from './_store.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (!hasStorage()) return send(res, 200, { setup: false, products: null });
      const products = await readProducts();
      // Visitors get a short edge cache; the admin asks with ?fresh=... to skip it.
      const cache = req.query?.fresh ? 'no-store' : 'public, s-maxage=15, stale-while-revalidate=300';
      return send(res, 200, { setup: true, products }, cache);
    }

    if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
    if (!hasStorage()) return send(res, 503, { error: 'Storage is not connected yet' });
    if (!isAuthed(req)) return send(res, 401, { error: 'Wrong passcode' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const current = (await readProducts()) || [];

    switch (body.action) {
      case 'save': {
        const p = cleanProduct(body.product);
        const i = current.findIndex((x) => x.id === p.id);
        if (i === -1) {
          // New products go to the front of their category.
          const min = Math.min(0, ...current.map((x) => x.order || 0));
          current.push({ ...p, id: randomUUID(), order: min - 1, createdAt: Date.now() });
        } else {
          if (current[i].image !== p.image) await deleteImage(current[i].image);
          current[i] = { ...current[i], ...p, order: current[i].order, updatedAt: Date.now() };
        }
        return send(res, 200, { products: await writeProducts(current) });
      }
      case 'delete': {
        const gone = current.find((x) => x.id === body.id);
        if (!gone) return send(res, 404, { error: 'Product not found' });
        await deleteImage(gone.image);
        return send(res, 200, { products: await writeProducts(current.filter((x) => x.id !== body.id)) });
      }
      case 'reorder': {
        const ids = Array.isArray(body.ids) ? body.ids : [];
        const pos = new Map(ids.map((id, n) => [id, n]));
        current.forEach((x) => { if (pos.has(x.id)) x.order = pos.get(x.id); });
        return send(res, 200, { products: await writeProducts(current) });
      }
      case 'seed': {
        if (current.length) return send(res, 409, { error: 'Products already exist' });
        const seeded = (body.products || []).map((p, n) => ({ ...cleanProduct(p), id: p.id || randomUUID(), order: n }));
        return send(res, 200, { products: await writeProducts(seeded) });
      }
      default:
        return send(res, 400, { error: 'Unknown action' });
    }
  } catch (err) {
    return send(res, 400, { error: err.message || 'Something went wrong' });
  }
}
