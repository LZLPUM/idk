const mineflayer = require('mineflayer')
const express = require('express')
const fetch = require('node-fetch')
const os = require('os')
const { execSync } = require('child_process')

// Telegram config
const TELEGRAM_BOT_TOKEN = '8184857901:AAGHLGeX5VUgRouxsmIXBPDV6Zl5KPqarkw'
const CHAT_ID = '6790410023'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

// Discord webhook
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1376391242576957562/2cmM6ySlCSlbSvYMIn_jVQ6zZLGH6OLx5LLhuzDNh4mxFdHNQSqgRnKcaNvilZ-m8HSe'

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

    // Chống AFK
    setInterval(() => {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
      const yaw = Math.random() * Math.PI * 2
      bot.look(yaw, 0, true)
      console.log('Đang hoạt động để tránh AFK...')
    }, 30000)

    // Gửi tọa độ + thống kê hệ thống mỗi phút
    setInterval(async () => {
      if (!bot.entity) return
      const pos = bot.entity.position
      const coords = `Tọa độ hiện tại:\nX: ${pos.x.toFixed(2)}\nY: ${pos.y.toFixed(2)}\nZ: ${pos.z.toFixed(2)}\nThời gian: ${new Date().toLocaleString('vi-VN')}`
      const stats = getSystemStats()
      await sendMessage(`${coords}\n\n${stats}`)
    }, 60000)

    // Chat quảng cáo mỗi 3 giây
    setInterval(() => {
      bot.chat('MeMayBeo')
      console.log('Đã chat: 2y2c.org')
    }, 3000)
  })

  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    const text = `[${username}]: ${message}`
    console.log(text)
    chatBuffer.push(text)
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
_        }
      }
    }
  })

  // Tự động kết nối lại
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

// Lấy thông tin hệ thống (RAM, CPU, Disk)
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

// Gửi tin nhắn đã gộp trong buffer đến Telegram và Discord mỗi 5 giây
setInterval(async () => {
  if (chatBuffer.length === 0) return
  const message = chatBuffer.join('\n')
  chatBuffer = []
  await sendMessage(message)
}, logIntervalMs)

// Gửi message tới Telegram và Discord
async function sendMessage(message) {
  try {
    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message })
    })
  } catch (err) {
    console.error('Lỗi gửi Telegram:', err.message)
  }

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    })
  } catch (err) {
    console.error('Lỗi gửi Discord:', err.message)
  }
}

// Nhận tin từ Telegram và gửi vào Minecraft
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

// Kiểm tra tin nhắn Telegram mỗi 2 giây
setInterval(checkTelegramMessages, 2000)

// Server Express để giữ bot sống
const app = express()
app.get('/', (req, res) => {
  res.send('Còn cứu được')
})
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server Express đang chạy trên cổng ${PORT}`)
})
