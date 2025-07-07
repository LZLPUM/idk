const mineflayer = require('mineflayer')
const express = require('express')
const fetch = require('node-fetch')

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1376391242576957562/2cmM6ySlCSlbSvYMIn_jVQ6zZLGH6OLx5LLhuzDNh4mxFdHNQSqgRnKcaNvilZ-m8HSe'

let bot
createBot()

function createBot() {
  bot = mineflayer.createBot({
    host: 'anarchy.vn',
    username: 'nahiwinhaha',
    version: '1.12.2'
  })

  bot.on('login', () => console.log('✅ Bot đã đăng nhập'))

  bot.on('spawn', () => {
    setTimeout(() => {
      bot.chat('/login 03012001')
      setTimeout(() => bot.chat('/avn'), 2000)
    }, 3000)

    // Anti AFK
    setInterval(() => {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
      const yaw = Math.random() * Math.PI * 2
      bot.look(yaw, 0, true)
    }, 30000)

    // Spam chat mỗi 10s
    setInterval(() => {
      bot.chat('DITME')
    }, 10000)

    console.log('🚀 Bot đã sẵn sàng hoạt động.')
  })

  // Tự click toàn bộ item khi GUI mở
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
    bot.closeWindow(window)
  })

  // Gửi chat từ Minecraft → Discord
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

  bot.on('end', () => {
    console.log('🔁 Mất kết nối, thử lại sau 10s...')
    setTimeout(createBot, 10000)
  })

  bot.on('error', err => console.error('❌ Lỗi bot:', err.message))
  bot.on('kicked', reason => console.warn('⚠️ Bị kick:', reason))
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

// Express giữ bot online
const app = express()
app.get('/', (req, res) => res.send('🟢 Bot đang hoạt động.'))
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🌐 Express chạy tại cổng ${PORT}`))
