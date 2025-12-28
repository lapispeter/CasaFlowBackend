import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import fs from 'fs'
import router from './routes/api.js'

// ✅ Model kapcsolatok + sync (fontos, hogy ez meglegyen)
import './models/modrels.js'

// ✅ Scheduler indítása
import { startDueDateScheduler } from './jobs/dueDateNotifier.js'

const app = express()

const logfile = 'access.log'
const accessLogStream = fs.createWriteStream(logfile, { flags: 'a' })

app.use(morgan('dev', { stream: accessLogStream }))
app.use(cors())
app.use(express.json())

app.use('/api', router)

// ✅ Scheduler induljon el a backend indulásakor
startDueDateScheduler()

export default app

