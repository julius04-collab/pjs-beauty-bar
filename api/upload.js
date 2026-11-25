// POST /api/upload  { dataUrl: 'data:image/jpeg;base64,...', name: 'Gold cuff' } -> { url }
// The admin shrinks photos in the browser first, so uploads stay well under Vercel's 4.5 MB limit.
import { put } from '@vercel/blob';
import { hasStorage, isAuthed, send } from './_store.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
    if (!hasStorage()) return send(res, 503, { error: 'Storage is not connected yet' });
    if (!isAuthed(req)) return send(res, 401, { error: 'Wrong passcode' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(body.dataUrl || '');
    if (!m) return send(res, 400, { error: 'Please choose a JPG, PNG or WebP photo' });

    const buffer = Buffer.from(m[2], 'base64');
    if (buffer.length > 4 * 1024 * 1024) return send(res, 413, { error: 'Photo is too large' });

    const slug = String(body.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'product';
    const blob = await put(`products/${slug}.${TYPES[m[1]]}`, buffer, {
      access: 'public',
      contentType: m[1],
      addRandomSuffix: true,
    });
    return send(res, 200, { url: blob.url });
  } catch (err) {
    return send(res, 400, { error: err.message || 'Upload failed' });
  }
}
