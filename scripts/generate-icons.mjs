/**
 * Generates Stark Team PWA icons using sharp (bundled with Next.js).
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(iconsDir, { recursive: true })

// Stark Team brand colours
const NAVY  = { r: 15,  g: 28,  b: 46,  alpha: 1 }   // #0F1C2E
const GOLD  = { r: 212, g: 160, b: 23,  alpha: 1 }   // #D4A017

const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512]

async function generateIcon(size) {
  // Navy square with a centred gold rounded rectangle and "ST" text via SVG overlay
  const padding = Math.round(size * 0.15)
  const inner   = size - padding * 2
  const radius  = Math.round(size * 0.18)
  const font    = Math.round(size * 0.38)

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <!-- Background -->
    <rect width="${size}" height="${size}" rx="${radius}" fill="#0F1C2E"/>
    <!-- Gold inner square -->
    <rect x="${padding}" y="${padding}" width="${inner}" height="${inner}"
          rx="${Math.round(radius * 0.6)}" fill="#D4A017" opacity="0.15"/>
    <!-- ST text -->
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
          font-family="system-ui, -apple-system, sans-serif"
          font-weight="800" font-size="${font}" fill="#D4A017"
          letter-spacing="-${Math.round(font * 0.04)}">ST</text>
  </svg>`

  const buf = Buffer.from(svg)

  await sharp(buf)
    .resize(size, size)
    .png()
    .toFile(join(iconsDir, `icon-${size}.png`))

  console.log(`  ✓ icon-${size}.png`)
}

console.log('\nGenerating Stark Team PWA icons…\n')
for (const size of SIZES) {
  await generateIcon(size)
}

// apple-touch-icon (180×180 alias)
await sharp(join(iconsDir, 'icon-180.png'))
  .toFile(join(iconsDir, 'apple-touch-icon.png'))
console.log('  ✓ apple-touch-icon.png')

// favicon (32×32)
await sharp(join(iconsDir, 'icon-96.png'))
  .resize(32, 32)
  .toFile(join(iconsDir, 'favicon-32.png'))
console.log('  ✓ favicon-32.png\n')

console.log('Done! Icons saved to public/icons/\n')
