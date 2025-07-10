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
  bot = mineflayer.createBot({
    host: 'anarchy.vn',
    username: 'nahiwinhaha',
    version: '1.12.2'
  })

  bot.on('spawn', () => {
    bot.chat('/register 03012001 03012001')
    setTimeout(() => {
      bot.chat('/login 03012001')
      setTimeout(() => bot.chat('/avn'), 3000)
    }, 3000)

    setInterval(() => {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
      bot.look(Math.random() * Math.PI * 2, 0, true)
    }, 30000)

    setInterval(async () => {
      if (!bot.entity) return
      const p = bot.entity.position
      const stats = getSystemStats()
      const msg = `📍 Tọa độ: X:${p.x.toFixed(1)} Y:${p.y.toFixed(1)} Z:${p.z.toFixed(1)}\n${stats}`
      await sendMessage(msg)
    }, 60000)
  })

  bot.on('chat', (username, msg) => {
    if (username === bot.username) return
    chatBuffer.push({ username, msg })
    lastLogs.push(`[${username}]: ${msg}`)
    if (lastLogs.length > 100) lastLogs.shift()
  })

  bot.on('windowOpen', async window => {
    for (let i = 0; i < window.slots.length; i++) {
      const item = window.slots[i]
      if (item) try {
        await bot.clickWindow(i, 0, 0)
        await new Promise(r => setTimeout(r, 500))
      } catch {}
    }
  })

  bot.on('end', () => {
    if (botActive) setTimeout(createBot, 10000)
  })
}
createBot()

setInterval(async () => {
  if (chatBuffer.length === 0) return
  const text = chatBuffer.map(m => `[${m.username}]: ${m.msg}`).join('\n')
  for (const m of chatBuffer) await sendDiscordEmbed(m.username, m.msg)
  await sendMessage(text)
  chatBuffer = []
}, 5000)

async function sendMessage(msg) {
  try {
    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: msg })
    })
  } catch {}
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: msg })
    })
  } catch {}
}

async function sendDiscordEmbed(user, msg) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `💬 Từ ${user}`,
          description: msg,
          color: 0x00AAFF,
          timestamp: new Date().toISOString()
        }]
      })
    })
  } catch {}
}

setInterval(async () => {
  try {
    const res = await fetch(`${TELEGRAM_API_URL}/getUpdates?offset=${lastUpdateId + 1}`)
    const data = await res.json()
    if (!data.result) return
    for (const update of data.result) {
      lastUpdateId = update.update_id
      const m = update.message
      if (!m || !m.text || m.chat.id != CHAT_ID) continue
      bot.chat(m.text.trim())
    }
  } catch {}
}, 2000)

function getSystemStats() {
  try {
    const total = os.totalmem(), free = os.freemem()
    const used = total - free
    const cpu = os.loadavg()[0]
    const disk = execSync('df -h /').toString().split('\n')[1]?.split(/\s+/)[4] || 'N/A'
    return `🧠 RAM: ${(used / 1024 ** 2).toFixed(1)}MB / ${(total / 1024 ** 2).toFixed(1)}MB\n⚙️ CPU: ${cpu.toFixed(2)}\n💽 Disk: ${disk}`
  } catch {
    return `❌ Lỗi lấy hệ thống`
  }
}

const app = express()
app.get('/', (req, res) => {
  const pin = req.query.pin
  if (pin !== PIN) {
    return res.send(`
      <style>
        body { background:#000 url('https://wallpapercosmos.com/w/full/6/f/6/1257646-3840x2160-desktop-4k-space-background-image.jpg') center/cover fixed; color:white; font-family:sans-serif; text-align:center; padding-top:20vh }
        input, button { padding:10px 15px; border-radius:10px; border:none; font-size:16px }
      </style>
      <form>
        <h2>🔒 Nhập mã PIN</h2>
        <input name="pin" placeholder="PIN"/><button>Vào</button>
      </form>
    `)
  }

  const players = bot?.players ? Object.keys(bot.players).join(', ') : 'Đang tải...'

  res.send(`
    <style>
      body { background:#000 url('https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=1500&q=80') center/cover fixed; color:white; font-family:sans-serif; padding:30px; animation: bgmove 60s infinite linear }
      form, pre { margin:10px 0 }
      button, input { padding:10px 15px; border:none; border-radius:8px; font-size:15px }
      a { color:#0ff; text-decoration:none }
      @keyframes bgmove {
        0% { background-position: 0 0 }
        100% { background-position: 1000px 0 }
      }
    </style>
    <h1>🚀 Điều khiển Bot Minecraft</h1>
    <p>🧑‍🤝‍🧑 Người chơi online: <b>${players}</b></p>
    <form action="/chat"><input name="msg" placeholder="Tin nhắn"/><button>💬 Gửi</button></form>
    <form action="/toggleSpam"><button>${spamEnabled ? '⛔ Tắt spam' : '✅ Bật spam'}</button></form>
    <form action="/disconnect"><button>❌ Ngắt bot</button></form>
    <form action="/reconnect"><button>🔁 Kết nối lại bot</button></form>
    <form action="/chatlog"><button>📜 Xem log chat</button></form>
  `)
})

app.get('/chat', (req, res) => {
  const msg = req.query.msg
  if (!bot || !msg) return res.send('Bot chưa sẵn sàng.')
  bot.chat(msg)
  res.redirect('/?pin=' + PIN)
})

app.get('/toggleSpam', (req, res) => {
  if (!bot) return res.send('Bot chưa sẵn sàng.')
  spamEnabled = !spamEnabled
  if (spamEnabled) {
    spamInterval = setInterval(() => bot.chat('Memaybeo'), 3000)
  } else {
    clearInterval(spamInterval)
  }
  res.redirect('/?pin=' + PIN)
})

app.get('/disconnect', (req, res) => {
  bot.quit()
  botActive = false
  res.redirect('/?pin=' + PIN)
})

app.get('/reconnect', (req, res) => {
  if (!botActive) {
    botActive = true
    createBot()
  }
  res.redirect('/?pin=' + PIN)
})

app.get('/chatlog', (req, res) => {
  res.send(`<pre style="background:#000;color:#0f0;padding:20px">${lastLogs.slice(-30).join('\n')}</pre><a href="/?pin=${PIN}">🔙 Quay lại</a>`)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🌐 Giao diện bot đang chạy tại cổng ${PORT}`))
