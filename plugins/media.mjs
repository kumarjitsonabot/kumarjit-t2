import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import pino from 'pino'
import { downloadMediaMessage } from '@whiskeysockets/baileys'

const execFileP = promisify(execFile)
const CAT = 'MEDIA'
const logger = pino({ level: 'silent' })

// reply করা মেসেজ বা নিজের caption-সহ মেসেজ
function targetOf(ctx) {
  const m = ctx.msg.message || {}
  if (m.imageMessage || m.videoMessage || m.stickerMessage) return ctx.msg
  const ci = m.extendedTextMessage?.contextInfo
  if (!ci?.quotedMessage) return null
  return {
    key: { remoteJid: ctx.jid, id: ci.stanzaId, participant: ci.participant, fromMe: false },
    message: ci.quotedMessage,
  }
}

async function download(ctx, msg) {
  return downloadMediaMessage(msg, 'buffer', {}, { logger, reuploadRequest: ctx.sock.updateMediaMessage })
}

async function convert(buf, args, outExt) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kj-'))
  const inp = path.join(dir, 'in')
  const out = path.join(dir, `out.${outExt}`)
  try {
    fs.writeFileSync(inp, buf)
    await execFileP('ffmpeg', ['-y', '-i', inp, ...args, out])
    return fs.readFileSync(out)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

export default [
  {
    name: 'sticker', alias: ['s'], category: CAT,
    run: async (ctx) => {
      const target = targetOf(ctx)
      const m = target?.message || {}
      const isImg = !!m.imageMessage
      const isVid = !!m.videoMessage
      if (!isImg && !isVid) return ctx.reply('ব্যবহার: একটি ছবি/ছোট ভিডিওতে reply করে .s লেখো')

      await ctx.reply('⏳ স্টিকার বানানো হচ্ছে...')
      const buf = await download(ctx, target)
      const vf = 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,fps=15,format=rgba'
      const args = isVid
        ? ['-t', '6', '-vf', vf, '-vcodec', 'libwebp', '-loop', '0', '-an', '-q:v', '60']
        : ['-vf', vf, '-vcodec', 'libwebp', '-loop', '0', '-q:v', '80']
      const webp = await convert(buf, args, 'webp')
      return ctx.send(ctx.jid, { sticker: webp }, { quoted: ctx.msg })
    },
  },
  {
    name: 'toimage', alias: ['sticker2img'], category: CAT,
    run: async (ctx) => {
      const target = targetOf(ctx)
      if (!target?.message?.stickerMessage) return ctx.reply('ব্যবহার: একটি স্টিকারে reply করে .toimage লেখো')

      await ctx.reply('⏳ ছবি বানানো হচ্ছে...')
      const buf = await download(ctx, target)
      const png = await convert(buf, [], 'png')
      return ctx.send(ctx.jid, { image: png, caption: '🖼️ ছবি' }, { quoted: ctx.msg })
    },
  },
]
