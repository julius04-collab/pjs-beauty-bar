# PJs' Beauty Bar

Website for PJs' Beauty Bar (Everyday Elegance). Customers browse products and order on WhatsApp. The owner manages products at `/admin`.

## What's in here

| Path | What it is |
| --- | --- |
| `index.html` | The homepage (hero, categories, product rows, gifts, contact) |
| `admin/index.html` | The product manager, opened at `yourdomain.com/admin` |
| `api/products.js` | Reads and saves the product list |
| `api/upload.js` | Uploads product photos |
| `api/_store.js` | Shared storage helpers (Vercel Blob) |
| `products-seed.js` | Starter products, shown until the admin saves real data |
| `img/` | Starter product photos |

## Deploy on Vercel (one time)

1. **Import the repo:** in Vercel choose **Add New → Project**, pick `pjs-beauty-bar`, set Framework Preset to **Other**, leave the build command empty, then **Deploy**.
2. **Connect storage:** open the project → **Storage** → **Create** → **Blob** → connect it to this project (all environments). This adds `BLOB_READ_WRITE_TOKEN` automatically.
3. **Redeploy:** go to **Deployments** → latest → **Redeploy**, so the API picks up the token.
4. **Load the products:** open `yourdomain.com/admin` and tap **Load starter products**. From then on, the homepage shows whatever is saved in the admin.

Until step 2 is done, the homepage shows the starter products and `/admin` runs in demo mode (changes only stay on that device).

## Using the admin

- **Add product:** photo, name, category, price (optional) and in-stock switch. Photos are resized on the phone before uploading.
- **Edit:** tap a product to change anything, mark it sold out, or delete it.
- **Reorder:** pick a category, then use the up/down arrows. The site shows products in that order.
- Prices are in naira. An empty price shows "Price on request" on the site.
- Changes show on the homepage within about 15 seconds.

## Optional passcode

There is no login by default; `/admin` is simply not linked anywhere. Anyone who learns the address can still edit products. To add a passcode, set an environment variable `ADMIN_KEY` in Vercel (Settings → Environment Variables) and redeploy. The admin will ask for it once on each device.

## Local preview

Open `index.html` in a browser for the homepage (it uses the starter products). For the API, use `npx vercel dev` with the Blob token in `.env.local`.
