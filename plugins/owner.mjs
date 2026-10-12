import fs from 'fs'
import { numOf } from '../lib.mjs'

const CAT = 'OWNER'
const toJid = (t) => { const n = (t || '').replace(/\D/g, ''); return n.length >= 7 ? `${n}@s.whatsapp.net` : null }

function ciOf(msg) {
  const m = msg.message || {}
  return m.extendedTextMessage?.contextInfo || m.imageMessage?.contextInfo || m.videoMessage?.contextInfo || {}
}

// টার্গেট: মেনশন > reply করা ব্যক্তি > লেখা নম্বর
function targetOf(ctx) {
  const ci = ciOf(ctx.msg)
  const me = numOf(ctx.sock.user?.id)
  const cand = (ci.mentionedJid || [])[0] || ci.participant || toJid(ctx.argText)
  if (!cand || numOf(cand) === me) return null
  return cand
}

const blockCmd = (name, action, alias = []) => ({
  name, alias, category: CAT, owner: true,
  run: async (ctx) => {
    const t = targetOf(ctx)
    if (!t) return ctx.reply(`ব্যবহার: কাউকে মেনশন/reply করে .${name} লেখো, অথবা .${name} 8801XXXXXXXXX`)
    await ctx.sock.updateBlockStatus(t, action)
    return ctx.reply(`✅ ${numOf(t)} ${action === 'block' ? 'ব্লক' : 'আনব্লক'} করা হয়েছে`)
  },
})

export default [
  blockCmd('block', 'block'),
  blockCmd('unblock', 'unblock'),
  {
    name: 'blocklist', category: CAT, owner: true,
    run: async (ctx) => {
      const list = await ctx.sock.fetchBlocklist()
      if (!list?.length) return ctx.reply('ব্লক তালিকা খালি।')
      return ctx.reply(`🚫 ব্লক তালিকা (${list.length}):\n` + list.map((j, i) => `${i + 1}. ${numOf(j)}`).join('\n'))
    },
  },
  {
    name: 'setbio', alias: ['setstatus', 'setabout'], category: CAT, owner: true,
    run: async (ctx) => {
      if (!ctx.argText) return ctx.reply('ব্যবহার: .setbio নতুন বায়ো')
      await ctx.sock.updateProfileStatus(ctx.argText)
      return ctx.reply('✅ বায়ো বদলানো হয়েছে')
    },
  },
  {
    name: 'setname', alias: ['setpushname'], category: CAT, owner: true,
    run: async (ctx) => {
      if (!ctx.argText) return ctx.reply('ব্যবহার: .setname নতুন নাম')
      await ctx.sock.updateProfileName(ctx.argText)
      return ctx.reply('✅ নাম বদলানো হয়েছে')
    },
  },
  {
    name: 'setpp', alias: ['setdp', 'setprofile'], category: CAT, owner: true,
    run: async (ctx) => {
      const m = ctx.msg.message || {}
      const img = m.imageMessage ? ctx.msg : null
      if (!img) return ctx.reply('ব্যবহার: একটি ছবিতে .setpp caption হিসেবে লিখে পাঠাও')
      const { downloadMediaMessage } = await import('@whiskeysockets/baileys')
      const buf = await downloadMediaMessage(img, 'buffer', {}, { reuploadRequest: ctx.sock.updateMediaMessage })
      await ctx.sock.updateProfilePicture(ctx.sock.user.id, buf)
      return ctx.reply('✅ নিজের প্রোফাইল ছবি বদলানো হয়েছে')
    },
  },
  {
    name: 'removepp', alias: ['removedp', 'deletepp'], category: CAT, owner: true,
    run: async (ctx) => {
      await ctx.sock.removeProfilePicture(ctx.sock.user.id)
      return ctx.reply('✅ নিজের প্রোফাইল ছবি মুছে ফেলা হয়েছে')
    },
  },
  {
    name: 'jid', category: CAT, owner: true,
    run: async (ctx) => ctx.reply(`🆔 Chat JID: ${ctx.jid}\n👤 Sender JID: ${ctx.sender}`),
  },
  {
    name: 'listgc', alias: ['grouplist'], category: CAT, owner: true,
    run: async (ctx) => {
      const groups = Object.values(await ctx.sock.groupFetchAllParticipating())
      if (!groups.length) return ctx.reply('কোনো গ্রুপ পাওয়া যায়নি।')
      return ctx.reply(`👥 গ্রুপ তালিকা (${groups.length}):\n` + groups.map((g, i) => `${i + 1}. ${g.subject} (${g.participants.length})`).join('\n'))
    },
  },
  {
    name: 'join', category: CAT, owner: true,
    run: async (ctx) => {
      const code = (ctx.argText.split('chat.whatsapp.com/')[1] || '').trim()
      if (!code) return ctx.reply('ব্যবহার: .join https://chat.whatsapp.com/XXXX')
      await ctx.sock.groupAcceptInvite(code)
      return ctx.reply('✅ গ্রুপে যোগ দেওয়া হয়েছে')
    },
  },
  {
    name: 'delete', alias: ['del'], category: CAT, owner: true,
    run: async (ctx) => {
      const ci = ciOf(ctx.msg)
      if (!ci.stanzaId) return ctx.reply('ব্যবহার: যে মেসেজ মুছতে চাও তাতে reply করে .delete লেখো')
      const mine = !ctx.isGroup || numOf(ci.participant) === numOf(ctx.sock.user?.id)
      await ctx.sock.sendMessage(ctx.jid, {
        delete: { remoteJid: ctx.jid, fromMe: mine, id: ci.stanzaId, participant: ci.participant },
      })
    },
  },
]
