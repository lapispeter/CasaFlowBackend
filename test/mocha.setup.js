import dotenvFlow from 'dotenv-flow'
import sequelize from '../app/database/database.js'

// Betölti: .env + .env.test (mivel NODE_ENV=test)
dotenvFlow.config({ silent: true })

// Mocha globál hookok
before(async function () {
  this.timeout(20000)

  // Kapcsolatok + modellek betöltése (ez ESM top-level await miatt fel is húzza a táblákat)
  await import('../app/models/modrels.js')

  // Tiszta DB tesztekhez (in-memory sqlite)
  await sequelize.sync({ force: true })
})

beforeEach(async function () {
  // Minden teszt előtt tiszta adatbázis
  await sequelize.sync({ force: true })
})

after(async function () {
  try {
    await sequelize.close()
  } catch {}
})
