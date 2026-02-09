import { DataTypes } from 'sequelize'
import sequelize from '../database/database.js'

const MeterReading = sequelize.define(
  'MeterReading',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    meterType: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    reading: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    // 🔔 Mikor küldtünk értesítést erről a leolvasásról (null = még nem)
    notifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },

    // ✅ EZ A LÉNYEG: a leolvasás a userhez tartozik
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'meterReading',
    timestamps: true,
  }
)

export default MeterReading
