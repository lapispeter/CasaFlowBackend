import request from 'supertest'
import assert from 'node:assert/strict'

import app from '../app/app.js'
import User from '../app/models/user.js'

async function getToken() {
  // register
  await request(app).post('/api/register').send({
    name: 'testuser',
    email: 'testuser@example.com',
    password: 'pass1234',
    password_confirmation: 'pass1234'
  })

  // verify in DB (email megerősítést megkerüljük tesztben)
  const u = await User.findOne({ where: { name: 'testuser' } })
  u.isVerified = true
  u.verificationToken = null
  u.verificationTokenExpires = null
  await u.save()

  // login
  const loginRes = await request(app).post('/api/login').send({
    name: 'testuser',
    password: 'pass1234'
  })

  return loginRes.body.accessToken
}

describe('/api/reminders', function () {
  it('post /reminders', async function () {
    const token = await getToken()
    assert.ok(token)

    const res = await request(app)
      .post('/api/reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'autó',
        description: 'gyertyacsere',
        date: '2026-02-01'
      })

    assert.equal(res.status, 201)
    assert.equal(res.body.success, true)
    assert.ok(res.body.data?.id)
    assert.equal(res.body.data.title, 'autó')
  })

  it('get /reminders', async function () {
    const token = await getToken()

    // create one
    await request(app)
      .post('/api/reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'születésnap',
        description: 'Lányom',
        date: '2026-02-01'
      })

    const res = await request(app)
      .get('/api/reminders')
      .set('Authorization', `Bearer ${token}`)

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    assert.ok(Array.isArray(res.body.data))
    assert.equal(res.body.data.length, 1)
  })

  it('put /reminders/:id', async function () {
    const token = await getToken()

    const createRes = await request(app)
      .post('/api/reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'névnap',
        description: 'feleség',
        date: '2026-03-01'
      })

    const id = createRes.body.data.id
    assert.ok(id)

    const res = await request(app)
      .put(`/api/reminders/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'névnap',
        description: 'apu',
        date: '2026-03-03'
      })

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.data.description, 'apu')
    assert.equal(res.body.data.date.slice(0, 10), '2026-03-03')

  })


  it('delete /reminders/:id', async function () {
    const token = await getToken()

    // create
    const createRes = await request(app)
      .post('/api/reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'találkozó',
        description: 'barátokkal',
        date: '2026-02-01'
      })

    const id = createRes.body.data.id
    assert.ok(id)

    // delete
    const res = await request(app)
      .delete(`/api/reminders/${id}`)
      .set('Authorization', `Bearer ${token}`)

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
  })
})
