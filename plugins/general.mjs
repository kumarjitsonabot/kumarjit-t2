import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { BOT_NAME, OWNER_NAME, PREFIXES, settings } from '../config.mjs'
import { renderMenuCard } from '../menucard.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MENU_IMAGE = path.join(__dirname, '..', 'assets', 'menu.jpg')
const CATEGORY_ORDER = ['GENERAL', 'GROUP', 'PROTECT', 'AI', 'ANIME', 'DEVOTION', 'SEARCH', 'TOOLS', 'UTILITY', 'MEDIA', 'AUTO', 'OWNER', 'MAIN']

const numOf = (jid) => (jid || '').split('@')[0].split(':')[0]

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`
}

function groupCommands(ctx) {
  const uniq = [...new Set(ctx.commands.values())]
  const groups = {}
  for (const c of uniq) {
    const cat = c.category || 'OTHER'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(c)
  }
  const cats = [
    ...CATEGORY_ORDER.filter(c => groups[c]),
    ...Object.keys(groups).filter(c => !CATEGORY_ORDER.includes(c)),
  ]
  return { groups, cats, total: uniq.length }
}

function buildCaption(info, groups, cats) {
  let out = `*${info.botName}*\n👑 Owner: ${OWNER_NAME}\n⚙️ Mode: ${info.mode}\n🔰 Prefix: ${PREFIXES.join(' ')}\n⏱️ Run: ${info.uptime}\n💾 Ram: ${info.ram}\n\nনিচে সব কমান্ডের তালিকা 👇\n`
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
      const { groups, cats, total } = groupCommands(ctx)
      const info = {
        botName: BOT_NAME,
        mode: settings.mode === 'private' ? 'Private' : 'Public',
        uptime: fmtUptime(Date.now() - ctx.startedAt),
        ram: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      }
      const caption = buildCaption(info, groups, cats)

      // আগে থেকে সেট করা ব্যানার (.setmenu) থাকলে সেটাই দেখাবে
      if (fs.existsSync(MENU_IMAGE)) {
        return ctx.send(ctx.jid, { image: fs.readFileSync(MENU_IMAGE), caption }, { quoted: ctx.msg })
      }

      try {
        const image = await renderMenuCard({
          botName: BOT_NAME,
          ownerName: OWNER_NAME,
          mode: info.mode,
          prefix: PREFIXES[0],
          uptime: info.uptime,
          ram: info.ram,
          total,
          categories: cats.map(c => ({ name: c, items: groups[c].map(x => x.name) })),
        })
        return ctx.send(ctx.jid, { image, caption }, { quoted: ctx.msg })
      } catch (e) {
        console.log('Menu card error:', e.message)
        return ctx.reply(caption)
      }
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
