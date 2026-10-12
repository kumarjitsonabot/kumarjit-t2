import { BOT_NAME } from '../config.mjs'

const CAT = 'GROUP'
const numOf = (jid) => (jid || '').split('@')[0].split(':')[0]
const pjid = (p) => p.phoneNumber || p.id
const ctxInfoOf = (msg) => {
  const m = msg.message || {}
  return m.extendedTextMessage?.contextInfo || m.imageMessage?.contextInfo || m.videoMessage?.contextInfo || {}
}
const mentionsOf = (msg) => ctxInfoOf(msg).mentionedJid || []
const quotedOf = (msg) => ctxInfoOf(msg).quotedMessage
const quotedSender = (msg) => ctxInfoOf(msg).participant

async function requireGroup(ctx) {
  if (ctx.isGroup) return true
  await ctx.reply('⚠️ এই কমান্ডটি শুধু গ্রুপে ব্যবহার করা যাবে।')
  return false
}

async function requireAdmin(ctx) {
  if (!(await requireGroup(ctx))) return null
  const g = await ctx.sock.groupMetadata(ctx.jid)
  const admins = new Set()
  for (const p of g.participants) {
    if (!p.admin) continue
    for (const v of [p.id, p.phoneNumber, p.lid]) if (v) admins.add(numOf(v))
  }
  if (ctx.isOwner || (ctx.sender && admins.has(numOf(ctx.sender)))) return g
  await ctx.reply('⛔ এই কমান্ড শুধু গ্রুপ অ্যাডমিন ব্যবহার করতে পারবে।')
  return null
}

function targetsOf(ctx) {
  const list = [...mentionsOf(ctx.msg)]
  const q = quotedSender(ctx.msg)
  if (q) list.push(q)
  const me = numOf(ctx.sock.user?.id)
  return [...new Set(list)].filter(j => numOf(j) !== me)
}

const participantCmd = (name, action, alias = []) => ({
  name, alias, category: CAT,
  run: async (ctx) => {
    if (!(await requireAdmin(ctx))) return
    const targets = targetsOf(ctx)
    if (!targets.length) return ctx.reply(`ব্যবহার: কাউকে মেনশন (@) করে বা তার মেসেজে reply করে .${name} লেখো`)
    const res = await ctx.sock.groupParticipantsUpdate(ctx.jid, targets, action)
    const ok = res.filter(r => r.status === '200').length
    return ctx.reply(`✅ ${name} সম্পন্ন: ${ok}/${targets.length}`)
  },
})

const settingCmd = (name, setting, alias = []) => ({
  name, alias, category: CAT,
  run: async (ctx) => {
    if (!(await requireAdmin(ctx))) return
    await ctx.sock.groupSettingUpdate(ctx.jid, setting)
    return ctx.reply(`✅ ${name} সম্পন্ন`)
  },
})

export default [
  {
    name: 'tagall', category: CAT,
    run: async (ctx) => {
      const g = await requireAdmin(ctx)
      if (!g) return
      const mentions = g.participants.map(pjid)
      const lines = mentions.map((j, i) => `${i + 1}. @${numOf(j)}`).join('\n')
      return ctx.send(ctx.jid, { text: `📢 *${ctx.argText || 'সবাই মনোযোগ দাও'}*\n\n${lines}`, mentions }, { quoted: ctx.msg })
    },
  },
  {
    name: 'hidetag', alias: ['tag'], category: CAT,
    run: async (ctx) => {
      const g = await requireAdmin(ctx)
      if (!g) return
      const q = quotedOf(ctx.msg)
      const qText = q?.conversation || q?.extendedTextMessage?.text || ''
      return ctx.send(ctx.jid, { text: ctx.argText || qText || '📢', mentions: g.participants.map(pjid) }, { quoted: ctx.msg })
    },
  },
  {
    name: 'add', category: CAT,
    run: async (ctx) => {
      if (!(await requireAdmin(ctx))) return
      const nums = ctx.args.map(a => a.replace(/\D/g, '')).filter(n => n.length >= 7)
      if (!nums.length) return ctx.reply('ব্যবহার: .add 8801XXXXXXXXX')
      const res = await ctx.sock.groupParticipantsUpdate(ctx.jid, nums.map(n => `${n}@s.whatsapp.net`), 'add')
      const ok = res.filter(r => r.status === '200').length
      return ctx.reply(`✅ ${ok}/${nums.length} জনকে যোগ করা হয়েছে।\n(403 মানে তার প্রাইভেসি সেটিং বাধা দিচ্ছে)`)
    },
  },
  participantCmd('kick', 'remove', ['remove']),
  participantCmd('promote', 'promote'),
  participantCmd('demote', 'demote'),
  {
    name: 'link', alias: ['invite', 'grouplink'], category: CAT,
    run: async (ctx) => {
      if (!(await requireAdmin(ctx))) return
      const code = await ctx.sock.groupInviteCode(ctx.jid)
      return ctx.reply(`🔗 গ্রুপ লিংক:\nhttps://chat.whatsapp.com/${code}`)
    },
  },
  {
    name: 'reset', alias: ['resetlink', 'newlink'], category: CAT,
    run: async (ctx) => {
      if (!(await requireAdmin(ctx))) return
      const code = await ctx.sock.groupRevokeInvite(ctx.jid)
      return ctx.reply(`♻️ নতুন লিংক:\nhttps://chat.whatsapp.com/${code}`)
    },
  },
  settingCmd('lock', 'locked'),
  settingCmd('unlock', 'unlocked'),
  settingCmd('mute', 'announcement'),
  settingCmd('unmute', 'not_announcement'),
  {
    name: 'setname', category: CAT,
    run: async (ctx) => {
      if (!(await requireAdmin(ctx))) return
      if (!ctx.argText) return ctx.reply('ব্যবহার: .setname নতুন নাম')
      await ctx.sock.groupUpdateSubject(ctx.jid, ctx.argText)
      return ctx.reply('✅ গ্রুপের নাম বদলানো হয়েছে')
    },
  },
  {
    name: 'desc', alias: ['setdesc', 'description'], category: CAT,
    run: async (ctx) => {
      if (!(await requireAdmin(ctx))) return
      await ctx.sock.groupUpdateDescription(ctx.jid, ctx.argText || undefined)
      return ctx.reply(ctx.argText ? '✅ বর্ণনা বদলানো হয়েছে' : '✅ বর্ণনা মুছে ফেলা হয়েছে')
    },
  },
  {
    name: 'ginfo', alias: ['gcinfo'], category: CAT,
    run: async (ctx) => {
      if (!(await requireGroup(ctx))) return
      const g = await ctx.sock.groupMetadata(ctx.jid)
      const admins = g.participants.filter(p => p.admin).length
      return ctx.reply(`👥 *${g.subject}*\n\n🧑‍🤝‍🧑 মোট সদস্য: ${g.participants.length}\n🛡️ অ্যাডমিন: ${admins}\n📝 বর্ণনা: ${g.desc || 'নেই'}`)
    },
  },
  {
    name: 'admin', alias: ['admins'], category: CAT,
    run: async (ctx) => {
      if (!(await requireGroup(ctx))) return
      const g = await ctx.sock.groupMetadata(ctx.jid)
      const admins = g.participants.filter(p => p.admin)
      const lines = admins.map((p, i) => `${i + 1}. @${numOf(pjid(p))}`).join('\n')
      return ctx.send(ctx.jid, { text: `🛡️ *অ্যাডমিন তালিকা*\n\n${lines}`, mentions: admins.map(pjid) }, { quoted: ctx.msg })
    },
  },
  {
    name: 'leave', alias: ['exit', 'left'], category: CAT, owner: true,
    run: async (ctx) => {
      if (!(await requireGroup(ctx))) return
      await ctx.reply(`👋 ${BOT_NAME} গ্রুপ ছেড়ে যাচ্ছে`)
      await ctx.sock.groupLeave(ctx.jid)
    },
  },
]
