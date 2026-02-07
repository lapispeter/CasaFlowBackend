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

  // verify (DB-ben)
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

describe('/api/bills', function () {
  it('post /bills', async function () {
    const token = await getToken()
    assert.ok(token)

    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        billType: 'Villany',
        amount: 12345.67,
        date: '2026-01-15',
        paymentStatus: 'Nem'
      })

    assert.equal(res.status, 201)
    assert.equal(res.body.success, true)
    assert.ok(res.body.data?.id)
    assert.equal(res.body.data.billType, 'Villany')
  })

  it('get /bills', async function () {
    const token = await getToken()

    // létrehozunk 1 számlát
    await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        billType: 'Gáz',
        amount: 5000,
        date: '2026-01-10',
        paymentStatus: 'Nem'
      })

    const res = await request(app)
      .get('/api/bills')
      .set('Authorization', `Bearer ${token}`)

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    assert.ok(Array.isArray(res.body.data))
    assert.equal(res.body.data.length, 1)
  })

  it('put /bills/:id', async function () {
    const token = await getToken()

    // create
    const createRes = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        billType: 'Víz',
        amount: 2000,
        date: '2026-01-20',
        paymentStatus: 'Nem'
      })

    const id = createRes.body.data.id
    assert.ok(id)

    // update
    const res = await request(app)
      .put(`/api/bills/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        billType: 'Víz',
        amount: 2500,
        date: '2026-01-21',
        paymentStatus: 'Igen'
      })

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.data.amount, 2500)
    assert.equal(res.body.data.paymentStatus, 'Igen')
  })

  it('delete /bills/:id', async function () {
    const token = await getToken()

    // create
    const createRes = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        billType: 'Net',
        amount: 999,
        date: '2026-01-05',
        paymentStatus: 'Nem'
      })

    const id = createRes.body.data.id
    assert.ok(id)

    // delete
    const res = await request(app)
      .delete(`/api/bills/${id}`)
      .set('Authorization', `Bearer ${token}`)

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
  })
})
