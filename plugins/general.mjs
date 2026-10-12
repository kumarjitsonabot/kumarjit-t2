import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { BOT_NAME, OWNER_NAME, PREFIXES, settings } from '../config.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MENU_IMAGE = path.join(__dirname, '..', 'assets', 'menu.jpg')
const CATEGORY_ORDER = ['GENERAL', 'GROUP', 'AI', 'TOOLS', 'OWNER']

const numOf = (jid) => (jid || '').split('@')[0].split(':')[0]

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`
}

function buildMenu(ctx) {
  const uniq = [...new Set(ctx.commands.values())]
  const groups = {}
  for (const c of uniq) {
    const cat = c.category || 'OTHER'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(c)
  }

  const ram = Math.round(process.memoryUsage().rss / 1024 / 1024)
  let out = `┌───✦ ${ctx.botName} ✦───\n`
  out += `│ 👑 Owner: ${OWNER_NAME}\n`
  out += `│ ⚙️ Mode: ${settings.mode === 'private' ? 'Private 🔒' : 'Public 🌍'}\n`
  out += `│ 🔰 Prefix: ${PREFIXES.join(' ')}\n`
  out += `│ ⏱️ Run: ${fmtUptime(Date.now() - ctx.startedAt)}\n`
  out += `│ 💾 Ram: ${ram} MB\n`
  out += `└────────────\n\nনিচে সব কমান্ডের তালিকা 👇\n`

  const cats = [
    ...CATEGORY_ORDER.filter(c => groups[c]),
    ...Object.keys(groups).filter(c => !CATEGORY_ORDER.includes(c)),
  ]
  for (const cat of cats) {
    out += `\n┌─❮ ${cat} ❯─\n`
    for (const c of groups[cat]) {
      const alias = c.alias?.length ? ` (${c.alias.join(', ')})` : ''
      out += `│ ⊃ ${c.name}${alias}\n`
    }
    out += `└────────────\n`
  }
  return out + `\n© Powered by ${OWNER_NAME}`
}

export default [
  {
    name: 'menu',
    alias: ['list', 'help'],
    category: 'GENERAL',
    run: async (ctx) => {
      const text = buildMenu(ctx)
      if (fs.existsSync(MENU_IMAGE)) {
        return ctx.send(ctx.jid, { image: fs.readFileSync(MENU_IMAGE), caption: text }, { quoted: ctx.msg })
      }
      return ctx.reply(text)
    },
  },
  {
    name: 'ping',
    category: 'GENERAL',
    run: (ctx) => ctx.reply(`pong 🏓 — ${BOT_NAME}`),
  },
  {
    name: 'alive',
    category: 'GENERAL',
    run: (ctx) => ctx.reply(`✅ ${BOT_NAME} চালু আছে\n⏱️ Uptime: ${fmtUptime(Date.now() - ctx.startedAt)}\n👑 Owner: ${OWNER_NAME}`),
  },
  {
    name: 'uptime',
    category: 'GENERAL',
    run: (ctx) => ctx.reply(`⏱️ Uptime: ${fmtUptime(Date.now() - ctx.startedAt)}`),
  },
  {
    name: 'owner',
    category: 'GENERAL',
    run: (ctx) => ctx.reply(`👑 Owner: ${OWNER_NAME}\n📞 wa.me/${numOf(ctx.sock.user?.id)}`),
  },
  {
    name: 'mode',
    category: 'OWNER',
    owner: true,
    run: async (ctx) => {
      const m = ctx.args[0]?.toLowerCase()
      if (m === 'public' || m === 'private') {
        settings.mode = m
        return ctx.reply(`✅ Mode এখন: ${m}`)
      }
      return ctx.reply(`বর্তমান Mode: ${settings.mode}\nব্যবহার: .mode public  অথবা  .mode private`)
    },
  },
]
