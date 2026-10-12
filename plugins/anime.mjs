const CAT = 'ANIME'

const animeCmd = (name, cat, alias = []) => ({
  name, alias, category: CAT,
  run: async (ctx) => {
    const r = await fetch(`https://api.waifu.pics/sfw/${cat}`)
    const j = await r.json()
    if (!j.url) return ctx.reply('❌ ছবি আনা যায়নি।')
    return ctx.send(ctx.jid, { image: { url: j.url }, caption: `✨ ${name}` }, { quoted: ctx.msg })
  },
})

export default [
  animeCmd('waifu', 'waifu', ['animegirl']),
  animeCmd('neko', 'neko'),
  animeCmd('shinobu', 'shinobu'),
  animeCmd('megumin', 'megumin'),
]
