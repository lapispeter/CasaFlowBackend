import { Op } from 'sequelize'

import User from '../models/user.js'
import Bill from '../models/bill.js'
import MeterReading from '../models/meterReading.js'
import Reminder from '../models/reminder.js'

import EmailService from '../services/emailService.js'

function getTargetDayRange(daysAhead = 3) {
  const now = new Date()

  const target = new Date(now)
  target.setDate(target.getDate() + daysAhead)

  const start = new Date(target)
  start.setHours(0, 0, 0, 0)

  const end = new Date(target)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

function formatDateHU(d) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}.`
}

async function sendDueEmail({ to, userName, typeLabel, titleLine, dateValue }) {
  const dateStr = formatDateHU(dateValue)

  const subject = `Figyelmeztetés: 3 nap múlva lejáró időpont (${typeLabel})`

  const text =
    `Szia ${userName || ''}!\n\n` +
    `Figyelmeztetés: 3 nap múlva lejáró időpontod van a(z) ${typeLabel} elemnél.\n` +
    `${titleLine}\n` +
    `Dátum: ${dateStr}\n\n` +
    `Üdv,\nCasaFlow`

  const html = `
    <p>Szia <b>${userName || ''}</b>!</p>
    <p><b>Figyelmeztetés:</b> 3 nap múlva lejáró időpontod van a(z) <b>${typeLabel}</b> elemnél.</p>
    <p>${titleLine}</p>
    <p><b>Dátum:</b> ${dateStr}</p>
    <p>Üdv,<br/>CasaFlow</p>
  `

  await EmailService.send({ to, subject, text, html })
}

// ✅ user cache: userId -> { email, name }
async function getUserSafe(userId, cache) {
  if (!userId) return null
  if (cache.has(userId)) return cache.get(userId)

  const u = await User.findByPk(userId, { attributes: ['id', 'email', 'name'] })
  const val = u ? { id: u.id, email: u.email, name: u.name } : null
  cache.set(userId, val)
  return val
}

async function runDueDateCheckOnce() {
  const { start, end } = getTargetDayRange(3)

  console.log('--- DUE CHECK START ---')
  console.log('Target day range:', start.toISOString(), '->', end.toISOString())

  const bills = await Bill.findAll({
    where: {
      date: { [Op.between]: [start, end] },
      notifiedAt: { [Op.is]: null }
    },
    order: [['date', 'ASC']]
  })

  const meterReadings = await MeterReading.findAll({
    where: {
      date: { [Op.between]: [start, end] },
      notifiedAt: { [Op.is]: null }
    },
    order: [['date', 'ASC']]
  })

  const reminders = await Reminder.findAll({
    where: {
      date: { [Op.between]: [start, end] },
      notifiedAt: { [Op.is]: null }
    },
    order: [['date', 'ASC']]
  })

  const total = bills.length + meterReadings.length + reminders.length
  console.log(
    `Found due items (not notified yet): ${total} (Bills: ${bills.length}, MeterReadings: ${meterReadings.length}, Reminders: ${reminders.length})`
  )

  const userCache = new Map()
  let sentCount = 0

  // ✅ Bills
  for (const b of bills) {
    const user = await getUserSafe(b.userId, userCache)
    if (!user?.email) {
      console.log(`[SKIP][BILL] billId=${b.id} userId=${b.userId} -> user/email missing`)
      continue
    }

    try {
      const titleLine = `Számla típusa: <b>${b.billType}</b> (összeg: ${b.amount})`
      await sendDueEmail({
        to: user.email,
        userName: user.name,
        typeLabel: 'Számla',
        titleLine,
        dateValue: b.date
      })

      b.notifiedAt = new Date()
      await b.save()

      sentCount++
      console.log(`[EMAIL SENT][BILL] to=${user.email} billId=${b.id}`)
    } catch (err) {
      console.error(`[EMAIL ERROR][BILL] billId=${b.id}`, err?.message || err)
    }
  }

  // ✅ Meter readings
  for (const m of meterReadings) {
    const user = await getUserSafe(m.userId, userCache)
    if (!user?.email) {
      console.log(`[SKIP][METER] meterId=${m.id} userId=${m.userId} -> user/email missing`)
      continue
    }

    try {
      const titleLine = `Leolvasás típusa: <b>${m.meterType}</b> (érték: ${m.reading})`
      await sendDueEmail({
        to: user.email,
        userName: user.name,
        typeLabel: 'Leolvasás',
        titleLine,
        dateValue: m.date
      })

      m.notifiedAt = new Date()
      await m.save()

      sentCount++
      console.log(`[EMAIL SENT][METER] to=${user.email} meterId=${m.id}`)
    } catch (err) {
      console.error(`[EMAIL ERROR][METER] meterId=${m.id}`, err?.message || err)
    }
  }

  // ✅ Reminders
  for (const r of reminders) {
    const user = await getUserSafe(r.userId, userCache)
    if (!user?.email) {
      console.log(`[SKIP][REMINDER] reminderId=${r.id} userId=${r.userId} -> user/email missing`)
      continue
    }

    try {
      const titleLine = `Emlékeztető: <b>${r.title}</b>${r.description ? ` – ${r.description}` : ''}`
      await sendDueEmail({
        to: user.email,
        userName: user.name,
        typeLabel: 'Emlékeztető',
        titleLine,
        dateValue: r.date
      })

      r.notifiedAt = new Date()
      await r.save()

      sentCount++
      console.log(`[EMAIL SENT][REMINDER] to=${user.email} reminderId=${r.id}`)
    } catch (err) {
      console.error(`[EMAIL ERROR][REMINDER] reminderId=${r.id}`, err?.message || err)
    }
  }

  console.log(`Emails sent in this run: ${sentCount}`)
  console.log('--- DUE CHECK END ---')
}

export function startDueDateScheduler() {
  runDueDateCheckOnce().catch(err => console.error('DUE CHECK ERROR:', err))

  const ONE_HOUR = 60 * 60 * 1000
  setInterval(() => {
    runDueDateCheckOnce().catch(err => console.error('DUE CHECK ERROR:', err))
  }, ONE_HOUR)
}
