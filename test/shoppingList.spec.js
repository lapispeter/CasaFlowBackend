// test/shoppingLists.spec.js
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
    password_confirmation: 'pass1234',
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
    password: 'pass1234',
  })

  return loginRes.body.accessToken
}

describe('/api/shopping-lists', function () {
  it('post /shopping-lists', async function () {
    const token = await getToken()
    assert.ok(token)

    const res = await request(app)
      .post('/api/shopping-lists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tej',
        note: '2.8%-os',
        quantity: 2,
        unit: 'l',
        purchaseDate: '2026-01-15',
        expiryDate: '2026-01-20',
        isBought: false,
      })

    assert.equal(res.status, 201)
    assert.equal(res.body.success, true)
    assert.ok(res.body.data?.id)
    assert.equal(res.body.data.title, 'Tej')
    // ha a controller visszaküldi:
    assert.equal(Number(res.body.data.quantity), 2)
    assert.equal(res.body.data.unit, 'l')
    assert.equal(res.body.data.isBought, false)
  })

  it('get /shopping-lists', async function () {
    const token = await getToken()

    // létrehozunk 1 tételt
    await request(app)
      .post('/api/shopping-lists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Kenyér',
        note: 'Teljes kiőrlésű',
        quantity: 1,
        unit: 'db',
        purchaseDate: '2026-01-10',
        expiryDate: '2026-01-12',
        isBought: false,
      })

    const res = await request(app)
      .get('/api/shopping-lists')
      .set('Authorization', `Bearer ${token}`)

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    assert.ok(Array.isArray(res.body.data))
    assert.equal(res.body.data.length, 1)
    assert.equal(res.body.data[0].title, 'Kenyér')
  })

  it('put /shopping-lists/:id', async function () {
    const token = await getToken()

    // create
    const createRes = await request(app)
      .post('/api/shopping-lists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Alma',
        note: 'piros',
        quantity: 3,
        unit: 'kg',
        purchaseDate: '2026-01-20',
        expiryDate: '2026-01-30',
        isBought: false,
      })

    const id = createRes.body.data.id
    assert.ok(id)

    // update
    const res = await request(app)
      .put(`/api/shopping-lists/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Alma',
        note: 'piros, édes',
        quantity: 4,
        unit: 'kg',
        purchaseDate: '2026-01-21',
        expiryDate: '2026-02-01',
        isBought: true,
      })

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)

    assert.equal(res.body.data.title, 'Alma')
    assert.equal(Number(res.body.data.quantity), 4)
    assert.equal(res.body.data.isBought, true)

    // dátumoknál lehet ISO stringet ad vissza (mint a remindersnél), ezért itt csak “van-e értéke”
    assert.ok(res.body.data.purchaseDate)
    assert.ok(res.body.data.expiryDate)
  })

  it('delete /shopping-lists/:id', async function () {
    const token = await getToken()

    // create
    const createRes = await request(app)
      .post('/api/shopping-lists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Vaj',
        note: null,
        quantity: 1,
        unit: 'db',
        purchaseDate: '2026-01-05',
        expiryDate: '2026-02-05',
        isBought: false,
      })

    const id = createRes.body.data.id
    assert.ok(id)

    // delete
    const res = await request(app)
      .delete(`/api/shopping-lists/${id}`)
      .set('Authorization', `Bearer ${token}`)

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
  })
})
