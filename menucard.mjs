import sharp from 'sharp'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const FONT = 'DejaVu Sans, Arial, sans-serif'

const COLORS = {
  GENERAL: ['#7F77DD', '#AFA9EC'],
  GROUP: ['#5DCAA5', '#9FE1CB'],
  PROTECT: ['#D85A30', '#F5C4B3'],
  AI: ['#EF9F27', '#FAC775'],
  ANIME: ['#D4537E', '#F4C0D1'],
  DEVOTION: ['#EF9F27', '#FAC775'],
  SEARCH: ['#378ADD', '#B5D4F4'],
  TOOLS: ['#85B7EB', '#B5D4F4'],
  UTILITY: ['#888780', '#D3D1C7'],
  OWNER: ['#E24B4A', '#F7C1C1'],
  MEDIA: ['#1D9E75', '#9FE1CB'],
  AUTO: ['#7F77DD', '#AFA9EC'],
  MAIN: ['#888780', '#D3D1C7'],
}
const DEFAULT_COLOR = ['#888780', '#D3D1C7']

function wrapItems(items) {
  const lines = []
  let line = ''
  for (const item of items) {
    const next = line ? `${line}  ${item}` : item
    if (next.length > 20 && line) {
      lines.push(line)
      line = item
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function renderMenuCard({ botName, ownerName, mode, prefix, uptime, ram, total, categories }) {
  const W = 380
  const tileW = 164
  const tileH = 120
  const gap = 12
  const rows = Math.ceil(categories.length / 2)
  const H = 206 + rows * (tileH + gap) + 40

  let tiles = ''
  categories.forEach((c, i) => {
    const x = 20 + (i % 2) * (tileW + gap)
    const y = 206 + Math.floor(i / 2) * (tileH + gap)
    const [accent, textColor] = COLORS[c.name] || DEFAULT_COLOR
    const all = wrapItems(c.items)
    const lines = all.slice(0, 3)
    if (all.length > 3) lines[2] += ' …'

    tiles += `<rect x="${x}" y="${y}" width="${tileW}" height="${tileH}" rx="16" fill="#1C2440"/>`
    tiles += `<rect x="${x}" y="${y}" width="4" height="${tileH}" rx="2" fill="${accent}"/>`
    tiles += `<text x="${x + 18}" y="${y + 28}" font-family="${FONT}" font-size="14" font-weight="700" fill="${textColor}">${esc(c.name)} (${c.items.length})</text>`
    lines.forEach((l, k) => {
      tiles += `<text x="${x + 18}" y="${y + 52 + k * 20}" font-family="${FONT}" font-size="12" fill="#C9CEE6">${esc(l)}</text>`
    })
  })

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="hd" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#7F77DD"/>
<stop offset="1" stop-color="#1D9E75"/>
</linearGradient>
</defs>
<rect width="${W}" height="${H}" rx="22" fill="#0B1020"/>
<rect x="20" y="20" width="340" height="96" rx="16" fill="url(#hd)"/>
<text x="38" y="58" font-family="${FONT}" font-size="22" font-weight="700" fill="#FFFFFF">${esc(botName)}</text>
<text x="38" y="80" font-family="${FONT}" font-size="12" fill="#E6F1FB">Owner ${esc(ownerName)}  •  Prefix ${esc(prefix)}</text>
<text x="38" y="102" font-family="${FONT}" font-size="11" fill="#E6F1FB">Mode ${esc(mode)}  •  Run ${esc(uptime)}</text>
<rect x="20" y="132" width="164" height="58" rx="12" fill="#1C2440"/>
<text x="34" y="156" font-family="${FONT}" font-size="11" fill="#8F9BC4">Ram</text>
<text x="34" y="178" font-family="${FONT}" font-size="15" font-weight="700" fill="#FFFFFF">${esc(ram)}</text>
<rect x="196" y="132" width="164" height="58" rx="12" fill="#1C2440"/>
<text x="210" y="156" font-family="${FONT}" font-size="11" fill="#8F9BC4">Commands</text>
<text x="210" y="178" font-family="${FONT}" font-size="15" font-weight="700" fill="#FFFFFF">${total}</text>
${tiles}
<text x="${W / 2}" y="${H - 16}" text-anchor="middle" font-family="${FONT}" font-size="11" fill="#6B7599">Powered by ${esc(ownerName)}</text>
</svg>`

  return sharp(Buffer.from(svg)).png().toBuffer()
}
