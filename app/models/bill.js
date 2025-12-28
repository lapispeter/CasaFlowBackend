import { DataTypes } from 'sequelize'
import sequelize from '../database/database.js'

const Bill = sequelize.define(
  'Bill',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    billType: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    paymentStatus: {
      type: DataTypes.STRING, // pl: "Igen" / "Nem"
      allowNull: false,
      defaultValue: 'Nem',
    },

    // 🔔 Mikor küldtünk értesítést erről a számláról (null = még nem)
    notifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },

    // ✅ EZ A LÉNYEG: a számla a userhez tartozik
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'bills',
    timestamps: true,
  }
)

export default Bill
