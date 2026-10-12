const CAT = 'SEARCH'
const UA = { 'User-Agent': 'KUMARJIT-T2-Bot/1.0' }

export default [
  {
    name: 'weather', category: CAT,
    run: async (ctx) => {
      if (!ctx.argText) return ctx.reply('ব্যবহার: .weather Dhaka')
      const r = await fetch(`https://wttr.in/${encodeURIComponent(ctx.argText)}?format=3`, { headers: UA })
      return ctx.reply(`🌦️ ${(await r.text()).trim()}`)
    },
  },
  {
    name: 'wiki', category: CAT,
    run: async (ctx) => {
      if (!ctx.argText) return ctx.reply('ব্যবহার: .wiki Bangladesh')
      const title = ctx.argText.replace(/ /g, '_')
      const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { headers: UA })
      const j = await r.json()
      if (!j.extract) return ctx.reply('❌ উইকিপিডিয়ায় পাওয়া যায়নি।')
      return ctx.reply(`📚 *${j.title}*\n\n${j.extract}\n\n${j.content_urls?.desktop?.page || ''}`)
    },
  },
  {
    name: 'npm', alias: ['npmsearch', 'npmpack'], category: CAT,
    run: async (ctx) => {
      if (!ctx.argText) return ctx.reply('ব্যবহার: .npm baileys')
      const r = await fetch(`https://registry.npmjs.org/${encodeURIComponent(ctx.argText)}/latest`, { headers: UA })
      const j = await r.json()
      if (!j.name) return ctx.reply('❌ প্যাকেজ পাওয়া যায়নি।')
      return ctx.reply(`📦 *${j.name}* v${j.version}\n${j.description || ''}\n\nhttps://www.npmjs.com/package/${j.name}`)
    },
  },
  {
    name: 'define', alias: ['meaning'], category: CAT,
    run: async (ctx) => {
      if (!ctx.argText) return ctx.reply('ব্যবহার: .define hello')
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(ctx.argText)}`)
      const j = await r.json()
      const def = j?.[0]?.meanings?.[0]?.definitions?.[0]?.definition
      if (!def) return ctx.reply('❌ অর্থ পাওয়া যায়নি।')
      return ctx.reply(`📖 *${j[0].word}*\n\n${def}`)
    },
  },
]
