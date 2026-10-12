const CAT = 'DEVOTION'
const getJson = async (url) => (await fetch(url)).json()
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a

export default [
  {
    name: 'gitashlok', alias: ['gitaverse'], category: CAT,
    run: async (ctx) => {
      let ch = rnd(1, 18), v = rnd(1, 20)
      if (ctx.args.length === 2) [ch, v] = ctx.args
      for (let i = 0; i < 5; i++) {
        try {
          const j = await getJson(`https://vedicscriptures.github.io/slok/${ch}/${v}`)
          if (j.slok) return ctx.reply(`🕉️ *শ্রীমদ্ভগবদ্গীতা ${j.chapter}:${j.verse}*\n\n${j.slok}\n\n${j.transliteration || ''}`)
        } catch {}
        ch = rnd(1, 18); v = rnd(1, 20)
      }
      return ctx.reply('❌ শ্লোক আনা যায়নি, আবার চেষ্টা করো।')
    },
  },
  {
    name: 'quranverse', alias: ['qverse', 'ayat'], category: CAT,
    run: async (ctx) => {
      const ref = ctx.argText.replace(/\s+/g, '') || String(rnd(1, 6236))
      const j = await getJson(`https://api.alquran.cloud/v1/ayah/${encodeURIComponent(ref)}/en.asad`)
      if (j.code !== 200) return ctx.reply('❌ আয়াত পাওয়া যায়নি। ব্যবহার: .ayat 2:255')
      const d = j.data
      return ctx.reply(`📖 *${d.surah.englishName} ${d.surah.number}:${d.numberInSurah}*\n\n${d.text}`)
    },
  },
  {
    name: 'bibleverse', alias: ['verse'], category: CAT,
    run: async (ctx) => {
      const ref = ctx.argText || 'john 3:16'
      const j = await getJson(`https://bible-api.com/${encodeURIComponent(ref)}`)
      if (!j.text) return ctx.reply('❌ পদ পাওয়া যায়নি। ব্যবহার: .verse john 3:16')
      return ctx.reply(`📖 *${j.reference}*\n\n${j.text.trim()}`)
    },
  },
]
