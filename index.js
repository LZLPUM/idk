const mineflayer = require('mineflayer')
const express = require('express')
const os = require('os')
const { execSync } = require('child_process')
const { Vec3 } = require('vec3')
const { pathfinder, Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder')

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

  bot.loadPlugin(pathfinder)

  bot.on('login', () => console.log('✅ Bot đã đăng nhập.'))

  bot.on('spawn', () => {
    setTimeout(() => bot.chat('/login 03012001'), 3000)

    const mcData = require('minecraft-data')(bot.version)
    const defaultMove = new Movements(bot, mcData)
    bot.pathfinder.setMovements(defaultMove)

    setInterval(() => {
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

    console.log('🚀 Di chuyển zigzag đã kích hoạt.')
  })

  bot.on('chat', async (username, message) => {
    if (username === bot.username) return
    const formatted = `**${username}**: ${message}`
    await sendToDiscord(formatted)
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

async function sendToDiscord(message) {
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

const app = express()
app.get('/', (req, res) => res.send('🟢 Bot đang hoạt động.'))
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🌐 Express đang chạy tại cổng ${PORT}`))
