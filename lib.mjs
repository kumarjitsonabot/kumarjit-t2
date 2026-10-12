import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = path.join(__dirname, 'data.json')

let db = {}
try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) } catch {}

export const numOf = (jid) => (jid || '').split('@')[0].split(':')[0]

export function groupSettings(jid) {
  db.groups ??= {}
  db.groups[jid] ??= {}
  return db.groups[jid]
}

export function globalSettings() {
  db.global ??= {}
  return db.global
}

export function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

export async function isGroupAdmin(sock, jid, sender) {
  const meta = await sock.groupMetadata(jid)
  const admins = new Set()
  for (const p of meta.participants) {
    if (!p.admin) continue
    for (const v of [p.id, p.phoneNumber, p.lid]) if (v) admins.add(numOf(v))
  }
  return { meta, admin: admins.has(numOf(sender)) }
}
