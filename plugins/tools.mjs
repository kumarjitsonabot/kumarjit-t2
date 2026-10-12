const CAT = 'TOOLS'

export default [
  {
    name: 'calc', alias: ['calculate'], category: CAT,
    run: async (ctx) => {
      const expr = ctx.argText
      if (!expr || !/^[\d+\-*\/().%\s]+$/.test(expr)) {
        return ctx.reply('ব্যবহার: .calc 12*(3+4)\n(শুধু সংখ্যা ও + - * / ( ) % চলবে)')
      }
      const result = Function(`"use strict"; return (${expr})`)()
      return ctx.reply(`🧮 ${expr} = ${result}`)
    },
  },
  {
    name: 'createqr', alias: ['qrcode', 'makeqr', 'qr'], category: CAT,
    run: async (ctx) => {
      if (!ctx.argText) return ctx.reply('ব্যবহার: .qr তোমার লেখা বা লিংক')
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(ctx.argText)}`
      return ctx.send(ctx.jid, { image: { url }, caption: '📱 QR কোড' }, { quoted: ctx.msg })
    },
  },
  {
    name: 'shorturl', category: CAT,
    run: async (ctx) => {
      if (!ctx.argText) return ctx.reply('ব্যবহার: .shorturl https://example.com')
      const r = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(ctx.argText)}`)
      return ctx.reply(`🔗 ${(await r.text()).trim()}`)
    },
  },
  {
    name: 'ssweb', category: CAT,
    run: async (ctx) => {
      if (!ctx.argText) return ctx.reply('ব্যবহার: .ssweb https://example.com')
      return ctx.send(ctx.jid, { image: { url: `https://image.thum.io/get/${ctx.argText}` }, caption: '🖥️ ওয়েবসাইটের স্ক্রিনশট' }, { quoted: ctx.msg })
    },
  },
]
