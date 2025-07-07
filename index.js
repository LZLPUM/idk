const mineflayer = require('mineflayer')
const express = require('express')
const fetch = require('node-fetch')
const os = require('os')
const { execSync } = require('child_process')
const { Vec3 } = require('vec3')
const { pathfinder, Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder')
const { once } = require('events')

// Telegram & Discord config
const TELEGRAM_BOT_TOKEN = '8184857901:AAGHLGeX5VUgRouxsmIXBPDV6Zl5KPqarkw'
const CHAT_ID = '6790410023'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1376391242576957562/2cmM6ySlCSlbSvYMIn_jVQ6zZLGH6OLx5LLhuzDNh4mxFdHNQSqgRnKcaNvilZ-m8HSe'

const WATCHED_PLAYERS = ['lzlpum', 'AdolfHitler', 'nahiwinhaha2']
const recentPlayers = new Set()
let lastPosition = null
let stuckTime = 0
let chatBuffer = []
let lastUpdateId = 0
let bot

createBot()

function createBot() {
  bot = mineflayer.createBot({
    host: '42.113.140.250',
    username: 'nahiwinhaha',
    version: '1.20.4',
    keepAlive: true,
    keepAliveInterval: 10000,
    timeout: 60000
  })

  bot.loadPlugin(pathfinder)

  bot.on('login', () => console.log('✅ Bot đã đăng nhập vào server.'))

  bot.on('spawn', () => {
    bot.chat('/register 03012001 03012001')
    setTimeout(() => {
      bot.chat('/login 03012001')
      setTimeout(() => bot.chat('/avn'), 3000)
    }, 3000)

    setTimeout(() => {
      const mcData = require('minecraft-data')(bot.version)
      const defaultMove = new Movements(bot, mcData)
      bot.pathfinder.setMovements(defaultMove)

      setInterval(() => {
        if (!bot.entity) return
        const xOffset = Math.floor(Math.random() * 1000 - 500)
        const zOffset = Math.floor(Math.random() * 1000 - 500)
        const goalPos = bot.entity.position.offset(xOffset, 0, zOffset)
        bot.pathfinder.setGoal(new GoalBlock(goalPos.x, goalPos.y, goalPos.z))
      }, 15000)

      setInterval(() => {
        bot.setControlState('jump', true)
        setTimeout(() => bot.setControlState('jump', false), 300)
        const yaw = Math.random() * Math.PI * 2
        bot.look(yaw, 0, true)
      }, 30000)

      setInterval(() => {
        if (!bot.entity) return
        const pos = bot.entity.position
        const coords = `📍 Vị trí:\nX: ${pos.x.toFixed(1)}\nY: ${pos.y.toFixed(1)}\nZ: ${pos.z.toFixed(1)}`
        const stats = getSystemStats()
        sendMessage(`${coords}\n\n${stats}`)
      }, 60000)

      setInterval(() => {
        if (bot.player) bot.chat('Nhìn Nhìn Con Cặc')
      }, 10000 + Math.floor(Math.random() * 3000))

      console.log('🚀 Bắt đầu thực hiện các tính năng chính.')
    }, 30000)
  })

  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    const text = `[${username}]: ${message}`
    chatBuffer.push(text)

    const privateMsg = message.match(/^\/w\s+nahiwinhaha\s+(.+)/i)
    if (privateMsg) {
      const msg = privateMsg[1]
      const coords = msg.match(/(-?\d+)\s+(-?\d+)/)
      if (coords) {
        const [ , x, z ] = coords
        const y = bot.entity.position.y
        bot.pathfinder.setGoal(new GoalBlock(parseInt(x), y, parseInt(z)))
      } else {
        if (bot.player) bot.chat(`/tell ${username} Đã nhận: ${msg}`)
        sendMessage(`[PM từ ${username}]: ${msg}`)
      }
    }
  })

  bot.on('windowOpen', async (window) => {
    for (let i = 0; i < window.slots.length; i++) {
      const item = window.slots[i]
      if (item) {
        try {
          await bot.clickWindow(i, 0, 0)
          await new Promise(res => setTimeout(res, 500))
        } catch {}
      }
    }
  })

  bot.on('playerJoined', (player) => {
    if (WATCHED_PLAYERS.includes(player.username)) {
      recentPlayers.add(player.username)
    }
  })

  setInterval(() => {
    if (!bot.entity) return
    const pos = bot.entity.position
    recentPlayers.forEach(username => {
      if (bot.player) bot.chat(`/tell ${username} Vị trí bot: X=${pos.x.toFixed(0)} Y=${pos.y.toFixed(0)} Z=${pos.z.toFixed(0)}`)
    })
  }, 30000)

  setInterval(() => {
    if (!bot.entity) return
    const pos = bot.entity.position
    const key = `${pos.x.toFixed(1)}:${pos.y.toFixed(1)}:${pos.z.toFixed(1)}`
    if (lastPosition === key) stuckTime++
    else stuckTime = 0
    lastPosition = key
    if (stuckTime >= 20) {
      if (bot.player) bot.chat('/kill')
      stuckTime = 0
    }
  }, 30000)

  bot.on('end', () => {
    console.log('🔁 Bot bị ngắt, thử kết nối lại sau 10s...')
    setTimeout(createBot, 10000)
  })

  bot.on('error', err => console.error('❌ Lỗi bot:', err.message))
  bot.on('kicked', reason => console.warn('⚠️ Bot bị kick:', reason))
}

setInterval(async () => {
  if (chatBuffer.length === 0) return
  const msg = chatBuffer.join('\n')
  chatBuffer = []
  await sendMessage(msg)
}, 5000)

async function sendMessage(message) {
  try {
    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message })
    })
  } catch (err) {
    console.error('Telegram Error:', err.message)
  }

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    })
  } catch (err) {
    console.error('Discord Error:', err.message)
  }
}

function getSystemStats() {
  try {
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const memPercent = (usedMem / totalMem) * 100
    const cpu = os.loadavg()[0]
    const disk = execSync('df -h /').toString().split('\n')[1].split(/\s+/)[4] || 'N/A'
    return [
      `[System Stats - ${new Date().toLocaleString('vi-VN')}]`,
      `RAM: ${(usedMem / 1024 / 1024).toFixed(1)} MB / ${(totalMem / 1024 / 1024).toFixed(1)} MB (${memPercent.toFixed(1)}%)`,
      `CPU: ${cpu.toFixed(2)} (1 phút)`,
      `Disk: ${disk}`
    ].join('\n')
  } catch (err) {
    return `Không thể lấy thông tin hệ thống: ${err.message}`
  }
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
      const text = msg.text.trim()
      if (bot.player) bot.chat(text)
    }
  } catch (err) {
    console.error('Telegram polling error:', err.message)
  }
}

setInterval(checkTelegramMessages, 2000)

const app = express()
app.get('/', (req, res) => res.send('🟢 Bot vẫn đang hoạt động.'))
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🌐 Server Express đang chạy tại cổng ${PORT}`))


