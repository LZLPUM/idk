const mineflayer = require('mineflayer')
const express = require('express')
const fetch = require('node-fetch')
const os = require('os')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Cấu hình
const TELEGRAM_BOT_TOKEN = '8184857901:AAGHLGeX5VUgRouxsmIXBPDV6Zl5KPqarkw'
const CHAT_ID = '6790410023'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1376391242576957562/2cmM6ySlCSlbSvYMIn_jVQ6zZLGH6OLx5LLhuzDNh4mxFdHNQSqgRnKcaNvilZ-m8HSe'
const PIN = '0301'

const ENABLE_SPAM_CHAT = false
let lastUpdateId = 0
let chatBuffer = []
let lastLogs = []
let logIntervalMs = 5000
let bot
let botActive = true
let spamEnabled = false
let spamInterval

createBot()

function createBot() {
  bot = mineflayer.createBot({
    host: 'anarchy.vn',
    username: 'nahiwinhaha',
    version: '1.12.2'
  })

  bot.on('login', () => console.log('✅ Đã kết nối vào server!'))

  bot.on('spawn', () => {
    bot.chat('/register 03012001 03012001')
    setTimeout(() => {
      bot.chat('/login 03012001')
      setTimeout(() => bot.chat('/avn'), 3000)
    }, 3000)

    setInterval(() => {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
      const yaw = Math.random() * Math.PI * 2
      bot.look(yaw, 0, true)
    }, 30000)

    setInterval(async () => {
      if (!bot.entity) return
      const pos = bot.entity.position
      const coords = `📍 Tọa độ:\nX: ${pos.x.toFixed(2)} Y: ${pos.y.toFixed(2)} Z: ${pos.z.toFixed(2)}\n🕒 ${new Date().toLocaleString('vi-VN')}`
      const stats = getSystemStats()
      await sendMessage(`${coords}\n\n${stats}`)
    }, 6000000)

    if (ENABLE_SPAM_CHAT) {
      spamInterval = setInterval(() => {
        bot.chat('')
      }, 300000)
    }
  })

  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    chatBuffer.push({ username, message })
    lastLogs.push(`[${username}]: ${message}`)
    if (lastLogs.length > 100) lastLogs.shift()
  })

  bot.on('windowOpen', async (window) => {
    for (let i = 0; i < window.slots.length; i++) {
      const item = window.slots[i]
      if (item) {
        try {
          await bot.clickWindow(i, 0, 0)
          await new Promise(res => setTimeout(res, 500))
        } catch (err) {}
      }
    }
  })

  bot.on('end', () => {
    console.log('❌ Mất kết nối. Đang thử lại...')
    if (botActive) setTimeout(createBot, 10000)
  })

  bot.on('error', err => console.error('Lỗi bot:', err.message))
  bot.on('kicked', reason => console.warn('Bot bị kick:', reason))
}

function getSystemStats() {
  try {
    const totalMem = os.totalmem(), freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const memUsagePercent = (usedMem / totalMem) * 100
    const cpuLoad = os.loadavg()[0]
    const dfOutput = execSync('df -h /').toString()
    const diskLine = dfOutput.split('\n')[1]
    const diskUsage = diskLine ? diskLine.split(/\s+/)[4] : 'N/A'
    return [
      `[📊 System Stats - ${new Date().toLocaleString('vi-VN')}]`,
      `🧠 RAM: ${(usedMem / 1024 / 1024).toFixed(1)} MB / ${(totalMem / 1024 / 1024).toFixed(1)} MB (${memUsagePercent.toFixed(1)}%)`,
      `⚙️ CPU Load: ${cpuLoad.toFixed(2)}`,
      `💽 Disk Usage: ${diskUsage}`
    ].join('\n')
  } catch (err) {
    return `❌ Lỗi thống kê hệ thống: ${err.message}`
  }
}

setInterval(async () => {
  if (chatBuffer.length === 0) return
  const messages = chatBuffer.map(({ username, message }) => ({ username, content: message }))
  chatBuffer = []
  const telegramText = messages.map(m => `[${m.username}]: ${m.content}`).join('\n')
  await sendMessage(telegramText)
  for (const msg of messages) await sendDiscordEmbed(msg.username, msg.content)
}, logIntervalMs)

async function sendMessage(message) {
  try {
    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message })
    })
  } catch {}
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    })
  } catch {}
}

async function sendDiscordEmbed(username, message) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `💬 Tin nhắn từ ${username}`,
          description: message,
          color: 0x00AAFF,
          timestamp: new Date().toISOString()
        }]
      })
    })
  } catch {}
}

async function checkTelegramMessages() {
  try {
    const res = await fetch(`${TELEGRAM_API_URL}/getUpdates?offset=${lastUpdateId + 1}`)
    const data = await res.json()
    if (!data.result) return
    for (const update of data.result) {
      lastUpdateId = update.update_id
      const msg = update.message
      if (!msg || !msg.text || msg.chat.id != CHAT_ID) continue
      bot.chat(msg.text.trim())
    }
  } catch {}
}
setInterval(checkTelegramMessages, 2000)

const app = express()
app.use(express.static(path.join(__dirname, 'public')))
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>...`) // Rút gọn để không vượt giới hạn ký tự
})

// Các route Express khác như /chat, /toggleSpam, /disconnect, /reconnect, /chatlog vẫn giữ nguyên

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🌐 Server web chạy tại cổng ${PORT}`))
        
