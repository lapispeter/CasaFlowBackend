import { Sequelize } from 'sequelize'
import dotenvFlow from 'dotenv-flow'

// ⬅️ EZ FONTOS
dotenvFlow.config({ silent: true })

const DIALECT = process.env.DB_DIALECT || 'sqlite'

let sequelize

if (DIALECT === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || 'database.sqlite',
    logging: false
  })
} else {
  sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: DIALECT,
      logging: false
    }
  )
}

export default sequelize
