import { DataTypes } from 'sequelize'
import sequelize from '../database/database.js'

const Thing = sequelize.define('thing', {
    name: { type: DataTypes.STRING,  allowNull: false  }
})

export default Thing
