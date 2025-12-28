import { DataTypes } from 'sequelize'
import sequelize from '../database/database.js'

const Reminder = sequelize.define(
  'Reminder',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    // 🔔 Mikor küldtünk értesítést erről az emlékeztetőről (null = még nem)
    notifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },

    // ✅ a reminder is userhez tartozik
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'reminders',
    timestamps: true,
  }
)

export default Reminder

