/**
 * Generates the 1200×630 social share card at public/og/default.png.
 *
 * Run LOCALLY (`node scripts/og.mjs`) and commit the artifact. Deliberately
 * not a build step: SVG text rasterises with the host's fonts, and a Vercel
 * Linux builder would silently swap Georgia for DejaVu. The card uses system
 * serif/mono stand-ins for the brand faces — at share-card size the
 * difference is invisible; the palette carries the identity.
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const W = 1200;
const H = 630;

const overlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="bloom" cx="0.85" cy="0.25" r="0.9">
      <stop offset="0" stop-color="#2b2620"/>
      <stop offset="1" stop-color="#14120f"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bloom)"/>

  <text x="84" y="132" font-family="Courier New, monospace" font-size="24"
        letter-spacing="6" fill="#b08d57">PROFESSOR GORDON SLATER</text>

  <text x="78" y="268" font-family="Georgia, serif" font-size="118"
        letter-spacing="-2" fill="#f0ebe3">Chaos</text>
  <text x="84" y="352" font-family="Courier New, monospace" font-size="30"
        letter-spacing="10" fill="#5fa99c">to</text>
  <text x="78" y="478" font-family="Georgia, serif" font-size="118"
        letter-spacing="-2" fill="#f0ebe3">Creation</text>

  <rect x="84" y="524" width="52" height="1.5" fill="#b08d57"/>
  <text x="152" y="533" font-family="Courier New, monospace" font-size="23"
        letter-spacing="4" fill="#5fa99c">AMAZON BEST SELLER</text>

  <text x="84" y="586" font-family="Courier New, monospace" font-size="20"
        letter-spacing="2" fill="#8a827a">chaostocreation.com.au</text>
</svg>`;

mkdirSync('public/og', { recursive: true });

const cover = await sharp('src/assets/cover.png')
  .resize({ height: 540 })
  .png()
  .toBuffer();
const coverMeta = await sharp(cover).metadata();

await sharp(Buffer.from(overlay))
  .png()
  .composite([
    { input: cover, top: 48, left: W - coverMeta.width - 56 },
  ])
  .toFile('public/og/default.png');

console.log('public/og/default.png written (1200×630)');
