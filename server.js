import express from 'express'
import messageRoutes from './routes/messageRoutes.js'
import postRoutes from './routes/postRoutes.js'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import cron from 'node-cron'
import https from 'https'
import http from 'http'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

app.use(express.json())

import fs from 'fs'
const uploadsDir = join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

app.use(
  '/uploads',
  (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200)
    }
    next()
  },
  express.static(uploadsDir)
)

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'server is running',
    timestamp: new Date().toISOString()
  })
})

app.use('/api/messages', messageRoutes)
app.use('/api/posts', postRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

const pingServer = () => {
  const backendUrl =
    process.env.BACKEND_URL || 'https://postgre-app-backend.onrender.com'

  const protocol = backendUrl.startsWith('https') ? https : http

  protocol
    .get(backendUrl, res => {
      console.log(
        `[${new Date().toISOString()}] Ping successful - Status: ${
          res.statusCode
        }`
      )
    })
    .on('error', err => {
      console.error(`[${new Date().toISOString()}] Ping failed: ${err.message}`)
    })
}

cron.schedule('*/10 * * * *', () => {
  pingServer()
})

setTimeout(() => {
  pingServer()
}, 5000)

const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
  })
})
