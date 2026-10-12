const CAT = 'UTILITY'

export default [
  {
    name: 'tts', alias: ['say', 'voice'], category: CAT,
    run: async (ctx) => {
      let lang = 'bn'
      let text = ctx.argText
      if (ctx.args.length > 1 && /^[a-z]{2}$/i.test(ctx.args[0])) {
        lang = ctx.args[0].toLowerCase()
        text = ctx.args.slice(1).join(' ')
      }
      if (!text) return ctx.reply('ব্যবহার: .tts বাংলায় লেখা  অথবা  .tts en hello')
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text.slice(0, 190))}`
      return ctx.send(ctx.jid, { audio: { url }, mimetype: 'audio/mpeg', ptt: true }, { quoted: ctx.msg })
    },
  },
  {
    name: 'checknumber', alias: ['checkwa'], category: CAT,
    run: async (ctx) => {
      const num = ctx.argText.replace(/\D/g, '')
      if (num.length < 7) return ctx.reply('ব্যবহার: .checkwa 8801XXXXXXXXX')
      const [r] = await ctx.sock.onWhatsApp(num)
      return ctx.reply(r?.exists ? `✅ ${num} WhatsApp-এ আছে` : `❌ ${num} WhatsApp-এ নেই`)
    },
  },
]
