const mineflayer = require('mineflayer')
const express = require('express')
const fetch = require('node-fetch')
const os = require('os')
const { execSync } = require('child_process')
const { Client, GatewayIntentBits } = require('discord.js') // NEW: Discord bot

// Telegram config
const TELEGRAM_BOT_TOKEN = '8184857901:AAGHLGeX5VUgRouxsmIXBPDV6Zl5KPqarkw'
const CHAT_ID = '6790410023'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

// Discord webhook
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1376391242576957562/2cmM6ySlCSlbSvYMIn_jVQ6zZLGH6OLx5LLhuzDNh4mxFdHNQSqgRnKcaNvilZ-m8HSe'
const DISCORD_BOT_TOKEN = 'MTE0MDI0NzIxMjUyNjQwMzc2Nw.GrpGi_.Gq7xpFOy0iqmzJzubRhbLTBTkWyFEr0ol2Mix8' // ADD YOUR TOKEN
const DISCORD_CHANNEL_ID = '1376389208075145269' // ADD YOUR CHANNEL ID

let lastUpdateId = 0
let chatBuffer = []
let logIntervalMs = 5000
let bot

createBot()

function createBot() {
  bot = mineflayer.createBot({
    host: 'anarchy.vn',
    username: 'nahiwinhaha',
    version: '1.12.2'
  })

  bot.on('login', () => {
    console.log('Đã kết nối vào server!')
  })

  bot.on('spawn', () => {
    console.log('Đăng ký và đăng nhập...')
    bot.chat('/register 03012001 03012001')

    setTimeout(() => {
      bot.chat('/login 03012001')
      console.log('Đã gửi /login')

      setTimeout(() => {
        bot.chat('/avn')
        console.log('Đã gửi /avn - chờ GUI mở...')
      }, 3000)
    }, 3000)

    setInterval(() => {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
      const yaw = Math.random() * Math.PI * 2
      bot.look(yaw, 0, true)
      console.log('Đang hoạt động để tránh AFK...')
    }, 30000)

    setInterval(async () => {
      if (!bot.entity) return
      const pos = bot.entity.position
      const coords = `Tọa độ hiện tại:\nX: ${pos.x.toFixed(2)}\nY: ${pos.y.toFixed(2)}\nZ: ${pos.z.toFixed(2)}\nThời gian: ${new Date().toLocaleString('vi-VN')}`
      const stats = getSystemStats()
      await sendMessage(`${coords}\n\n${stats}`)
    }, 60000)

    setInterval(() => {
      bot.chat('')
      console.log('Đã chat: 2y2c.org')
    }, 3000000)
  })

  bot.on('chat', async (username, message) => {
    if (username === bot.username) return
    const text = message
    console.log(`[${username}]: ${text}`)
    await sendMessage(text, username)
  })

  bot.on('windowOpen', async (window) => {
    console.log(`GUI mở: ${window.title}`)
    for (let i = 0; i < window.slots.length; i++) {
      const item = window.slots[i]
      if (item) {
        try {
          await bot.clickWindow(i, 0, 0)
          console.log(`Đã click slot ${i} (${item.displayName || item.name})`)
          await new Promise(res => setTimeout(res, 500))
        } catch (err) {
          console.log(`Lỗi khi click slot ${i}:`, err.message)
        }
      }
    }
  })

  bot.on('end', () => {
    console.log('Mất kết nối với server. Đang thử lại sau 10 giây...')
    setTimeout(createBot, 10000)
  })

  bot.on('error', err => {
    console.error('Lỗi bot:', err.message)
  })

  bot.on('kicked', reason => {
    console.warn('Bot bị kick:', reason)
  })
}

function getSystemStats() {
  try {
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const memUsagePercent = (usedMem / totalMem) * 100
    const cpuLoad = os.loadavg()[0]
    const dfOutput = execSync('df -h /').toString()
    const diskLine = dfOutput.split('\n')[1]
    const diskUsage = diskLine ? diskLine.split(/\s+/)[4] : 'N/A'

    const stats = [
      `[System Stats - ${new Date().toLocaleString('vi-VN')}]`,
      `RAM: ${(usedMem / 1024 / 1024).toFixed(1)} MB used / ${(totalMem / 1024 / 1024).toFixed(1)} MB total (${memUsagePercent.toFixed(1)}%)`,
      `CPU Load (1m avg): ${cpuLoad.toFixed(2)}`,
      `Disk Usage: ${diskUsage}`
    ]

    return stats.join('\n')
  } catch (err) {
    return `Không thể lấy thông tin hệ thống: ${err.message}`
  }
}

async function sendMessage(message, sender = 'BOT') {
  try {
    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: `[${sender}]\n${message}` })
    })
  } catch (err) {
    console.error('Lỗi gửi Telegram:', err.message)
  }

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: sender,
            description: message,
            color: 0x00ffff,
            footer: { text: 'Gửi từ Minecraft' },
            timestamp: new Date().toISOString()
          }
        ],
        username: sender,
        avatar_url: `https://minotar.net/avatar/${sender}`
      })
    })
  } catch (err) {
    console.error('Lỗi gửi Discord:', err.message)
  }
}

async function checkTelegramMessages() {
  try {
    const res = await fetch(`${TELEGRAM_API_URL}/getUpdates?offset=${lastUpdateId + 1}`)
    const data = await res.json()
    if (!data.result) return

    for (const update of data.result) {
      lastUpdateId = update.update_id
      const message = update.message
      if (!message || !message.text || message.chat.id != CHAT_ID) continue

      const text = message.text.trim()
      bot.chat(text)
      console.log(`Đã nhận từ Telegram và gửi vào game: ${text}`)
    }
  } catch (err) {
    console.error('Lỗi khi lấy tin nhắn Telegram:', err.message)
  }
}

setInterval(checkTelegramMessages, 2000)

const app = express()
app.get('/', (req, res) => {
  res.send('Còn cứu được')
})
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server Express đang chạy trên cổng ${PORT}`)
})

const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

discordClient.on('ready', () => {
  console.log(`✅ Discord bot đã kết nối: ${discordClient.user.tag}`)
})

discordClient.on('messageCreate', message => {
  if (message.author.bot) return
  if (message.channel.id !== DISCORD_CHANNEL_ID) return
  const text = `${message.author.username}: ${message.content}`
  if (bot?.chat) bot.chat(text)
})

discordClient.login(DISCORD_BOT_TOKEN)
        
