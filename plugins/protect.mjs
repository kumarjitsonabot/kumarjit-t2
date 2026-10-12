import { groupSettings, saveDb, isGroupAdmin, numOf } from '../lib.mjs'

const CAT = 'PROTECT'
const LINK_RE = /(https?:\/\/|chat\.whatsapp\.com|wa\.me\/)/i

const toggle = (name, key, label) => ({
  name, category: CAT,
  run: async (ctx) => {
    if (!ctx.isGroup) return ctx.reply('⚠️ এই কমান্ডটি শুধু গ্রুপে ব্যবহার করা যাবে।')
    const { admin } = await isGroupAdmin(ctx.sock, ctx.jid, ctx.sender)
    if (!ctx.isOwner && !admin) return ctx.reply('⛔ শুধু গ্রুপ অ্যাডমিন ব্যবহার করতে পারবে।')
    const arg = ctx.args[0]?.toLowerCase()
    if (arg !== 'on' && arg !== 'off') {
      const cur = groupSettings(ctx.jid)[key] ? 'on' : 'off'
      return ctx.reply(`${label} এখন: ${cur}\nব্যবহার: .${name} on  অথবা  .${name} off`)
    }
    groupSettings(ctx.jid)[key] = arg === 'on'
    saveDb()
    return ctx.reply(`✅ ${label}: ${arg}`)
  },
})

export default [
  toggle('antilink', 'antilink', 'অ্যান্টিলিংক'),
  toggle('welcome', 'welcome', 'ওয়েলকাম বার্তা'),
  toggle('goodbye', 'goodbye', 'বিদায় বার্তা'),
]

// প্রতিটি মেসেজের জন্য চলে (শুধু অ্যাডমিন/Owner ছাড়া অন্যদের মেসেজে)
export async function onMessage(ctx) {
  if (!ctx.isGroup || !groupSettings(ctx.jid).antilink) return
  if (!LINK_RE.test(ctx.text)) return
  const { admin } = await isGroupAdmin(ctx.sock, ctx.jid, ctx.sender)
  if (admin) return
  await ctx.sock.sendMessage(ctx.jid, { delete: ctx.msg.key })
  await ctx.send(ctx.jid, {
    text: `🚫 @${numOf(ctx.sender)} গ্রুপে লিংক দেওয়া নিষেধ।`,
    mentions: [ctx.sender],
  })
}

// কেউ যোগ হলে বা বের হলে চলে
export async function onGroupUpdate(sock, update) {
  const s = groupSettings(update.id)
  const list = update.participants.map(p => (typeof p === 'string' ? p : p.id))
  const me = numOf(sock.user?.id)

  if (update.action === 'add' && s.welcome) {
    const meta = await sock.groupMetadata(update.id)
    const text = list.map(j => `👋 স্বাগতম @${numOf(j)}!`).join('\n') + `\n\n*${meta.subject}* গ্রুপে তোমাকে পেয়ে ভালো লাগছে।`
    await sock.sendMessage(update.id, { text, mentions: list })
  }

  if (update.action === 'remove' && s.goodbye) {
    const others = list.filter(j => numOf(j) !== me)
    if (!others.length) return
    const text = others.map(j => `👋 @${numOf(j)} বিদায়!`).join('\n')
    await sock.sendMessage(update.id, { text, mentions: others })
  }
}
