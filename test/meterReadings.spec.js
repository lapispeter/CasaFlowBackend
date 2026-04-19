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

describe('/api/meter-readings', function () {
  it('post /meter-readings', async function () {
    const token = await getToken()
    assert.ok(token)

    const res = await request(app)
      .post('/api/meter-readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        meterType: 'Villany',
        reading: 123.45,
        date: '2026-06-01'
      })

    assert.equal(res.status, 201)
    assert.equal(res.body.success, true)
    assert.ok(res.body.data?.id)
    assert.equal(res.body.data.meterType, 'Villany')
  })

  it('get /meter-readings', async function () {
    const token = await getToken()

    // create one
    await request(app)
      .post('/api/meter-readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        meterType: 'Gáz',
        reading: 50.5,
        date: '2026-04-02'
      })

    const res = await request(app)
      .get('/api/meter-readings')
      .set('Authorization', `Bearer ${token}`)

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    assert.ok(Array.isArray(res.body.data))
    assert.equal(res.body.data.length, 1)
  })

  it('put /meter-readings/:id', async function () {
    const token = await getToken()

    // create
    const createRes = await request(app)
      .post('/api/meter-readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        meterType: 'Víz',
        reading: 10,
        date: '2026-06-03'
      })

    const id = createRes.body.data.id
    assert.ok(id)

    // update
    const res = await request(app)
      .put(`/api/meter-readings/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        meterType: 'Víz',
        reading: 15,
        date: '2026-06-04'
      })

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    assert.equal(Number(res.body.data.reading), 15)
  })

  it('delete /meter-readings/:id', async function () {
    const token = await getToken()

    // create
    const createRes = await request(app)
      .post('/api/meter-readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        meterType: 'Net',
        reading: 999,
        date: '2026-06-05'
      })

    const id = createRes.body.data.id
    assert.ok(id)

    // delete
    const res = await request(app)
      .delete(`/api/meter-readings/${id}`)
      .set('Authorization', `Bearer ${token}`)

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
  })
})
