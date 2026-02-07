import request from 'supertest'
import assert from 'node:assert/strict'

import app from '../app/app.js'
import User from '../app/models/user.js'

describe('/api/register and /api/login', function () {
  it('post /register', async function () {
    const res = await request(app).post('/api/register').send({
      name: 'testuser',
      email: 'testuser@example.com',
      password: 'pass1234',
      password_confirmation: 'pass1234'
    })

    assert.equal(res.status, 201)
    // nálad "succes: true" (szándékosan)
    assert.equal(res.body.succes, true)
    assert.ok(res.body.data)
    assert.equal(res.body.data.name, 'testuser')
  })

  it('post /login (only after verified)', async function () {
    // 1) regisztrál
    await request(app).post('/api/register').send({
      name: 'testuser',
      email: 'testuser@example.com',
      password: 'pass1234',
      password_confirmation: 'pass1234'
    })

    // 2) kézzel verified-re állítjuk (mert tesztben nem emailt klikkelünk)
    const u = await User.findOne({ where: { name: 'testuser' } })
    assert.ok(u)
    u.isVerified = true
    u.verificationToken = null
    u.verificationTokenExpires = null
    await u.save()

    // 3) login
    const res = await request(app).post('/api/login').send({
      name: 'testuser',
      password: 'pass1234'
    })

    assert.equal(res.status, 200)
    assert.ok(res.body.accessToken)
    assert.equal(res.body.name, 'testuser')
  })

  it('get /users (protected, token required)', async function () {
    // register
    await request(app).post('/api/register').send({
      name: 'testuser',
      email: 'testuser@example.com',
      password: 'pass1234',
      password_confirmation: 'pass1234'
    })

    // verify in DB
    const u = await User.findOne({ where: { name: 'testuser' } })
    u.isVerified = true
    u.verificationToken = null
    u.verificationTokenExpires = null
    await u.save()

    // login -> token
    const loginRes = await request(app).post('/api/login').send({
      name: 'testuser',
      password: 'pass1234'
    })

    const token = loginRes.body.accessToken
    assert.ok(token)

    // protected request
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)

    assert.equal(res.status, 200)
    // nálad jellemzően: { success:true, data:[...] }
    assert.equal(res.body.success, true)
    assert.ok(Array.isArray(res.body.data))
  })
})
