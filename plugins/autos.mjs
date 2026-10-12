import { settings } from '../config.mjs'
import { globalSettings, saveDb } from '../lib.mjs'

const CAT = 'AUTO'

const flag = (name, key, label) => ({
  name, category: CAT, owner: true,
  run: async (ctx) => {
    const arg = ctx.args[0]?.toLowerCase()
    const g = globalSettings()
    if (arg !== 'on' && arg !== 'off') {
      return ctx.reply(`${label} এখন: ${g[key] ? 'on' : 'off'}\nব্যবহার: .${name} on  অথবা  .${name} off`)
    }
    g[key] = arg === 'on'
    saveDb()
    return ctx.reply(`✅ ${label}: ${arg}`)
  },
})

const modeCmd = (name) => ({
  name, category: CAT, owner: true,
  run: async (ctx) => {
    settings.mode = name
    return ctx.reply(`✅ Mode এখন: ${name}`)
  },
})

export default [
  flag('autoread', 'autoread', 'অটো-রিড'),
  flag('autotyping', 'autotyping', 'অটো-টাইপিং'),
  flag('autorecord', 'autorecord', 'অটো-রেকর্ডিং'),
  flag('autoreact', 'autoreact', 'অটো-রিঅ্যাক্ট (❤️)'),
  modeCmd('public'),
  modeCmd('private'),
]

// প্রতিটি মেসেজে চলে (গ্রুপ ও প্রাইভেট দুটোতেই)
export async function onAny(ctx) {
  const g = globalSettings()
  if (g.autoread) await ctx.sock.readMessages([ctx.msg.key]).catch(() => {})
  if (g.autoreact && !ctx.msg.key.fromMe && !ctx.isOwner) {
    await ctx.sock.sendMessage(ctx.jid, { react: { text: '❤️', key: ctx.msg.key } }).catch(() => {})
  }
}
