import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import pino from 'pino'
import readline from 'readline/promises'
import { stdin as input, stdout as output } from 'process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { BOT_NAME, PREFIXES, EXTRA_OWNERS, settings } from './config.mjs'
import { numOf, globalSettings } from './lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logger = pino({ level: 'silent' })
const sentIds = new Set()
const commands = new Map()
const anyHooks = []     // সব মেসেজে চলে
const messageHooks = [] // গ্রুপে অন্যদের মেসেজে চলে (যেমন অ্যান্টিলিংক)
const groupHooks = []   // কেউ যোগ/বের হলে চলে
const startedAt = Date.now()

function getText(msg) {
  const m = msg.message || {}
  return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || ''
}

function parse(text) {
  const t = text.trim()
  const prefix = PREFIXES.find(p => t.startsWith(p))
  if (!prefix) return null
  const body = t.slice(prefix.length).trim()
  const [name = '', ...rest] = body.split(/\s+/)
  return { name: name.toLowerCase(), args: rest, argText: body.slice(name.length).trim() }
}

async function loadPlugins() {
  commands.clear()
  anyHooks.length = 0
  messageHooks.length = 0
  groupHooks.length = 0
  const dir = path.join(__dirname, 'plugins')
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.mjs')) continue
    const mod = await import(pathToFileURL(path.join(dir, file)).href)
    for (const cmd of mod.default || []) {
      for (const n of [cmd.name, ...(cmd.alias || [])]) commands.set(n.toLowerCase(), cmd)
    }
    if (mod.onAny) anyHooks.push(mod.onAny)
    if (mod.onMessage) messageHooks.push(mod.onMessage)
    if (mod.onGroupUpdate) groupHooks.push(mod.onGroupUpdate)
  }
  console.log(`✅ মোট ${new Set(commands.values()).size} টি কমান্ড লোড হয়েছে`)
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browsers: ['Ubuntu', 'Chrome', '20.0.04'],
  })

  sock.ev.on('creds.update', saveCreds)

  if (!sock.authState.creds.registered) {
    const rl = readline.createInterface({ input, output })
    const phone = (await rl.question('WhatsApp নম্বর দাও (দেশের কোডসহ, + ছাড়া): ')).replace(/\D/g, '')
    rl.close()
    await new Promise(r => setTimeout(r, 3000))
    const code = await sock.requestPairingCode(phone)
    console.log(`\n${BOT_NAME} পেয়ারিং কোড: ${code}\n`)
  }

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') console.log(`✅ ${BOT_NAME} কানেক্ট হয়েছে!`)
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      console.log('কানেকশন বন্ধ হয়েছে। রিকানেক্ট করা হবে:', shouldReconnect)
      if (shouldReconnect) start()
    }
  })

  sock.ev.on('group-participants.update', async (update) => {
    for (const h of groupHooks) {
      try { await h(sock, update) } catch (e) { console.log('Group hook error:', e.message) }
    }
  })

  const send = async (jid, content, options = {}) => {
    const sent = await sock.sendMessage(jid, content, options)
    if (sent?.key?.id) {
      sentIds.add(sent.key.id)
      if (sentIds.size > 500) sentIds.delete(sentIds.values().next().value)
    }
    return sent
  }

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    const myNum = numOf(sock.user?.id)
    const myLid = numOf(sock.user?.lid)
    const owners = new Set([myNum, myLid, ...EXTRA_OWNERS])

    for (const msg of messages) {
      try {
        if (!msg.message || !msg.key || sentIds.has(msg.key.id)) continue

        const text = getText(msg)
        const jid = msg.key.remoteJid
        const isGroup = jid.endsWith('@g.us')
        const sender = isGroup ? msg.key.participant : jid
        const isOwner = msg.key.fromMe || owners.has(numOf(sender))

        const ctx = {
          sock, msg, text, jid, isGroup, sender, isOwner,
          args: [], argText: '',
          commands, startedAt, botName: BOT_NAME,
          send,
          reply: (t) => send(jid, { text: t }, { quoted: msg }),
        }

        for (const h of anyHooks) {
          try { await h(ctx) } catch (e) { console.log('Hook error:', e.message) }
        }

        if (isGroup && !isOwner) {
          for (const h of messageHooks) await h(ctx)
        }

        if (settings.mode === 'private' && !isOwner) continue

        const parsed = parse(text)
        if (!parsed) continue

        const cmd = commands.get(parsed.name)
        if (!cmd) continue

        ctx.args = parsed.args
        ctx.argText = parsed.argText

        if (cmd.owner && !isOwner) {
          await ctx.reply('⛔ এই কমান্ড শুধু Owner ব্যবহার করতে পারবে।')
          continue
        }

        const g = globalSettings()
        if (g.autorecord) await sock.sendPresenceUpdate('recording', jid).catch(() => {})
        else if (g.autotyping) await sock.sendPresenceUpdate('composing', jid).catch(() => {})

        await cmd.run(ctx)
      } catch (e) {
        console.log('Error:', e.message)
        try {
          await send(msg.key.remoteJid, { text: `❌ ত্রুটি: ${e.message}` })
        } catch {}
      }
    }
  })
}

await loadPlugins()
start()
