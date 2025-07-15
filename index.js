const mineflayer = require('mineflayer')
const express = require('express')
const fetch = require('node-fetch')
const os = require('os')
const { execSync } = require('child_process')

const TELEGRAM_BOT_TOKEN = '8184857901:AAGHLGeX5VUgRouxsmIXBPDV6Zl5KPqarkw'
const CHAT_ID = '6790410023'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1376391242576957562/2cmM6ySlCSlbSvYMIn_jVQ6zZLGH6OLx5LLhuzDNh4mxFdHNQSqgRnKcaNvilZ-m8HSe'
const PIN = '0301'

let bot, botActive = true, spamEnabled = false, spamInterval
let lastUpdateId = 0, chatBuffer = [], lastLogs = []

function createBot() {
  console.log('🟡 Bot đang khởi động...')

  bot = mineflayer.createBot({
    host: '2y2c.org',
    username: 'nahiwinhaha',
    version: '1.12.2'
  })

  bot.on('login', () => {
    console.log('🔐 Bot đã đăng nhập xong Minecraft!')
  })

  bot.on('spawn', () => {
    console.log('✅ Bot đã vào server thành công!')

    let loginInterval = setInterval(() => {
      if (bot && bot.chat && typeof bot.chat === 'function') {
        console.log('📨 Gửi lệnh /register + /login')
        bot.chat('/register 03012001 03012001')
        bot.chat('/login 03012001')
      }
    }, 2000)

    setTimeout(() => {
      clearInterval(loginInterval)
      if (bot && bot.chat && typeof bot.chat === 'function') {
        console.log('📨 Gửi lệnh /avn sau khi login')
        bot.chat('/avn')
      }
    }, 10000)

    setInterval(() => {
      if (!bot.entity) return
      console.log('↕️ Anti-AFK nhảy lên')
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
      if (bot.entity.yaw !== undefined) {
        bot.look(Math.random() * Math.PI * 2, 0, true)
      }
    }, 30000)

    setInterval(async () => {
      if (!bot.entity) return
      const p = bot.entity.position
      const stats = getSystemStats()
      const msg = `📍 Tọa độ: X:${p.x.toFixed(1)} Y:${p.y.toFixed(1)} Z:${p.z.toFixed(1)}\n${stats}`
      console.log('📡 Gửi toạ độ về Telegram/Discord')
      await sendMessage(msg)
    }, 60000)
  })

  bot.on('chat', (username, msg) => {
    if (username === bot.username) return
    console.log(`[💬 Ingame] ${username}: ${msg}`)
    chatBuffer.push({ username, msg })
    lastLogs.push(`[${username}]: ${msg}`)
    if (lastLogs.length > 100) lastLogs.shift()
  })

  bot.on('windowOpen', async window => {
    console.log('📦 Mở GUI - Auto click')
    for (let i = 0; i < window.slots.length; i++) {
      const item = window.slots[i]
      if (item) try {
        await bot.clickWindow(i, 0, 0)
        await new Promise(r => setTimeout(r, 500))
      } catch (err) {
        console.log('❌ Lỗi click GUI:', err)
      }
    }
  })

  bot.on('end', () => {
    console.log('🔁 Bot bị ngắt kết nối, thử kết nối lại sau 10s...')
    if (botActive) setTimeout(createBot, 10000)
  })

  bot.on('error', (err) => {
    console.log('❌ Bot gặp lỗi:', err)
  })
}

createBot()
    
