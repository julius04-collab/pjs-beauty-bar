// Shared helpers for the PJs' Beauty Bar API (files starting with _ are not routes on Vercel).
// Products are stored as one JSON file in Vercel Blob. Every save writes a NEW file with a
// unique URL, so visitors never see a stale cached copy; older copies are cleaned up.
import { put, list, del } from '@vercel/blob';

export const CATEGORIES = ['adornment', 'beads', 'fragrance', 'lounge', 'intimates'];
const PREFIX = 'data/products-';
const KEEP = 5;

export const hasStorage = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// Optional passcode: if ADMIN_KEY is set in Vercel, saves need the x-admin-key header.
export const isAuthed = (req) => {
  const key = process.env.ADMIN_KEY;
  return !key || req.headers['x-admin-key'] === key;
};

async function sortedSnapshots() {
  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
  return blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

export async function readProducts() {
  const snaps = await sortedSnapshots();
  if (!snaps.length) return null;
  const r = await fetch(snaps[0].url, { cache: 'no-store' });
  if (!r.ok) throw new Error('Could not read products');
  return r.json();
}

export async function writeProducts(products) {
  await put(`${PREFIX}${Date.now()}.json`, JSON.stringify(products), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: true,
    cacheControlMaxAge: 60,
  });
  const old = (await sortedSnapshots()).slice(KEEP).map((b) => b.url);
  if (old.length) await del(old);
  return products;
}

export const isBlobUrl = (u) => typeof u === 'string' && /\.blob\.vercel-storage\.com\//.test(u);

export async function deleteImage(url) {
  if (isBlobUrl(url)) {
    try { await del(url); } catch { /* already gone */ }
  }
}

// Clean and validate one product coming from the admin.
export function cleanProduct(p) {
  const name = String(p?.name ?? '').trim().slice(0, 120);
  const category = String(p?.category ?? '');
  const image = String(p?.image ?? '').trim();
  const price = String(p?.price ?? '').replace(/[^\d]/g, '').slice(0, 10);
  if (!name) throw new Error('Product name is required');
  if (!CATEGORIES.includes(category)) throw new Error('Choose a category');
  if (!image) throw new Error('Add a photo');
  if (!/^(https?:\/\/|img\/)/.test(image)) throw new Error('Invalid image');
  return {
    id: String(p.id || ''),
    name,
    category,
    price,
    image,
    inStock: p.inStock !== false,
    order: Number.isFinite(+p.order) ? +p.order : 0,
  };
}

export function send(res, status, body, cache = 'no-store') {
  res.setHeader('Cache-Control', cache);
  res.status(status).json(body);
}
