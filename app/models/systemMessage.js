import { DataTypes } from 'sequelize'
import sequelize from '../database/database.js'

const SystemMessage = sequelize.define(
  'SystemMessage',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },

    // admin id, aki utoljára módosította (nem kötelező, de hasznos)
    updatedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: 'system_messages',
    timestamps: true
  }
)

export default SystemMessage
