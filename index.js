const mineflayer = require('mineflayer')
const express = require('express')
const fetch = require('node-fetch')
const os = require('os')
const { Vec3 } = require('vec3')

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1376391242576957562/2cmM6ySlCSlbSvYMIn_jVQ6zZLGH6OLx5LLhuzDNh4mxFdHNQSqgRnKcaNvilZ-m8HSe'

let bot
createBot()

function createBot() {
  bot = mineflayer.createBot({
    host: 'anarchy.vn',
    username: 'nahiwinhaha',
    version: '1.12.2',
    keepAlive: true
  })

  bot.on('login', () => console.log('✅ Bot đã đăng nhập.'))

  bot.on('spawn', () => {
    setTimeout(() => bot.chat('/login 03012001'), 3000)

    setInterval(() => {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
      const yaw = Math.random() * Math.PI * 2
      bot.look(yaw, 0, true)
    }, 30000)

    setInterval(() => {
      bot.chat('Rình Ai Tắm')
    }, 10000)

    console.log('🚀 Anti-AFK và spam chat đã kích hoạt.')
  })

  bot.on('chat', async (username, message) => {
    if (username === bot.username) return
    const embed = {
      username: username,
      avatar_url: `https://mc-heads.net/avatar/${username}`,
      embeds: [{
        title: username,
        description: message,
        color: 3447003
      }]
    }
    await sendToDiscord(embed)
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

  bot.on('end', () => {
    console.log('🔁 Bot bị ngắt, đang kết nối lại...')
    setTimeout(createBot, 10000)
  })

  bot.on('error', err => console.error('❌ Lỗi bot:', err.message))
  bot.on('kicked', reason => console.warn('⚠️ Bot bị kick:', reason))
}

async function sendToDiscord(data) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  } catch (err) {
    console.error('Discord Error:', err.message)
  }
}

// Nhận lệnh từ Discord qua Webhook (GET)
const app = express()
app.use(express.json())

app.post('/discord', (req, res) => {
  const { username, content } = req.body
  if (content && bot?.chat) {
    bot.chat(`${username}: ${content}`)
  }
  res.sendStatus(200)
})

app.get('/', (req, res) => res.send('🟢 Bot đang hoạt động.'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🌐 Express đang chạy tại cổng ${PORT}`))
