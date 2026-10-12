import { GEMINI_KEY, GEMINI_MODEL, GROQ_KEY, GROQ_MODEL } from '../config.mjs'

const CAT = 'AI'
const clip = (t) => (t.length > 3500 ? t.slice(0, 3500) + '…' : t)

async function askGemini(prompt) {
  if (!GEMINI_KEY) return '⚠️ config.mjs-এ GEMINI_KEY বসাও।'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })
  const j = await r.json()
  if (j.error) return `❌ ${j.error.message}`
  return j.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || 'উত্তর পাওয়া যায়নি'
}

async function askGroq(prompt) {
  if (!GROQ_KEY) return '⚠️ config.mjs-এ GROQ_KEY বসাও।'
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: prompt }] }),
  })
  const j = await r.json()
  if (j.error) return `❌ ${j.error.message}`
  return j.choices?.[0]?.message?.content || 'উত্তর পাওয়া যায়নি'
}

const aiCmd = (name, alias, fn) => ({
  name, alias, category: CAT,
  run: async (ctx) => {
    if (!ctx.argText) return ctx.reply(`ব্যবহার: .${name} তোমার প্রশ্ন`)
    await ctx.reply('⏳ ভাবছি...')
    return ctx.reply(clip(await fn(ctx.argText)))
  },
})

export default [
  aiCmd('ai', ['gemini', 'ask'], askGemini),
  aiCmd('groq', ['groqai', 'chat'], askGroq),
]
