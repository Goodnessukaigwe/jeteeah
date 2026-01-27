import express from 'express'
import cors from 'cors'
import { config } from './api/config/config'
import { RoomManager } from './api/service/RoomManager'

const app = express()

app.use(express.json())
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Server status endpoint (optional - for monitoring)
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    roomCount: RoomManager.getRoomCount(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

export default app