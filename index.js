const mineflayer = require('mineflayer')
const express = require('express')
const fetch = require('node-fetch')
const os = require('os')
const { execSync } = require('child_process')

// Cấu hình
const TELEGRAM_BOT_TOKEN = '8184857901:AAGHLGeX5VUgRouxsmIXBPDV6Zl5KPqarkw'
const CHAT_ID = '6790410023'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1376391242576957562/2cmM6ySlCSlbSvYMIn_jVQ6zZLGH6OLx5LLhuzDNh4mxFdHNQSqgRnKcaNvilZ-m8HSe'

const ENABLE_SPAM_CHAT = false
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

  bot.on('login', () => console.log('Đã kết nối vào server!'))

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
      const coords = `📍 Tọa độ hiện tại:\nX: ${pos.x.toFixed(2)}\nY: ${pos.y.toFixed(2)}\nZ: ${pos.z.toFixed(2)}\n🕒 ${new Date().toLocaleString('vi-VN')}`
      const stats = getSystemStats()
      await sendMessage(`${coords}\n\n${stats}`)
    }, 60000)

    if (ENABLE_SPAM_CHAT) {
      setInterval(() => {
        bot.chat('')
        console.log('Đã chat spam')
      }, 300000)
    }
  })

  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    chatBuffer.push({ username, message })
    console.log(`[${username}]: ${message}`)
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

  bot.on('error', err => console.error('Lỗi bot:', err.message))
  bot.on('kicked', reason => console.warn('Bot bị kick:', reason))
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
    return [
      `[📊 System Stats - ${new Date().toLocaleString('vi-VN')}]`,
      `🧠 RAM: ${(usedMem / 1024 / 1024).toFixed(1)} MB used / ${(totalMem / 1024 / 1024).toFixed(1)} MB total (${memUsagePercent.toFixed(1)}%)`,
      `⚙️ CPU Load (1m avg): ${cpuLoad.toFixed(2)}`,
      `💽 Disk Usage: ${diskUsage}`
    ].join('\n')
  } catch (err) {
    return `❌ Không thể lấy thông tin hệ thống: ${err.message}`
  }
}

setInterval(async () => {
  if (chatBuffer.length === 0) return
  const messages = chatBuffer.map(({ username, message }) => ({
    username,
    content: message
  }))
  chatBuffer = []
  const telegramText = messages.map(m => `[${m.username}]: ${m.content}`).join('\n')
  await sendMessage(telegramText)
  for (const msg of messages) {
    await sendDiscordEmbed(msg.username, msg.content)
  }
}, logIntervalMs)

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
  } catch (err) {
    console.error('Lỗi gửi embed Discord:', err.message)
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
      bot.chat(message.text.trim())
      console.log(`Đã nhận từ Telegram và gửi vào game: ${message.text.trim()}`)
    }
  } catch (err) {
    console.error('Lỗi khi lấy tin nhắn Telegram:', err.message)
  }
}
setInterval(checkTelegramMessages, 2000)

const app = express()

// 🔻 GIAO DIỆN HTML ĐIỀU KHIỂN
app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html><html><head><title>Điều khiển bot</title><meta name="viewport" content="width=device-width"><style>
  body { background:#1e1e1e; color:white; font-family:sans-serif; max-width:500px; margin:auto; padding:20px }
  input,button { width:100%; padding:10px; margin:10px 0; border:none; border-radius:5px; font-size:16px }
  input { background:#2e2e2e; color:white }
  button { background:#00bcd4; color:white; cursor:pointer }
  pre { background:#2e2e2e; padding:10px; border-radius:6px; white-space:pre-wrap; word-wrap:break-word }
  </style></head><body><h2>📱 Điều khiển Bot Minecraft</h2>
  <input id="chat" placeholder="💬 Chat vào game"><button onclick="chat()">Gửi Chat</button>
  <input id="command" placeholder="⌨️ Gửi lệnh"><button onclick="command()">Gửi Lệnh</button>
  <button onclick="spam()">🔁 Bật/Tắt Spam</button>
  <button onclick="coords()">📍 Xem tọa độ</button><pre id="coordsResult">...</pre>
  <button onclick="tablist()">👥 Xem người chơi</button><pre id="tablistResult">...</pre>
  <script>
  async function chat(){const v=chat.value;if(!v)return;alert(await(await fetch('/chat?msg='+encodeURIComponent(v))).text())}
  async function command(){const v=command.value;if(!v)return;alert(await(await fetch('/command?cmd='+encodeURIComponent(v))).text())}
  async function spam(){alert(await(await fetch('/toggleSpam')).text())}
  async function coords(){const r=await fetch('/coords');if(!r.ok)return alert(await r.text());coordsResult.innerText=JSON.stringify(await r.json(),null,2)}
  async function tablist(){const r=await fetch('/tablist');if(!r.ok)return alert(await r.text());tablistResult.innerText=(await r.json()).join("\\n")}
  </script></body></html>
  `)
})

// 🔻 CÁC API
app.get('/chat', (req, res) => {
  const msg = req.query.msg
  if (!msg || !bot) return res.send('Thiếu msg hoặc bot chưa sẵn sàng.')
  bot.chat(msg)
  res.send(`✅ Đã gửi chat: ${msg}`)
})

app.get('/command', (req, res) => {
  const cmd = req.query.cmd
  if (!cmd || !bot) return res.send('Thiếu cmd hoặc bot chưa sẵn sàng.')
  bot.chat(cmd)
  res.send(`✅ Đã gửi lệnh: ${cmd}`)
})

let spamEnabled = false
let spamInterval
app.get('/toggleSpam', (req, res) => {
  if (!bot) return res.send('Bot chưa sẵn sàng.')
  spamEnabled = !spamEnabled
  if (spamEnabled) {
    spamInterval = setInterval(() => {
      bot.chat('')
    }, 300000)
    res.send('✅ Đã BẬT spam chat.')
  } else {
    clearInterval(spamInterval)
    res.send('⛔ Đã TẮT spam chat.')
  }
})

app.get('/coords', (req, res) => {
  if (!bot || !bot.entity) return res.status(500).send('Bot chưa spawn.')
  const pos = bot.entity.position
  res.json({ x: pos.x, y: pos.y, z: pos.z })
})

app.get('/tablist', (req, res) => {
  if (!bot || !bot.players) return res.status(500).send('Bot chưa kết nối.')
  const players = Object.keys(bot.players)
  res.json(players)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server Express đang chạy trên cổng ${PORT}`))
