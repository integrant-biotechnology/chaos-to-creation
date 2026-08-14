/**
 * Generates favicon.ico and apple-touch-icon.png from the seal mark.
 *
 * Run LOCALLY (`node scripts/icons.mjs`) and commit the artifacts. This is
 * deliberately not wired into the build: rasterisation depends on the host's
 * SVG stack, and a CI box regenerating committed icons buys nothing.
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

// Media queries don't rasterise; bake the mid-brass, which reads on both
// light and dark tab strips.
const mark = (size, pad, bg) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  ${bg ? `<rect width="64" height="64" fill="${bg}"/>` : ''}
  <g transform="translate(${pad} ${pad}) scale(${(64 - pad * 2) / 64})">
    <rect x="14.9" y="14.9" width="34.2" height="34.2" transform="rotate(45 32 32)"
          fill="none" stroke="#b08d57" stroke-width="3.5"/>
    <rect x="26.35" y="26.35" width="11.3" height="11.3" transform="rotate(45 32 32)"
          fill="#b08d57"/>
  </g>
</svg>`;

/** Modern browsers accept a PNG payload inside the ICO container. */
function pngToIco(png, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(size === 256 ? 0 : size, 6); // width
  header.writeUInt8(size === 256 ? 0 : size, 7); // height
  header.writeUInt8(0, 8); // palette
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bpp
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18); // offset
  return Buffer.concat([header, png]);
}

const icoPng = await sharp(Buffer.from(mark(32, 0, null))).png().toBuffer();
writeFileSync('public/favicon.ico', pngToIco(icoPng, 32));

// Apple touch icons get no transparency; ink ground, mark inset.
const touch = await sharp(Buffer.from(mark(180, 10, '#14120f'))).png().toBuffer();
writeFileSync('public/apple-touch-icon.png', touch);

console.log('favicon.ico + apple-touch-icon.png written');
