/**
 * GastroVibe — Tanı Scripti
 * Çalıştır: node check.js
 */
import { createRequire } from 'module'
import { existsSync }    from 'fs'

const require = createRequire(import.meta.url)
let ok = true

console.log('\n🔍 GastroVibe Sistem Kontrolü\n' + '─'.repeat(36))

// Node version
const [maj] = process.versions.node.split('.').map(Number)
const nodeOk = maj >= 18
console.log(`Node.js  ${process.versions.node}   ${nodeOk ? '✅' : '❌ (18+ gerekli)'}`)
if (!nodeOk) ok = false

// .env
const envOk = existsSync('.env')
console.log(`.env     ${envOk ? '✅ mevcut' : '❌ YOK → cp .env.example .env'}`)
if (!envOk) ok = false

// better-sqlite3
try {
  require('better-sqlite3')
  console.log('sqlite3  ✅ derlendi')
} catch (e) {
  console.log('sqlite3  ❌ derlenmemiş → npm run rebuild:sqlite')
  ok = false
}

// bcryptjs
try { require('bcryptjs');    console.log('bcrypt   ✅') } catch { console.log('bcrypt   ❌ → npm install'); ok = false }
// jsonwebtoken
try { require('jsonwebtoken'); console.log('jwt      ✅') } catch { console.log('jwt      ❌ → npm install'); ok = false }
// express
try { require('express');      console.log('express  ✅') } catch { console.log('express  ❌ → npm install'); ok = false }

console.log('─'.repeat(36))
if (ok) {
  console.log('✅ Her şey hazır. npm run dev çalıştırabilirsiniz.\n')
} else {
  console.log('⚠️  Bazı sorunlar bulundu. Yukarıdaki komutları sırayla çalıştırın.\n')
}
